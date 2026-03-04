import { useEffect, useState, useRef } from 'react';
import { Message } from '@/types';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { api } from '@/lib/api';
import { useToast } from './Toast';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useSocketChannel } from '@/hooks/useSocket';
import { useChatStore } from '@/stores/chat-store';

interface ThreadSidebarProps {
  channelId: string;
  parentMessage: Message;
  onClose: () => void;
}

export function ThreadSidebar({ channelId, parentMessage, onClose }: ThreadSidebarProps) {
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { user, threadMessages, setActiveThread, setThreadMessages } = useChatStore();
  const { sendTyping, addReaction, removeReaction } = useSocketChannel(channelId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tenantId = localStorage.getItem('tenant_id');
    if (!tenantId) return;

    setActiveThread(parentMessage.id);

    const fetchReplies = async () => {
      setLoading(true);
      try {
        const msgs = await api.channels.getThreadMessages(tenantId, channelId, parentMessage.id);
        setThreadMessages(msgs);
      } catch (err) {
        addToast('error', 'Error loading replies');
      } finally {
        setLoading(false);
      }
    };

    fetchReplies();

    return () => {
      setActiveThread(null);
    };
  }, [channelId, parentMessage.id, addToast, setActiveThread, setThreadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  return (
    <div className="w-80 border-l dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col h-full">
      <div className="h-14 border-b dark:border-gray-700 px-4 flex items-center justify-between bg-white dark:bg-gray-900 shrink-0">
        <h2 className="font-semibold dark:text-white">Thread</h2>
        <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Render Original Message as context */}
        <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-900">
          <MessageList messages={[parentMessage]} currentUserId={user?.id} onAddReaction={addReaction} onRemoveReaction={removeReaction} />
        </div>
        
        {/* Render Replies */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
           {loading && threadMessages.length === 0 ? (
             <div className="p-4 text-center text-gray-400">Carregando...</div>
           ) : (
             <MessageList messages={threadMessages} currentUserId={user?.id} onAddReaction={addReaction} onRemoveReaction={removeReaction} />
           )}
           <div ref={bottomRef} />
        </div>
      </div>
      
      <div className="p-2 bg-white dark:bg-gray-900 border-t dark:border-gray-700 shrink-0">
        <MessageComposer 
          onSend={(text) => {
            const tenantId = localStorage.getItem('tenant_id');
            const clientId = crypto.randomUUID();
            api.channels.sendMessage(tenantId!, channelId, text, clientId, parentMessage.id)
              .catch(() => addToast('error', 'Erro ao enviar resposta'));
          }} 
          onFileUpload={() => {}}
          onChange={() => sendTyping()}
          placeholder="Responder..."
        />
      </div>
    </div>
  );
}
