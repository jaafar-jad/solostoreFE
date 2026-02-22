'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';

const schema = z.object({
  email: z.string().email('Invalid email address'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      await api.post('/auth/forgot-password', data);
      setSent(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Something went wrong. Please try again.';
      setServerError(msg);
    }
  };

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
        <h1
          style={{
            fontSize: 'var(--text-h3)',
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--space-2)',
          }}
        >
          Reset password
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-sm)' }}>
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {sent ? (
        <div
          style={{
            background: 'var(--color-success-light)',
            color: 'var(--color-success)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            fontSize: 'var(--text-body-sm)',
          }}
        >
          ✓ Check your inbox — we sent a password reset link.
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {serverError && (
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
              {serverError}
            </div>
          )}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: 'var(--text-body-sm)',
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input-field"
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>
                {errors.email.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', padding: 'var(--space-4) var(--space-6)' }}
          >
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <hr className="divider" />
      <p style={{ textAlign: 'center', fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
        <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-weight-semibold)', textDecoration: 'none' }}>
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
