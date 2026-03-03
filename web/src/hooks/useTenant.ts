'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from './useApi';
import { TenantPermissions } from '@/types';

export function useTenant(tenantId?: string) {
  const { apiFetch } = useApi();
  const router = useRouter();
  const [permissions, setPermissions] = useState<TenantPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    if (!tenantId) {
      const storedTenantId = localStorage.getItem('tenant_id');
      if (!storedTenantId) {
        setLoading(false);
        return;
      }
      tenantId = storedTenantId;
    }

    try {
      const { data, ok } = await apiFetch<TenantPermissions>(`/tenants/${tenantId}/me`);
      if (ok && data) {
        setPermissions(data);
      } else {
        setError('Failed to fetch permissions');
      }
    } catch (err) {
      setError('Error fetching permissions');
    } finally {
      setLoading(false);
    }
  }, [tenantId, apiFetch]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const can = useCallback(
    (action: 'manage_members' | 'create_channels' | 'update_roles') => {
      return permissions?.permissions[action] ?? false;
    },
    [permissions]
  );

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    loading,
    error,
    can,
    refetch,
    role: permissions?.role ?? null,
  };
}
