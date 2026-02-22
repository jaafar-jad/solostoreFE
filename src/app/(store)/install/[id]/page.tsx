'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { App } from '@/types/app.types';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Phase = 'checking' | 'ready' | 'installing' | 'installed' | 'launching' | 'unsupported';

export default function InstallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [phase, setPhase] = useState<Phase>('checking');
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const launchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: app } = useQuery<App>({
    queryKey: ['install-app', id],
    queryFn: async () => {
      const { data } = await api.get(`/store/apps/${id}`);
      return data.data;
    },
  });

  /* ── Detect standalone launch → redirect to actual website ── */
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (sp.get('launch') === '1' || isStandalone) {
      setPhase('launching');
    }
  }, []);

  useEffect(() => {
    if (phase === 'launching' && app?.websiteUrl) {
      launchTimeout.current = setTimeout(() => {
        window.location.replace(app.websiteUrl);
      }, 900);
    }
    return () => { if (launchTimeout.current) clearTimeout(launchTimeout.current); };
  }, [phase, app]);

  /* ── Register SW + capture beforeinstallprompt ── */
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw-install.js', { scope: '/install/' })
        .catch(() => {});
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setPhase('ready');
    };
    const onInstalled = () => setPhase('installed');

    window.addEventListener('beforeinstallprompt', onPrompt as EventListener);
    window.addEventListener('appinstalled', onInstalled);

    // Give it 6 s — if no prompt fired, the browser probably doesn't support it
    const t = setTimeout(() => {
      if (phase === 'checking') setPhase('unsupported');
    }, 6000);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt as EventListener);
      window.removeEventListener('appinstalled', onInstalled);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    setPhase('installing');
    try {
      await deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      deferredPrompt.current = null;
      setPhase(outcome === 'accepted' ? 'installed' : 'ready');
    } catch {
      setPhase('ready');
    }
  };

  const accentColor = app?.accentColor || '#15803d';
  const appName = app?.name || 'App';

  /* ── Shared layout wrapper ── */
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${accentColor}18 0%, #f8fafc 100%)`,
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: '400px',
          background: '#fff', borderRadius: '24px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
          padding: '40px 32px',
          textAlign: 'center',
        }}
      >
        {/* App icon */}
        <div
          style={{
            width: '88px', height: '88px', borderRadius: '20px',
            background: app?.icon
              ? 'transparent'
              : `linear-gradient(135deg, ${accentColor}33, ${accentColor}66)`,
            border: `2px solid ${accentColor}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', overflow: 'hidden',
            boxShadow: `0 8px 24px ${accentColor}33`,
          }}
        >
          {app?.icon
            ? <img src={app.icon} alt={appName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '44px' }}>📱</span>
          }
        </div>
        {children}
      </div>
    </div>
  );

  /* ── Launching / redirect screen ── */
  if (phase === 'launching') {
    return (
      <Shell>
        <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800 }}>{appName}</h2>
        <p style={{ color: '#6b7280', margin: '0 0 24px', fontSize: '14px' }}>Opening your app…</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: `3px solid ${accentColor}33`,
            borderTop: `3px solid ${accentColor}`,
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </Shell>
    );
  }

  /* ── Installed success screen ── */
  if (phase === 'installed') {
    return (
      <Shell>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800, color: accentColor }}>
          {appName} Installed!
        </h2>
        <p style={{ color: '#6b7280', margin: '0 0 24px', fontSize: '14px', lineHeight: 1.6 }}>
          The app has been added to your desktop and taskbar. Launch it from there anytime.
        </p>
        <button
          onClick={() => window.close()}
          style={{
            padding: '12px 28px', borderRadius: '12px',
            background: accentColor, color: '#fff',
            border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '15px', width: '100%',
          }}
        >
          Close Window
        </button>
      </Shell>
    );
  }

  /* ── Unsupported browser fallback ── */
  if (phase === 'unsupported') {
    return (
      <Shell>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🌐</div>
        <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800 }}>{appName}</h2>
        <p style={{ color: '#6b7280', margin: '0 0 6px', fontSize: '14px', lineHeight: 1.6 }}>
          Your browser doesn&apos;t support automatic PWA install.
        </p>
        <p style={{ color: '#6b7280', margin: '0 0 24px', fontSize: '13px', lineHeight: 1.6 }}>
          Open this page in <strong>Chrome or Edge</strong> and look for the ⊕ install icon in the address bar.
        </p>
        {app?.websiteUrl && (
          <a
            href={app.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', padding: '12px 28px', borderRadius: '12px',
              background: accentColor, color: '#fff',
              textDecoration: 'none', fontWeight: 700, fontSize: '15px',
            }}
          >
            Visit Website →
          </a>
        )}
      </Shell>
    );
  }

  /* ── Main install screen (checking | ready | installing) ── */
  const isReady = phase === 'ready';
  const isInstalling = phase === 'installing';

  return (
    <Shell>
      <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800 }}>{appName}</h2>
      <p style={{ color: '#6b7280', margin: '0 0 4px', fontSize: '13px' }}>
        {app?.shortDescription}
      </p>
      <p style={{ color: '#9ca3af', margin: '0 0 28px', fontSize: '12px' }}>Web App (PWA)</p>

      {/* Install button */}
      <button
        onClick={handleInstall}
        disabled={!isReady || isInstalling}
        style={{
          width: '100%', padding: '14px 24px',
          borderRadius: '14px', border: 'none', cursor: isReady ? 'pointer' : 'not-allowed',
          background: isReady ? accentColor : '#e5e7eb',
          color: isReady ? '#fff' : '#9ca3af',
          fontWeight: 700, fontSize: '16px',
          transition: 'all 0.2s',
          marginBottom: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        {isInstalling
          ? <>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.4)',
                borderTop: '2px solid #fff',
                animation: 'spin 0.7s linear infinite', flexShrink: 0,
              }} />
              Installing…
            </>
          : phase === 'checking'
            ? 'Preparing install…'
            : '⊕  Add to Desktop'
        }
      </button>

      {phase === 'checking' && (
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 12px' }}>
          Waiting for browser permission…
        </p>
      )}

      {/* Fallback website link */}
      {app?.websiteUrl && (
        <a
          href={app.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block', textAlign: 'center',
            fontSize: '13px', color: accentColor,
            textDecoration: 'none', fontWeight: 600, marginTop: '8px',
          }}
        >
          Open website instead →
        </a>
      )}

      <p style={{ fontSize: '11px', color: '#d1d5db', marginTop: '20px', lineHeight: 1.5 }}>
        Works on Chrome &amp; Edge · Adds to your desktop &amp; taskbar
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Shell>
  );
}
