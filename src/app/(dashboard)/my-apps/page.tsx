'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import type { App, BuildJob, DomainVerification } from '@/types/app.types';

/* ─── helpers ─── */
function statusBadge(status: App['status']) {
  const map: Record<App['status'], { label: string; cls: string }> = {
    draft:          { label: 'Draft',       cls: 'badge-gray'   },
    building:       { label: 'Building',    cls: 'badge-blue'   },
    pending_review: { label: 'In Review',   cls: 'badge-yellow' },
    published:      { label: 'Published',   cls: 'badge-green'  },
    rejected:       { label: 'Rejected',    cls: 'badge-red'    },
    unpublished:    { label: 'Unpublished', cls: 'badge-gray'   },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'badge-gray' };
  return <span className={`badge ${cls}`}>{label}</span>;
}

/* ─── Link-domain modal ─── */
function LinkDomainModal({
  app, verifications, onClose, onLinked,
}: {
  app: App; verifications: DomainVerification[]; onClose: () => void; onLinked: () => void;
}) {
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async (domainId: string) => { await api.post(`/apps/${app._id}/link-domain`, { domainId }); },
    onSuccess: () => { onLinked(); onClose(); },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      setError(e?.response?.data?.message ?? 'Failed to link domain.');
    },
  });

  const verified = verifications.filter((v) => v.status === 'verified');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
      <div className="glass-card-solid" style={{ width: '100%', maxWidth: '480px', padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--text-h4)' }}>Link Verified Domain</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--color-text-muted)' }}>×</button>
        </div>
        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Select a verified domain to link to <strong>{app.name}</strong>.<br />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>App URL: <code>{app.websiteUrl}</code></span>
        </p>
        {error && (
          <div style={{ padding: 'var(--space-3)', background: 'var(--color-danger-light)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: 'var(--text-body-sm)', marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}
        {verified.length === 0 ? (
          <div style={{ padding: 'var(--space-5)', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-body-sm)', margin: 0 }}>
              No verified domains yet.{' '}
              <Link href="/verify" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Go verify a domain →</Link>
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
            {verified.map((v) => (
              <label key={v._id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', border: `1.5px solid ${selected === v._id ? 'var(--color-primary)' : 'var(--color-border)'}`, background: selected === v._id ? 'var(--color-primary-50)' : 'var(--color-white)', cursor: 'pointer', transition: 'all var(--transition-fast)' }}>
                <input type="radio" name="domain" value={v._id} checked={selected === v._id} onChange={() => setSelected(v._id)} style={{ accentColor: 'var(--color-primary)' }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--text-body-sm)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>{v.domain}</p>
                  <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-primary)' }}>✓ Verified {v.verifiedAt ? new Date(v.verifiedAt).toLocaleDateString() : ''}</p>
                </div>
              </label>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn-primary" onClick={() => mutation.mutate(selected)} disabled={!selected || mutation.isPending} style={{ flex: 1 }}>
            {mutation.isPending ? 'Linking…' : 'Link Domain'}
          </button>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Build progress panel ─── */
const BUILD_STAGES: { status: BuildJob['status'] | 'queued'; icon: string; label: string; sublabel: string }[] = [
  { status: 'queued',    icon: '📦', label: 'Preparing',   sublabel: 'Resolving dependencies & config'  },
  { status: 'building',  icon: '🔨', label: 'Compiling',   sublabel: 'Building TWA Android project'      },
  { status: 'signing',   icon: '🔐', label: 'Signing APK', sublabel: 'Applying keystore signature'       },
  { status: 'uploading', icon: '☁️', label: 'Uploading',   sublabel: 'Pushing to cloud storage'          },
];
const STAGE_ORDER: BuildJob['status'][] = ['queued', 'building', 'signing', 'uploading', 'completed', 'failed'];

function BuildProgress({ appId, onDone, onCancel }: { appId: string; onDone: () => void; onCancel: () => void }) {
  const logEndRef = useRef<HTMLDivElement>(null);

  const { data: jobs = [] } = useQuery<BuildJob[]>({
    queryKey: ['builds', appId],
    queryFn: async () => {
      const { data } = await api.get(`/apps/${appId}/builds`);
      return data.data;
    },
    refetchInterval: (query) => {
      const jobs = query.state.data ?? [];
      const latest = jobs[0];
      if (!latest) return 2000;
      if (latest.status === 'completed' || latest.status === 'failed') return false;
      return 2000;
    },
  });

  const job = jobs[0] ?? null;
  const stageIdx = job ? Math.max(0, STAGE_ORDER.indexOf(job.status)) : 0;
  const isDone = job?.status === 'completed';
  const isFailed = job?.status === 'failed';

  /* Notify parent when build finishes */
  useEffect(() => {
    if (isDone || isFailed) onDone();
  }, [isDone, isFailed, onDone]);

  /* Auto-scroll log to bottom */
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [job?.logs]);

  /* Animated elapsed time */
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (isDone || isFailed) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [isDone, isFailed]);
  const elapsedStr = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  /* Fake "smooth" progress between real progress values */
  const rawProgress = job?.progress ?? 0;
  const displayProgress = isDone ? 100 : Math.min(rawProgress + (stageIdx * 5), 98);

  return (
    <div
      style={{
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: isFailed ? '1.5px solid var(--color-danger)' : '1.5px solid #1a3a1a',
        background: '#0d1117',
      }}
    >
      <style>{`
        @keyframes bp-scan {
          0%   { transform: translateY(-100%); opacity: 0.07; }
          100% { transform: translateY(400%);  opacity: 0; }
        }
        @keyframes bp-pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
        @keyframes bp-glow {
          0%, 100% { box-shadow: 0 0 8px 2px #16a34a88; }
          50%       { box-shadow: 0 0 18px 6px #16a34acc; }
        }
        @keyframes bp-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes bp-appear {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#161b22', borderBottom: '1px solid #1a3a1a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Traffic light dots */}
          {['#ff5f57', '#ffbd2e', '#28c840'].map((c) => (
            <span key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, display: 'inline-block' }} />
          ))}
          <span style={{ marginLeft: '6px', fontSize: '11px', color: '#58a6ff', fontFamily: 'monospace', fontWeight: 600 }}>
            solostore/build — {job?.status ?? 'initializing'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: isFailed ? '#f85149' : '#3fb950', fontFamily: 'monospace' }}>
            {isFailed ? '✗ FAILED' : isDone ? '✓ DONE' : `⏱ ${elapsedStr}`}
          </span>
          {!isDone && !isFailed && (
            <button
              onClick={onCancel}
              style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', border: '1px solid #f8514966', background: 'transparent', color: '#f85149', cursor: 'pointer', letterSpacing: '0.04em' }}
            >
              ✕ Cancel
            </button>
          )}
        </div>
      </div>

      {/* Stage track */}
      <div style={{ display: 'flex', gap: '0', background: '#0d1117', padding: '12px 14px', borderBottom: '1px solid #161b22', overflowX: 'auto' }}>
        {BUILD_STAGES.map((stage, i) => {
          const done = stageIdx > i || isDone;
          const active = stageIdx === i && !isDone && !isFailed;
          return (
            <div key={stage.status} style={{ display: 'flex', alignItems: 'center', flex: i < BUILD_STAGES.length - 1 ? 1 : 'none', minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                {/* Circle */}
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                  background: isFailed && active ? '#2d0a0a' : done ? '#0d2818' : active ? '#0d2818' : '#161b22',
                  border: `2px solid ${isFailed && active ? '#f85149' : done ? '#3fb950' : active ? '#3fb950' : '#30363d'}`,
                  animation: active ? 'bp-glow 2s ease-in-out infinite' : 'none',
                  transition: 'all 0.4s',
                }}>
                  {done
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    : active
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2.5" style={{ animation: 'bp-spin 1.2s linear infinite' }}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                      : <span style={{ fontSize: '12px', opacity: 0.4 }}>{stage.icon}</span>
                  }
                </div>
                <span style={{ fontSize: '9px', color: done ? '#3fb950' : active ? '#79c0ff' : '#484f58', fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                  {stage.label}
                </span>
              </div>
              {/* Connector line */}
              {i < BUILD_STAGES.length - 1 && (
                <div style={{ flex: 1, height: '2px', margin: '0 4px', marginBottom: '18px', background: done ? '#3fb950' : '#21262d', transition: 'background 0.6s', position: 'relative', overflow: 'hidden' }}>
                  {active && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #3fb950 0%, transparent 100%)', animation: 'bp-scan 1.8s ease-in-out infinite' }} />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0 14px 0', background: '#0d1117' }}>
        <div style={{ height: '3px', background: '#21262d', borderRadius: '2px', overflow: 'hidden', margin: '10px 0 4px' }}>
          <div style={{
            height: '100%', background: isFailed ? '#f85149' : 'linear-gradient(90deg, #0d5a1e, #3fb950)',
            borderRadius: '2px', width: `${displayProgress}%`,
            transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isFailed ? 'none' : '0 0 8px #3fb95066',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
          <span style={{ fontSize: '10px', color: '#484f58', fontFamily: 'monospace' }}>
            {isFailed ? 'Build failed' : isDone ? 'APK ready' : BUILD_STAGES[Math.min(stageIdx, BUILD_STAGES.length - 1)]?.sublabel}
          </span>
          <span style={{ fontSize: '10px', color: isFailed ? '#f85149' : '#3fb950', fontFamily: 'monospace', fontWeight: 700 }}>
            {displayProgress}%
          </span>
        </div>
      </div>

      {/* Terminal log */}
      <div
        style={{
          maxHeight: '130px', overflowY: 'auto', padding: '8px 14px 12px',
          background: '#010409', borderTop: '1px solid #161b22',
          fontFamily: 'monospace', fontSize: '11px', lineHeight: 1.7,
        }}
      >
        {(job?.logs ?? ['Waiting for build agent…']).map((line, i) => (
          <div key={i} style={{ animation: 'bp-appear 0.3s ease', color: line.startsWith('[ERROR]') || line.startsWith('✗') ? '#f85149' : line.startsWith('[TEST]') ? '#f0e68c' : '#8b949e' }}>
            <span style={{ color: '#484f58', userSelect: 'none' }}>{String(i + 1).padStart(2, ' ')}  </span>
            <span style={{ color: '#3fb950', userSelect: 'none' }}>$ </span>
            {line}
          </div>
        ))}
        {!isFailed && !isDone && (
          <div style={{ color: '#3fb950' }}>
            <span style={{ color: '#484f58', userSelect: 'none' }}>   </span>
            <span style={{ color: '#3fb950' }}>$ </span>
            <span style={{ animation: 'bp-pulse-dot 1s ease-in-out infinite' }}>▋</span>
          </div>
        )}
        <div ref={logEndRef} />
      </div>

      {/* Failed message */}
      {isFailed && job?.errorMessage && (
        <div style={{ padding: '8px 14px', background: '#2d0a0a', borderTop: '1px solid #f8514944' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#f85149', fontFamily: 'monospace' }}>✗ {job.errorMessage}</p>
        </div>
      )}
    </div>
  );
}

/* ─── App card ─── */
function AppCard({ app, verifications, bypassBuild, reviewMode }: { app: App; verifications: DomainVerification[]; bypassBuild: boolean; reviewMode: 'auto' | 'manual' }) {
  const queryClient = useQueryClient();
  const [linking, setLinking] = useState(false);
  const [deletingId, setDeletingId] = useState(false);
  const [apkDownloading, setApkDownloading] = useState(false);

  const downloadApk = async () => {
    if (!app.apkUrl) return;
    setApkDownloading(true);
    try {
      const response = await api.get(`/apps/${app._id}/apk`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.android.package-archive' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${app.name.replace(/[^a-z0-9]/gi, '-')}.apk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download APK. Please try again.');
    } finally {
      setApkDownloading(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/apps/${app._id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-apps'] }),
  });

  const publishMutation = useMutation({
    mutationFn: () => api.post(`/apps/${app._id}/publish`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-apps'] }),
  });

  const buildMutation = useMutation({
    mutationFn: () => api.post(`/apps/${app._id}/build`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-apps'] }),
    onError: (e: { response?: { data?: { message?: string } } }) => {
      alert(e?.response?.data?.message ?? 'Build failed to start.');
    },
  });

  const cancelBuildMutation = useMutation({
    mutationFn: () => api.delete(`/apps/${app._id}/build`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-apps'] }),
    onError: (e: { response?: { data?: { message?: string } } }) => {
      alert(e?.response?.data?.message ?? 'Failed to cancel build.');
    },
  });

  const nextStep = (() => {
    if (!app.domainVerification) return 'link-domain';
    if (!app.apkUrl && app.status !== 'building') return 'build';
    if (app.status === 'building') return 'building';
    if (app.apkUrl && app.status === 'draft') return 'submit';
    if (app.status === 'pending_review') return 'in-review';
    if (app.status === 'published') return 'published';
    if (app.status === 'rejected') return 'rejected';
    return null;
  })();

  const pipelineSteps = [
    { label: 'Created',       done: true },
    { label: 'Domain Linked', done: !!app.domainVerification },
    { label: 'APK Built',     done: !!app.apkUrl },
    { label: 'Published',     done: app.status === 'published' },
  ];
  const pct = Math.round((pipelineSteps.filter((s) => s.done).length / pipelineSteps.length) * 100);

  return (
    <>
      {linking && (
        <LinkDomainModal
          app={app} verifications={verifications} onClose={() => setLinking(false)}
          onLinked={() => queryClient.invalidateQueries({ queryKey: ['my-apps'] })}
        />
      )}

      <div className="glass-card-solid" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-md)', background: app.splashColor || 'var(--color-primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '22px', color: 'white', flexShrink: 0, overflow: 'hidden' }}>
            {app.icon
              ? <img src={app.icon} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : app.name[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <h4 style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>{app.name}</h4>
              {statusBadge(app.status)}
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{app.category} · v{app.version}</p>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: pct === 100 ? 'var(--color-primary)' : 'var(--color-text-muted)', flexShrink: 0 }}>{pct}%</span>
        </div>

        {/* Progress bar */}
        <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: app.status === 'rejected' ? 'var(--color-danger)' : 'var(--color-primary)', borderRadius: 'var(--radius-full)', transition: 'width 0.5s' }} />
        </div>

        {/* Pipeline chips */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {pipelineSteps.map((s) => (
            <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 600, background: s.done ? 'var(--color-primary-50)' : 'var(--color-surface)', border: `1px solid ${s.done ? 'var(--color-primary-100)' : 'var(--color-border)'}`, color: s.done ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
              {s.done ? '✓' : '○'} {s.label}
            </span>
          ))}
        </div>

        {/* Rejection reason */}
        {app.status === 'rejected' && app.rejectionReason && (
          <div style={{ padding: 'var(--space-3)', background: 'var(--color-danger-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', margin: 0 }}><strong>Rejection reason:</strong> {app.rejectionReason}</p>
          </div>
        )}

        {/* ── Review health warnings (published apps only) ── */}
        {app.status === 'published' && app.reviewCount >= 3 && app.averageRating > 0 && (() => {
          if (app.averageRating < 2.5) return (
            <div style={{ padding: 'var(--space-3) var(--space-4)', background: '#2d0a0a', border: '1.5px solid #f8514966', borderRadius: 'var(--radius-md)' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-body-sm)', color: '#f85149' }}>
                🚨 Critical reviews — {app.averageRating.toFixed(1)} ★ avg from {app.reviewCount} reviews
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: '#f8514999' }}>
                Your app may be removed if ratings stay this low. Address user feedback immediately.
              </p>
            </div>
          );
          if (app.averageRating < 3.5) return (
            <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1.5px solid var(--color-warning)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-warning)' }}>
                ⚠️ Below-average reviews — {app.averageRating.toFixed(1)} ★ avg from {app.reviewCount} reviews
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                Consider improving your app experience to boost your store rating.
              </p>
            </div>
          );
          return null;
        })()}

        {/* ── No icon tip ── */}
        {!app.icon && app.status !== 'rejected' && (
          <div style={{ padding: 'var(--space-2) var(--space-4)', background: 'var(--color-surface)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              💡 No icon uploaded — apps with icons get 2× more clicks in the store
            </p>
          </div>
        )}

        {/* ── Next-step CTA ── */}
        {nextStep === 'link-domain' && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-info-light)', border: '1px solid var(--color-info)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-info)' }}>Step 2 — Link your domain</p>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Prove you own the website this app wraps.</p>
            </div>
            <button className="btn-primary" style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-4)', flexShrink: 0 }} onClick={() => setLinking(true)}>
              Link Domain →
            </button>
          </div>
        )}

        {nextStep === 'build' && (() => {
          const isRebuild = !!app.latestBuildJob;
          return (
            <div style={{ padding: 'var(--space-3) var(--space-4)', background: isRebuild ? '#2d0a0a' : 'var(--color-primary-50)', border: `1px solid ${isRebuild ? '#f8514966' : 'var(--color-primary-100)'}`, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-body-sm)', color: isRebuild ? '#f85149' : 'var(--color-primary)' }}>
                  {isRebuild ? '✗ Build failed or cancelled' : `Step 3 — Build your APK`}
                  {bypassBuild && !isRebuild && <span style={{ fontWeight: 400, fontSize: 'var(--text-xs)', marginLeft: '6px' }}>[bypass ON — instant]</span>}
                </p>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  {isRebuild ? 'You can try again with a fresh build.' : 'Compile your website into an Android app package.'}
                </p>
              </div>
              <button
                className="btn-primary"
                style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-4)', flexShrink: 0, background: isRebuild ? '#f85149' : undefined, borderColor: isRebuild ? '#f85149' : undefined }}
                onClick={() => buildMutation.mutate()}
                disabled={buildMutation.isPending}
              >
                {buildMutation.isPending ? 'Starting…' : isRebuild ? 'Rebuild APK →' : 'Build APK →'}
              </button>
            </div>
          );
        })()}

        {nextStep === 'building' && (
          <BuildProgress
            appId={app._id}
            onDone={() => queryClient.invalidateQueries({ queryKey: ['my-apps'] })}
            onCancel={() => cancelBuildMutation.mutate()}
          />
        )}

        {nextStep === 'submit' && (
          reviewMode === 'auto' ? (
            <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-100)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-primary)' }}>Step 4 — Publish your app</p>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>APK is ready. Your app will go live in the store instantly.</p>
              </div>
              <button className="btn-primary" style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-4)', flexShrink: 0 }} onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
                {publishMutation.isPending ? 'Publishing…' : 'Publish Now →'}
              </button>
            </div>
          ) : (
            <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-warning)' }}>Step 4 — Submit for review</p>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>APK is ready. Submit to get listed after admin approval.</p>
              </div>
              <button className="btn-primary" style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-4)', flexShrink: 0 }} onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
                {publishMutation.isPending ? 'Submitting…' : 'Submit for Review →'}
              </button>
            </div>
          )
        )}

        {nextStep === 'in-review' && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-warning)' }}>🔍 Under review</p>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>The Solo Store team is reviewing your app. You&apos;ll be notified once it&apos;s approved or rejected.</p>
          </div>
        )}

        {nextStep === 'published' && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-100)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-primary)' }}>🎉 Live in the store!</p>
            <Link href={`/store/app/${app._id}`} className="btn-ghost" style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-3)' }}>View in Store →</Link>
          </div>
        )}

        {/* Secondary actions */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          {app.apkUrl && (
            <button onClick={downloadApk} disabled={apkDownloading} className="btn-ghost" style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)' }}>
              {apkDownloading ? '⏳…' : '↓ APK'}
            </button>
          )}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => { if (!window.confirm(`Delete "${app.name}"? This cannot be undone.`)) return; setDeletingId(true); deleteMutation.mutate(undefined, { onSettled: () => setDeletingId(false) }); }} disabled={deletingId} className="btn-danger" style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)' }}>
              {deletingId ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Page ─── */
export default function MyAppsPage() {
  const { data: apps = [], isLoading } = useQuery({
    queryKey: ['my-apps'],
    queryFn: async () => { const { data } = await api.get('/apps'); return data.data as App[]; },
  });

  const { data: verifications = [] } = useQuery({
    queryKey: ['verifications'],
    queryFn: async () => { const { data } = await api.get('/verify/list'); return data.data as DomainVerification[]; },
  });

  const { data: testingMode } = useQuery<{ bypassBuild: boolean; reviewMode: 'auto' | 'manual' }>({
    queryKey: ['testing-mode'],
    queryFn: async () => { const { data } = await api.get('/plans/testing-mode'); return data.data; },
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <div>
          <h1 style={{ marginBottom: 'var(--space-1)' }}>My Apps</h1>
          <p>Manage all your converted and published apps.</p>
        </div>
        <Link href="/convert" className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New App
        </Link>
      </div>

      {isLoading && <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--color-text-muted)' }}>Loading your apps…</div>}

      {!isLoading && apps.length === 0 && (
        <div className="glass-card-solid" style={{ padding: 'var(--space-16)', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-full)', background: 'var(--color-primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)', color: 'var(--color-primary)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>No apps yet</h3>
          <p style={{ marginBottom: 'var(--space-6)', color: 'var(--color-text-muted)' }}>Convert your first website into an Android app to get started.</p>
          <Link href="/convert" className="btn-primary">Convert your first website</Link>
        </div>
      )}

      {!isLoading && apps.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-5)' }}>
            {apps.map((app) => (
              <AppCard key={app._id} app={app} verifications={verifications} bypassBuild={testingMode?.bypassBuild ?? false} reviewMode={testingMode?.reviewMode ?? 'manual'} />
            ))}
          </div>

          {/* Recommendation engine promo */}
          <div style={{ marginTop: 'var(--space-8)', padding: 'var(--space-5) var(--space-6)', borderRadius: 'var(--radius-xl)', background: 'linear-gradient(135deg, #7c3aed12 0%, #9333ea08 100%)', border: '1.5px solid #7c3aed33', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-body)', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🔥 Boost your app&apos;s visibility
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', maxWidth: '500px' }}>
                Developers on plans with <strong>Featured Store Placement</strong> appear higher in the <strong>Recommended</strong> section on the store. Upgrade your plan to outrank competitors and reach more users.
              </p>
            </div>
            <Link href="/plans" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-full)', background: '#7c3aed', color: 'white', fontWeight: 700, fontSize: 'var(--text-body-sm)', textDecoration: 'none', boxShadow: '0 4px 16px #7c3aed44' }}>
              View Plans →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
