import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Tenant, Channel, Message, ChannelList, Reaction } from '@/types';

interface ChatState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  tenants: Tenant[];
  currentTenant: Tenant | null;
  channels: ChannelList;
  currentChannel: Channel | null;
  messages: Message[];
  activeThreadId: string | null;
  threadMessages: Message[];
  onlineUsers: Record<string, boolean>;
  
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setTenants: (tenants: Tenant[]) => void;
  setCurrentTenant: (tenant: Tenant | null) => void;
  setChannels: (channels: ChannelList) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  setMessages: (messages: Message[]) => void;
  setActiveThread: (threadId: string | null) => void;
  setThreadMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessageReactions: (messageId: string, reactions: Reaction[]) => void;
  setOnlineUsers: (users: Record<string, boolean>) => void;
  clearMessages: () => void;
  updateChannelUnread: (channelId: string, unreadCount: number, lastReadMessageId?: string | null) => void;
  incrementUnread: (channelId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      tenants: [],
      currentTenant: null,
      channels: { public: [], private: [], dms: [] },
      currentChannel: null,
      messages: [],
      activeThreadId: null,
      threadMessages: [],
      onlineUsers: {},

      setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
        }
        set({ user, accessToken, refreshToken });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('tenant_id');
        }
        set({ 
          user: null, 
          accessToken: null, 
          refreshToken: null,
          currentTenant: null,
          channels: { public: [], private: [], dms: [] },
          currentChannel: null,
          messages: []
        });
      },

      setTenants: (tenants) => set({ tenants }),
      setCurrentTenant: (tenant) => {
        if (typeof window !== 'undefined' && tenant) {
          localStorage.setItem('tenant_id', tenant.id);
        }
        set({ currentTenant: tenant, currentChannel: null, messages: [] });
      },
      
      setChannels: (channels) => set({ channels }),
      setCurrentChannel: (channel) => set({ currentChannel: channel, messages: [], activeThreadId: null, threadMessages: [] }),
      
      setMessages: (messages) => set({ messages }),
      setActiveThread: (threadId) => set({ activeThreadId: threadId, threadMessages: [] }),
      setThreadMessages: (messages) => set({ threadMessages: messages }),
      
      addMessage: (message) => set((state) => {
        if (message.parent_id) {
          // It's a thread reply. Update parent's reply_count in main list if present.
          const updatedMessages = state.messages.map(m => 
            m.id === message.parent_id ? { ...m, reply_count: (m.reply_count || 0) + 1 } : m
          );
          
          if (state.activeThreadId === message.parent_id) {
            const existsInThread = state.threadMessages.some(m => m.id === message.id || (m.client_id && m.client_id === message.client_id));
            if (!existsInThread) {
              return { messages: updatedMessages, threadMessages: [...state.threadMessages, message] };
            }
          }
          return { messages: updatedMessages };
        }
        
        // Main channel message
        const exists = state.messages.some(m => m.id === message.id || (m.client_id && m.client_id === message.client_id));
        if (exists) {
          return {
            messages: state.messages.map(m => (m.client_id === message.client_id) ? message : m)
          };
        }
        return { messages: [...state.messages, message] };
      }),
      updateMessageReactions: (messageId, reactions) => set((state) => ({
        messages: state.messages.map(m => m.id === messageId ? { ...m, reactions } : m),
        threadMessages: state.threadMessages.map(m => m.id === messageId ? { ...m, reactions } : m)
      })),
      setOnlineUsers: (users) => set({ onlineUsers: users }),
      clearMessages: () => set({ messages: [], threadMessages: [] }),
      updateChannelUnread: (channelId, unreadCount, lastReadMessageId) => set((state) => {
        const updateList = (list: Channel[]) => 
          list.map(c => c.id === channelId ? { ...c, unread_count: unreadCount, last_read_message_id: lastReadMessageId } : c);
        return {
          channels: {
            public: updateList(state.channels.public),
            private: updateList(state.channels.private),
            dms: updateList(state.channels.dms)
          }
        };
      }),
      incrementUnread: (channelId) => set((state) => {
        if (state.currentChannel?.id === channelId) return state; // Don't increment if we are actively viewing it
        const updateList = (list: Channel[]) => 
          list.map(c => c.id === channelId ? { ...c, unread_count: (c.unread_count || 0) + 1 } : c);
        return {
          channels: {
            public: updateList(state.channels.public),
            private: updateList(state.channels.private),
            dms: updateList(state.channels.dms)
          }
        };
      }),
    }),
    {
      name: 'sychat-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tenants: state.tenants,
        currentTenant: state.currentTenant,
      }),
    }
  )
);
