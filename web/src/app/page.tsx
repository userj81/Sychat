'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function normalizeSlug(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function HomePageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.tenants.list()
      .then((data) => {
        setTenants(data);
        setLoading(false);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const normalizedSlug = normalizeSlug(slug);
    
    try {
      await api.tenants.create({ name, slug: normalizedSlug });
      const data = await api.tenants.list();
      setTenants(data);
      setShowCreate(false);
      setName('');
      setSlug('');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar workspace');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (tenants.length === 0 || showCreate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Criar Workspace</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleCreateTenant} className="space-y-4">
            <Input
              label="Nome"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(normalizeSlug(e.target.value));
              }}
              placeholder="Minha Empresa"
              required
            />
            <Input
              label="URL"
              value={slug}
              onChange={(e) => setSlug(normalizeSlug(e.target.value))}
              placeholder="minha-empresa"
              required
            />
            <p className="text-xs text-gray-500">Apenas letras, números e hífens</p>
            <Button type="submit" className="w-full">
              Criar
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Seus Workspaces</h1>
        <div className="grid gap-4">
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => {
                localStorage.setItem('tenant_id', tenant.id);
                router.push(`/t/${tenant.slug}`);
              }}
              className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
            >
              <h3 className="font-semibold">{tenant.name}</h3>
              <p className="text-gray-500 text-sm">{tenant.slug}</p>
            </button>
          ))}
          <button
            onClick={() => setShowCreate(true)}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-emerald-500 hover:text-emerald-600"
          >
            + Novo Workspace
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomePageContent />
    </ProtectedRoute>
  );
}
