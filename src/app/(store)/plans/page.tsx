'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Plan } from '@/types/plan.types';

/* ─── helpers ─────────────────────────────────────────────────────── */

function planBullets(plan: Plan): { label: string; ok: boolean }[] {
  const f = plan.features;
  const maxApps = f.maxApps === 999 ? 'Unlimited Android apps' : `${f.maxApps} Android app${f.maxApps !== 1 ? 's' : ''}`;
  const priority =
    f.queuePriority === 'highest' ? 'Highest-priority builds' :
    f.queuePriority === 'high'    ? 'High-priority builds'    :
                                    'Standard build queue';
  return [
    { label: maxApps,                        ok: true },
    { label: `${f.maxApkSizeMB} MB APK limit`, ok: true },
    { label: 'Public store listing',         ok: true },
    { label: priority,                       ok: true },
    { label: 'Custom package name',          ok: f.customPackageName },
    { label: 'Analytics dashboard',          ok: f.hasAnalytics },
    { label: 'Remove Solo badge',            ok: f.removeSoloBadge },
    { label: 'Featured store placement',     ok: f.isFeaturedEligible },
  ];
}

function isPopular(plan: Plan, all: Plan[]): boolean {
  const sorted = [...all].sort((a, b) => a.displayOrder - b.displayOrder);
  const midIdx = Math.floor((sorted.length - 1) / 2);
  return sorted[midIdx]?._id === plan._id && plan.price > 0;
}

function planCta(plan: Plan): string {
  if (plan.price === 0) return 'Start for free';
  return `Get ${plan.name}`;
}

function planHref(plan: Plan): string {
  if (plan.price === 0) return '/register';
  return `/register?plan=${plan.slug}`;
}

const FAQS = [
  {
    q: 'Can I upgrade or downgrade my plan anytime?',
    a: "Yes. Upgrades take effect immediately and are prorated. Downgrades take effect at the end of your current billing period.",
  },
  {
    q: 'Do you offer refunds?',
    a: "We offer a 7-day money-back guarantee on your first paid subscription. Just contact us within 7 days of charging and we'll refund you, no questions asked.",
  },
  {
    q: 'What happens to my apps if I downgrade?',
    a: "Your existing apps remain published and downloadable. If you exceed the new plan's app limit, you won't be able to build new apps until you remove old ones or upgrade.",
  },
  {
    q: 'Is the Starter plan really free forever?',
    a: 'Yes. The free plan has no time limit. You can keep your apps published on the store indefinitely.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex) via Stripe. All payments are processed securely.',
  },
];

