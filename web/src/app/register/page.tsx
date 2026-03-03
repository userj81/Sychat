'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PublicRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function RegisterPageContent() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.auth.register({ name, email, password });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Cadastro falhou');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Sychat</h1>
          <p className="text-gray-500 mt-2">Crie sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <Input
            label="Nome"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div>
            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Mínimo de 8 caracteres</p>
          </div>

          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              Já tem conta? Faça login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <PublicRoute>
      <RegisterPageContent />
    </PublicRoute>
  );
}
