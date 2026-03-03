'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
}

function ProfilePageContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [codeEnabled, setCodeEnabled] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.me.get()
      .then((data) => {
        setUser(data);
        setName(data.name || '');
        setAvatarUrl(data.avatar_url || '');
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
    
    const savedCodeEnabled = localStorage.getItem('code_enabled');
    if (savedCodeEnabled !== null) {
      setCodeEnabled(savedCodeEnabled === 'true');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const data = await api.me.update({ name, avatar_url: avatarUrl });
      setUser(data);
      setSuccess('Perfil atualizado com sucesso!');
      localStorage.setItem('user_name', data.name);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Voltar
          </button>
          <h1 className="text-xl font-semibold">Meu Perfil</h1>
          <div></div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>
            )}
            {success && (
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">{success}</div>
            )}

            <div className="flex flex-col items-center">
              <div 
                onClick={handleAvatarClick}
                className="cursor-pointer relative"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-emerald-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-emerald-100">
                    {name[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 bg-emerald-600 text-white p-1.5 rounded-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-sm text-gray-500 mt-2">Clique na foto para alterar</p>
            </div>

            <Input
              label="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Tema</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Escolha entre modo claro e escuro</p>
              </div>
              <ThemeToggle />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Permitir envio de código</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Habilita o botão de código no chat</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newValue = !codeEnabled;
                  setCodeEnabled(newValue);
                  localStorage.setItem('code_enabled', String(newValue));
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  codeEnabled ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    codeEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Notificações</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receber alertas de novas mensagens</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const notifications = localStorage.getItem('notifications_enabled') !== 'false';
                  localStorage.setItem('notifications_enabled', String(!notifications));
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localStorage.getItem('notifications_enabled') !== 'false' ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localStorage.getItem('notifications_enabled') !== 'false' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <Button type="submit" loading={saving} className="w-full">
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
