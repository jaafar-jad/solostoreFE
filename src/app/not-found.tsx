import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '404 — Page Not Found | Solo Store' };

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8)',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        {/* Big 404 */}
        <div
          style={{
            fontSize: 'clamp(5rem, 15vw, 9rem)',
            fontWeight: 800,
            lineHeight: 1,
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 'var(--space-4)',
            userSelect: 'none',
          }}
        >
          404
        </div>

        {/* Icon */}
        <p style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🔍</p>

        <h1
          style={{
            fontSize: 'var(--text-h2)',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-3)',
          }}
        >
          Page not found
        </h1>

        <p
          style={{
            fontSize: 'var(--text-body)',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            marginBottom: 'var(--space-8)',
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist, was moved, or is only available to certain users.
        </p>

        {/* Quick links */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 'var(--space-8)',
          }}
        >
          <Link
            href="/"
            className="btn-primary"
            style={{ padding: 'var(--space-3) var(--space-6)' }}
          >
            Go Home
          </Link>
          <Link
            href="/store"
            className="btn-ghost"
            style={{ padding: 'var(--space-3) var(--space-6)' }}
          >
            Browse Store
          </Link>
        </div>

        {/* Helpful links */}
        <style>{`
          .nf-link {
            display: flex; align-items: center; justify-content: space-between;
            padding: var(--space-3) var(--space-4); border-radius: var(--radius-md);
            background: var(--color-surface); border: 1px solid var(--color-border);
            text-decoration: none; transition: all var(--transition-fast); gap: var(--space-3);
          }
          .nf-link:hover { border-color: var(--color-primary); background: var(--color-primary-50); }
        `}</style>
        <div
          style={{
            padding: 'var(--space-5)',
            background: 'var(--color-white)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-body-sm)',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-3)',
            }}
          >
            You might be looking for:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {[
              { href: '/store',     label: '📱 Browse Apps',         desc: 'Discover Android apps'         },
              { href: '/plans',     label: '💳 Pricing Plans',       desc: 'View subscription options'     },
              { href: '/login',     label: '🔑 Sign In',             desc: 'Access your account'           },
              { href: '/dashboard', label: '🚀 Developer Dashboard', desc: 'Manage your apps'              },
              { href: '/register',  label: '✨ Get Started',         desc: 'Create a free account'         },
            ].map(({ href, label, desc }) => (
              <Link key={href} href={href} className="nf-link">
                <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {label}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {desc}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
