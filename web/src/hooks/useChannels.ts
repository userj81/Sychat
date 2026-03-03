import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { ChannelList } from '@/types';

export function useChannels(tenantId?: string) {
  const [channels, setChannels] = useState<ChannelList>({ public: [], private: [], dms: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    const tid = tenantId || localStorage.getItem('tenant_id') || undefined;
    
    if (!tid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.channels.list(tid);
      setChannels(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar canais');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const createChannel = useCallback(
    async (name: string, type: 'public' | 'private' = 'public') => {
      const tid = tenantId || localStorage.getItem('tenant_id') || undefined;
      if (!tid) return;
      await api.channels.create(tid, { name, type });
      await fetchChannels();
    },
    [tenantId, fetchChannels]
  );

  const refresh = useCallback(() => {
    setLoading(true);
    fetchChannels();
  }, [fetchChannels]);

  return {
    channels,
    loading,
    error,
    createChannel,
    refresh,
  };
}
