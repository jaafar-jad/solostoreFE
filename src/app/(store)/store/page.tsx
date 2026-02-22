'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import FeaturedBannerCard, { FeaturedApp } from '@/components/store/FeaturedBannerCard';
import AppCard, { StoreApp } from '@/components/store/AppCard';
import type { App } from '@/types/app.types';

/* ─── API → component type mappers ─── */

/* ─── Recommended app type (has planName/planTier from backend aggregation) ─── */
interface RecommendedApp extends App {
  planName: string | null;
  planTier: number;          // 0 = free, 1 = basic, 2 = pro, 3+ = enterprise
}

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

function toFeaturedApp(app: App): FeaturedApp {
  const color = app.accentColor || '#15803d';
  return {
    id: app._id,
    name: app.name,
    shortDescription: app.shortDescription,
    category: app.category,
    icon: app.icon,
    downloadCount: app.downloadCount,
    averageRating: app.averageRating,
    apkUrl: app.apkUrl,
    accentColor: color,
    gradient: `linear-gradient(135deg, ${color} 0%, ${color}cc 60%, ${color}55 100%)`,
  };
}

const CATEGORIES = [
  'All', 'Business', 'Education', 'Entertainment', 'Finance',
  'Food & Drink', 'Health & Fitness', 'Lifestyle', 'Music', 'News',
  'Photography', 'Productivity', 'Shopping', 'Social', 'Sports',
  'Tools', 'Travel', 'Weather',
];

