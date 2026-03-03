'use client';

import { ReactNode } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface WorkspaceLayoutProps {
  children: ReactNode;
  channels?: ReactNode;
}

export function WorkspaceLayout({ children, channels }: WorkspaceLayoutProps) {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4 flex flex-col">
        <button
          onClick={() => router.push('/')}
          className="mb-4 text-gray-400 hover:text-white flex items-center gap-2"
        >
          ← Voltar
        </button>
        
        {channels}

        <div className="mt-auto pt-4 border-t border-gray-700 space-y-1">
          <button
            onClick={() => router.push('/profile')}
            className="w-full text-left px-3 py-2 rounded hover:bg-gray-800"
          >
            Meu Perfil
          </button>
          <button
            onClick={() => router.push(`/t/${slug}/settings`)}
            className="w-full text-left px-3 py-2 rounded hover:bg-gray-800"
          >
            Configurações
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              router.push('/login');
            }}
            className="w-full text-left px-3 py-2 rounded hover:bg-gray-800 text-red-400"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
