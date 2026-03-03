'use client';

import { useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';

interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  showErrorToast?: boolean;
}

interface ApiFetchResult<T> {
  data?: T;
  error?: string;
  ok: boolean;
}

export function useApi() {
  const { addToast } = useToast();

  const apiFetch = useCallback(
    async <T = unknown>(url: string, options: ApiFetchOptions = {}): Promise<ApiFetchResult<T>> => {
      const { method = 'GET', body, headers = {}, showErrorToast = true } = options;

      const token = localStorage.getItem('access_token');
      const requestHeaders: Record<string, string> = {
        ...headers,
      };

      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }

      let requestBody: BodyInit | undefined;
      if (body) {
        requestHeaders['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(body);
      }

      let res: Response;
      try {
        res = await fetch(`http://localhost:4000/api/v1${url}`, {
          method,
          headers: requestHeaders,
          body: requestBody,
        });
      } catch (networkError) {
        const error = 'Erro de conexão. Verifique sua internet.';
        if (showErrorToast) {
          addToast('error', error);
        }
        return { ok: false, error };
      }

      if (res.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          return apiFetch<T>(url, options);
        }
        localStorage.clear();
        window.location.href = '/login';
        return { ok: false, error: 'Session expired' };
      }

      let data: unknown;
      let error: string | undefined;

      try {
        data = await res.json();
        if (!res.ok && data && typeof data === 'object' && 'error' in data) {
          error = (data as { error: string }).error;
        }
      } catch {
        // No JSON body
      }

      if (!res.ok) {
        if (showErrorToast && error) {
          addToast('error', error);
        }
        return { ok: false, error, data: data as T };
      }

      return { ok: true, data: data as T };
    },
    [addToast]
  );

  return { apiFetch };
}

async function refreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;

  try {
    const res = await fetch('http://localhost:4000/api/v1/auth/refresh', {
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
