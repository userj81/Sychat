import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { Message } from '@/types';

export function useMessages(channelId?: string, tenantId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevLengthRef = useRef(0);

  const fetchMessages = useCallback(async () => {
    const cid = channelId || window.location.pathname.split('/c/')[1]?.split('/')[0];
    const tid = tenantId || localStorage.getItem('tenant_id') || undefined;
    
    if (!cid || !tid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.channels.getMessages(tid, cid);
      setMessages(data);
      prevLengthRef.current = data.length;
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  }, [channelId, tenantId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = useCallback(
    async (body: string, clientId: string) => {
      const cid = channelId || window.location.pathname.split('/c/')[1]?.split('/')[0];
      const tid = tenantId || localStorage.getItem('tenant_id') || undefined;
      
      if (!cid || !tid) return null;
      
      try {
        const message = await api.channels.sendMessage(tid, cid, body, clientId);
        setMessages((prev) => [...prev, message]);
        return message;
      } catch (err: any) {
        throw new Error(err.message || 'Erro ao enviar mensagem');
      }
    },
    [channelId, tenantId]
  );

  const refresh = useCallback(() => {
    setLoading(true);
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    refresh,
    hasNewMessages: messages.length > prevLengthRef.current,
  };
}
