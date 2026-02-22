'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Plan } from '@/types/plan.types';

const FEATURE_LABELS: Record<string, string> = {
  maxApps: 'Max Apps',
  maxApkSizeMB: 'Max APK (MB)',
  queuePriority: 'Queue Priority',
  isFeaturedEligible: 'Featured',
  hasAnalytics: 'Analytics',
  removeSoloBadge: 'Remove Badge',
  customPackageName: 'Custom Package',
};

export default function AdminPlansPage() {
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const { data } = await api.get('/plans');
      return data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Plan> }) =>
      api.patch(`/admin/plans/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-plans'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/plans/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-plans'] }),
  });

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ marginBottom: 'var(--space-1)' }}>Plan Management</h1>
        <p>View and manage subscription plans. Use the Stripe dashboard to update prices.</p>
      </div>

      {isLoading ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading plans...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {plans.map((plan) => (
            <div key={plan._id} className="glass-card-solid" style={{ padding: 'var(--space-6)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 'var(--space-4)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
                    <h3 style={{ margin: 0, fontSize: 'var(--text-h4)' }}>{plan.name}</h3>
                    {plan.isDefault && <span className="badge badge-blue">Default</span>}
                    <span className={`badge ${plan.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-body-sm)' }}>
                    {plan.description}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 'var(--text-h3)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
                      /{plan.interval}
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: 'var(--space-2)',
                  marginBottom: 'var(--space-5)',
                }}
              >
                {Object.entries(plan.features).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      background: 'var(--color-surface)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: '0 0 2px' }}>
                      {FEATURE_LABELS[key] ?? key}
                    </p>
                    <p style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                      {key === 'maxApps'
                        ? value === 999 ? 'Unlimited' : `${value}`
                        : key === 'maxApkSizeMB'
                        ? `${value}`
                        : typeof value === 'boolean'
                        ? value ? 'Yes' : 'No'
                        : String(value)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Stripe price ID */}
              <div
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
                  Stripe Price ID:
                </span>
                <code style={{ fontSize: 'var(--text-body-sm)', color: plan.stripePriceId ? 'var(--color-text-primary)' : 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {plan.stripePriceId ?? 'Not configured'}
                </code>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    const priceId = window.prompt('Enter Stripe Price ID (price_xxx):', plan.stripePriceId ?? '');
                    if (priceId === null) return;
                    updateMutation.mutate({ id: plan._id, payload: { stripePriceId: priceId || null } as Partial<Plan> });
                  }}
                  className="btn-ghost"
                  style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-body-sm)' }}
                >
                  Update Stripe ID
                </button>
                <button
                  onClick={() => updateMutation.mutate({ id: plan._id, payload: { isActive: !plan.isActive } as Partial<Plan> })}
                  className="btn-ghost"
                  style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-body-sm)' }}
                >
                  {plan.isActive ? 'Deactivate' : 'Activate'}
                </button>
                {!plan.isDefault && (
                  <button
                    onClick={() => {
                      if (!window.confirm(`Delete plan "${plan.name}"? This cannot be undone.`)) return;
                      deleteMutation.mutate(plan._id);
                    }}
                    className="btn-danger"
                    style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-body-sm)' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