/* ─── Plan tier badge ─── */
function PlanBadge({ tier, name }: { tier: number; name: string | null }) {
  if (tier < 1 || !name) return null;
  const cfg: Record<number, { label: string; bg: string; color: string; border: string }> = {
    1: { label: '⬆ Basic',      bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6', border: 'rgba(59,130,246,0.3)'  },
    2: { label: '⚡ Pro',        bg: 'rgba(168,85,247,0.12)', color: '#9333ea', border: 'rgba(168,85,247,0.35)' },
    3: { label: '💎 Enterprise', bg: 'rgba(251,191,36,0.13)', color: '#b45309', border: 'rgba(251,191,36,0.4)'  },
  };
  const s = cfg[Math.min(tier, 3)];
  if (!s) return null;
  return (
    <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: s.bg, color: s.color, border: `1px solid ${s.border}`, letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

/* ─── Recommended card (compact horizontal) ─── */
function RecommendedCard({ app }: { app: RecommendedApp }) {
  const accent = app.accentColor || '#15803d';
  const rating = app.averageRating ?? 0;
  const stars = [1, 2, 3, 4, 5].map((s) => s <= Math.floor(rating) ? '#fbbf24' : '#e2e8f0');
  return (
    <a
      href={`/store/app/${app._id}`}
      style={{ flexShrink: 0, width: '220px', display: 'flex', flexDirection: 'column', gap: '8px', textDecoration: 'none', scrollSnapAlign: 'start', borderRadius: 'var(--radius-xl)', background: 'var(--color-white)', border: '1px solid var(--color-border)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-sm)', transition: 'all var(--transition-fast)' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Icon + badge row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0, background: `linear-gradient(135deg, ${accent}22, ${accent}44)`, border: `1px solid ${accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
          {app.icon ? <img src={app.icon} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📱'}
        </div>
        <PlanBadge tier={app.planTier} name={app.planName} />
      </div>

      {/* Name & category */}
      <div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.name}</p>
        <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{app.category}</p>
      </div>

      {/* Short desc */}
      <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {app.shortDescription}
      </p>

      {/* Rating + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          {stars.map((c, i) => <span key={i} style={{ fontSize: '10px', color: c }}>★</span>)}
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginLeft: '2px' }}>{rating.toFixed(1)}</span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, color: accent, background: `${accent}15`, border: `1px solid ${accent}33`, padding: '3px 12px', borderRadius: '999px' }}>Get</span>
      </div>
    </a>
  );
}

/* ─── Horizontal scroll section ─── */
function HScrollSection({
  title, subtitle, children, accentColor = 'var(--color-primary)',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accentColor?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'right' ? 360 : -360, behavior: 'smooth' });
  };

  return (
    <section style={{ marginBottom: 'var(--space-10)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-5)',
          paddingRight: 'var(--space-2)',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'var(--text-h3)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
              marginBottom: subtitle ? '4px' : 0,
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {(['left', 'right'] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => scroll(dir)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-white)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                transition: 'all var(--transition-fast)',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = accentColor;
                e.currentTarget.style.borderColor = accentColor;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-white)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
              aria-label={`Scroll ${dir}`}
            >
              {dir === 'left' ? '←' : '→'}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 'var(--space-4)',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          paddingBottom: 'var(--space-2)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>
    </section>
  );
}

/* ─── Skeleton loaders ─── */
function HScrollSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-4)', overflow: 'hidden' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            flexShrink: 0,
            width: '160px',
            height: '200px',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--color-border)',
            opacity: 0.5,
            animation: 'pulse 1.5s infinite',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Main store page ─── */
export default function StorePage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const featuredScrollRef = useRef<HTMLDivElement>(null);

  /* ── API queries ── */
  const { data: featuredApps = [], isLoading: featuredLoading } = useQuery<App[]>({
    queryKey: ['store-featured'],
    queryFn: async () => {
      const { data } = await api.get('/store/featured');
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: recommended = [], isLoading: recommendedLoading } = useQuery<RecommendedApp[]>({
    queryKey: ['store-recommended'],
    queryFn: async () => {
      const { data } = await api.get('/store/recommended');
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: topDownloads = [], isLoading: topLoading } = useQuery<App[]>({
    queryKey: ['store-top'],
    queryFn: async () => {
      const { data } = await api.get('/store/apps?sort=downloads&limit=12');
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: newArrivals = [], isLoading: newLoading } = useQuery<App[]>({
    queryKey: ['store-new'],
    queryFn: async () => {
      const { data } = await api.get('/store/apps?sort=newest&limit=12');
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: topRated = [], isLoading: ratedLoading } = useQuery<App[]>({
    queryKey: ['store-rated'],
    queryFn: async () => {
      const { data } = await api.get('/store/apps?sort=rating&limit=12');
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: searchResults = [], isFetching: searchFetching } = useQuery<App[]>({
    queryKey: ['store-search', query, activeCategory],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (query) params.set('q', query);
      if (activeCategory !== 'All') params.set('category', activeCategory);
      const { data } = await api.get(`/store/apps?${params.toString()}`);
      return data.data;
    },
    enabled: !!(query || activeCategory !== 'All'),
    staleTime: 30 * 1000,
  });

  /* Combine all non-search apps for "All Apps" section */
  const allApps = [...topDownloads, ...newArrivals, ...topRated].filter(
    (app, i, self) => i === self.findIndex((a) => a._id === app._id)
  );

  const isSearching = !!query || activeCategory !== 'All';

  const scrollFeatured = (dir: 'prev' | 'next') => {
    const next = dir === 'next'
      ? Math.min(featuredIdx + 1, featuredApps.length - 1)
      : Math.max(featuredIdx - 1, 0);
    setFeaturedIdx(next);
    if (featuredScrollRef.current) {
      const card = featuredScrollRef.current.children[next] as HTMLElement;
      card?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  };

  return (
    <div style={{ background: 'var(--color-surface)', minHeight: '100vh' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:.25} }`}</style>

      {/* ── HERO / SEARCH BAR ── */}
      <div
        style={{
          background: 'linear-gradient(180deg, var(--color-white) 0%, var(--color-surface) 100%)',
          borderBottom: '1px solid var(--color-border)',
          paddingTop: 'var(--space-8)',
          paddingBottom: 'var(--space-6)',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-5)',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 'var(--text-h2)',
                  fontWeight: 'var(--font-weight-extrabold)',
                  color: 'var(--color-text-primary)',
                  marginBottom: '4px',
                }}
              >
                Solo Store
              </h1>
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
                Discover Android apps built from websites
              </p>
            </div>
            {allApps.length > 0 && (
              <span className="badge badge-green" style={{ fontSize: '11px' }}>
                {allApps.length}+ apps
              </span>
            )}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: '600px' }}>
            <span
              style={{
                position: 'absolute',
                left: 'var(--space-4)',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '16px',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }}
            >
              🔍
            </span>
            <input
              type="search"
              className="input-field"
              placeholder="Search apps by name or category…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                paddingLeft: 'var(--space-10)',
                height: '48px',
                fontSize: 'var(--text-body)',
                borderRadius: 'var(--radius-full)',
                boxShadow: 'var(--shadow-md)',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{
                  position: 'absolute',
                  right: 'var(--space-4)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  fontSize: '18px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>

        {/* ── CATEGORY CHIPS ── */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            overflowX: 'auto',
            paddingBottom: 'var(--space-2)',
            marginBottom: 'var(--space-8)',
            scrollbarWidth: 'none',
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                flexShrink: 0,
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-body-sm)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                border: activeCategory === cat ? 'none' : '1.5px solid var(--color-border)',
                background: activeCategory === cat ? 'var(--color-primary)' : 'var(--color-white)',
                color: activeCategory === cat ? 'white' : 'var(--color-text-secondary)',
                boxShadow: activeCategory === cat ? 'var(--shadow-green)' : 'var(--shadow-sm)',
                whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {isSearching ? (
          /* ── SEARCH / FILTER RESULTS ── */
          <div>
            <h2 style={{ fontSize: 'var(--text-h3)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              {query ? `Results for "${query}"` : activeCategory}
            </h2>
            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
              {searchFetching ? 'Searching…' : `${searchResults.length} app${searchResults.length !== 1 ? 's' : ''} found`}
            </p>
            {!searchFetching && searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-20)', color: 'var(--color-text-muted)' }}>
                <p style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🔍</p>
                <p style={{ fontSize: 'var(--text-body-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  No apps found
                </p>
                <p>Try a different search term or category.</p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 'var(--space-4)',
                }}
              >
                {searchResults.map((app) => (
                  <AppCard key={app._id} app={toStoreApp(app)} variant="grid" />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ── FEATURED BANNER SECTION ── */}
            <section style={{ marginBottom: 'var(--space-10)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-5)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: '4px' }}>
                    <h2 style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                      Featured Apps
                    </h2>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(251,191,36,0.15)',
                        border: '1px solid rgba(251,191,36,0.4)',
                        color: '#b45309',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                      }}
                    >
                      ✦ Pro & Enterprise
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
                    Promoted by developers on Pro and Enterprise plans
                  </p>
                </div>

                {featuredApps.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <button
                      onClick={() => scrollFeatured('prev')}
                      disabled={featuredIdx === 0}
                      style={{
                        width: '32px', height: '32px', borderRadius: 'var(--radius-full)',
                        border: '1.5px solid var(--color-border)', background: 'var(--color-white)',
                        cursor: featuredIdx === 0 ? 'not-allowed' : 'pointer',
                        opacity: featuredIdx === 0 ? 0.4 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', color: 'var(--color-text-secondary)',
                      }}
                    >←</button>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {featuredApps.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setFeaturedIdx(i);
                            const card = featuredScrollRef.current?.children[i] as HTMLElement;
                            card?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
                          }}
                          style={{
                            width: i === featuredIdx ? '20px' : '6px',
                            height: '6px', borderRadius: 'var(--radius-full)',
                            background: i === featuredIdx ? 'var(--color-primary)' : 'var(--color-border)',
                            border: 'none', cursor: 'pointer', transition: 'all var(--transition-fast)', padding: 0,
                          }}
                          aria-label={`Go to featured app ${i + 1}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => scrollFeatured('next')}
                      disabled={featuredIdx === featuredApps.length - 1}
                      style={{
                        width: '32px', height: '32px', borderRadius: 'var(--radius-full)',
                        border: '1.5px solid var(--color-border)', background: 'var(--color-white)',
                        cursor: featuredIdx === featuredApps.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: featuredIdx === featuredApps.length - 1 ? 0.4 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', color: 'var(--color-text-secondary)',
                      }}
                    >→</button>
                  </div>
                )}
              </div>

              {/* Featured cards scroll */}
              <div
                ref={featuredScrollRef}
                style={{
                  display: 'flex',
                  gap: 'var(--space-4)',
                  overflowX: 'auto',
                  scrollSnapType: 'x mandatory',
                  paddingBottom: 'var(--space-3)',
                  scrollbarWidth: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {featuredLoading ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} style={{ flexShrink: 0, width: '340px', height: '210px', borderRadius: 'var(--radius-xl)', background: 'var(--color-border)', opacity: 0.4, animation: 'pulse 1.5s infinite' }} />
                  ))
                ) : featuredApps.length > 0 ? (
                  featuredApps.map((app) => (
                    <FeaturedBannerCard key={app._id} app={toFeaturedApp(app)} />
                  ))
                ) : null}

                {/* "Get Featured" promo card */}
                <div
                  style={{
                    flexShrink: 0, width: '340px', height: '210px',
                    borderRadius: 'var(--radius-xl)',
                    background: 'linear-gradient(135deg, var(--color-primary-50), var(--color-primary-100))',
                    border: '2px dashed var(--color-primary)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', textAlign: 'center',
                    padding: 'var(--space-6)', scrollSnapAlign: 'start', gap: 'var(--space-3)',
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>✦</span>
                  <p style={{ fontSize: 'var(--text-h4)', fontWeight: 700, color: 'var(--color-primary)' }}>
                    Feature Your App
                  </p>
                  <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', maxWidth: '220px' }}>
                    Upgrade to Pro or Enterprise plan to get your app featured here
                  </p>
                  <a
                    href="/plans"
                    style={{
                      display: 'inline-flex', alignItems: 'center', padding: '8px 20px',
                      borderRadius: 'var(--radius-full)', background: 'var(--color-primary)',
                      color: 'white', fontSize: 'var(--text-body-sm)', fontWeight: 700,
                      textDecoration: 'none', boxShadow: 'var(--shadow-green)',
                    }}
                  >
                    View Plans
                  </a>
                </div>
              </div>
            </section>

            {/* ── RECOMMENDED ── */}
            {(recommendedLoading || recommended.length > 0) && (
              <section style={{ marginBottom: 'var(--space-10)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
                  <div>
                    <h2 style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                      🔥 Recommended
                    </h2>
                    <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
                      Top picks — Pro &amp; Enterprise developers get priority placement
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '999px', background: 'linear-gradient(90deg,#7c3aed15,#7c3aed08)', border: '1px solid #7c3aed33' }}>
                    <span style={{ fontSize: '10px', color: '#7c3aed', fontWeight: 700 }}>Plan-boosted</span>
                  </div>
                </div>
                {recommendedLoading ? (
                  <HScrollSkeleton />
                ) : (
                  <div style={{ display: 'flex', gap: 'var(--space-4)', overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 'var(--space-3)', scrollbarWidth: 'none' }}>
                    {recommended.map((app) => <RecommendedCard key={app._id} app={app} />)}
                  </div>
                )}
              </section>
            )}

            {/* ── TOP DOWNLOADS ── */}
            <HScrollSection title="🏆 Top Downloads" subtitle="Most downloaded apps on Solo Store">
              {topLoading ? <HScrollSkeleton /> : topDownloads.map((app) => (
                <AppCard key={app._id} app={toStoreApp(app)} variant="horizontal" />
              ))}
            </HScrollSection>

            {/* ── NEW ARRIVALS ── */}
            <HScrollSection title="✨ New Arrivals" subtitle="Fresh apps just added to the store" accentColor="var(--color-info)">
              {newLoading ? <HScrollSkeleton /> : newArrivals.map((app) => (
                <AppCard key={app._id} app={toStoreApp(app)} variant="horizontal" />
              ))}
            </HScrollSection>

            {/* ── TOP RATED ── */}
            <HScrollSection title="⭐ Top Rated" subtitle="Highest-rated apps by our community" accentColor="#7c3aed">
              {ratedLoading ? <HScrollSkeleton /> : topRated.map((app) => (
                <AppCard key={app._id} app={toStoreApp(app)} variant="horizontal" />
              ))}
            </HScrollSection>

            {/* ── DIVIDER ── */}
            <hr className="divider" style={{ margin: 'var(--space-10) 0' }} />

            {/* ── ALL APPS GRID ── */}
            <section>
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 'var(--space-6)',
                }}
              >
                <div>
                  <h2 style={{ fontSize: 'var(--text-h3)', fontWeight: 700, marginBottom: '4px' }}>All Apps</h2>
                  <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
                    {allApps.length} apps available for download
                  </p>
                </div>
                <span className="badge badge-green">{allApps.length} apps</span>
              </div>

              {allApps.length === 0 && !topLoading && !newLoading && !ratedLoading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--color-text-muted)' }}>
                  <p style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📱</p>
                  <p style={{ fontSize: 'var(--text-body-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                    No apps published yet
                  </p>
                  <p>Be the first to publish your website as an Android app!</p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 'var(--space-4)',
                  }}
                >
                  {allApps.map((app) => (
                    <AppCard key={app._id} app={toStoreApp(app)} variant="grid" />
                  ))}
                </div>
              )}
            </section>

            {/* ── PUBLISH PROMO ── */}
            <div
              style={{
                marginTop: 'var(--space-16)', padding: 'var(--space-10)',
                borderRadius: 'var(--radius-2xl)',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                textAlign: 'center', color: 'white', boxShadow: 'var(--shadow-green)',
              }}
            >
              <p style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>🚀</p>
              <h3 style={{ fontSize: 'var(--text-h2)', fontWeight: 800, color: 'white', marginBottom: 'var(--space-3)' }}>
                Got a website? Turn it into an app.
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'var(--text-body-lg)', marginBottom: 'var(--space-6)', maxWidth: '500px', margin: '0 auto var(--space-6)' }}>
                Join thousands of developers publishing Android apps on Solo Store — no coding required.
              </p>
              <a
                href="/register"
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: 'var(--space-4) var(--space-8)', borderRadius: 'var(--radius-full)',
                  background: 'white', color: 'var(--color-primary)', fontWeight: 700,
                  fontSize: 'var(--text-body)', textDecoration: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}
              >
                Start free — 1 app included
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
