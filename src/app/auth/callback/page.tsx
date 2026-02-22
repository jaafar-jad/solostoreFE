'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      router.replace(`/login?error=${error ?? 'oauth_failed'}`);
      return;
    }

    // Store token so the api interceptor attaches it to the /auth/me request
    localStorage.setItem('accessToken', token);

    api
      .get('/auth/me')
      .then(({ data }) => {
        setAuth(data.data, token);
        router.replace('/dashboard');
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        router.replace('/login?error=oauth_failed');
      });
  }, [searchParams, router, setAuth]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 'var(--space-4)',
        background: 'var(--color-surface)',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid var(--color-primary-100)',
          borderTopColor: 'var(--color-primary)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-sm)' }}>
        Completing sign in…
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'var(--color-surface)',
          }}
        >
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading…</p>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
