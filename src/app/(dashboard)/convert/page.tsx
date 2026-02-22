'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { APP_CATEGORIES } from '@/types/app.types';
import type { App } from '@/types/app.types';

/* ─── Types ─── */
interface WizardData {
  websiteUrl: string; name: string; packageName: string;
  shortDescription: string; fullDescription: string;
  category: string; version: string;
  splashColor: string; accentColor: string;
  icon: string;           // base64 data URL or ''
  featureGraphic: string; // base64 data URL or ''
  screenshots: string[];  // up to 8 base64 data URLs
  orientation: 'portrait' | 'landscape' | 'both';
  isFullscreen: boolean; enableOfflineMode: boolean; enablePushNotifications: boolean;
}
interface DraftMeta { step: number; name: string; websiteUrl: string; savedAt: string; hasIcon: boolean; hasFeatureGraphic: boolean; screenshotCount: number; }

const STEPS = ['Website URL', 'App Details', 'Appearance & Media', 'Features', 'Review'];
const DRAFT_META_KEY = 'solostore-draft-meta';
const IDB_DB      = 'solostore-draft';
const IDB_STORE   = 'wizard';
const IDB_KEY     = 'current';
const DEFAULT: WizardData = {
  websiteUrl: '', name: '', packageName: '',
  shortDescription: '', fullDescription: '',
  category: 'Other', version: '1.0.0',
  splashColor: '#15803d', accentColor: '#16a34a',
  icon: '', featureGraphic: '', screenshots: [],
  orientation: 'portrait', isFullscreen: false,
  enableOfflineMode: false, enablePushNotifications: false,
};

/* ─── IndexedDB helpers — full draft stored here ─── */
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}

async function idbSave(draft: { step: number; data: WizardData }): Promise<void> {
  const db = await openIDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(draft, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

async function idbLoad(): Promise<{ step: number; data: WizardData } | null> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror   = () => reject(req.error);
  });
}

async function idbClear(): Promise<void> {
  const db = await openIDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

/* ─── App pipeline helpers ─── */
type PipelineStep = { label: string; done: boolean; hint: string };
function getAppPipeline(app: App, reviewMode: 'auto' | 'manual' = 'manual'): PipelineStep[] {
  const publishHint = app.status === 'published'
    ? 'Live in store'
    : app.status === 'pending_review'
    ? 'Under review'
    : app.status === 'rejected'
    ? `Rejected: ${app.rejectionReason ?? ''}`
    : reviewMode === 'auto'
    ? 'Publish after building APK'
    : 'Submit for review after building APK';
  return [
    { label: 'App Created',     done: true,                     hint: `Created ${new Date(app.createdAt).toLocaleDateString()}` },
    { label: 'Domain Verified', done: !!app.domainVerification, hint: app.domainVerification ? 'Domain verified' : 'Go to Verify page' },
    { label: 'APK Built',       done: !!app.apkUrl,             hint: app.apkUrl ? 'APK available' : 'Trigger a build from My Apps' },
    { label: 'Published',       done: ['published', 'pending_review'].includes(app.status), hint: publishHint },
  ];
}
function statusColor(s: App['status']) {
  const m: Record<App['status'], string> = { draft: 'var(--color-text-muted)', building: 'var(--color-info)', pending_review: 'var(--color-warning)', published: 'var(--color-primary)', rejected: 'var(--color-danger)', unpublished: 'var(--color-text-muted)' };
  return m[s] ?? 'var(--color-text-muted)';
}

/* ─── Image → base64 (compressed) ─── */
function fileToDataUrl(file: File, maxPx = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio  = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ─── Step indicator ─── */
function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-8)', overflowX: 'auto', paddingBottom: '4px' }}>
      {STEPS.map((label, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: i <= current ? 'var(--color-primary)' : 'var(--color-border)', color: i <= current ? '#fff' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0, transition: 'all var(--transition-fast)' }}>
              {i < current ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> : i + 1}
            </div>
            <span style={{ fontSize: '10px', color: i === current ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: i === current ? 600 : 400, whiteSpace: 'nowrap' }}>{label}</span>
          </div>
          {i < STEPS.length - 1 && <div style={{ height: '2px', flex: 1, margin: '0 var(--space-2)', marginBottom: '18px', background: i < current ? 'var(--color-primary)' : 'var(--color-border)', transition: 'background var(--transition-fast)' }} />}
        </div>
      ))}
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
      {children}{required && <span style={{ color: 'var(--color-danger)', marginLeft: '2px' }}>*</span>}
    </label>
  );
}

