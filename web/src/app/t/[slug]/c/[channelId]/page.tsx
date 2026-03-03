'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Message } from '@/types';
import { MessageList } from '@/components/ui/MessageList';
import { MessageComposer } from '@/components/ui/MessageComposer';
import { SkeletonMessageList } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useSocketChannel } from '@/hooks/useSocket';
import { useChatStore } from '@/stores/chat-store';
import { ThreadSidebar } from '@/components/ui/ThreadSidebar';

function generateClientId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function ChannelPageContent() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<any>(null);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const { user, messages: storeMessages, setMessages: setStoreMessages, updateChannelUnread } = useChatStore();
  const { sendTyping, markAsRead, typingUsers, addReaction, removeReaction } = useSocketChannel(params.channelId as string);

  const [activeThread, setActiveThread] = useState<Message | null>(null);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      markAsRead(lastMsg.id);
      updateChannelUnread(params.channelId as string, 0, lastMsg.id);
    }
  }, [messages, markAsRead, updateChannelUnread, params.channelId]);

  useEffect(() => {
    const tenantId = localStorage.getItem('tenant_id');
    
    if (!tenantId) {
      router.push('/login');
      return;
    }

    api.channels.get(tenantId, params.channelId as string)
      .then((data) => {
        setChannel(data);
        return api.channels.getMessages(tenantId, params.channelId as string);
      })
      .then((msgs) => {
        setMessages(msgs);
        setStoreMessages(msgs);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || 'Erro ao carregar canal');
        setLoading(false);
      });
  }, [params.channelId, router, setStoreMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const tenantId = localStorage.getItem('tenant_id');
    const clientId = generateClientId();

    try {
      await api.channels.sendMessage(tenantId!, params.channelId as string, message, clientId);
      // Let Socket handle adding to store to avoid duplicates, or we can add to store locally
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao enviar mensagem');
    }
  };

  const handleFileUpload = async (files: File[]) => {
    // For MVP attachments over REST
    const tenantId = localStorage.getItem('tenant_id');
    if (!tenantId) return;

    try {
      const formData = new FormData();
      formData.append('channel_id', params.channelId as string);
      formData.append('file', files[0]); // Only one file for MVP
      formData.append('client_id', generateClientId());
      
      await api.channels.sendMessageWithAttachment(tenantId, params.channelId as string, formData);
      addToast('success', 'Arquivo enviado!');
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao enviar arquivo');
    }
  };

  const currentMessages = storeMessages.length > 0 ? storeMessages : messages;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-emerald-600 text-white rounded"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4 flex flex-col shrink-0">
        <button
          onClick={() => router.push(`/t/${params.slug}`)}
          className="mb-4 text-gray-400 hover:text-white flex items-center gap-2"
        >
          ← Voltar
        </button>
        <h2 className="text-lg font-bold">
          {channel?.type === 'dm' ? '@' : '#'} {channel?.name || 'Canal'}
        </h2>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex min-w-0">
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 min-w-0">
          {/* Header */}
          <div className="h-14 border-b dark:border-gray-700 px-4 flex items-center shrink-0">
            <h1 className="font-semibold dark:text-white">
              {channel?.type === 'dm' ? '@' : '#'} {channel?.name || 'Canal'}
            </h1>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {loading ? (
              <SkeletonMessageList count={10} />
            ) : (
              <MessageList 
                messages={currentMessages} 
                currentUserId={user?.id}
                onAddReaction={addReaction}
                onRemoveReaction={removeReaction}
                onReply={(msg) => setActiveThread(msg)}
              />
            )}
            {typingUsers.length > 0 && (
              <div className="text-xs text-gray-500 px-4 py-2 italic animate-pulse">
                {typingUsers.length === 1 ? 'Alguém está digitando...' : 'Várias pessoas estão digitando...'}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="shrink-0 p-4 pt-0">
            <MessageComposer
              onSend={handleSendMessage}
              onFileUpload={handleFileUpload}
              onChange={() => sendTyping()}
              placeholder="Digite uma mensagem... (suporta markdown e arraste arquivos)"
            />
          </div>
        </div>

        {/* Thread Sidebar View */}
        {activeThread && (
          <div className="shrink-0">
            <ThreadSidebar 
              channelId={params.channelId as string}
              parentMessage={activeThread}
              onClose={() => setActiveThread(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChannelPage() {
  return (
    <ProtectedRoute>
      <ChannelPageContent />
    </ProtectedRoute>
  );
}