/* ─── Loading skeleton ─────────────────────────────────────────────── */
function PlanSkeleton() {
  return (
    <div style={{
      background: 'var(--color-white)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)',
    }}>
      {[60, 40, 80, 36, 120, 80, 80, 80].map((w, i) => (
        <div key={i} style={{ height: i === 0 ? 18 : i === 2 ? 40 : 14, width: `${w}%`, background: 'var(--color-border)', borderRadius: 4, marginBottom: 'var(--space-3)', opacity: 0.6 }} />
      ))}
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────────────────── */
export default function PlansPage() {
  const [yearly, setYearly] = useState(false);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['public-plans'],
    queryFn: async () => {
      const { data } = await api.get('/plans');
      return (data.data as Plan[]).sort((a, b) => a.displayOrder - b.displayOrder);
    },
  });

  return (
    <div style={{ background: 'var(--color-surface)', minHeight: '100vh' }}>
      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(180deg, var(--color-primary-50) 0%, var(--color-surface) 100%)',
          paddingTop: 'var(--space-20)',
          paddingBottom: 'var(--space-16)',
          textAlign: 'center',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="container">
          <div className="badge badge-green" style={{ display: 'inline-flex', marginBottom: 'var(--space-5)' }}>
            Transparent pricing · No hidden fees
          </div>
          <h1
            style={{
              fontSize: 'var(--text-display)',
              fontWeight: 'var(--font-weight-extrabold)',
              color: 'var(--color-text-primary)',
              lineHeight: 1.1,
              marginBottom: 'var(--space-5)',
            }}
          >
            Simple pricing that{' '}
            <span style={{ color: 'var(--color-primary)' }}>scales with you</span>
          </h1>
          <p
            style={{
              fontSize: 'var(--text-body-lg)',
              color: 'var(--color-text-secondary)',
              maxWidth: '520px',
              margin: '0 auto var(--space-10)',
            }}
          >
            Start free forever. Upgrade when you need more apps, faster builds, or featured placement.
          </p>

          {/* Monthly / Yearly toggle */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
              background: 'var(--color-white)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding: '4px',
            }}
          >
            <button
              onClick={() => setYearly(false)}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: !yearly ? 'var(--color-primary)' : 'transparent',
                color: !yearly ? 'white' : 'var(--color-text-secondary)',
                fontWeight: 600,
                fontSize: 'var(--text-body-sm)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: yearly ? 'var(--color-primary)' : 'transparent',
                color: yearly ? 'white' : 'var(--color-text-secondary)',
                fontWeight: 600,
                fontSize: 'var(--text-body-sm)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Yearly
              <span
                style={{
                  background: yearly ? 'rgba(255,255,255,0.25)' : 'var(--color-primary-100)',
                  color: yearly ? 'white' : 'var(--color-primary-dark)',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plan cards */}
      <section style={{ paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-20)' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 'var(--space-5)',
              alignItems: 'start',
            }}
          >
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <PlanSkeleton key={i} />)
              : plans.map((plan) => {
                  const popular = isPopular(plan, plans);
                  const bullets = planBullets(plan);
                  const monthlyPrice = plan.price;
                  const yearlyPrice = Math.round(plan.price * 0.8);
                  const displayPrice = plan.price === 0 ? 'Free' : `$${yearly ? yearlyPrice : monthlyPrice}`;

                  return (
                    <div
                      key={plan._id}
                      style={{
                        background: popular ? 'var(--color-primary)' : 'var(--color-white)',
                        border: popular ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-xl)',
                        padding: 'var(--space-8)',
                        position: 'relative',
                        boxShadow: popular ? '0 16px 48px rgba(21,128,61,0.30)' : 'var(--shadow-md)',
                      }}
                    >
                      {/* Most Popular badge */}
                      {popular && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '-14px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#fbbf24',
                            color: '#78350f',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 14px',
                            borderRadius: 'var(--radius-full)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Most Popular
                        </div>
                      )}

                      {/* Plan name */}
                      <p
                        style={{
                          fontSize: 'var(--text-body-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: popular ? 'rgba(255,255,255,0.8)' : 'var(--color-text-secondary)',
                          marginBottom: 'var(--space-2)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {plan.name}
                      </p>

                      {/* Price */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: 'var(--space-2)' }}>
                        <span
                          style={{
                            fontSize: '2.5rem',
                            fontWeight: 800,
                            lineHeight: 1,
                            color: popular ? 'white' : 'var(--color-text-primary)',
                          }}
                        >
                          {displayPrice}
                        </span>
                        {plan.price > 0 && (
                          <span
                            style={{
                              fontSize: 'var(--text-body-sm)',
                              color: popular ? 'rgba(255,255,255,0.6)' : 'var(--color-text-muted)',
                              paddingBottom: '6px',
                            }}
                          >
                            /mo{yearly && ' billed yearly'}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p
                        style={{
                          fontSize: 'var(--text-body-sm)',
                          color: popular ? 'rgba(255,255,255,0.75)' : 'var(--color-text-secondary)',
                          marginBottom: 'var(--space-6)',
                          lineHeight: 1.6,
                        }}
                      >
                        {plan.description}
                      </p>

                      {/* CTA */}
                      <Link
                        href={planHref(plan)}
                        style={{
                          display: 'block',
                          textAlign: 'center',
                          padding: 'var(--space-3) var(--space-4)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--text-body-sm)',
                          fontWeight: 700,
                          textDecoration: 'none',
                          marginBottom: 'var(--space-6)',
                          transition: 'all var(--transition-fast)',
                          background: popular ? 'white' : 'var(--color-primary)',
                          color: popular ? 'var(--color-primary)' : 'white',
                          boxShadow: popular ? '0 4px 12px rgba(0,0,0,0.15)' : 'var(--shadow-green)',
                        }}
                      >
                        {planCta(plan)}
                      </Link>

                      {/* Divider */}
                      <div
                        style={{
                          borderTop: popular ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--color-border)',
                          marginBottom: 'var(--space-5)',
                        }}
                      />

                      {/* Feature list */}
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {bullets.map((f) => (
                          <li
                            key={f.label}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-3)',
                              fontSize: 'var(--text-body-sm)',
                              color: f.ok
                                ? (popular ? 'rgba(255,255,255,0.9)' : 'var(--color-text-primary)')
                                : (popular ? 'rgba(255,255,255,0.35)' : 'var(--color-text-muted)'),
                            }}
                          >
                            <span
                              style={{
                                flexShrink: 0,
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 700,
                                background: f.ok
                                  ? (popular ? 'rgba(255,255,255,0.25)' : 'var(--color-primary-100)')
                                  : 'transparent',
                                color: f.ok
                                  ? (popular ? 'white' : 'var(--color-primary)')
                                  : (popular ? 'rgba(255,255,255,0.3)' : 'var(--color-text-muted)'),
                                border: !f.ok ? (popular ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--color-border)') : 'none',
                              }}
                            >
                              {f.ok ? '✓' : '×'}
                            </span>
                            {f.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
          </div>

          <p
            style={{
              textAlign: 'center',
              marginTop: 'var(--space-8)',
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-text-muted)',
            }}
          >
            All plans include unlimited APK downloads, public store listing, and SSL-secured API. No contracts.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section
        style={{
          paddingTop: 'var(--space-20)',
          paddingBottom: 'var(--space-24)',
          background: 'var(--color-white)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <div className="container" style={{ maxWidth: '720px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-12)', color: 'var(--color-text-primary)' }}>
            Billing questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {FAQS.map((faq) => (
              <div
                key={faq.q}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-6)',
                }}
              >
                <p style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)' }}>
                  {faq.q}
                </p>
                <p style={{ fontSize: 'var(--text-body-sm)', lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-12)' }}>
            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
              Still have questions?
            </p>
            <a
              href="mailto:support@solostore.app"
              style={{
                color: 'var(--color-primary)',
                fontWeight: 'var(--font-weight-semibold)',
                fontSize: 'var(--text-body-sm)',
                textDecoration: 'none',
              }}
            >
              Contact us at support@solostore.app →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
