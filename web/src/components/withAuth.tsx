'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface WithAuthOptions {
  redirectTo?: string;
  publicPage?: boolean;
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const { redirectTo = '/login', publicPage = false } = options;

  function ProtectedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (isLoading) return;

      if (publicPage && isAuthenticated) {
        router.push('/');
        return;
      }

      if (!publicPage && !isAuthenticated) {
        const returnUrl = encodeURIComponent(pathname);
        router.push(`${redirectTo}?returnUrl=${returnUrl}`);
      }
    }, [isAuthenticated, isLoading, pathname, router, redirectTo, publicPage]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      );
    }

    if (publicPage && isAuthenticated) {
      return null;
    }

    if (!publicPage && !isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  }

  ProtectedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  return ProtectedComponent;
}