/* ─── Image upload box ─── */
function ImageUploadBox({ value, onChange, label, hint, aspect = '1/1', maxPx = 512 }: { value: string; onChange: (v: string) => void; label: string; hint?: string; aspect?: string; maxPx?: number; }) {
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const handle = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setLoading(true);
    try { onChange(await fileToDataUrl(file, maxPx)); } catch { /* ignore */ } finally { setLoading(false); }
  };
  return (
    <div>
      <Label>{label}</Label>
      <div
        onClick={() => ref.current?.click()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
        onDragOver={(e) => e.preventDefault()}
        style={{ aspectRatio: aspect, width: aspect === '1/1' ? '120px' : '100%', border: `2px dashed ${value ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: aspect === '1/1' ? 'var(--radius-xl)' : 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', background: value ? 'transparent' : 'var(--color-surface)', transition: 'border-color 0.15s' }}
      >
        {loading ? <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Loading…</span>
          : value ? (
            <>
              <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={(e) => { e.stopPropagation(); onChange(''); }} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '13px', lineHeight: '22px', textAlign: 'center' }}>✕</button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px', pointerEvents: 'none' }}>
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>📷</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Click or drag</div>
            </div>
          )}
      </div>
      {hint && <small style={{ display: 'block', marginTop: '4px', color: 'var(--color-text-muted)', fontSize: '11px' }}>{hint}</small>}
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ''; }} />
    </div>
  );
}

/* ─── Screenshots grid ─── */
function ScreenshotsUpload({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const addFiles = async (files: FileList) => {
    if (value.length >= 8) return;
    setLoading(true);
    const urls: string[] = [];
    for (const f of Array.from(files).slice(0, 8 - value.length)) {
      if (!f.type.startsWith('image/')) continue;
      try { urls.push(await fileToDataUrl(f, 1280)); } catch { /* skip */ }
    }
    onChange([...value, ...urls]);
    setLoading(false);
  };
  return (
    <div>
      <Label>Screenshots <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 400 }}>({value.length}/8)</span></Label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
        {value.map((url, i) => (
          <div key={i} style={{ position: 'relative', aspectRatio: '9/16', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <img src={url} alt={`Screenshot ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '11px', lineHeight: '20px', textAlign: 'center' }}>✕</button>
          </div>
        ))}
        {value.length < 8 && (
          <div onClick={() => ref.current?.click()} style={{ aspectRatio: '9/16', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--color-surface)', gap: '4px' }}>
            {loading ? <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>…</span> : <><div style={{ fontSize: '20px' }}>+</div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Add</div></>}
          </div>
        )}
      </div>
      <small style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>Up to 8 screenshots · PNG or JPG · Portrait (9:16) recommended</small>
      <input ref={ref} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
    </div>
  );
}

