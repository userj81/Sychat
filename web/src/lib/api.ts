const API_URL = 'http://localhost:4000/api/v1';

async function refreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T = any>(
  url: string,
  options: { method?: string; headers?: Record<string, string>; body?: any } = {}
): Promise<{ ok: boolean; data?: T; error?: string; status: number }> {
  let token = localStorage.getItem('access_token');
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
    body,
  });

  if (res.status === 401) {
    const refreshed = await refreshToken();
    
    if (refreshed) {
      token = localStorage.getItem('access_token');
      headers['Authorization'] = `Bearer ${token}`;
      
      res = await fetch(`${API_URL}${url}`, {
        ...options,
        headers,
      });
    } else {
      localStorage.clear();
      window.location.href = '/login';
      return { ok: false, error: 'Session expired', status: 401 };
    }
  }

  let data: T | undefined;
  let error: string | undefined;

  try {
    data = await res.json();
    if (!res.ok && data && typeof data === 'object' && 'error' in data) {
      error = (data as any).error;
    }
  } catch {
    // No JSON body
  }

  return {
    ok: res.ok,
    data,
    error,
    status: res.status,
  };
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (refreshToken) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      // Ignore logout errors
    }
  }

  localStorage.clear();
  window.location.href = '/login';
}

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const { data, error } = await apiFetch<{ user: any; access_token: string; refresh_token: string }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      if (!data) throw new Error(error || 'Login failed');
      return data;
    },

    register: async (data: { email: string; password: string; name: string }) => {
      const { data: res, error } = await apiFetch<{ user: any; access_token: string; refresh_token: string }>('/auth/register', {
        method: 'POST',
        body: data,
      });
      if (!res) throw new Error(error || 'Registration failed');
      return res;
    },

    logout: async () => {
      await logout();
    },
  },

  me: {
    get: async () => {
      const { data, error } = await apiFetch<{ id: string; email: string; name: string; avatar_url: string | null }>('/me');
      if (!data) throw new Error(error || 'Failed to fetch user');
      return data;
    },

    update: async (body: { name?: string; avatar_url?: string }) => {
      const { data, error } = await apiFetch<{ id: string; email: string; name: string; avatar_url: string | null }>('/me', {
        method: 'PUT',
        body,
      });
      if (!data) throw new Error(error || 'Failed to update user');
      return data;
    },
  },

  tenants: {
    list: async () => {
      const { data, error } = await apiFetch<{ tenants: any[] }>('/tenants');
      if (!data) throw new Error(error || 'Failed to fetch tenants');
      return data.tenants;
    },

    create: async (body: { name: string; slug: string }) => {
      const { data, error } = await apiFetch<{ id: string; name: string; slug: string }>('/tenants', {
        method: 'POST',
        body,
      });
      if (!data) throw new Error(error || 'Failed to create tenant');
      return data;
    },

    get: async (tenantId: string) => {
      const { data, error } = await apiFetch<{ id: string; name: string; slug: string }>(`/tenants/${tenantId}`);
      if (!data) throw new Error(error || 'Failed to fetch tenant');
      return data;
    },

    me: async (tenantId: string) => {
      const { data, error } = await apiFetch<{
        role: string;
        permissions: { manage_members: boolean; create_channels: boolean; update_roles: boolean };
      }>(`/tenants/${tenantId}/me`);
      if (!data) throw new Error(error || 'Failed to fetch tenant permissions');
      return data;
    },

    getMembers: async (tenantId: string) => {
      const { data, error } = await apiFetch<{ members: any[] }>(`/tenants/${tenantId}/members`);
      if (!data) throw new Error(error || 'Failed to fetch members');
      return data.members;
    },

    createInvite: async (tenantId: string, body: { email: string; role: string }) => {
      const { data, error } = await apiFetch<{ code: string; expires_at: string }>(`/tenants/${tenantId}/invites`, {
        method: 'POST',
        body,
      });
      if (!data) throw new Error(error || 'Failed to create invite');
      return data;
    },

    listInvites: async (tenantId: string) => {
      const { data, error } = await apiFetch<{ invites: any[] }>(`/tenants/${tenantId}/invites`);
      if (!data) throw new Error(error || 'Failed to fetch invites');
      return data.invites;
    },

    updateMemberRole: async (tenantId: string, userId: string, role: string) => {
      const { error } = await apiFetch(`/tenants/${tenantId}/members/${userId}/role`, {
        method: 'PATCH',
        body: { role },
      });
      if (error) throw new Error(error);
    },

    removeMember: async (tenantId: string, userId: string) => {
      const { error } = await apiFetch(`/tenants/${tenantId}/members/${userId}`, {
        method: 'DELETE',
      });
      if (error) throw new Error(error);
    },
  },

  channels: {
    list: async (tenantId: string) => {
      const { data, error } = await apiFetch<any>(`/tenants/${tenantId}/channels`);
      if (!data) throw new Error(error || 'Failed to fetch channels');
      return data;
    },

    create: async (tenantId: string, body: { name: string; type: string }) => {
      const { data, error } = await apiFetch<any>(`/tenants/${tenantId}/channels`, {
        method: 'POST',
        body,
      });
      if (!data) throw new Error(error || 'Failed to create channel');
      return data;
    },

    get: async (tenantId: string, channelId: string) => {
      const { data, error } = await apiFetch<any>(`/tenants/${tenantId}/channels/${channelId}`);
      if (!data) throw new Error(error || 'Failed to fetch channel');
      return data;
    },

    join: async (tenantId: string, channelId: string) => {
      const { error } = await apiFetch(`/tenants/${tenantId}/channels/${channelId}/join`, {
        method: 'POST',
      });
      if (error) throw new Error(error);
    },

    leave: async (tenantId: string, channelId: string) => {
      const { error } = await apiFetch(`/tenants/${tenantId}/channels/${channelId}/leave`, {
        method: 'DELETE',
      });
      if (error) throw new Error(error);
    },

    getMessages: async (tenantId: string, channelId: string) => {
      const { data, error } = await apiFetch<{ messages: any[] }>(`/tenants/${tenantId}/channels/${channelId}/messages`);
      if (!data) throw new Error(error || 'Failed to fetch messages');
      return data.messages;
    },

    getThreadMessages: async (tenantId: string, channelId: string, parentId: string) => {
      const { data, error } = await apiFetch<{ messages: any[] }>(`/tenants/${tenantId}/channels/${channelId}/messages/${parentId}/replies`);
      if (!data) throw new Error(error || 'Failed to fetch thread messages');
      return data.messages;
    },

    sendMessage: async (tenantId: string, channelId: string, body: string, clientId: string, parentId?: string) => {
      const payload: any = { body, client_id: clientId };
      if (parentId) payload.parent_id = parentId;

      const { data, error } = await apiFetch<any>(`/tenants/${tenantId}/channels/${channelId}/messages`, {
        method: 'POST',
        body: payload,
      });
      if (!data) throw new Error(error || 'Failed to send message');
      return data;
    },

    sendMessageWithAttachment: async (tenantId: string, channelId: string, formData: FormData) => {
      const { data, error } = await apiFetch<any>(`/tenants/${tenantId}/channels/${channelId}/messages_with_attachment`, {
        method: 'POST',
        body: formData, // Fetch automatically removes Content-Type wrapper for FormData
      });
      if (!data) throw new Error(error || 'Failed to send message with attachment');
      return data;
    },

    createDm: async (tenantId: string, userId: string) => {
      const { data, error } = await apiFetch<any>(`/tenants/${tenantId}/dms`, {
        method: 'POST',
        body: { user_id: userId },
      });
      if (!data) throw new Error(error || 'Failed to create DM');
      return data;
    },
  },

  messages: {
    update: async (messageId: string, body: string) => {
      const { data, error } = await apiFetch<any>(`/messages/${messageId}`, {
        method: 'PATCH',
        body: { body },
      });
      if (!data) throw new Error(error || 'Failed to update message');
      return data;
    },

    delete: async (messageId: string) => {
      const { error } = await apiFetch(`/messages/${messageId}`, {
        method: 'DELETE',
      });
      if (error) throw new Error(error);
    },
  },

  invites: {
    accept: async (code: string) => {
      const { data, error } = await apiFetch<{ message: string }>(`/invites/${code}/accept`, {
        method: 'POST',
      });
      if (!data) throw new Error(error || 'Failed to accept invite');
      return data;
    },
  },
};
