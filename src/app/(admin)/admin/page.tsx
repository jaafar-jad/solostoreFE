'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';

interface AdminStats {
  totalUsers: number;
  publishedApps: number;
  totalDownloads: number;
  activeBuilds: number;
  pendingReview: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/stats');
      return data.data;
    },
    refetchInterval: 30000, // refresh every 30s
  });

  const statCards = [
    {
      label: 'Total Users',
      value: isLoading ? '—' : String(stats?.totalUsers ?? 0),
      href: '/admin/users',
      color: 'var(--color-info)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: 'Published Apps',
      value: isLoading ? '—' : String(stats?.publishedApps ?? 0),
      href: '/admin/apps',
      color: 'var(--color-primary)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      ),
    },
    {
      label: 'Total Downloads',
      value: isLoading
        ? '—'
        : (stats?.totalDownloads ?? 0) >= 1000
        ? `${((stats?.totalDownloads ?? 0) / 1000).toFixed(1)}k`
        : String(stats?.totalDownloads ?? 0),
      href: '/admin/apps',
      color: 'var(--color-success)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
    },
    {
      label: 'Active Builds',
      value: isLoading ? '—' : String(stats?.activeBuilds ?? 0),
      href: '/admin/builds',
      color: 'var(--color-warning)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" />
        </svg>
      ),
    },
    {
      label: 'Pending Review',
      value: isLoading ? '—' : String(stats?.pendingReview ?? 0),
      href: '/admin/apps?status=pending_review',
      color: stats?.pendingReview && stats.pendingReview > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)',
      urgent: (stats?.pendingReview ?? 0) > 0,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
  ];

  const quickLinks = [
    { href: '/admin/apps', label: 'Review Queue', desc: 'Approve or reject submitted apps', icon: 'layers' },
    { href: '/admin/users', label: 'User Management', desc: 'Ban, unban, or manage users', icon: 'users' },
    { href: '/admin/plans', label: 'Plan Management', desc: 'Edit pricing and features', icon: 'credit-card' },
    { href: '/admin/builds', label: 'Build Monitor', desc: 'Track active and past builds', icon: 'cpu' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ marginBottom: 'var(--space-1)' }}>Platform Overview</h1>
        <p>Real-time stats and platform health.</p>
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
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            style={{ textDecoration: 'none' }}
          >
            <div
              className="glass-card-solid"
              style={{
                padding: 'var(--space-5)',
                border: card.urgent ? '1.5px solid var(--color-danger)' : '1px solid var(--color-border)',
                cursor: 'pointer',
                transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', margin: 0, fontWeight: 500 }}>
                  {card.label}
                </p>
                <span style={{ color: card.color, opacity: 0.75 }}>{card.icon}</span>
              </div>
              <p style={{ fontSize: 'var(--text-h2)', fontWeight: 800, color: card.urgent ? 'var(--color-danger)' : 'var(--color-text-primary)', margin: 0 }}>
                {card.value}
              </p>
              {card.urgent && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', margin: '4px 0 0', fontWeight: 600 }}>
                  Needs attention
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-h4)' }}>Quick Actions</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
            <div
              className="glass-card-solid"
              style={{
                padding: 'var(--space-5)',
                cursor: 'pointer',
                display: 'flex',
                gap: 'var(--space-4)',
                alignItems: 'center',
                transition: 'transform var(--transition-fast)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 2px', fontSize: 'var(--text-body-sm)' }}>
                  {link.label}
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
                  {link.desc}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
