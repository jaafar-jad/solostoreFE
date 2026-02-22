'use client';

import Link from 'next/link';

export interface FeaturedApp {
  id: string;
  name: string;
  shortDescription: string;
  category: string;
  icon: string | null;
  iconEmoji?: string;
  downloadCount: number;
  averageRating: number;
  gradient: string;
  accentColor: string;
  apkUrl: string | null;
}

interface Props {
  app: FeaturedApp;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          style={{
            fontSize: '11px',
            color: s <= Math.round(rating) ? '#fbbf24' : 'rgba(255,255,255,0.3)',
          }}
        >
          ★
        </span>
      ))}
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginLeft: '3px' }}>
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
}

export default function FeaturedBannerCard({ app }: Props) {
  return (
    <Link
      href={`/store/app/${app.id}`}
      style={{
        flexShrink: 0,
        width: '340px',
        height: '210px',
        borderRadius: 'var(--radius-xl)',
        background: app.gradient,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 'var(--space-5)',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        scrollSnapAlign: 'start',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)';
      }}
    >
      {/* Background pattern */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '20px',
          right: '30px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          pointerEvents: 'none',
        }}
      />

      {/* App icon */}
      <div
        style={{
          position: 'absolute',
          top: 'var(--space-5)',
          right: 'var(--space-5)',
          width: '72px',
          height: '72px',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.25)',
          overflow: 'hidden',
        }}
      >
        {app.icon
          ? <img src={app.icon} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }} />
          : (app.iconEmoji ?? '📱')}
      </div>

      {/* Featured badge */}
      <div
        style={{
          position: 'absolute',
          top: 'var(--space-4)',
          left: 'var(--space-5)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(251,191,36,0.25)',
          border: '1px solid rgba(251,191,36,0.5)',
          color: '#fbbf24',
          fontSize: '10px',
          fontWeight: 700,
          padding: '3px 10px',
          borderRadius: 'var(--radius-full)',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}
      >
        ✦ Featured
      </div>

      {/* Bottom content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Category */}
        <p
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.65)',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            marginBottom: '4px',
          }}
        >
          {app.category}
        </p>

        {/* App name */}
        <h3
          style={{
            fontSize: 'var(--text-h4)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'white',
            marginBottom: '4px',
            lineHeight: 1.2,
            maxWidth: '200px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {app.name}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.7)',
            marginBottom: 'var(--space-4)',
            maxWidth: '210px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {app.shortDescription}
        </p>

        {/* Rating + Downloads + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <StarRating rating={app.averageRating} />
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
              {formatNum(app.downloadCount)} downloads
            </span>
          </div>
          <button
            style={{
              background: 'rgba(255,255,255,0.22)',
              border: '1.5px solid rgba(255,255,255,0.4)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 700,
              padding: '7px 18px',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all var(--transition-fast)',
              letterSpacing: '0.3px',
            }}
            onClick={(e) => {
              e.preventDefault();
              if (app.apkUrl) window.open(app.apkUrl, '_blank');
            }}
          >
            Get App
          </button>
        </div>
      </div>

      {/* Gradient overlay at bottom */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)',
          pointerEvents: 'none',
        }}
      />
    </Link>
  );
}
