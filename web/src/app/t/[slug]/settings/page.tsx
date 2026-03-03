'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { SkeletonMemberList } from '@/components/ui/Skeleton';

interface Member {
  user: { id: string; name: string; email: string };
  role: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  code: string;
  expires_at: string;
}

interface TenantPermissions {
  role: string;
  permissions: { manage_members: boolean; create_channels: boolean; update_roles: boolean };
}

function SettingsPageContent() {
  const params = useParams();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [tenantPerms, setTenantPerms] = useState<TenantPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const tenantId = localStorage.getItem('tenant_id');

    if (!tenantId) {
      router.push('/login');
      return;
    }

    Promise.all([api.tenants.me(tenantId), api.tenants.getMembers(tenantId)])
      .then(async ([me, membersData]) => {
        setTenantPerms(me);
        setMembers(membersData);

        if (me.permissions.manage_members) {
          const invitesData = await api.tenants.listInvites(tenantId);
          setInvites(invitesData);
        }

        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const tenantId = localStorage.getItem('tenant_id');

    try {
      const data = await api.tenants.createInvite(tenantId!, { email: inviteEmail, role: inviteRole });
      setSuccess(`Convite enviado! Codigo: ${data.code}`);
      setInviteEmail('');
      setShowInvite(false);
      const invitesData = await api.tenants.listInvites(tenantId!);
      setInvites(invitesData);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar convite');
    }
  };

  const removeMember = async (userId: string) => {
    if (!confirm('Tem certeza que deseja remover este membro?')) return;

    const tenantId = localStorage.getItem('tenant_id');

    try {
      await api.tenants.removeMember(tenantId!, userId);
      setMembers((prev) => prev.filter((m) => m.user.id !== userId));
      setSuccess('Membro removido');
    } catch (err: any) {
      setError(err.message || 'Erro ao remover membro');
    }
  };

  const updateRole = async (userId: string, role: string) => {
    const tenantId = localStorage.getItem('tenant_id');

    try {
      await api.tenants.updateMemberRole(tenantId!, userId, role);
      setMembers((prev) => prev.map((m) => (m.user.id === userId ? { ...m, role } : m)));
      setSuccess('Role atualizada');
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar role');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <SkeletonMemberList count={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push(`/t/${params.slug}`)} className="text-gray-600 hover:text-gray-900">
            ← Voltar
          </button>
          <h1 className="text-xl font-semibold">Configuracoes do Workspace</h1>
          <div className="text-sm text-gray-500">Role: {tenantPerms?.role}</div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>}
        {success && <div className="p-3 bg-green-50 text-green-600 rounded-lg">{success}</div>}

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Membros ({members.length})</h2>
            {tenantPerms?.permissions.manage_members && (
              <Button onClick={() => setShowInvite(true)}>
                + Convidar
              </Button>
            )}
          </div>
          <div className="divide-y">
            {members.map((member) => (
              <div key={member.user.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                    {member.user.name[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium">{member.user.name}</p>
                    <p className="text-sm text-gray-500">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {tenantPerms?.permissions.update_roles && member.role !== 'owner' ? (
                    <select
                      value={member.role}
                      onChange={(e) => updateRole(member.user.id, e.target.value)}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="member">member</option>
                      <option value="admin">admin</option>
                    </select>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">{member.role}</span>
                  )}

                  {tenantPerms?.permissions.manage_members && member.role !== 'owner' && (
                    <Button variant="ghost" size="sm" onClick={() => removeMember(member.user.id)}>
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {tenantPerms?.permissions.manage_members && invites.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Convites Pendentes ({invites.length})</h2>
            </div>
            <div className="divide-y">
              {invites.map((invite) => (
                <div key={invite.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-sm text-gray-500">Expira em {new Date(invite.expires_at).toLocaleDateString()}</p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-sm rounded">{invite.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tenantPerms?.permissions.manage_members && showInvite && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Convidar Membro</h3>
              <form onSubmit={sendInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Funcao</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="member">Membro</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => setShowInvite(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Enviar Convite
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  );
}
