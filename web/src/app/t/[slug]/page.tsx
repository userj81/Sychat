'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { SkeletonChannelList } from '@/components/ui/Skeleton';

function WorkspacePageContent() {
  const params = useParams();
  const router = useRouter();
  const [channels, setChannels] = useState<any>({ public: [], private: [], dms: [] });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [error, setError] = useState('');
  const [canCreateChannels, setCanCreateChannels] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const tenantId = localStorage.getItem('tenant_id');
    
    if (!tenantId) {
      router.push('/login');
      return;
    }

    Promise.all([api.channels.list(tenantId), api.tenants.me(tenantId)])
      .then(([data, me]) => {
        setChannels(data);
        setCanCreateChannels(me.permissions.create_channels);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const filteredChannels = useMemo(() => {
    if (!search.trim()) return channels;
    const searchLower = search.toLowerCase();
    return {
      public: channels.public.filter((c: any) => c.name.toLowerCase().includes(searchLower)),
      private: channels.private.filter((c: any) => c.name.toLowerCase().includes(searchLower)),
      dms: channels.dms.filter((c: any) => c.name.toLowerCase().includes(searchLower)),
    };
  }, [channels, search]);

  const createChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const tenantId = localStorage.getItem('tenant_id');

    try {
      await api.channels.create(tenantId!, { name: channelName, type: 'public' });
      const data = await api.channels.list(tenantId!);
      setChannels(data);
      setShowCreate(false);
      setChannelName('');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar canal');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="w-64 bg-gray-900 text-white p-4">
          <SkeletonChannelList count={6} />
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-gray-400">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4">
        <h2 className="text-lg font-bold mb-4">Canais</h2>
        
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar canais..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
          {filteredChannels.public?.map((channel: any) => (
            <button
              key={channel.id}
              onClick={() => router.push(`/t/${params.slug}/c/${channel.id}`)}
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-800 flex items-center justify-between"
            >
              <span className="truncate"># {channel.name}</span>
              {channel.unread_count > 0 && (
                <span className="ml-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {channel.unread_count}
                </span>
              )}
            </button>
          ))}
          {filteredChannels.private?.map((channel: any) => (
            <button
              key={channel.id}
              onClick={() => router.push(`/t/${params.slug}/c/${channel.id}`)}
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-800 text-gray-400 flex items-center justify-between"
            >
              <span className="truncate">🔒 {channel.name}</span>
              {channel.unread_count > 0 && (
                <span className="ml-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {channel.unread_count}
                </span>
              )}
            </button>
          ))}
          {filteredChannels.dms?.map((channel: any) => (
            <button
              key={channel.id}
              onClick={() => router.push(`/t/${params.slug}/c/${channel.id}`)}
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-800 flex items-center justify-between"
            >
              <span className="truncate">@{channel.name.replace('dm:', '')}</span>
              {channel.unread_count > 0 && (
                <span className="ml-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {channel.unread_count}
                </span>
              )}
            </button>
          ))}
          {filteredChannels.public?.length === 0 && filteredChannels.private?.length === 0 && filteredChannels.dms?.length === 0 && (
            <p className="text-gray-500 text-sm px-3 py-2">Nenhum canal encontrado</p>
          )}
        </div>

        {canCreateChannels && (
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 w-full py-2 border border-gray-700 rounded hover:bg-gray-800"
          >
            + Novo Canal
          </button>
        )}

        <button
          onClick={() => router.push('/profile')}
          className="mt-2 w-full py-2 border border-gray-700 rounded hover:bg-gray-800"
        >
          Meu Perfil
        </button>

        <button
          onClick={() => router.push(`/t/${params.slug}/settings`)}
          className="mt-2 w-full py-2 border border-gray-700 rounded hover:bg-gray-800"
        >
          Configurações
        </button>

        <button
          onClick={() => api.auth.logout()}
          className="mt-2 w-full py-2 text-red-400 hover:text-red-300"
        >
          Sair
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p>Selecione um canal para começar</p>
        </div>
      </div>

      {/* Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Novo Canal</h3>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm">
                {error}
              </div>
            )}
            <form onSubmit={createChannel}>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="Nome do canal"
                className="w-full px-3 py-2 border rounded mb-4"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 border rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white rounded"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <ProtectedRoute>
      <WorkspacePageContent />
    </ProtectedRoute>
  );
}
