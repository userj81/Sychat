import { useEffect, useState, useRef, useCallback } from 'react';
import { Socket, Channel, Presence } from 'phoenix';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket';
import { useChatStore } from '@/stores/chat-store';
import { Message, Reaction } from '@/types';

export function useSocketChannel(channelId: string) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [tenantChannel, setTenantChannel] = useState<Channel | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const { addMessage, updateMessageReactions, setOnlineUsers } = useChatStore();
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  const updateOnlineUsers = useCallback((presence: Presence) => {
    const onlineMap: Record<string, boolean> = {};
    presence.list((userId: string, metas: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      onlineMap[userId] = metas.metas.length > 0;
    });
    setOnlineUsers(onlineMap);
  }, [setOnlineUsers]);

  useEffect(() => {
    let sock = getSocket();
    const token = localStorage.getItem('access_token');
    
    if (!sock && token) {
      sock = connectSocket(token);
    }

    if (!sock) return;

    const tenantId = localStorage.getItem('tenant_id');
    
    // Connect to Tenant channel for Presence if not already connected globally
    // For simplicity, we connect here. In a real app, this might be in a top-level provider.
    const tChan = sock.channel(`tenant:${tenantId}`, { tenant_id: tenantId });
    tChan.join()
      .receive("ok", () => setTenantChannel(tChan))
    const presence = new Presence(tChan);
    presence.onSync(() => {
      updateOnlineUsers(presence);
    });

    if (!channelId) return;

    const chan = sock.channel(`channel:${channelId}`, { tenant_id: tenantId });

    chan.join()
      .receive("ok", (resp: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.log("Joined successfully", resp);
        setChannel(chan);
      })
      .receive("error", (resp: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.log("Unable to join", resp);
      });

    chan.on("message:new", (payload: { message: Message }) => {
      addMessage(payload.message);
    });

    chan.on("reaction:added", (payload: { message_id: string, reaction: Reaction }) => {
      const messages = useChatStore.getState().messages;
      const msg = messages.find((m) => m.id === payload.message_id);
      if (msg) {
        const reactions = msg.reactions || [];
        updateMessageReactions(payload.message_id, [...reactions, payload.reaction]);
      }
    });

    chan.on("reaction:removed", (payload: { message_id: string, user_id: string, emoji: string }) => {
      const messages = useChatStore.getState().messages;
      const msg = messages.find((m) => m.id === payload.message_id);
      if (msg) {
        const reactions = msg.reactions || [];
        updateMessageReactions(
          payload.message_id, 
          reactions.filter((r) => !(r.user.id === payload.user_id && r.emoji === payload.emoji))
        );
      }
    });

    chan.on("user:typing", (payload: { user_id: string }) => {
      setTypingUsers((prev: string[]) => {
        if (!prev.includes(payload.user_id)) {
          return [...prev, payload.user_id];
        }
        return prev;
      });

      if (typingTimeouts.current[payload.user_id]) {
        clearTimeout(typingTimeouts.current[payload.user_id]);
      }
      
      typingTimeouts.current[payload.user_id] = setTimeout(() => {
        setTypingUsers((prev: string[]) => prev.filter(id => id !== payload.user_id));
      }, 3000);
    });

    return () => {
      chan.leave();
      tChan.leave();
      setChannel(null);
      setTenantChannel(null);
    };
  }, [channelId, addMessage, setOnlineUsers, updateMessageReactions, updateOnlineUsers]);

  const sendTyping = () => {
    if (channel) {
      channel.push("user:typing", {});
    }
  };

  const markAsRead = (messageId: string) => {
    if (channel) {
      channel.push("message:mark_read", { message_id: messageId });
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (channel) {
      channel.push("reaction:add", { message_id: messageId, emoji });
    }
  };

  const removeReaction = (messageId: string, emoji: string) => {
    if (channel) {
      channel.push("reaction:remove", { message_id: messageId, emoji });
    }
  };

  // Avoid unused variable warnings
  void tenantChannel;
  void Socket;
  void disconnectSocket;

  return { channel, typingUsers, sendTyping, markAsRead, addReaction, removeReaction };
}
