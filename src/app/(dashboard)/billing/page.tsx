'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { Plan } from '@/types/plan.types';

const FEATURE_LABELS: Record<string, string> = {
  maxApps: 'Max Apps',
  maxApkSizeMB: 'Max APK Size',
  queuePriority: 'Build Priority',
  isFeaturedEligible: 'Featured Store',
  hasAnalytics: 'Analytics',
  removeSoloBadge: 'Remove Solo Badge',
  customPackageName: 'Custom Package Name',
};

function formatFeatureValue(key: string, value: unknown): string {
  if (key === 'maxApps') return value === 999 ? 'Unlimited' : `${value} apps`;
  if (key === 'maxApkSizeMB') return `${value} MB`;
  if (typeof value === 'boolean') return value ? 'Included' : 'Not included';
  return String(value);
}

function CheckIcon({ checked }: { checked: boolean }) {
  if (checked) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function BillingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data } = await api.get('/plans');
      return data.data as Plan[];
    },
  });

  const { data: currentPlan } = useQuery({
    queryKey: ['current-plan', user?.currentPlan],
    queryFn: async () => {
      if (!user?.currentPlan) return null;
      // currentPlan may be a populated Plan object (from /me) or just a string ID
      const planId =
        typeof user.currentPlan === 'object'
          ? (user.currentPlan as unknown as { _id: string })._id
          : user.currentPlan;
      const { data } = await api.get(`/plans/${planId}`);
      return data.data as Plan;
    },
    enabled: !!user?.currentPlan,
  });

  const { data: testingMode } = useQuery({
    queryKey: ['testing-mode'],
    queryFn: async () => {
      const { data } = await api.get('/plans/testing-mode');
      return data.data as { bypassPayment: boolean; bypassDns: boolean };
    },
  });

  const testSubscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { data } = await api.post(`/plans/test-subscribe/${planId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['current-plan'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ marginBottom: 'var(--space-1)' }}>Plans & Billing</h1>
        <p>Manage your subscription and view available plans.</p>
      </div>

      {/* Testing-mode banner */}
      {testingMode?.bypassPayment && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1.5px solid var(--color-warning)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-body-sm)' }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>Payment bypass is active.</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>Test subscribe buttons skip Stripe and assign plans directly.</span>
        </div>
      )}

      {/* Current plan */}
      {currentPlan && (
        <div className="glass-card-solid" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-h4)' }}>Current Plan</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary-50)',
                  border: '2px solid var(--color-primary-200)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <div>
                <h4 style={{ margin: 0, color: 'var(--color-text-primary)' }}>{currentPlan.name}</h4>
                <p style={{ margin: 0, fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
                  {currentPlan.price === 0 ? 'Free forever' : `$${currentPlan.price}/${currentPlan.interval}`}
                </p>
              </div>
            </div>
            <span className="badge badge-green">Active</span>
          </div>

          {/* Current plan features */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 'var(--space-3)',
              marginTop: 'var(--space-5)',
            }}
          >
            {Object.entries(currentPlan.features).map(([key, value]) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <CheckIcon checked={typeof value === 'boolean' ? value : true} />
                <div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>{FEATURE_LABELS[key] ?? key}</p>
                  <p style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                    {formatFeatureValue(key, value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available plans */}
      <div>
        <h3 style={{ marginBottom: 'var(--space-5)', fontSize: 'var(--text-h4)' }}>Available Plans</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-5)',
          }}
        >
          {plans.map((plan) => {
            const isCurrent = plan._id === user?.currentPlan || plan.slug === currentPlan?.slug;
            return (
              <div
                key={plan._id}
                className="glass-card-solid"
                style={{
                  padding: 'var(--space-6)',
                  border: isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  position: 'relative',
                }}
              >
                {isCurrent && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <span className="badge badge-green">Current Plan</span>
                  </div>
                )}
                <h4 style={{ margin: '0 0 var(--space-1)', color: 'var(--color-text-primary)' }}>{plan.name}</h4>
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <span style={{ fontSize: 'var(--text-h2)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>/{plan.interval}</span>
                  )}
                </div>
                <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)', margin: '0 0 var(--space-5)' }}>
                  {plan.description}
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
                  {[
                    `${plan.features.maxApps === 999 ? 'Unlimited' : plan.features.maxApps} apps`,
                    `${plan.features.maxApkSizeMB} MB max APK`,
                    `${plan.features.queuePriority} priority`,
                    ...(plan.features.hasAnalytics ? ['Analytics'] : []),
                    ...(plan.features.isFeaturedEligible ? ['Featured store'] : []),
                    ...(plan.features.removeSoloBadge ? ['No Solo badge'] : []),
                    ...(plan.features.customPackageName ? ['Custom package name'] : []),
                  ].map((feat) => (
                    <li key={feat} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>{feat}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <button disabled className="btn-ghost" style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }}>
                    Current Plan
                  </button>
                ) : testingMode?.bypassPayment && plan.price > 0 ? (
                  <button
                    className="btn-primary"
                    style={{ width: '100%', background: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}
                    onClick={() => testSubscribeMutation.mutate(plan._id)}
                    disabled={testSubscribeMutation.isPending}
                  >
                    {testSubscribeMutation.isPending ? 'Subscribing…' : `[TEST] Subscribe to ${plan.name}`}
                  </button>
                ) : plan.stripePriceId ? (
                  <button className="btn-primary" style={{ width: '100%' }}>
                    Upgrade to {plan.name}
                  </button>
                ) : (
                  <button disabled className="btn-ghost" style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }}>
                    Coming Soon
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info about Stripe */}
      <div
        style={{
          marginTop: 'var(--space-8)',
          padding: 'var(--space-4)',
          background: 'var(--color-info-light)',
          border: '1px solid var(--color-info)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          gap: 'var(--space-3)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-info)', margin: 0 }}>
          Paid plan upgrades require Stripe to be configured. Contact{' '}
          <Link href="mailto:support@solostore.app" style={{ color: 'var(--color-info)', fontWeight: 600 }}>
            support@solostore.app
          </Link>{' '}
          for enterprise pricing.
        </p>
      </div>
    </div>
  );
}
