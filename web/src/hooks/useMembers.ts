import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { TenantMembership, Invite, TenantPermissions } from '@/types';

export function useMembers(initialTenantId?: string) {
  const [members, setMembers] = useState<TenantMembership[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [permissions, setPermissions] = useState<TenantPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    const tid = initialTenantId || localStorage.getItem('tenant_id') || undefined;
    
    if (!tid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [permsData, membersData] = await Promise.all([
        api.tenants.me(tid),
        api.tenants.getMembers(tid),
      ]);

      setPermissions(permsData);
      setMembers(membersData);

      if (permsData.permissions.manage_members) {
        const invitesData = await api.tenants.listInvites(tid);
        setInvites(invitesData);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar membros');
    } finally {
      setLoading(false);
    }
  }, [initialTenantId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const inviteMember = useCallback(
    async (email: string, role: string) => {
      const tid = initialTenantId || localStorage.getItem('tenant_id') || undefined;
      if (!tid) return;
      await api.tenants.createInvite(tid, { email, role });
      const invitesData = await api.tenants.listInvites(tid);
      setInvites(invitesData);
    },
    [initialTenantId]
  );

  const removeMember = useCallback(
    async (userId: string) => {
      const tid = initialTenantId || localStorage.getItem('tenant_id') || undefined;
      if (!tid) return;
      await api.tenants.removeMember(tid, userId);
      setMembers((prev) => prev.filter((m) => m.user.id !== userId));
    },
    [initialTenantId]
  );

  const updateMemberRole = useCallback(
    async (userId: string, role: 'owner' | 'admin' | 'member') => {
      const tid = initialTenantId || localStorage.getItem('tenant_id') || undefined;
      if (!tid) return;
      await api.tenants.updateMemberRole(tid, userId, role);
      setMembers((prev) =>
        prev.map((m) => (m.user.id === userId ? { ...m, role: role as 'owner' | 'admin' | 'member' } : m))
      );
    },
    [initialTenantId]
  );

  return {
    members,
    invites,
    permissions,
    loading,
    error,
    inviteMember,
    removeMember,
    updateMemberRole,
    refresh: fetchMembers,
  };
}
