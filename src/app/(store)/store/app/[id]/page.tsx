'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import type { App, Review } from '@/types/app.types';

/* ─── Helpers ─── */
function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
}

/* ─── Half-star display ─── */
function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '1px' }}>
      {[1, 2, 3, 4, 5].map((s) => {
        const full = rating >= s;
        const half = !full && rating >= s - 0.5;
        return (
          <span key={s} style={{ position: 'relative', display: 'inline-block', fontSize: `${size}px`, width: `${size}px` }}>
            <span style={{ color: 'var(--color-border)' }}>★</span>
            {(full || half) && (
              <span style={{ position: 'absolute', left: 0, top: 0, overflow: 'hidden', width: full ? '100%' : '50%', color: '#fbbf24' }}>★</span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/* ─── Half-star picker ─── */
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const getVal = (starIdx: number, e: React.MouseEvent<HTMLSpanElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return e.clientX - rect.left < rect.width / 2 ? starIdx - 0.5 : starIdx;
  };
  const display = hovered || value;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((s) => {
        const full = display >= s;
        const half = !full && display >= s - 0.5;
        return (
          <span key={s} onMouseMove={(e) => setHovered(getVal(s, e))} onClick={(e) => onChange(getVal(s, e))}
            style={{ position: 'relative', display: 'inline-block', fontSize: '32px', cursor: 'pointer', width: '34px' }}>
            <span style={{ color: 'var(--color-border)' }}>★</span>
            {(full || half) && <span style={{ position: 'absolute', left: 0, top: 0, overflow: 'hidden', width: full ? '100%' : '50%', color: '#fbbf24', pointerEvents: 'none' }}>★</span>}
          </span>
        );
      })}
      {display > 0 && (
        <span style={{ marginLeft: '8px', fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
          {display % 1 === 0 ? display.toFixed(1) : display} / 5
        </span>
      )}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', width: '12px', textAlign: 'right' }}>{label}</span>
      <span style={{ fontSize: '10px', color: '#fbbf24' }}>★</span>
      <div style={{ flex: 1, height: '6px', background: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#fbbf24', borderRadius: 'var(--radius-full)' }} />
      </div>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', width: '28px' }}>{count}</span>
    </div>
  );
}

/* ─── Screenshots carousel ─── */
function ScreenshotsCarousel({ screenshots }: { screenshots: string[] }) {
  const [active, setActive] = useState(0);
  if (!screenshots || screenshots.length === 0) return null;
  return (
    <section style={{ marginBottom: 'var(--space-8)' }}>
      <h2 style={{ fontSize: 'var(--text-h3)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Screenshots</h2>
      {/* Thumbnail strip */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', overflowX: 'auto', paddingBottom: 'var(--space-3)', scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
        {screenshots.map((src, i) => (
          <div key={i} onClick={() => setActive(i)} style={{ flexShrink: 0, width: '120px', aspectRatio: '9/16', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: `2px solid ${i === active ? 'var(--color-primary)' : 'var(--color-border)'}`, cursor: 'pointer', scrollSnapAlign: 'start', transition: 'border-color 0.15s' }}>
            <img src={src} alt={`Screenshot ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>
      {/* Full preview */}
      <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', maxWidth: '260px', width: '100%', aspectRatio: '9/16', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          <img src={screenshots[active]} alt={`Screenshot ${active + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {screenshots.length > 1 && (
            <>
              <button onClick={() => setActive((a) => (a - 1 + screenshots.length) % screenshots.length)} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px' }}>‹</button>
              <button onClick={() => setActive((a) => (a + 1) % screenshots.length)} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px' }}>›</button>
              <div style={{ position: 'absolute', bottom: '12px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '6px' }}>
                {screenshots.map((_, i) => <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === active ? '#fff' : 'rgba(255,255,255,0.4)' }} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Anonymous review form ─── */
function ReviewForm({ appId }: { appId: string }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [reviewerName, setReviewerName] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.post(`/store/apps/${appId}/reviews`, { reviewerName, rating, title, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-reviews', appId] });
      queryClient.invalidateQueries({ queryKey: ['app-detail', appId] });
      setSuccess(true);
    },
  });

  if (success) {
    return (
      <div style={{ padding: 'var(--space-5)', background: 'var(--color-success-light)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-primary)', textAlign: 'center' }}>
        <p style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>🎉</p>
        <p style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Review submitted! Thank you.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6)', background: 'var(--color-white)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
      <h4 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-h4)' }}>Write a Review</h4>
      {mutation.isError && (
        <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-body-sm)', marginBottom: 'var(--space-3)' }}>
          {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Something went wrong.'}
        </p>
      )}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>Your name <span style={{ color: 'var(--color-danger)' }}>*</span></p>
        <input className="input-field" placeholder="Enter your name" value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} maxLength={50} />
      </div>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>Your rating <span style={{ color: 'var(--color-danger)' }}>*</span></p>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <input className="input-field" placeholder="Review title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
      </div>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <textarea className="input-field" rows={4} placeholder="Share your experience with this app…" value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} style={{ resize: 'vertical' }} />
      </div>
      <button className="btn-primary" onClick={() => mutation.mutate()} disabled={rating === 0 || !body.trim() || !reviewerName.trim() || mutation.isPending} style={{ width: '100%' }}>
        {mutation.isPending ? 'Submitting…' : 'Submit Review'}
      </button>
    </div>
  );
}

/* ─── Main page ─── */
export default function AppDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [installing, setInstalling] = useState<'idle' | 'preparing' | 'ready' | 'error'>('idle');
  const [descExpanded, setDescExpanded] = useState(false);

  const { data: app, isLoading, isError } = useQuery<App>({
    queryKey: ['app-detail', id],
    queryFn: async () => { const { data } = await api.get(`/store/apps/${id}`); return data.data; },
  });

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ['app-reviews', id],
    queryFn: async () => { const { data } = await api.get(`/store/apps/${id}/reviews`); return data.data; },
    enabled: !!app,
  });

  const handleInstall = () => {
    if (!app?.apkUrl) return;
    setInstalling('preparing');
    // Build the direct API download URL — no auth required for store downloads.
    // Navigating to it lets Android intercept the APK and launch the system installer,
    // which installs the app and returns the user to their home screen automatically.
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    const installUrl = `${API_BASE}/store/apps/${id}/download`;
    // Create a hidden anchor and click it so the browser treats it as a user-initiated
    // navigation — this is what Android's download manager listens for to trigger install.
    const a = document.createElement('a');
    a.href = installUrl;
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setInstalling('ready');
    // Reset after 8 s so the button is usable again if they come back
    setTimeout(() => setInstalling('idle'), 8000);
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-4)' }}>⏳</div>
          <p>Loading app details…</p>
        </div>
      </div>
    );
  }
  if (isError || !app) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>😕</p>
          <h2 style={{ marginBottom: 'var(--space-2)' }}>App not found</h2>
          <Link href="/store" className="btn-primary" style={{ padding: 'var(--space-3) var(--space-6)' }}>Browse Store</Link>
        </div>
      </div>
    );
  }

  const accentColor = app.accentColor || '#15803d';
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  const fullDesc = app.fullDescription || app.shortDescription || '';
  const isLongDesc = fullDesc.split('\n').length > 3 || fullDesc.length > 240;
  const descPreview = isLongDesc && !descExpanded ? fullDesc.slice(0, 240).replace(/\s+\S*$/, '') + '…' : fullDesc;

  return (
    <div style={{ background: 'var(--color-surface)', minHeight: '100vh' }}>
      <style>{`
        @media (max-width: 768px) {
          .app-detail-grid { grid-template-columns: 1fr !important; }
          .app-detail-sidebar { position: static !important; top: auto !important; }
        }
      `}</style>

      {/* Feature graphic banner */}
      {app.featureGraphic && (
        <div style={{ width: '100%', maxHeight: '220px', overflow: 'hidden' }}>
          <img src={app.featureGraphic} alt={`${app.name} banner`} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
        </div>
      )}

      {/* ── HERO ── */}
      <div style={{ background: `linear-gradient(180deg, ${accentColor}18 0%, var(--color-surface) 100%)`, borderBottom: '1px solid var(--color-border)', paddingTop: 'var(--space-10)', paddingBottom: 'var(--space-8)' }}>
        <div className="container">
          <Link href="/store" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: 'var(--space-6)' }}>← Back to Store</Link>

          <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* App icon */}
            <div style={{ position: 'relative', width: '96px', height: '96px', flexShrink: 0 }}>
              <div style={{ width: '96px', height: '96px', borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: app.icon ? 'transparent' : `linear-gradient(135deg, ${accentColor}33, ${accentColor}66)`, border: `2px solid ${accentColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 32px ${accentColor}33` }}>
                {app.icon ? <img src={app.icon} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '48px' }}>📱</span>}
              </div>
              {installing === 'preparing' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 'var(--radius-xl)', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '28px', animation: 'spin 1s linear infinite' }}>⚙️</span>
                </div>
              )}
            </div>

            {/* App info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
                <h1 style={{ fontSize: 'var(--text-h1)', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>{app.name}</h1>
                {app.isFeatured && <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', color: '#b45309', textTransform: 'uppercase' }}>✦ Featured</span>}
              </div>
              <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>{app.shortDescription}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
                <span className="badge badge-gray">{app.category}</span>
                <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>v{app.version}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Stars rating={app.averageRating} />
                  <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{app.averageRating.toFixed(1)}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>({app.reviewCount})</span>
                </div>
                <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>⬇ {fmt(app.downloadCount)}</span>
                {app.apkSize && <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>{(app.apkSize / 1024 / 1024).toFixed(1)} MB</span>}
              </div>

              {/* Install button */}
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <button
                  onClick={handleInstall}
                  disabled={installing === 'preparing' || !app.apkUrl}
                  className="btn-primary"
                  style={{ padding: 'var(--space-3) var(--space-8)', fontSize: 'var(--text-body)', fontWeight: 700, opacity: !app.apkUrl ? 0.5 : 1, minWidth: '200px', background: installing === 'ready' ? '#16a34a' : accentColor, transition: 'background 0.3s' }}
                >
                  {!app.apkUrl
                    ? 'Not Available'
                    : installing === 'preparing'
                      ? '⚙️ Preparing…'
                      : installing === 'ready'
                        ? '✓ Check your notifications'
                        : '📲 Install'}
                </button>
                {installing === 'ready' && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 600, margin: 0 }}>
                    Tap the downloaded file in your notification bar to install · Android will launch the app automatically after install
                  </p>
                )}
                {installing === 'idle' && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
                    Free · Android APK · Installs directly on your device
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
        <div className="app-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 'var(--space-8)' }}>

          {/* Left column */}
          <div>
            {/* Screenshots */}
            {app.screenshots && app.screenshots.length > 0 && <ScreenshotsCarousel screenshots={app.screenshots} />}

            {/* Description */}
            <section style={{ marginBottom: 'var(--space-8)' }}>
              <h2 style={{ fontSize: 'var(--text-h3)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>About this app</h2>
              <div className="glass-card-solid" style={{ padding: 'var(--space-6)' }}>
                <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{descPreview}</p>
                {isLongDesc && (
                  <button onClick={() => setDescExpanded((e) => !e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600, fontSize: 'var(--text-body-sm)', marginTop: 'var(--space-3)', padding: 0 }}>
                    {descExpanded ? 'See less ▲' : 'See more ▼'}
                  </button>
                )}
              </div>
            </section>

            {/* App features */}
            <section style={{ marginBottom: 'var(--space-8)' }}>
              <h2 style={{ fontSize: 'var(--text-h3)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Features</h2>
              <div className="glass-card-solid" style={{ padding: 'var(--space-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
                {[
                  { icon: '📱', label: 'Platform', value: 'Android' },
                  { icon: '🔄', label: 'Orientation', value: app.orientation.charAt(0).toUpperCase() + app.orientation.slice(1) },
                  { icon: '🔲', label: 'Fullscreen', value: app.isFullscreen ? 'Yes' : 'No' },
                  { icon: '📶', label: 'Offline Mode', value: app.enableOfflineMode ? 'Supported' : 'Not supported' },
                  { icon: '🔔', label: 'Notifications', value: app.enablePushNotifications ? 'Enabled' : 'Not enabled' },
                  { icon: '🌐', label: 'Website App', value: 'Yes' },
                ].map((feat) => (
                  <div key={feat.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '20px' }}>{feat.icon}</span>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>{feat.label}</p>
                    <p style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>{feat.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews */}
            <section>
              <h2 style={{ fontSize: 'var(--text-h3)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
                Reviews
                {app.reviewCount > 0 && <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 'var(--space-3)' }}>{app.reviewCount} review{app.reviewCount !== 1 ? 's' : ''}</span>}
              </h2>

              {app.reviewCount > 0 && (
                <div className="glass-card-solid" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-8)', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1, marginBottom: '4px' }}>{app.averageRating.toFixed(1)}</p>
                    <Stars rating={app.averageRating} size={18} />
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>out of 5</p>
                  </div>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    {ratingCounts.map(({ star, count }) => <RatingBar key={star} label={String(star)} count={count} total={app.reviewCount} />)}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                {reviews.length === 0 ? (
                  <div className="glass-card-solid" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <p style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>💬</p>
                    <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>No reviews yet</p>
                    <p style={{ fontSize: 'var(--text-body-sm)' }}>Be the first to review this app!</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review._id} className="glass-card-solid" style={{ padding: 'var(--space-5)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-3)', gap: 'var(--space-3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: 'var(--color-primary-dark)', flexShrink: 0 }}>
                            {(review.reviewerName || review.reviewer?.username || '?')[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--text-body-sm)', color: 'var(--color-text-primary)' }}>
                              {review.reviewerName || review.reviewer?.username || 'Anonymous'}
                            </p>
                            {review.isVerifiedDownload && <span style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 600 }}>✓ Verified download</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <Stars rating={review.rating} size={12} />
                          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {review.title && <p style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)', marginBottom: 'var(--space-2)', color: 'var(--color-text-primary)' }}>{review.title}</p>}
                      <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>{review.body}</p>
                    </div>
                  ))
                )}
              </div>

              <ReviewForm appId={id} />
            </section>
          </div>

          {/* Right sidebar */}
          <aside>
            <div className="glass-card-solid app-detail-sidebar" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-4)', position: 'sticky', top: '80px' }}>
              <h4 style={{ fontSize: 'var(--text-body)', fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--color-text-primary)' }}>App Information</h4>
              {[
                { label: 'Package Name', value: app.packageName },
                { label: 'Version', value: `v${app.version}` },
                { label: 'Category', value: app.category },
                { label: 'Platform', value: 'Android' },
                { label: 'Downloads', value: fmt(app.downloadCount) },
                { label: 'Rating', value: `${app.averageRating.toFixed(1)} / 5.0` },
                ...(app.apkSize ? [{ label: 'Size', value: `${(app.apkSize / 1024 / 1024).toFixed(1)} MB` }] : []),
                { label: 'Published', value: new Date(app.createdAt).toLocaleDateString() },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)', textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
                </div>
              ))}

              <button
                onClick={handleInstall}
                disabled={installing === 'preparing' || !app.apkUrl}
                className="btn-primary"
                style={{ width: '100%', marginTop: 'var(--space-5)', opacity: !app.apkUrl ? 0.5 : 1, background: installing === 'ready' ? '#16a34a' : accentColor, transition: 'background 0.3s' }}
              >
                {!app.apkUrl ? 'Not Available' : installing === 'preparing' ? '⚙️ Preparing…' : installing === 'ready' ? '✓ Installing…' : '📲 Install'}
              </button>

              {app.websiteUrl && (
                <a href={app.websiteUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ display: 'block', textAlign: 'center', marginTop: 'var(--space-2)' }}>
                  🌐 Visit Website
                </a>
              )}
            </div>

            <div className="glass-card-solid" style={{ padding: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>Built with Solo Store — turn your website into an Android app.</p>
              <a href="/register" style={{ display: 'block', textAlign: 'center', marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}>Create your own app →</a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
