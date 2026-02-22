'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { App } from '@/types/app.types';

function statusBadge(status: App['status']) {
  const map: Record<App['status'], { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'badge-gray' },
    building: { label: 'Building', cls: 'badge-blue' },
    pending_review: { label: 'In Review', cls: 'badge-yellow' },
    published: { label: 'Published', cls: 'badge-green' },
    rejected: { label: 'Rejected', cls: 'badge-red' },
    unpublished: { label: 'Unpublished', cls: 'badge-gray' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'badge-gray' };
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: appsData } = useQuery({
    queryKey: ['my-apps'],
    queryFn: async () => {
      const { data } = await api.get('/apps');
      return data.data as App[];
    },
  });

  const apps = appsData ?? [];
  const publishedCount = apps.filter((a) => a.status === 'published').length;
  const totalDownloads = apps.reduce((sum, a) => sum + (a.downloadCount ?? 0), 0);
  const activeBuilds = apps.filter((a) => a.status === 'building').length;
  const pendingReview = apps.filter((a) => a.status === 'pending_review').length;

  const recentApps = apps.slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ marginBottom: 'var(--space-1)' }}>
          Welcome back, {user?.username ?? 'Developer'} 👋
        </h1>
        <p>Here&apos;s an overview of your apps and activity.</p>
      </div>

      {/* Stats grid */}
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
            label: 'Total Apps',
            value: String(apps.length),
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            ),
            color: 'var(--color-primary)',
          },
          {
            label: 'Published',
            value: String(publishedCount),
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ),
            color: 'var(--color-success)',
          },
          {
            label: 'Total Downloads',
            value: totalDownloads >= 1000 ? `${(totalDownloads / 1000).toFixed(1)}k` : String(totalDownloads),
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            ),
            color: 'var(--color-info)',
          },
          {
            label: 'Active Builds',
            value: String(activeBuilds),
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <rect x="9" y="9" width="6" height="6" />
              </svg>
            ),
            color: 'var(--color-warning)',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card-solid"
            style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p
                style={{
                  fontSize: 'var(--text-body-sm)',
                  color: 'var(--color-text-muted)',
                  fontWeight: 'var(--font-weight-medium)',
                  margin: 0,
                }}
              >
                {stat.label}
              </p>
              <span style={{ color: stat.color, opacity: 0.8 }}>{stat.icon}</span>
            </div>
            <p
              style={{
                fontSize: 'var(--text-h2)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions + pending notices */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-8)',
        }}
      >
        {/* Quick actions */}
        <div className="glass-card-solid" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-h4)' }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Link href="/convert" className="btn-primary" style={{ justifyContent: 'flex-start' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Convert Website to App
            </Link>
            <Link href="/my-apps" className="btn-ghost" style={{ justifyContent: 'flex-start' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              Manage My Apps
            </Link>
            <Link href="/verify" className="btn-ghost" style={{ justifyContent: 'flex-start' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Verify a Domain
            </Link>
          </div>
        </div>

        {/* Alerts / notices */}
        <div className="glass-card-solid" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-h4)' }}>
            Notifications
          </h3>
          {pendingReview > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-3)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-warning-light)',
                border: '1px solid var(--color-warning)',
                marginBottom: 'var(--space-3)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-warning)', margin: 0 }}>
                {pendingReview} app{pendingReview > 1 ? 's' : ''} pending review
              </p>
            </div>
          )}
          {apps.length === 0 && (
            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', margin: 0 }}>
              No apps yet. Convert your first website to get started!
            </p>
          )}
          {apps.length > 0 && pendingReview === 0 && (
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-3)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-success-light)',
                border: '1px solid var(--color-primary-200)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-primary)', margin: 0 }}>
                All good — no pending actions
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent apps */}
      {recentApps.length > 0 && (
        <div className="glass-card-solid" style={{ padding: 'var(--space-6)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-5)',
            }}
          >
            <h3 style={{ fontSize: 'var(--text-h4)', margin: 0 }}>Recent Apps</h3>
            <Link
              href="/my-apps"
              style={{
                fontSize: 'var(--text-body-sm)',
                color: 'var(--color-primary)',
                textDecoration: 'none',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              View all
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {recentApps.map((app) => (
              <div
                key={app._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface)',
                  flexWrap: 'wrap',
                }}
              >
                {/* App icon placeholder */}
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    background: app.splashColor || 'var(--color-primary-100)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                  }}
                >
                  {app.name[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-primary)',
                      margin: 0,
                      fontSize: 'var(--text-body-sm)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {app.name}
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      margin: 0,
                    }}
                  >
                    {app.category} &middot; v{app.version}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {app.downloadCount} downloads
                  </span>
                  {statusBadge(app.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