/* ─── App history card ─── */
function AppHistoryCard({ app, reviewMode }: { app: App; reviewMode: 'auto' | 'manual' }) {
  const pipeline = getAppPipeline(app, reviewMode);
  const pct = Math.round((pipeline.filter((s) => s.done).length / pipeline.length) * 100);
  return (
    <div className="glass-card-solid" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: app.splashColor || 'var(--color-primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px', color: 'white', flexShrink: 0 }}>
            {app.icon ? <img src={app.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : app.name[0]?.toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-text-primary)' }}>{app.name}</p>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{app.category} · v{app.version}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: statusColor(app.status), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{app.status.replace('_', ' ')}</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', background: 'var(--color-surface)', padding: '2px 8px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}>{pct}% complete</span>
        </div>
      </div>
      <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 'var(--space-3)' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: app.status === 'rejected' ? 'var(--color-danger)' : 'var(--color-primary)', borderRadius: 'var(--radius-full)', transition: 'width 0.5s' }} />
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
        {pipeline.map((s) => (
          <div key={s.label} title={s.hint} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 600, background: s.done ? 'var(--color-primary-50)' : 'var(--color-surface)', border: `1px solid ${s.done ? 'var(--color-primary-100)' : 'var(--color-border)'}`, color: s.done ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
            <span>{s.done ? '✓' : '○'}</span>{s.label}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{app.status === 'published' ? '🎉 Published in store' : `Next: ${pipeline.find((s) => !s.done)?.hint ?? 'All done'}`}</p>
        <Link href="/my-apps" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Manage →</Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function ConvertPage() {
  const router     = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep]           = useState(0);
  const [data, setData]           = useState<WizardData>(DEFAULT);
  const [error, setError]         = useState('');
  const [draftMeta, setDraftMeta] = useState<DraftMeta | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const saveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Load draft on mount ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_META_KEY);
      if (!raw) return;
      const meta: DraftMeta = JSON.parse(raw);
      if (meta.name || meta.websiteUrl) setDraftMeta(meta);
    } catch { /* ignore */ }
  }, []);

  /* ── Auto-save whenever step or data changes ── */
  const saveDraft = useCallback((s: number, d: WizardData) => {
    // Debounce writes — avoid thrashing on every keystroke
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        setSaveStatus('saving');

        // 1. Save full wizard data (including base64 images) in IndexedDB
        await idbSave({ step: s, data: d });

        // 2. Save lightweight meta in localStorage for fast banner detection on next visit
        const meta: DraftMeta = {
          step: s,
          name: d.name,
          websiteUrl: d.websiteUrl,
          savedAt: new Date().toISOString(),
          hasIcon: !!d.icon,
          hasFeatureGraphic: !!d.featureGraphic,
          screenshotCount: d.screenshots.length,
        };
        localStorage.setItem(DRAFT_META_KEY, JSON.stringify(meta));

        setSaveStatus('saved');
        if (statusTimer.current) clearTimeout(statusTimer.current);
        statusTimer.current = setTimeout(() => setSaveStatus('idle'), 2500);
      } catch { setSaveStatus('idle'); }
    }, 600);
  }, []);

  useEffect(() => {
    // Don't save an empty first load
    if (step === 0 && !data.name && !data.websiteUrl) return;
    saveDraft(step, data);
  }, [step, data, saveDraft]);

  /* ── Resume draft ── */
  const resumeDraft = async () => {
    try {
      const saved = await idbLoad();
      if (saved) {
        setData(saved.data);
        setStep(saved.step);
      }
    } catch { /* IndexedDB unavailable — ignore */ }
    setDraftMeta(null);
  };

  /* ── Dismiss draft ── */
  const dismissDraft = () => {
    setDraftMeta(null);
    localStorage.removeItem(DRAFT_META_KEY);
    idbClear().catch(() => {});
  };

  /* ── Clear on successful submit ── */
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_META_KEY);
    idbClear().catch(() => {});
  };

  /* ── Existing apps list ── */
  const { data: myApps = [] } = useQuery<App[]>({
    queryKey: ['my-apps'],
    queryFn: async () => { const { data } = await api.get('/apps'); return data.data; },
  });

  /* ── Platform settings — for review mode copy ── */
  const { data: testingMode } = useQuery<{ reviewMode: 'auto' | 'manual' }>({
    queryKey: ['testing-mode'],
    queryFn: async () => { const { data } = await api.get('/plans/testing-mode'); return data.data; },
  });
  const reviewMode = testingMode?.reviewMode ?? 'manual';

  /* ── Create mutation ── */
  const createMutation = useMutation({
    mutationFn: async (payload: WizardData) => { const { data: res } = await api.post('/apps', payload); return res.data; },
    onSuccess: () => {
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ['my-apps'] });
      router.push('/my-apps');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err?.response?.data?.message ?? 'Failed to create app. Please try again.');
    },
  });

  /* ── Field helpers ── */
  const set = (field: keyof WizardData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setData((prev) => ({ ...prev, [field]: e.target.value })); setError('');
    };
  const setCheck = (field: keyof WizardData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setData((prev) => ({ ...prev, [field]: e.target.checked }));
  const setVal = <K extends keyof WizardData>(field: K, value: WizardData[K]) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const autoPackageName = (url: string) => {
    try {
      const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '').replace(/\./g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      return `com.${host}.app`;
    } catch { return ''; }
  };

  /* ── Validation per step ── */
  const handleUrlNext = () => {
    if (!data.websiteUrl) { setError('Please enter a website URL.'); return; }
    try { new URL(data.websiteUrl.startsWith('http') ? data.websiteUrl : `https://${data.websiteUrl}`); }
    catch { setError('Please enter a valid URL (e.g., https://example.com)'); return; }
    if (!data.packageName) setData((prev) => ({ ...prev, packageName: autoPackageName(data.websiteUrl) }));
    setStep(1);
  };
  const handleDetailsNext = () => {
    if (!data.name.trim())             { setError('App name is required.'); return; }
    if (data.name.length < 2)          { setError('App name must be at least 2 characters.'); return; }
    if (!data.shortDescription.trim()) { setError('Short description is required.'); return; }
    if (!data.packageName.trim())      { setError('Package name is required.'); return; }
    setStep(2);
  };

  const fs: React.CSSProperties = { marginBottom: 'var(--space-5)' };
  const Arr = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ marginBottom: 'var(--space-1)' }}>Convert Website to App</h1>
        <p>Follow the steps to turn your website into a native Android app.</p>
      </div>

      {/* ── Draft resume banner ── */}
      {draftMeta && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)', padding: 'var(--space-4) var(--space-5)', background: 'var(--color-warning-light)', border: '1.5px solid var(--color-warning)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-5)' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-warning)' }}>
              📝 Continue where you left off
            </p>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
              <strong>{draftMeta.name || draftMeta.websiteUrl || 'Unnamed app'}</strong>
              {' · '}Step {draftMeta.step + 1} of {STEPS.length} ({STEPS[draftMeta.step]})
              {' · '}Saved {new Date(draftMeta.savedAt).toLocaleString()}
              {(draftMeta.hasIcon || draftMeta.screenshotCount > 0) && (
                <span style={{ marginLeft: '6px', color: 'var(--color-primary)', fontWeight: 600 }}>
                  {draftMeta.hasIcon ? ' · 🖼 icon' : ''}{draftMeta.screenshotCount > 0 ? ` · ${draftMeta.screenshotCount} screenshot${draftMeta.screenshotCount !== 1 ? 's' : ''}` : ''}
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button onClick={resumeDraft} className="btn-primary" style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-body-sm)' }}>Resume Draft</button>
            <button onClick={dismissDraft} className="btn-ghost" style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-body-sm)' }}>Start Fresh</button>
          </div>
        </div>
      )}

      <StepIndicator current={step} />

      {/* ── Auto-save status ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-2)', minHeight: '20px' }}>
        {saveStatus === 'saving' && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>⏳ Saving…</span>}
        {saveStatus === 'saved'  && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)',    display: 'flex', alignItems: 'center', gap: '4px' }}>✓ Draft saved</span>}
      </div>

      <div className="glass-card-solid" style={{ padding: 'var(--space-8)' }}>
        {error && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-danger-light)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: 'var(--text-body-sm)', marginBottom: 'var(--space-5)' }}>
            {error}
          </div>
        )}

        {/* ── Step 0 — URL ── */}
        {step === 0 && (
          <div>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>Enter your website URL</h3>
            <p style={{ marginBottom: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>Your website will be wrapped in a native Android app using Trusted Web Activity (TWA) technology.</p>
            <div style={fs}>
              <Label required>Website URL</Label>
              <input className="input-field" type="url" placeholder="https://yourwebsite.com" value={data.websiteUrl} onChange={set('websiteUrl')} autoFocus />
              <small style={{ marginTop: 'var(--space-2)', display: 'block', color: 'var(--color-text-muted)' }}>Your site must be live and HTTPS-enabled. You&apos;ll verify domain ownership in a later step.</small>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={handleUrlNext} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>Next: App Details <Arr /></button>
            </div>
          </div>
        )}

        {/* ── Step 1 — Details ── */}
        {step === 1 && (
          <div>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>App Details</h3>
            <p style={{ marginBottom: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>Fill in the information users will see in the Solo Store.</p>
            <div style={fs}><Label required>App Name</Label><input className="input-field" placeholder="My Awesome App" value={data.name} onChange={set('name')} /></div>
            <div style={fs}>
              <Label required>Package Name</Label>
              <input className="input-field" placeholder="com.example.myapp" value={data.packageName} onChange={set('packageName')} />
              <small style={{ marginTop: 'var(--space-1)', display: 'block', color: 'var(--color-text-muted)' }}>Unique identifier. Cannot be changed after publishing.</small>
            </div>
            <div style={fs}>
              <Label required>Short Description</Label>
              <input className="input-field" placeholder="One-line description shown in search results" value={data.shortDescription} onChange={set('shortDescription')} maxLength={80} />
              <small style={{ marginTop: 'var(--space-1)', display: 'block', color: 'var(--color-text-muted)' }}>{data.shortDescription.length}/80 characters</small>
            </div>
            <div style={fs}>
              <Label>Full Description</Label>
              <textarea className="input-field" rows={5} placeholder="Detailed description of your app…" value={data.fullDescription} onChange={set('fullDescription')} maxLength={4000} style={{ resize: 'vertical' }} />
              <small style={{ marginTop: 'var(--space-1)', display: 'block', color: 'var(--color-text-muted)' }}>{data.fullDescription.length}/4000</small>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
              <div><Label required>Category</Label><select className="input-field" value={data.category} onChange={set('category')}>{APP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><Label>Version</Label><input className="input-field" placeholder="1.0.0" value={data.version} onChange={set('version')} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn-ghost" onClick={() => { setStep(0); setError(''); }}>Back</button>
              <button className="btn-primary" onClick={handleDetailsNext} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>Next: Appearance &amp; Media <Arr /></button>
            </div>
          </div>
        )}

        {/* ── Step 2 — Appearance & Media ── */}
        {step === 2 && (
          <div>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>Appearance &amp; Media</h3>
            <p style={{ marginBottom: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>Set your app&apos;s icon, banner, colors, and screenshots.</p>

            {/* Icon + Feature graphic */}
            <div style={{ display: 'flex', gap: 'var(--space-6)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
              <ImageUploadBox label="App Icon" value={data.icon} onChange={(v) => setVal('icon', v)} hint="Square image (512×512 recommended)" aspect="1/1" maxPx={512} />
              <div style={{ flex: 1, minWidth: '200px' }}>
                <ImageUploadBox label="Feature Graphic (Banner)" value={data.featureGraphic} onChange={(v) => setVal('featureGraphic', v)} hint="Wide banner shown at top of store listing (1024×500)" aspect="1024/500" maxPx={1024} />
              </div>
            </div>

            {/* Colors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
              {(['splashColor', 'accentColor'] as const).map((field) => (
                <div key={field}>
                  <Label>{field === 'splashColor' ? 'Splash Color' : 'Accent Color'}</Label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <input type="color" value={data[field]} onChange={set(field)} style={{ width: '44px', height: '44px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }} />
                    <input className="input-field" value={data[field]} onChange={set(field)} style={{ flex: 1 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Orientation */}
            <div style={fs}>
              <Label>Screen Orientation</Label>
              <select className="input-field" value={data.orientation} onChange={set('orientation')}>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
                <input type="checkbox" checked={data.isFullscreen} onChange={setCheck('isFullscreen')} style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} />
                <div><span style={{ fontWeight: 600, display: 'block', fontSize: 'var(--text-body-sm)' }}>Fullscreen mode</span><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Hide the status bar and navigation bar</span></div>
              </label>
            </div>

            {/* Live preview */}
            <div style={{ padding: 'var(--space-4)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: data.icon ? 'transparent' : data.splashColor, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '22px' }}>
                {data.icon ? <img src={data.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : data.name?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div>
                <p style={{ fontWeight: 700, margin: 0, fontSize: 'var(--text-body-sm)' }}>{data.name || 'Your App'}</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>{data.shortDescription || 'Short description'}</p>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: '6px' }}>
                  <span style={{ width: '12px', height: '4px', borderRadius: '2px', background: data.accentColor, display: 'block' }} />
                  <span style={{ width: '8px', height: '4px', borderRadius: '2px', background: data.accentColor, opacity: 0.6, display: 'block' }} />
                </div>
              </div>
            </div>

            {/* Screenshots */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <ScreenshotsUpload value={data.screenshots} onChange={(v) => setVal('screenshots', v)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn-ghost" onClick={() => { setStep(1); setError(''); }}>Back</button>
              <button className="btn-primary" onClick={() => { setStep(3); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>Next: Features <Arr /></button>
            </div>
          </div>
        )}

        {/* ── Step 3 — Features ── */}
        {step === 3 && (
          <div>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>App Features</h3>
            <p style={{ marginBottom: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>Enable optional features for your app.</p>
            {([
              { field: 'enableOfflineMode' as keyof WizardData, title: 'Offline Mode', desc: 'Cache pages so the app works without internet connection.', emoji: '📶' },
              { field: 'enablePushNotifications' as keyof WizardData, title: 'Push Notifications', desc: 'Allow your app to send push notifications to users.', emoji: '🔔' },
            ]).map(({ field, title, desc, emoji }) => (
              <label key={field} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: `1.5px solid ${data[field] ? 'var(--color-primary)' : 'var(--color-border)'}`, background: data[field] ? 'var(--color-primary-50)' : 'var(--color-white)', cursor: 'pointer', marginBottom: 'var(--space-3)', transition: 'all var(--transition-fast)' }}>
                <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>{emoji}</span>
                <div style={{ flex: 1 }}><span style={{ display: 'block', fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>{title}</span><span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{desc}</span></div>
                <input type="checkbox" checked={!!data[field]} onChange={setCheck(field)} style={{ width: '18px', height: '18px', flexShrink: 0, accentColor: 'var(--color-primary)' }} />
              </label>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)' }}>
              <button className="btn-ghost" onClick={() => { setStep(2); setError(''); }}>Back</button>
              <button className="btn-primary" onClick={() => { setStep(4); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>Review &amp; Submit <Arr /></button>
            </div>
          </div>
        )}

        {/* ── Step 4 — Review ── */}
        {step === 4 && (
          <div>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>Review &amp; Create App</h3>
            <p style={{ marginBottom: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>Review your configuration before creating the app.</p>

            {/* Media preview */}
            {(data.icon || data.featureGraphic || data.screenshots.length > 0) && (
              <div style={{ marginBottom: 'var(--space-5)' }}>
                {data.featureGraphic && (
                  <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-3)', maxHeight: '140px' }}>
                    <img src={data.featureGraphic} alt="Banner" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                  {data.icon && <img src={data.icon} alt="Icon" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }} />}
                  <div>
                    <p style={{ margin: 0, fontWeight: 700 }}>{data.name}</p>
                    <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{data.category} · v{data.version}</p>
                    {data.screenshots.length > 0 && <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-primary)' }}>✓ {data.screenshots.length} screenshot{data.screenshots.length !== 1 ? 's' : ''}</p>}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              {[
                { label: 'Website URL', value: data.websiteUrl },
                { label: 'App Name', value: data.name },
                { label: 'Package Name', value: data.packageName },
                { label: 'Category', value: data.category },
                { label: 'Version', value: data.version },
                { label: 'Orientation', value: data.orientation },
                { label: 'Fullscreen', value: data.isFullscreen ? 'Yes' : 'No' },
                { label: 'Offline Mode', value: data.enableOfflineMode ? 'Enabled' : 'Disabled' },
                { label: 'Push Notifications', value: data.enablePushNotifications ? 'Enabled' : 'Disabled' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)' }}>
                  <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>{row.label}</span>
                  <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: 'var(--space-4)', background: 'var(--color-info-light)', border: '1px solid var(--color-info)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)' }}>
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-info)', margin: 0 }}>
                {reviewMode === 'auto'
                  ? 'After creation, verify your domain and build the APK — your app will then publish to the store automatically.'
                  : 'After creation, verify your domain and build the APK before submitting for admin review.'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn-ghost" onClick={() => { setStep(3); setError(''); }}>Back</button>
              <button className="btn-primary" onClick={() => createMutation.mutate(data)} disabled={createMutation.isPending} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {createMutation.isPending ? 'Creating…' : <><span>Create App</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg></>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Conversion history ── */}
      {myApps.length > 0 && (
        <div style={{ marginTop: 'var(--space-10)' }}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h2 style={{ margin: 0, fontSize: 'var(--text-h3)', fontWeight: 700 }}>Your Conversions</h2>
            <p style={{ margin: 0, fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', marginTop: '2px' }}>Track each app through the pipeline</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {myApps.map((app) => <AppHistoryCard key={app._id} app={app} reviewMode={reviewMode} />)}
          </div>
        </div>
      )}
    </div>
  );
}
