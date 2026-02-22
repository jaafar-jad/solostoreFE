'use client';

import Link from 'next/link';

export interface StoreApp {
  id: string;
  name: string;
  shortDescription: string;
  category: string;
  icon: string | null;
  iconEmoji?: string;
  accentColor: string;
  downloadCount: number;
  averageRating: number;
  apkUrl: string | null;
  isFeatured?: boolean;
}

interface Props {
  app: StoreApp;
  variant?: 'horizontal' | 'grid';
}

function Stars({ r }: { r: number }) {
  const full = Math.floor(r);
  return (
    <span style={{ display: 'inline-flex', gap: '1px' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ fontSize: '10px', color: s <= full ? '#fbbf24' : '#e2e8f0' }}>★</span>
      ))}
    </span>
  );
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
}

export default function AppCard({ app, variant = 'horizontal' }: Props) {
  const isHorizontal = variant === 'horizontal';

  if (isHorizontal) {
    return (
      <Link
        href={`/store/app/${app.id}`}
        style={{
          flexShrink: 0,
          width: '160px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          textDecoration: 'none',
          gap: 'var(--space-2)',
          scrollSnapAlign: 'start',
          cursor: 'pointer',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '160px',
            height: '160px',
            borderRadius: 'var(--radius-xl)',
            background: `linear-gradient(135deg, ${app.accentColor}22, ${app.accentColor}44)`,
            border: `1px solid ${app.accentColor}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            flexShrink: 0,
            transition: 'transform var(--transition-fast)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.03)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
        >
          {app.icon
            ? <img src={app.icon} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (app.iconEmoji ?? '📱')}
        </div>

        {/* Info */}
        <div style={{ width: '100%' }}>
          <p
            style={{
              fontSize: 'var(--text-body-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: '2px',
            }}
          >
            {app.name}
          </p>
          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              marginBottom: '4px',
            }}
          >
            {app.category}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Stars r={app.averageRating} />
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                {app.averageRating.toFixed(1)}
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
              {fmt(app.downloadCount)}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Grid variant
  return (
    <Link
      href={`/store/app/${app.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-white)',
        border: '1px solid var(--color-border)',
        textDecoration: 'none',
        transition: 'all var(--transition-fast)',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '60px',
          height: '60px',
          borderRadius: 'var(--radius-lg)',
          background: `linear-gradient(135deg, ${app.accentColor}22, ${app.accentColor}44)`,
          border: `1px solid ${app.accentColor}33`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '26px',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {app.icon
          ? <img src={app.icon} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (app.iconEmoji ?? '📱')}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 'var(--text-body-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '2px',
          }}
        >
          {app.name}
        </p>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
          {app.category}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Stars r={app.averageRating} />
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
            {fmt(app.downloadCount)} downloads
          </span>
        </div>
      </div>

      {/* Get button */}
      <button
        style={{
          flexShrink: 0,
          background: 'var(--color-primary-50)',
          color: 'var(--color-primary)',
          border: '1px solid var(--color-primary-100)',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
        }}
        onClick={(e) => {
          e.preventDefault();
          window.location.href = `/store/app/${app.id}`;
        }}
      >
        Get
      </button>
    </Link>
  );
}
