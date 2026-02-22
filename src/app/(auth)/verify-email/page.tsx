'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'no-token'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }
    api
      .get(`/auth/verify-email/${token}`)
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Verification failed. The link may have expired or already been used.';
        setErrorMsg(msg);
        setStatus('error');
      });
  }, [token]);

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="glass-card-solid" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '18px',
          }}
        >
          S
        </div>
        <span style={{ fontSize: 'var(--text-h4)', fontWeight: 'var(--font-weight-bold)' }}>
          Solo Store
        </span>
      </div>
      {children}
    </div>
  );

  if (status === 'verifying') {
    return (
      <Shell>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: '3px solid var(--color-primary-100)',
            borderTop: '3px solid var(--color-primary)',
            animation: 'spin 0.9s linear infinite',
            margin: '0 auto var(--space-5)',
          }}
        />
        <h2 style={{ marginBottom: 'var(--space-2)' }}>Verifying your email…</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-sm)' }}>
          Just a moment while we confirm your address.
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </Shell>
    );
  }

  if (status === 'success') {
    return (
      <Shell>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-success-light)',
            border: '2px solid var(--color-primary-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-5)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={{ marginBottom: 'var(--space-3)', color: 'var(--color-primary)' }}>
          Email verified!
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-7)', fontSize: 'var(--text-body-sm)', lineHeight: 1.6 }}>
          Your email address has been confirmed. Your account is fully active.
        </p>
        <Link href="/dashboard" className="btn-primary" style={{ display: 'inline-flex' }}>
          Go to dashboard
        </Link>
      </Shell>
    );
  }

  if (status === 'no-token') {
    return (
      <Shell>
        <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>🔗</div>
        <h2 style={{ marginBottom: 'var(--space-3)' }}>Invalid Link</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-7)', fontSize: 'var(--text-body-sm)' }}>
          This verification link is missing a token. Please click the link directly from your email.
        </p>
        <Link href="/login" className="btn-ghost" style={{ display: 'inline-flex' }}>
          Back to sign in
        </Link>
      </Shell>
    );
  }

  // error
  return (
    <Shell>
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-danger-light)',
          border: '2px solid var(--color-danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-5)',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 style={{ marginBottom: 'var(--space-3)' }}>Verification Failed</h2>
      <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-7)', fontSize: 'var(--text-body-sm)', lineHeight: 1.6 }}>
        {errorMsg}
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/login" className="btn-primary" style={{ display: 'inline-flex' }}>
          Sign in
        </Link>
        <Link href="/settings" className="btn-ghost" style={{ display: 'inline-flex' }}>
          Account settings
        </Link>
      </div>
    </Shell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
