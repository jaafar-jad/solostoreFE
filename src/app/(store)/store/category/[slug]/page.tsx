'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import AppCard, { StoreApp } from '@/components/store/AppCard';
import type { App } from '@/types/app.types';

const CATEGORY_ICONS: Record<string, string> = {
  'Business':         '💼',
  'Education':        '🎓',
  'Entertainment':    '🎬',
  'Finance':          '💰',
  'Food & Drink':     '🍔',
  'Health & Fitness': '💪',
  'Lifestyle':        '🌟',
  'Music':            '🎵',
  'News':             '📰',
  'Photography':      '📸',
  'Productivity':     '✅',
  'Shopping':         '🛍️',
  'Social':           '🌐',
  'Sports':           '⚽',
  'Tools':            '🔧',
  'Travel':           '✈️',
  'Weather':          '⛅',
  'Other':            '📱',
};

type SortKey = 'downloads' | 'newest' | 'rating';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'newest',    label: 'Newest First'    },
  { value: 'rating',    label: 'Top Rated'       },
];

function toStoreApp(app: App): StoreApp {
  return {
    id: app._id,
    name: app.name,
    shortDescription: app.shortDescription,
    category: app.category,
    icon: app.icon,
    accentColor: app.accentColor || '#15803d',
    downloadCount: app.downloadCount,
    averageRating: app.averageRating,
    apkUrl: app.apkUrl,
    isFeatured: app.isFeatured,
  };
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [sort, setSort] = useState<SortKey>('downloads');

  /* Decode slug: "food-drink" → "Food & Drink", "health-fitness" → "Health & Fitness" */
  const category = decodeURIComponent(slug)
    .replace(/-and-/gi, ' & ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const icon = CATEGORY_ICONS[category] ?? '📱';

  const { data: apps = [], isLoading } = useQuery<App[]>({
    queryKey: ['store-category', slug, sort],
    queryFn: async () => {
      const params = new URLSearchParams({ category, sort, limit: '50' });
      const { data } = await api.get(`/store/apps?${params.toString()}`);
      return data.data;
    },
    staleTime: 60 * 1000,
  });

  return (
    <div style={{ background: 'var(--color-surface)', minHeight: '100vh' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:.25} }`}</style>

      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(180deg, var(--color-white) 0%, var(--color-surface) 100%)',
          borderBottom: '1px solid var(--color-border)',
          paddingTop: 'var(--space-10)',
          paddingBottom: 'var(--space-8)',
        }}
      >
        <div className="container">
          <Link
            href="/store"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
              fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)',
              textDecoration: 'none', marginBottom: 'var(--space-5)',
            }}
          >
            ← Back to Store
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '64px', height: '64px', borderRadius: 'var(--radius-xl)',
                background: 'var(--color-primary-100)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', flexShrink: 0,
              }}
            >
              {icon}
            </div>
            <div>
              <h1 style={{ fontSize: 'var(--text-h1)', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, marginBottom: '4px' }}>
                {category}
              </h1>
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', margin: 0 }}>
                {isLoading ? 'Loading…' : `${apps.length} app${apps.length !== 1 ? 's' : ''} available`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
        {/* Sort controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', marginRight: 'var(--space-2)' }}>Sort by:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-body-sm)',
                fontWeight: sort === opt.value ? 600 : 400,
                border: '1.5px solid',
                borderColor: sort === opt.value ? 'var(--color-primary)' : 'var(--color-border)',
                background: sort === opt.value ? 'var(--color-primary-50)' : 'var(--color-white)',
                color: sort === opt.value ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* App grid */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                style={{
                  height: '88px', borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-border)', opacity: 0.5,
                  animation: 'pulse 1.5s infinite',
                }}
              />
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-20)', color: 'var(--color-text-muted)' }}>
            <p style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>{icon}</p>
            <p style={{ fontSize: 'var(--text-body-lg)', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--color-text-primary)' }}>
              No {category} apps yet
            </p>
            <p style={{ marginBottom: 'var(--space-6)' }}>
              Be the first to publish a {category} app on Solo Store.
            </p>
            <Link href="/register" className="btn-primary" style={{ padding: 'var(--space-3) var(--space-6)' }}>
              Create an app
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
              {apps.map((app) => (
                <AppCard key={app._id} app={toStoreApp(app)} variant="grid" />
              ))}
            </div>
            <p style={{ marginTop: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
              Showing {apps.length} app{apps.length !== 1 ? 's' : ''} in {category}
            </p>
          </>
        )}

        {/* Browse other categories */}
        <div style={{ marginTop: 'var(--space-12)', padding: 'var(--space-8)', borderRadius: 'var(--radius-xl)', background: 'var(--color-white)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
          <p style={{ fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--color-text-primary)' }}>Browse other categories</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', justifyContent: 'center' }}>
            {Object.entries(CATEGORY_ICONS).filter(([cat]) => cat !== category).map(([cat, emoji]) => (
              <Link
                key={cat}
                href={`/store/category/${cat.toLowerCase().replace(/ & /g, '-and-').replace(/ /g, '-')}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  textDecoration: 'none', transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.color = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                {emoji} {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
