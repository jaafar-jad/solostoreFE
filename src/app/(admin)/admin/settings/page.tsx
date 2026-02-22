'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Plan, Payment } from '@/types/plan.types';

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */
interface PlatformSettings {
  bypassPayment: boolean;
  bypassDns: boolean;
  bypassBuild: boolean;
  reviewMode: 'auto' | 'manual';
}

/* ─────────────────────────────────────────────────────────────────────────────
   Payment status badge
───────────────────────────────────────────────────────────────────────────── */
function paymentBadge(status: Payment['status']) {
  const map: Record<Payment['status'], { label: string; cls: string }> = {
    pending:   { label: 'Pending',   cls: 'badge-yellow' },
    succeeded: { label: 'Paid',      cls: 'badge-green'  },
    failed:    { label: 'Failed',    cls: 'badge-red'    },
    refunded:  { label: 'Refunded',  cls: 'badge-gray'   },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'badge-gray' };
  return <span className={`badge ${cls}`}>{label}</span>;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Toggle switch
───────────────────────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: '48px',
        height: '26px',
        borderRadius: '13px',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? 'var(--color-primary)' : 'var(--color-border)',
        position: 'relative',
        transition: 'background var(--transition-fast)',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '25px' : '3px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left var(--transition-fast)',
        }}
      />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Platform Controls panel — review mode + bypass flags
