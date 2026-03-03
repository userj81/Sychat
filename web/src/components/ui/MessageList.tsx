'use client';

import { useRef, useEffect, useState } from 'react';
import { Message, Reaction } from '@/types';
import { MarkdownMessage } from './MarkdownMessage';
import { useChatStore } from '@/stores/chat-store';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { FaceSmileIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  onReply?: (message: Message) => void;
}

export function MessageList({ messages, currentUserId, onAddReaction, onRemoveReaction, onReply }: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(messages.length);
  const { onlineUsers } = useChatStore();
  
  const [activePickerMsg, setActivePickerMsg] = useState<string | null>(null);

  useEffect(() => {
    if (messages.length > prevLengthRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  const handleEmojiClick = (emojiData: EmojiClickData, messageId: string) => {
    onAddReaction?.(messageId, emojiData.emoji);
    setActivePickerMsg(null);
  };

  const toggleReaction = (messageId: string, emoji: string, hasReacted: boolean) => {
    if (hasReacted) {
      onRemoveReaction?.(messageId, emoji);
    } else {
      onAddReaction?.(messageId, emoji);
    }
  };

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Nenhuma mensagem ainda. Seja o primeiro!
      </div>
    );
  }

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isOwn = message.user.id === currentUserId;
        const isOnline = onlineUsers[message.user.id];
        
        // Group reactions by emoji
        const reactionGroups = (message.reactions || []).reduce((acc, max) => {
          if (!acc[max.emoji]) acc[max.emoji] = [];
          acc[max.emoji].push(max);
          return acc;
        }, {} as Record<string, Reaction[]>);

        return (
          <div key={message.id} className={`group flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <div className="relative">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
                {message.user.name?.[0] || '?'}
              </div>
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
              )}
            </div>
            
            <div className={`flex-1 min-w-0 flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-baseline gap-2 mb-1`}>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {message.user.name || 'Usuário'}
                  {message.user.deactivated_at && (
                    <span className="ml-2 text-[10px] font-normal px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded uppercase tracking-wider">
                      Desativado
                    </span>
                  )}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(message.inserted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <div className={`relative flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`px-4 py-2 rounded-2xl max-w-prose ${
                  isOwn 
                    ? 'bg-emerald-600 text-white rounded-tr-sm' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
                }`}>
                  {message.attachment_url && (
                    <div className="mb-2 max-w-sm rounded overflow-hidden">
                      {message.attachment_type?.startsWith('image/') ? (
                        <img 
                          src={`http://localhost:4000${message.attachment_url}`} 
                          alt={message.attachment_name || 'Attachment'} 
                          className="max-h-60 rounded object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      ) : (
                        <a 
                          href={`http://localhost:4000${message.attachment_url}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-2 p-3 bg-black/10 dark:bg-white/10 rounded hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span className="truncate max-w-[200px] font-medium text-sm">{message.attachment_name || 'Download File'}</span>
                        </a>
                      )}
                    </div>
                  )}
                  {message.body && <MarkdownMessage content={message.body} />}
                </div>
                
                {/* Hover Actions */}
                <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center`}>
                  <button 
                    onClick={() => onReply?.(message)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    title="Responder em Thread"
                  >
                    <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setActivePickerMsg(activePickerMsg === message.id ? null : message.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    title="Adicionar reação"
                  >
                    <FaceSmileIcon className="w-5 h-5" />
                  </button>
                  {/* Emoji Picker Popover */}
                  {activePickerMsg === message.id && (
                    <div className="absolute bottom-full mb-2 z-50">
                      <div className="fixed inset-0 z-40" onClick={() => setActivePickerMsg(null)}></div>
                      <div className="relative z-50 shadow-xl rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                        <EmojiPicker 
                          onEmojiClick={(emoji) => handleEmojiClick(emoji, message.id)} 
                          lazyLoadEmojis
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Reactions Bar */}
              {Object.keys(reactionGroups).length > 0 && (
                <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  {Object.entries(reactionGroups).map(([emoji, reactions]) => {
                    const hasReacted = reactions.some(r => r.user.id === currentUserId);
                    return (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(message.id, emoji, hasReacted)}
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                          hasReacted 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400' 
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                        title={reactions.map(r => r.user.name).join(', ')}
                      >
                        <span className="text-sm">{emoji}</span>
                        <span>{reactions.length}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* Reply Count Indicator */}
              {message.reply_count && message.reply_count > 0 ? (
                <div className={`flex mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <button 
                    onClick={() => onReply?.(message)}
                    className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>Ver {message.reply_count} {message.reply_count === 1 ? 'resposta' : 'respostas'}</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
