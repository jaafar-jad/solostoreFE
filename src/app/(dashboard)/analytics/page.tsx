'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { App } from '@/types/app.types';
import type { Plan } from '@/types/plan.types';

// Star bar component — visual rating breakdown
function RatingBar({ rating, count }: { rating: number; count: number }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const full = rating >= i + 1;
    const partial = !full && rating > i;
    const pct = partial ? Math.round((rating - i) * 100) : 0;
    return { full, partial, pct };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {stars.map((s, i) =>
        s.full ? (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="var(--color-warning)" stroke="none">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ) : s.partial ? (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24">
            <defs>
              <linearGradient id={`grad-${i}-${count}`}>
                <stop offset={`${s.pct}%`} stopColor="var(--color-warning)" />
                <stop offset={`${s.pct}%`} stopColor="var(--color-border)" />
              </linearGradient>
            </defs>
            <polygon
              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
              fill={`url(#grad-${i}-${count})`}
              stroke="none"
            />
          </svg>
        ) : (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="var(--color-border)" stroke="none">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )
      )}
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: '2px' }}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// Health status pill
function HealthBadge({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  if (reviewCount < 3) {
    return <span className="badge badge-gray">No data</span>;
  }
  if (rating < 2.5) {
    return <span className="badge badge-red">Critical</span>;
  }
  if (rating < 3.5) {
    return <span className="badge badge-yellow">Below avg</span>;
  }
  if (rating >= 4.5) {
    return <span className="badge badge-green">Excellent</span>;
  }
  return <span className="badge badge-blue">Good</span>;
}

export default function AnalyticsPage() {
  const { user } = useAuth();

  const { data: currentPlan } = useQuery<Plan | null>({
    queryKey: ['current-plan', user?.currentPlan],
    queryFn: async () => {
      if (!user?.currentPlan) return null;
      // currentPlan may be a populated Plan object (from /me) or just a string ID
      const planId =
        typeof user.currentPlan === 'object'
          ? (user.currentPlan as unknown as { _id: string })._id
          : user.currentPlan;
      const { data } = await api.get(`/plans/${planId}`);
      return data.data as Plan;
    },
    enabled: !!user?.currentPlan,
  });

  const { data: apps = [], isLoading } = useQuery<App[]>({
    queryKey: ['my-apps'],
    queryFn: async () => {
      const { data } = await api.get('/apps');
      return data.data as App[];
    },
  });

  const hasAnalytics = currentPlan?.features.hasAnalytics ?? false;
  const publishedApps = apps.filter((a) => a.status === 'published');
  const totalDownloads = apps.reduce((sum, a) => sum + (a.downloadCount ?? 0), 0);
  const ratedApps = publishedApps.filter((a) => a.reviewCount >= 1);
  const avgRating =
    ratedApps.length > 0
      ? ratedApps.reduce((sum, a) => sum + a.averageRating, 0) / ratedApps.length
      : 0;
  const maxDownloads = Math.max(...apps.map((a) => a.downloadCount ?? 0), 1);

  // Upgrade wall
  if (!hasAnalytics && !isLoading) {
    return (
      <div>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1 style={{ marginBottom: 'var(--space-1)' }}>Analytics</h1>
          <p>Track your app performance — downloads, ratings, and review health.</p>
        </div>

        <div
          className="glass-card-solid"
          style={{
            padding: 'var(--space-16)',
            textAlign: 'center',
            background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-white) 100%)',
            border: '2px dashed var(--color-primary-200)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-primary-50)',
              border: '2px solid var(--color-primary-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-5)',
              color: 'var(--color-primary)',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <h2 style={{ marginBottom: 'var(--space-3)' }}>Analytics is a paid feature</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)', maxWidth: '420px', margin: '0 auto var(--space-8)', lineHeight: 1.7 }}>
            Upgrade to the <strong>Basic plan or higher</strong> to unlock per-app download stats,
            rating breakdowns, review health scores, and more.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/billing" className="btn-primary">
              View Plans &amp; Upgrade
            </Link>
            <Link href="/my-apps" className="btn-ghost">
              Back to My Apps
            </Link>
          </div>

          {/* Blurred preview teaser */}
          <div
            style={{
              marginTop: 'var(--space-10)',
              filter: 'blur(6px)',
              opacity: 0.4,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
            aria-hidden="true"
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-6)',
              }}
            >
              {[
                { label: 'Total Downloads', value: '—' },
                { label: 'Avg Rating', value: '—' },
                { label: 'Published Apps', value: '—' },
                { label: 'Reviews', value: '—' },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-5)',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{s.label}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 'var(--text-h2)', fontWeight: 800 }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ marginBottom: 'var(--space-1)' }}>Analytics</h1>
        <p>Track your app performance — downloads, ratings, and review health.</p>
      </div>

      {/* Portfolio summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-5)',
          marginBottom: 'var(--space-8)',
        }}
      >
        {[
          {
            label: 'Total Downloads',
            value: totalDownloads >= 1000 ? `${(totalDownloads / 1000).toFixed(1)}k` : String(totalDownloads),
            color: 'var(--color-info)',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            ),
          },
          {
            label: 'Portfolio Avg Rating',
            value: ratedApps.length > 0 ? avgRating.toFixed(1) : '—',
            color: 'var(--color-warning)',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ),
          },
          {
            label: 'Published Apps',
            value: String(publishedApps.length),
            color: 'var(--color-primary)',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            ),
          },
          {
            label: 'Total Reviews',
            value: String(apps.reduce((sum, a) => sum + (a.reviewCount ?? 0), 0)),
            color: 'var(--color-success)',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            ),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card-solid"
            style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', fontWeight: 500, margin: 0 }}>
                {stat.label}
              </p>
              <span style={{ color: stat.color, opacity: 0.8 }}>{stat.icon}</span>
            </div>
            <p style={{ fontSize: 'var(--text-h2)', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
              {isLoading ? '—' : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Per-app table */}
      {isLoading ? (
        <div className="glass-card-solid" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading app data…
        </div>
      ) : apps.length === 0 ? (
        <div className="glass-card-solid" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>No apps yet.</p>
          <Link href="/convert" className="btn-primary" style={{ display: 'inline-flex' }}>
            Convert your first website
          </Link>
        </div>
      ) : (
        <div className="glass-card-solid" style={{ overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-h4)' }}>App Breakdown</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['App', 'Status', 'Downloads', 'Rating', 'Reviews', 'Health', 'Since'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: 'var(--space-4) var(--space-5)',
                        textAlign: 'left',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apps
                  .slice()
                  .sort((a, b) => (b.downloadCount ?? 0) - (a.downloadCount ?? 0))
                  .map((app) => (
                    <tr
                      key={app._id}
                      style={{ borderBottom: '1px solid var(--color-border)', transition: 'background var(--transition-fast)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-surface)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                    >
                      {/* App name + icon */}
                      <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: 'var(--radius-md)',
                              background: app.splashColor || 'var(--color-primary-100)',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                            }}
                          >
                            {app.icon
                              ? <img src={app.icon} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{app.name[0]?.toUpperCase()}</span>
                            }
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--text-body-sm)', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                              {app.name}
                            </p>
                            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                              {app.category}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: 'var(--space-4) var(--space-5)', whiteSpace: 'nowrap' }}>
                        <span
                          className={`badge ${
                            app.status === 'published' ? 'badge-green'
                            : app.status === 'building' ? 'badge-blue'
                            : app.status === 'pending_review' ? 'badge-yellow'
                            : app.status === 'rejected' ? 'badge-red'
                            : 'badge-gray'
                          }`}
                        >
                          {app.status === 'pending_review' ? 'In Review' : app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </td>

                      {/* Downloads with bar */}
                      <td style={{ padding: 'var(--space-4) var(--space-5)', minWidth: '140px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {(app.downloadCount ?? 0).toLocaleString()}
                          </span>
                          <div
                            style={{
                              width: '100%',
                              height: '4px',
                              borderRadius: '2px',
                              background: 'var(--color-border)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.round(((app.downloadCount ?? 0) / maxDownloads) * 100)}%`,
                                background: 'var(--color-primary)',
                                borderRadius: '2px',
                                transition: 'width 0.5s ease',
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Rating stars */}
                      <td style={{ padding: 'var(--space-4) var(--space-5)', whiteSpace: 'nowrap' }}>
                        {app.reviewCount > 0
                          ? <RatingBar rating={app.averageRating} count={app.reviewCount} />
                          : <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>No ratings</span>
                        }
                      </td>

                      {/* Review count */}
                      <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                        <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
                          {app.reviewCount}
                        </span>
                      </td>

                      {/* Health badge */}
                      <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                        <HealthBadge rating={app.averageRating} reviewCount={app.reviewCount} />
                      </td>

                      {/* Created at */}
                      <td style={{ padding: 'var(--space-4) var(--space-5)', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Note on historical data */}
      {apps.length > 0 && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-4)', textAlign: 'center' }}>
          Download counts are cumulative totals since app creation. Historical time-series data coming soon.
        </p>
      )}
    </div>
  );
}