───────────────────────────────────────────────────────────────────────────── */
function PlatformControlsPanel() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<PlatformSettings>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data } = await api.get('/admin/settings');
      return data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (patch: Partial<PlatformSettings>) => {
      const { data } = await api.patch('/admin/settings', patch);
      return data.data as PlatformSettings;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['admin-settings'], updated);
      queryClient.invalidateQueries({ queryKey: ['testing-mode'] });
      queryClient.invalidateQueries({ queryKey: ['admin-testing-flags'] });
    },
  });

  const patch = (key: keyof PlatformSettings, value: boolean | string) => {
    if (!settings) return;
    mutation.mutate({ [key]: value });
  };

  const BYPASS_FLAGS = [
    { key: 'bypassPayment' as const, label: 'Payment Bypass', icon: '💳', desc: 'Skip Stripe — adds [TEST] subscribe buttons on billing pages.' },
    { key: 'bypassDns'     as const, label: 'DNS Bypass',     icon: '🌐', desc: 'Skip real DNS checks — adds [TEST] Force Verify on domain page.' },
    { key: 'bypassBuild'   as const, label: 'Build Bypass',   icon: '⚙️', desc: 'Skip APK compilation — build completes instantly.' },
  ];

  return (
    <div className="glass-card-solid" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <span style={{ fontSize: '22px' }}>⚙️</span>
        <div>
          <h2 style={{ margin: 0, fontSize: 'var(--text-h4)', fontWeight: 700 }}>Platform Controls</h2>
          <p style={{ margin: 0, fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
            Global switches affecting all users. Changes take effect immediately.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-body-sm)' }}>Loading…</p>
      ) : (
        <>
          {/* ── Review Mode ── */}
          <div
            style={{
              marginBottom: 'var(--space-6)',
              padding: 'var(--space-5)',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid var(--color-primary-200)',
              background: 'var(--color-primary-50)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '20px' }}>🔍</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-text-primary)' }}>
                  App Review Mode
                </p>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Controls what happens when a developer submits an app for publishing.
                </p>
              </div>
              <span className={`badge ${settings?.reviewMode === 'auto' ? 'badge-green' : 'badge-blue'}`} style={{ flexShrink: 0 }}>
                {settings?.reviewMode === 'auto' ? 'Auto-publish ON' : 'Manual Review ON'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              {[
                {
                  value: 'manual' as const,
                  label: '🛡️ Manual Review',
                  desc: 'Apps enter a review queue. Admin must approve or reject before the app appears in the store.',
                },
                {
                  value: 'auto' as const,
                  label: '⚡ Auto-Publish',
                  desc: 'Apps go live immediately when the developer clicks Publish. No admin approval step.',
                },
              ].map((opt) => {
                const active = settings?.reviewMode === opt.value;
                return (
                  <label
                    key={opt.value}
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      display: 'flex',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: active ? 'var(--color-white)' : 'var(--color-surface)',
                      cursor: mutation.isPending ? 'not-allowed' : 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <input
                      type="radio"
                      name="reviewMode"
                      value={opt.value}
                      checked={active}
                      disabled={mutation.isPending}
                      onChange={() => patch('reviewMode', opt.value)}
                      style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }}
                    />
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-body-sm)', color: active ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                        {opt.label}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                        {opt.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* ── Bypass Flags ── */}
          <div>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-full)', padding: '1px 8px' }}>
                Dev / Testing Only
              </span>
              Bypass Flags
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {BYPASS_FLAGS.map(({ key, label, desc, icon }) => {
                const active = settings?.[key] ?? false;
                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-4)',
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${active ? 'var(--color-warning)' : 'var(--color-border)'}`,
                      background: active ? 'var(--color-warning-light)' : 'var(--color-surface)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 'var(--space-3)', flex: 1, alignItems: 'center' }}>
                      <span style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-text-primary)' }}>{label}</p>
                        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>{desc}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                      {active && <span className="badge badge-yellow" style={{ fontSize: '10px' }}>ON</span>}
                      <Toggle checked={active} onChange={() => patch(key, !active)} disabled={mutation.isPending} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Plan Feature Editor — per-plan inline edit card
───────────────────────────────────────────────────────────────────────────── */
function PlanFeatureEditor({ plan, onSaved }: { plan: Plan; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    price: plan.price,
    maxApps: plan.features.maxApps,
    maxApkSizeMB: plan.features.maxApkSizeMB,
    queuePriority: plan.features.queuePriority,
    isFeaturedEligible: plan.features.isFeaturedEligible,
    hasAnalytics: plan.features.hasAnalytics,
    removeSoloBadge: plan.features.removeSoloBadge,
    customPackageName: plan.features.customPackageName,
    isActive: plan.isActive,
    isDefault: plan.isDefault,
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch(`/admin/plans/${plan._id}`, {
        price: form.price,
        isActive: form.isActive,
        isDefault: form.isDefault,
        features: {
          maxApps: form.maxApps,
          maxApkSizeMB: form.maxApkSizeMB,
          queuePriority: form.queuePriority,
          isFeaturedEligible: form.isFeaturedEligible,
          hasAnalytics: form.hasAnalytics,
          removeSoloBadge: form.removeSoloBadge,
          customPackageName: form.customPackageName,
        },
      });
      return data;
    },
    onSuccess: () => { setEditing(false); setError(''); onSaved(); },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      setError(e?.response?.data?.message ?? 'Failed to save changes.');
    },
  });

  const cancelEdit = () => {
    setEditing(false);
    setError('');
    setForm({
      price: plan.price,
      maxApps: plan.features.maxApps,
      maxApkSizeMB: plan.features.maxApkSizeMB,
      queuePriority: plan.features.queuePriority,
      isFeaturedEligible: plan.features.isFeaturedEligible,
      hasAnalytics: plan.features.hasAnalytics,
      removeSoloBadge: plan.features.removeSoloBadge,
      customPackageName: plan.features.customPackageName,
      isActive: plan.isActive,
      isDefault: plan.isDefault,
    });
  };

  const planColor =
    plan.displayOrder >= 3 ? '#b45309' :
    plan.displayOrder === 2 ? '#7c3aed' :
    plan.displayOrder === 1 ? '#0284c7' :
    'var(--color-text-muted)';

  const tierEmoji = plan.displayOrder >= 3 ? '💎' : plan.displayOrder === 2 ? '⚡' : plan.displayOrder === 1 ? '⬆' : '🌱';

  const BOOL_FEATURES: Array<{ key: keyof typeof form; label: string; desc: string }> = [
    { key: 'isFeaturedEligible', label: 'Featured Store Placement', desc: 'App appears in featured sections on the store homepage' },
    { key: 'hasAnalytics',       label: 'Analytics Dashboard',      desc: 'Developer can view download stats and review health' },
    { key: 'removeSoloBadge',    label: 'Remove Solo Badge',        desc: 'Hides "Built with Solo Store" badge on the app listing' },
    { key: 'customPackageName',  label: 'Custom Package Name',      desc: 'Developer sets their own Android package ID (e.g. com.myapp)' },
  ];

  return (
    <div
      className="glass-card-solid"
      style={{
        overflow: 'hidden',
        border: editing ? `2px solid ${planColor}` : '1px solid var(--color-border)',
        transition: 'border-color var(--transition-fast)',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--color-border)',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: `${planColor}18`,
              border: `1.5px solid ${planColor}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0,
            }}
          >
            {tierEmoji}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 'var(--text-body)', color: 'var(--color-text-primary)' }}>
              {plan.name}
              <code style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: '8px', fontFamily: 'var(--font-mono)', background: 'var(--color-surface)', padding: '2px 6px', borderRadius: '4px' }}>
                {plan.slug}
              </code>
            </p>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: planColor, fontWeight: 600 }}>
              {plan.price === 0 ? 'Free' : `$${plan.price}/${plan.interval}`}
              {' · '}displayOrder {plan.displayOrder}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {!plan.isActive && <span className="badge badge-gray">Inactive</span>}
          {plan.isDefault && <span className="badge badge-blue">Default</span>}
          {!editing ? (
            <button className="btn-ghost" onClick={() => { setEditing(true); setError(''); }} style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-body-sm)' }}>
              Edit Features
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button className="btn-primary" onClick={() => mutation.mutate()} disabled={mutation.isPending} style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-body-sm)' }}>
                {mutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
              <button className="btn-ghost" onClick={cancelEdit} style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-body-sm)' }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: 'var(--space-5)' }}>
        {error && (
          <div style={{ padding: 'var(--space-3)', background: 'var(--color-danger-light)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: 'var(--text-body-sm)', marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        {!editing ? (
          /* ── Read mode: compact feature pills ── */
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {[
              `${form.maxApps === 999 ? '∞' : form.maxApps} apps`,
              `${form.maxApkSizeMB} MB APK`,
              `${form.queuePriority} priority`,
              ...(form.isFeaturedEligible ? ['Featured store'] : []),
              ...(form.hasAnalytics ? ['Analytics'] : []),
              ...(form.removeSoloBadge ? ['No Solo badge'] : []),
              ...(form.customPackageName ? ['Custom package'] : []),
            ].map((feat) => (
              <span
                key={feat}
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: `${planColor}12`,
                  color: planColor,
                  border: `1px solid ${planColor}30`,
                }}
              >
                {feat}
              </span>
            ))}
          </div>
        ) : (
          /* ── Edit mode ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

            {/* Numeric limits */}
            <div>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)' }}>
                Limits &amp; Pricing
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, marginBottom: 'var(--space-1)', color: 'var(--color-text-secondary)' }}>
                    Max Apps <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>(999 = unlimited)</span>
                  </label>
                  <input type="number" min={1} max={999} className="input-field" value={form.maxApps}
                    onChange={(e) => setForm((f) => ({ ...f, maxApps: Math.max(1, parseInt(e.target.value) || 1) }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, marginBottom: 'var(--space-1)', color: 'var(--color-text-secondary)' }}>
                    Max APK Size (MB)
                  </label>
                  <input type="number" min={1} className="input-field" value={form.maxApkSizeMB}
                    onChange={(e) => setForm((f) => ({ ...f, maxApkSizeMB: Math.max(1, parseInt(e.target.value) || 1) }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, marginBottom: 'var(--space-1)', color: 'var(--color-text-secondary)' }}>
                    Price (USD)
                  </label>
                  <input type="number" min={0} step={0.01} className="input-field" value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
            </div>

            {/* Queue Priority — radio group */}
            <div>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)' }}>
                Build Queue Priority
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                {([
                  { value: 'normal',  label: 'Normal',  desc: 'Standard queue position',      color: '#6b7280' },
                  { value: 'high',    label: 'High',    desc: 'Ahead of normal builds',        color: '#0284c7' },
                  { value: 'highest', label: 'Highest', desc: 'Top of queue — near-instant',   color: '#15803d' },
                ] as const).map((opt) => {
                  const active = form.queuePriority === opt.value;
                  return (
                    <label
                      key={opt.value}
                      style={{
                        flex: 1,
                        minWidth: '130px',
                        display: 'flex',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${active ? opt.color : 'var(--color-border)'}`,
                        background: active ? `${opt.color}10` : 'var(--color-surface)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <input type="radio" name={`priority-${plan._id}`} value={opt.value} checked={active}
                        onChange={() => setForm((f) => ({ ...f, queuePriority: opt.value }))}
                        style={{ accentColor: opt.color, marginTop: '2px' }} />
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--text-body-sm)', color: active ? opt.color : 'var(--color-text-primary)' }}>
                          {opt.label}
                        </p>
                        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{opt.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Feature access — checkboxes */}
            <div>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)' }}>
                Feature Access
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
                {BOOL_FEATURES.map(({ key, label, desc }) => {
                  const val = form[key] as boolean;
                  return (
                    <label
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${val ? planColor + '50' : 'var(--color-border)'}`,
                        background: val ? `${planColor}08` : 'var(--color-surface)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <input type="checkbox" checked={val}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                        style={{ width: '16px', height: '16px', accentColor: planColor, marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--text-body-sm)', color: val ? planColor : 'var(--color-text-primary)' }}>
                          {label}
                        </p>
                        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>{desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Plan status */}
            <div>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)' }}>
                Plan Status
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                {[
                  { key: 'isActive' as const,  label: 'Active',       desc: 'Visible to users on pricing pages' },
                  { key: 'isDefault' as const, label: 'Default Plan', desc: 'Assigned to new users automatically' },
                ].map(({ key, label, desc }) => {
                  const val = form[key];
                  return (
                    <label
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-3) var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${val ? 'var(--color-primary-200)' : 'var(--color-border)'}`,
                        background: val ? 'var(--color-primary-50)' : 'var(--color-surface)',
                        cursor: 'pointer',
                        flex: 1,
                        minWidth: '160px',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <input type="checkbox" checked={val}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)', flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--text-body-sm)', color: 'var(--color-text-primary)' }}>{label}</p>
                        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Create Plan form (collapsed button by default)
───────────────────────────────────────────────────────────────────────────── */
const PLAN_DEFAULTS = {
  name: '', slug: '', description: '', price: 0, interval: 'monthly' as const,
  displayOrder: 0, isActive: true, isDefault: false,
  features: {
    maxApps: 1, maxApkSizeMB: 50, queuePriority: 'normal' as const,
    isFeaturedEligible: false, hasAnalytics: false, removeSoloBadge: false, customPackageName: false,
  },
};

function CreatePlanForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState(PLAN_DEFAULTS);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post('/admin/plans', form),
    onSuccess: () => { onCreated(); setOpen(false); setForm(PLAN_DEFAULTS); setError(''); },
    onError: (e: { response?: { data?: { message?: string } } }) => { setError(e?.response?.data?.message ?? 'Failed to create plan.'); },
  });

  const set = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));
  const setFeat = (field: string, value: unknown) => setForm((f) => ({ ...f, features: { ...f.features, [field]: value } }));

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)} style={{ padding: 'var(--space-2) var(--space-5)' }}>
        + New Plan
      </button>
    );
  }

  return (
    <div className="glass-card-solid" style={{ padding: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--text-h4)' }}>Create New Plan</h3>
        <button onClick={() => { setOpen(false); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--color-text-muted)' }}>×</button>
      </div>
      {error && <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-body-sm)', marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-danger-light)', borderRadius: 'var(--radius-md)' }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div><label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>Name *</label>
          <input className="input-field" value={form.name} onChange={(e) => { set('name', e.target.value); set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')); }} placeholder="e.g. Pro" /></div>
        <div><label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>Slug *</label>
          <input className="input-field" value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="e.g. pro" /></div>
        <div><label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>Price (USD)</label>
          <input className="input-field" type="number" min={0} step={0.01} value={form.price} onChange={(e) => set('price', parseFloat(e.target.value) || 0)} /></div>
        <div><label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>Interval</label>
          <select className="input-field" value={form.interval} onChange={(e) => set('interval', e.target.value)}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
        <div><label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>Display Order</label>
          <input className="input-field" type="number" min={0} value={form.displayOrder} onChange={(e) => set('displayOrder', parseInt(e.target.value) || 0)} /></div>
        <div><label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>Max Apps (999=∞)</label>
          <input className="input-field" type="number" min={1} value={form.features.maxApps} onChange={(e) => setFeat('maxApps', parseInt(e.target.value) || 1)} /></div>
        <div><label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>Max APK (MB)</label>
          <input className="input-field" type="number" min={1} value={form.features.maxApkSizeMB} onChange={(e) => setFeat('maxApkSizeMB', parseInt(e.target.value) || 50)} /></div>
        <div><label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>Queue Priority</label>
          <select className="input-field" value={form.features.queuePriority} onChange={(e) => setFeat('queuePriority', e.target.value)}><option value="normal">Normal</option><option value="high">High</option><option value="highest">Highest</option></select></div>
      </div>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>Description *</label>
        <textarea className="input-field" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Short description..." style={{ resize: 'vertical' }} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-5)', padding: 'var(--space-4)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
        {([
          { key: 'isFeaturedEligible', label: 'Featured Store' },
          { key: 'hasAnalytics', label: 'Analytics' },
          { key: 'removeSoloBadge', label: 'No Solo Badge' },
          { key: 'customPackageName', label: 'Custom Package' },
        ] as { key: keyof typeof PLAN_DEFAULTS.features; label: string }[]).map(({ key, label }) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
            <input type="checkbox" checked={!!form.features[key]} onChange={(e) => setFeat(key, e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} />
            {label}
          </label>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
          <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} />
          Active
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
          <input type="checkbox" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} />
          Default plan
        </label>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button className="btn-primary" onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || !form.slug || !form.description} style={{ flex: 1 }}>
          {mutation.isPending ? 'Creating…' : 'Create Plan'}
        </button>
        <button className="btn-ghost" onClick={() => { setOpen(false); setError(''); }}>Cancel</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────────────────────── */
export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const { data } = await api.get('/plans');
      return data.data as Plan[];
    },
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<
    (Omit<Payment, 'developer'> & { developer: { _id: string; username: string; email: string } })[]
  >({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data } = await api.get('/admin/payments');
      return data.data;
    },
  });

  const totalRevenue = payments.filter((p) => p.status === 'succeeded').reduce((s, p) => s + p.amount / 100, 0);
  const successfulPayments = payments.filter((p) => p.status === 'succeeded').length;

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ marginBottom: 'var(--space-1)' }}>Platform Settings</h1>
        <p>Control review mode, bypass flags, plan features, and billing transactions.</p>
      </div>

      {/* Platform Controls */}
      <PlatformControlsPanel />

      {/* Plan Feature Manager */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-h3)', fontWeight: 700, margin: 0 }}>Plan Feature Manager</h2>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
              Click &quot;Edit Features&quot; on any plan to change limits, features, and pricing. All changes save instantly.
            </p>
          </div>
          <CreatePlanForm onCreated={() => queryClient.invalidateQueries({ queryKey: ['admin-plans'] })} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {plans
            .slice()
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((plan) => (
              <PlanFeatureEditor
                key={plan._id}
                plan={plan}
                onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin-plans'] })}
              />
            ))}
          {plans.length === 0 && (
            <div className="glass-card-solid" style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-body-sm)' }}>
              No plans configured. Create your first plan above.
            </div>
          )}
        </div>
      </div>

      {/* Revenue summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        {[
          { label: 'Total Revenue',       value: `$${totalRevenue.toFixed(2)}`,  color: 'var(--color-primary)', icon: '💰' },
          { label: 'Successful Payments', value: successfulPayments,             color: 'var(--color-info)',    icon: '✅' },
          { label: 'Total Transactions',  value: payments.length,                color: 'var(--color-text-secondary)', icon: '🔄' },
          { label: 'Active Plans',        value: plans.filter(p => p.isActive).length, color: 'var(--color-warning)', icon: '📋' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card-solid" style={{ padding: 'var(--space-5)' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>{stat.icon}</p>
            <p style={{ fontSize: 'var(--text-h3)', fontWeight: 800, color: stat.color, margin: 0 }}>{stat.value}</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Payment Transactions */}
      <div>
        <h2 style={{ fontSize: 'var(--text-h3)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
          Payment Transactions
          <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 'var(--space-3)' }}>Last 200</span>
        </h2>
        <div className="glass-card-solid" style={{ overflow: 'hidden' }}>
          {paymentsLoading ? (
            <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading transactions…</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Developer', 'Plan', 'Amount', 'Status', 'Stripe ID', 'Date'].map((h) => (
                      <th key={h} style={{ padding: 'var(--space-4) var(--space-5)', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--text-body-sm)', color: 'var(--color-text-primary)' }}>
                          {typeof payment.developer === 'object' ? payment.developer.username : '—'}
                        </p>
                        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          {typeof payment.developer === 'object' ? payment.developer.email : ''}
                        </p>
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-5)', fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
                        {typeof payment.plan === 'object' ? payment.plan.name : '—'}
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-5)', fontSize: 'var(--text-body-sm)', fontWeight: 700, color: payment.status === 'succeeded' ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                        ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{paymentBadge(payment.status)}</td>
                      <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                        <code style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', background: 'var(--color-surface)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                          {payment.stripePaymentIntentId ? `${payment.stripePaymentIntentId.slice(0, 20)}…` : '—'}
                        </code>
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-5)', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
                          {new Date(payment.createdAt).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-body-sm)' }}>
                        No payment transactions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
