'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const eyeIcon = (visible: boolean) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {visible ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!token) {
      setErrorMsg('Invalid or missing reset token. Please request a new link.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setStatus('loading');
    try {
      await api.post(`/auth/reset-password/${token}`, { newPassword });
      setStatus('success');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to reset password. The link may have expired.';
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  if (!token) {
    return (
      <div className="glass-card-solid" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>🔗</div>
        <h2 style={{ marginBottom: 'var(--space-3)' }}>Invalid Reset Link</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-body-sm)' }}>
          This reset link is missing or invalid. Please request a new one.
        </p>
        <Link href="/forgot-password" className="btn-primary" style={{ display: 'inline-flex' }}>
          Request new link
        </Link>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="glass-card-solid" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>✅</div>
        <h2 style={{ marginBottom: 'var(--space-3)' }}>Password Reset!</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-body-sm)' }}>
          Your password has been updated. Redirecting you to sign in…
        </p>
        <Link href="/login" className="btn-primary" style={{ display: 'inline-flex' }}>
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card-solid" style={{ padding: 'var(--space-8)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-4)',
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
        <h1 style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)' }}>
          Set new password
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-sm)' }}>
          Choose a strong password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {errorMsg && (
          <div
            style={{
              background: 'var(--color-danger-light)',
              color: 'var(--color-danger)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-body-sm)',
              marginBottom: 'var(--space-5)',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* New password */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label
            htmlFor="new-password"
            style={{
              display: 'block',
              fontSize: 'var(--text-body-sm)',
              fontWeight: 'var(--font-weight-medium)',
              marginBottom: 'var(--space-2)',
            }}
          >
            New Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="new-password"
              type={showPw ? 'text' : 'password'}
              className="input-field"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setErrorMsg(''); }}
              style={{ paddingRight: '48px' }}
              autoFocus
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
              }}
            >
              {eyeIcon(showPw)}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <label
            htmlFor="confirm-password"
            style={{
              display: 'block',
              fontSize: 'var(--text-body-sm)',
              fontWeight: 'var(--font-weight-medium)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Confirm Password
          </label>
          <input
            id="confirm-password"
            type={showPw ? 'text' : 'password'}
            className="input-field"
            placeholder="Repeat your new password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg(''); }}
            required
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>
              Passwords do not match
            </p>
          )}
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={status === 'loading'}
          style={{ width: '100%', padding: 'var(--space-4) var(--space-6)' }}
        >
          {status === 'loading' ? 'Resetting…' : 'Reset Password'}
        </button>
      </form>

      <hr className="divider" />
      <p style={{ textAlign: 'center', fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
        <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-weight-semibold)', textDecoration: 'none' }}>
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
