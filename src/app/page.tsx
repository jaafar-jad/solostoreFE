'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import api from '@/lib/api';
import type { Plan } from '@/types/plan.types';

/* ─── Static data ────────────────────────────────────────────────────────── */

const STEPS = [
  {
    num: '01',
    icon: '🌐',
    title: 'Enter Your Website URL',
    desc: 'Paste any live HTTPS website. Works with React, Vue, Next.js, WordPress, Shopify, Webflow, Wix — any responsive stack.',
    detail: 'Your site runs inside a Chrome-based TWA shell. No code changes, no SDK setup.',
  },
  {
    num: '02',
    icon: '🛡️',
    title: 'Verify Domain Ownership',
    desc: 'Add a DNS TXT record or upload a small verification file to your server.',
    detail: 'Verification takes under 60 seconds. It permanently links your domain to your app, blocking impersonation.',
  },
  {
    num: '03',
    icon: '🎨',
    title: 'Customize Your Brand',
    desc: "Upload your app icon, set your app name, accent colors, splash screen, and orientation preference.",
    detail: 'Your icon, name, and colors are baked into the APK. Users install your branded app — not a Solo Store wrapper.',
  },
  {
    num: '04',
    icon: '⚡',
    title: 'Watch It Build Live',
    desc: 'Our TWA engine compiles, signs, and packages your APK. Track every stage live via real-time WebSocket.',
    detail: 'Prepare → Install deps → Compile → Generate manifest → Sign → Upload. You watch it happen.',
  },
  {
    num: '05',
    icon: '📲',
    title: 'Download & Publish',
    desc: 'Download your signed APK from CloudFront CDN and list it instantly on the Solo Store marketplace.',
    detail: 'Your APK URL is permanent. Push a website update — no rebuild needed. Your users always get the latest version.',
  },
];

const FEATURES = [
  {
    icon: '🛡️', color: '#15803d', bg: '#f0fdf4',
    title: 'Domain Verification',
    desc: 'Every build requires proven domain ownership via DNS TXT record or file challenge. No squatting, no impersonation — every app is genuine.',
    tags: ['DNS TXT', 'File Upload', 'Instant check'],
  },
  {
    icon: '⚡', color: '#0284c7', bg: '#f0f9ff',
    title: 'Real-time Build Pipeline',
    desc: 'Watch your APK compile live via WebSocket. See every stage — Queued → Building → Signing → Uploading — play out in your browser.',
    tags: ['WebSocket', 'Live logs', 'Progress bar'],
  },
  {
    icon: '🏪', color: '#7c3aed', bg: '#faf5ff',
    title: 'Built-in Marketplace',
    desc: 'Every published app gets a public store listing. Users browse by category, search by keyword, and download directly — no external platform needed.',
    tags: ['Public listing', 'Categories', 'Direct download'],
  },
  {
    icon: '📦', color: '#ea580c', bg: '#fff7ed',
    title: 'CloudFront CDN Delivery',
    desc: 'Signed APKs are stored on AWS S3 and served via CloudFront. Fast, globally-distributed downloads with a permanent URL.',
    tags: ['AWS S3', 'CloudFront', 'Permanent URLs'],
  },
  {
    icon: '📊', color: '#d97706', bg: '#fffbeb',
    title: 'Developer Analytics',
    desc: 'Track downloads over time, monitor store ratings, read user reviews, and see which versions are most popular across your portfolio.',
    tags: ['Download trends', 'Ratings', 'Version tracking'],
  },
  {
    icon: '🔔', color: '#db2777', bg: '#fdf4ff',
    title: 'Push Notifications',
    desc: 'Native browser push and background web-push built into the platform. Notify users of builds, reviews, and account events — even with the browser closed.',
    tags: ['Web Push', 'Service Worker', 'VAPID'],
  },
  {
    icon: '✨', color: '#6366f1', bg: '#eef2ff',
    title: 'Featured Store Placement',
    desc: 'Pro and Enterprise apps get prominent banner placement on the store homepage, visible to every visitor browsing the marketplace.',
    tags: ['Homepage feature', 'More downloads', 'Auto-unlocked'],
  },
  {
    icon: '🔐', color: '#0891b2', bg: '#ecfeff',
    title: 'Keystore Signing',
    desc: 'Every APK is signed with a production keystore — no debug builds, no unverified installers. Ready for sideloading or any third-party store.',
    tags: ['Release signed', 'Production-ready', 'Android 5.0+'],
  },
];

const STATS = [
  { value: '2,400+', label: 'Apps Published', icon: '📱' },
  { value: '180K+',  label: 'APKs Downloaded', icon: '📦' },
  { value: '65+',    label: 'Countries Reached', icon: '🌍' },
  { value: '< 10',   label: 'Minutes to First App', icon: '⚡' },
];

const TECH_STACKS = [
  { name: 'WordPress',  bg: '#21759b22', color: '#21759b' },
  { name: 'Shopify',    bg: '#96bf4822', color: '#5a8a28' },
  { name: 'Next.js',    bg: '#00000014', color: '#333' },
  { name: 'Nuxt',       bg: '#00dc8222', color: '#00814f' },
  { name: 'Webflow',    bg: '#4353ff22', color: '#2c3ecc' },
  { name: 'React',      bg: '#61dafb22', color: '#0284a7' },
  { name: 'Vue',        bg: '#42b88322', color: '#2d7f5e' },
  { name: 'Wix',        bg: '#faad0022', color: '#a07000' },
  { name: 'Squarespace',bg: '#00000014', color: '#555' },
  { name: 'Ghost',      bg: '#738a9422', color: '#3a4a52' },
  { name: 'Framer',     bg: '#0055ff22', color: '#0044cc' },
  { name: 'Gatsby',     bg: '#66339922', color: '#4a2270' },
];

const PERSONAS = [
  {
    icon: '👨‍💻',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    title: 'Freelancers & Agencies',
    subtitle: 'Package it as a service',
    desc: 'Add "Android app from your website" to your service list. Charge your client $500–$2,000. Your Solo Store cost? A fraction. The fastest upsell in web development.',
    bullets: ['Bill it as a standalone deliverable', 'White-label ready on Enterprise', 'Manage multiple client apps'],
  },
  {
    icon: '🚀',
    bg: '#f0f9ff',
    border: '#bae6fd',
    title: 'Solopreneurs & Startups',
    subtitle: 'Ship your Android MVP now',
    desc: "Skip the Google Play $25 fee and 3-day review. Get your app on Android instantly. Share a direct APK download link to your customers and iterate without gatekeepers.",
    bullets: ['No app store submission fees', 'Instant distribution', 'Update by updating your website'],
  },
  {
    icon: '🏢',
    bg: '#faf5ff',
    border: '#e9d5ff',
    title: 'Enterprise Teams',
    subtitle: 'Scale across your portfolio',
    desc: 'Multiple apps, priority build queues, dedicated analytics, custom package names, and a featured store presence. One platform for your entire Android presence.',
    bullets: ['Unlimited apps', 'Highest-priority builds', 'Full analytics + reviews'],
  },
];

const TESTIMONIALS = [
  {
    quote: "Turned my Shopify store into an Android app in under 8 minutes. My customers download it directly from the Solo Store — no Play Store review, no $25 fee. Should have done this years ago.",
    name: 'Sarah K.',
    role: 'E-commerce Founder',
    avatar: 'SK',
    bg: '#f0fdf4',
    color: '#15803d',
  },
  {
    quote: "I offer web-to-app conversion as an add-on service now. Solo Store does the heavy lifting, I charge my clients $800 a pop, and they're blown away. It's my best margin service by far.",
    name: 'Marcus T.',
    role: 'Web Agency Owner',
    avatar: 'MT',
    bg: '#eff6ff',
    color: '#2563eb',
  },
  {
    quote: "The real-time build progress was what sold me. Watching my domain get verified, the APK compile stage by stage — it's like magic. And the result is indistinguishable from a native app.",
    name: 'Priya D.',
    role: 'Indie Developer',
    avatar: 'PD',
    bg: '#faf5ff',
    color: '#7c3aed',
  },
];

const COMPARISON_ROWS = [
  { label: 'Time to first app',  old: '6 – 18 months',   solo: '< 10 minutes' },
  { label: 'Cost to get started', old: '$50,000+',        solo: 'Plans from $0/mo' },
  { label: 'Skills required',    old: 'Java / Kotlin',   solo: 'None — just your website' },
  { label: 'Distribution',       old: 'Google Play only', solo: 'Instant + marketplace' },
  { label: 'Pushing updates',    old: 'Full rebuild cycle', solo: 'Update your website' },
  { label: 'Domain security',    old: 'Not verified',    solo: 'DNS-verified ✓' },
  { label: 'Build visibility',   old: 'CI/CD blind',     solo: 'Live progress via WebSocket' },
  { label: 'Analytics',          old: 'Google Play only', solo: 'Built-in dashboard' },
];

const FAQS = [
  {
    q: 'What is a TWA and will it feel like a real app?',
    a: "A Trusted Web Activity (TWA) is Google's official standard for packaging a verified website as a native Android app. It runs your site inside a full-screen Chrome engine — no browser address bar, no chrome UI, full hardware access including camera, microphone, GPS, and Bluetooth. Users can't tell it from a native app.",
  },
  {
    q: 'What do I need before I can convert my site?',
    a: 'Your site must be live on HTTPS and mobile-responsive. You need to own the domain (proven via a DNS TXT record or a small verification file you upload). That\'s it — no code changes to your website, no server modifications, no SDK to install.',
  },
  {
    q: 'Is the APK safe to install? Will Android flag it?',
    a: 'Every APK is signed with our production release keystore — not a debug certificate. It installs cleanly on any Android 5.0+ device. There are no "Unknown Sources" warnings beyond what Android shows for any sideloaded app. It\'s identical in quality to an app you\'d publish on Google Play.',
  },
  {
    q: 'How long does a build actually take?',
    a: 'Starter builds typically take 2–5 minutes. Pro and Enterprise builds are queue-prioritized and usually complete in under 2 minutes even during peak load. You watch the exact progress live — no polling, no refresh. When the APK is ready, you get a notification and a download link.',
  },
  {
    q: 'What happens when I update my website?',
    a: "Nothing — and that's the point. Your app always loads your live website. When you push a site update, every user on every installed version sees the new content automatically on next open. For structure changes (name, icon, package ID), you trigger a new build. The APK URL stays the same, so existing download links still work.",
  },
  {
    q: 'Can I publish on Google Play or other stores?',
    a: 'Yes. The APK we produce is a fully signed, production-ready Android package. You can submit it to Google Play, Amazon Appstore, Samsung Galaxy Store, APKPure, or distribute it any other way you want. The Solo Store marketplace is an additional channel, not a restriction.',
  },
  {
    q: 'What is the difference between the "auto" and "manual" review modes?',
    a: 'Platform admins can switch between two modes. In auto mode, your submitted app is published instantly — no wait. In manual review mode, a human reviews the app before it goes live (usually within 24 hours). Either way, you\'re notified the moment the status changes.',
  },
  {
    q: 'What are push notifications for?',
    a: "Solo Store has two layers of push. In-app: you see real-time updates for build status, app approvals, and reviews while you're using the dashboard. Background push: even with the browser closed, you get OS-level native notifications powered by Web Push API + VAPID. Enable it with one click from the notification bell.",
  },
];

/* ─── plan helpers ───────────────────────────────────────────────────────── */
function planBullets(plan: Plan): Array<{ text: string; ok: boolean }> {
  const f = plan.features;
  return [
    { text: f.maxApps === 999 ? 'Unlimited Android apps' : `${f.maxApps} Android app${f.maxApps !== 1 ? 's' : ''}`, ok: true },
    { text: `${f.maxApkSizeMB} MB APK limit`, ok: true },
    { text: 'Public store listing', ok: true },
    { text: f.queuePriority === 'highest' ? 'Highest-priority builds' : f.queuePriority === 'high' ? 'High-priority builds' : 'Standard build queue', ok: true },
    { text: 'Custom package name', ok: !!f.customPackageName },
    { text: 'Analytics dashboard', ok: !!f.hasAnalytics },
    { text: 'Featured store placement', ok: !!f.isFeaturedEligible },
    { text: 'Remove Solo badge', ok: !!f.removeSoloBadge },
  ];
}
function isPopularPlan(plan: Plan, all: Plan[]): boolean {
  const sorted = [...all].sort((a, b) => a.displayOrder - b.displayOrder);
  const midIdx = Math.floor((sorted.length - 1) / 2);
  return sorted[midIdx]?._id === plan._id && plan.price > 0;
}

/* ─── Phone Mockup ───────────────────────────────────────────────────────── */
function PhoneMockup() {
  const apps = [
    { emoji: '📰', name: 'NewsFlash Daily', cat: 'News', rating: '4.9', dl: '24K', bg: '#f0fdf4', color: '#15803d' },
    { emoji: '🏋️', name: 'FitTrack Pro', cat: 'Health', rating: '4.7', dl: '18K', bg: '#eff6ff', color: '#2563eb' },
    { emoji: '🍕', name: 'FoodieHub', cat: 'Food', rating: '4.8', dl: '31K', bg: '#fff7ed', color: '#ea580c' },
  ];

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* Glow */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: '-60px', background: 'radial-gradient(ellipse at center, rgba(21,128,61,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Phone frame */}
      <div style={{ width: '270px', height: '540px', background: '#0a0f1a', borderRadius: '44px', border: '8px solid #1e293b', overflow: 'hidden', position: 'relative', boxShadow: '0 48px 100px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
        {/* Notch */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '88px', height: '24px', background: '#0a0f1a', borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px', zIndex: 10 }} />

        {/* Status bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 22px 0', height: '32px' }}>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px', fontWeight: 700 }}>9:41</span>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <svg width="12" height="10" viewBox="0 0 12 10" fill="rgba(255,255,255,0.7)"><rect x="0" y="4" width="2" height="6"/><rect x="3" y="2" width="2" height="8"/><rect x="6" y="0" width="2" height="10"/><rect x="9" y="0" width="2" height="10" opacity="0.3"/></svg>
            <svg width="12" height="8" viewBox="0 0 12 8" fill="rgba(255,255,255,0.7)"><path d="M6 2C3.5 2 1.3 3.1 0 4.8L1.5 6.3C2.5 5 4.2 4 6 4s3.5 1 4.5 2.3L12 4.8C10.7 3.1 8.5 2 6 2z"/><circle cx="6" cy="7" r="1"/></svg>
            <svg width="20" height="10" viewBox="0 0 20 10" fill="none"><rect x="0.5" y="0.5" width="17" height="9" rx="2.5" stroke="rgba(255,255,255,0.5)"/><rect x="2" y="2" width="12" height="6" rx="1.5" fill="rgba(255,255,255,0.8)"/><path d="M18.5 3.5v3a1.5 1.5 0 0 0 0-3z" fill="rgba(255,255,255,0.4)"/></svg>
          </div>
        </div>

        {/* App bar */}
        <div style={{ background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', background: 'rgba(255,255,255,0.2)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '14px' }}>S</div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '13px', lineHeight: 1 }}>Solo Store</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '9px', marginTop: '1px' }}>App Marketplace</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 12px 6px' }}>
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '999px', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '7px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>Search 2,400+ apps…</span>
          </div>
        </div>

        {/* Featured banner */}
        <div style={{ padding: '4px 12px' }}>
          <div style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)', borderRadius: '14px', padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '70px', height: '70px', background: 'rgba(255,255,255,0.07)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-20px', right: '20px', width: '50px', height: '50px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
            <div style={{ display: 'inline-block', background: 'rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: '8px', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', marginBottom: '5px', letterSpacing: '0.5px' }}>✦ FEATURED</div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '13px', lineHeight: 1.2 }}>ShopEase Store</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '9px', marginTop: '2px' }}>E-Commerce · ★ 4.9 · 31K downloads</div>
            <div style={{ marginTop: '9px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', fontSize: '10px', fontWeight: 700, padding: '4px 12px', borderRadius: '999px' }}>
              <span>↓</span> Get App
            </div>
          </div>
        </div>

        {/* Section label */}
        <div style={{ padding: '10px 14px 6px' }}>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Top Downloads This Week</div>
        </div>

        {/* App list */}
        <div style={{ padding: '0 12px' }}>
          {apps.map((app, i) => (
            <div key={app.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: i < apps.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', marginBottom: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: app.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{app.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '9px', marginTop: '1px' }}>{app.cat} · ★ {app.rating} · {app.dl}</div>
              </div>
              <div style={{ background: '#15803d', color: 'white', fontSize: '9px', fontWeight: 800, padding: '4px 11px', borderRadius: '999px', flexShrink: 0, letterSpacing: '0.3px' }}>GET</div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating badges */}
      <div style={{ position: 'absolute', top: '55px', left: '-95px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.13)', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#15803d' }}>
          <span style={{ fontSize: '13px' }}>✓</span> Domain Verified
        </div>
        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>yoursite.com · TXT record ✓</div>
      </div>

      <div style={{ position: 'absolute', bottom: '130px', right: '-105px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.13)', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#15803d' }}>
          <span style={{ fontSize: '13px' }}>⚡</span> Build complete
        </div>
        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>APK ready in 2m 14s · 4.2 MB</div>
      </div>

      <div style={{ position: 'absolute', top: '210px', left: '-110px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.13)', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#7c3aed' }}>
          <span style={{ fontSize: '13px' }}>📲</span> New download
        </div>
        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>YourApp · Berlin, Germany</div>
      </div>
    </div>
  );
}

/* ─── FAQ accordion item ─────────────────────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'box-shadow var(--transition-fast)',
        boxShadow: open ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          padding: 'var(--space-5) var(--space-6)',
          background: open ? 'var(--color-primary-50)' : 'var(--color-white)',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background var(--transition-fast)',
        }}
      >
        <span style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
          {q}
        </span>
        <span
          style={{
            flexShrink: 0,
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-full)',
            background: open ? 'var(--color-primary)' : 'var(--color-surface)',
            color: open ? 'white' : 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 400,
            lineHeight: 1,
            transition: 'all var(--transition-fast)',
            transform: open ? 'rotate(45deg)' : 'none',
          }}
        >
          +
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: '0 var(--space-6) var(--space-5)',
            background: 'var(--color-primary-50)',
            borderTop: '1px solid var(--color-primary-100)',
          }}
        >
          <p style={{ fontSize: 'var(--text-body-sm)', lineHeight: 1.8, color: 'var(--color-text-secondary)', margin: 'var(--space-4) 0 0' }}>
            {a}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Build progress showcase ────────────────────────────────────────────── */
function BuildShowcase() {
  const stages = [
    { label: 'Prepare environment', pct: 12, done: true, icon: '🔧' },
    { label: 'Install dependencies', pct: 30, done: true, icon: '📦' },
    { label: 'Compile & bundle assets', pct: 52, done: true, icon: '⚙️' },
    { label: 'Generate TWA manifest', pct: 65, done: true, icon: '📋' },
    { label: 'Sign APK with keystore', pct: 80, done: false, icon: '🔏', active: true },
    { label: 'Upload to CDN', pct: 100, done: false, icon: '☁️' },
  ];

  return (
    <div
      style={{
        background: '#0a0f1a',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
      }}
    >
      {/* Terminal header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-5)' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ marginLeft: 'var(--space-3)', fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>Solo Store — Build #4821</span>
        <span style={{ marginLeft: 'auto', fontSize: '10px', background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>● LIVE</span>
      </div>

      {/* Overall bar */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>Overall progress</span>
          <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 700, fontFamily: 'monospace' }}>75%</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '75%', background: 'linear-gradient(90deg, #15803d, #22c55e)', borderRadius: '999px', boxShadow: '0 0 12px rgba(34,197,94,0.5)' }} />
        </div>
      </div>

      {/* Stage list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {stages.map((stage) => (
          <div
            key={stage.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '8px',
              background: stage.active ? 'rgba(21,128,61,0.15)' : 'transparent',
              border: stage.active ? '1px solid rgba(21,128,61,0.25)' : '1px solid transparent',
            }}
          >
            <span style={{ fontSize: '14px', flexShrink: 0 }}>{stage.icon}</span>
            <span style={{ flex: 1, fontSize: '11px', fontFamily: 'monospace', color: stage.done ? 'rgba(255,255,255,0.5)' : stage.active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)' }}>
              {stage.label}
            </span>
            {stage.done && <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 700 }}>✓</span>}
            {stage.active && (
              <span style={{ fontSize: '9px', background: '#15803d', color: 'white', padding: '2px 8px', borderRadius: '999px', fontWeight: 700, animation: 'pulse 2s infinite' }}>
                RUNNING
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Log tail */}
      <div style={{ marginTop: 'var(--space-4)', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#22c55e', lineHeight: 1.8 }}>
          <div>[04/04] Signing APK with release keystore...</div>
          <div style={{ color: 'rgba(255,255,255,0.4)' }}>Keystore: /etc/solostore/release.keystore</div>
          <div style={{ color: 'rgba(255,255,255,0.3)' }}>jarsigner: done</div>
          <div style={{ color: '#f59e0b' }}>⏳ zipalign in progress...</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [urlValue, setUrlValue] = useState('');

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ['public-plans'],
    queryFn: async () => {
      const { data } = await api.get('/plans');
      return (data.data as Plan[]).sort((a, b) => a.displayOrder - b.displayOrder);
    },
  });

  const starterPlan = plans.find((p) => p.price === 0);
  const starterApps = starterPlan?.features.maxApps ?? 1;
  const freeAppsText = starterApps === 1 ? '1 app free forever' : `${starterApps} apps free forever`;

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = urlValue.trim();
    if (!url) return;
    router.push(`/register?url=${encodeURIComponent(url)}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-white)' }}>
      <style>{`
        /* ── Landing page responsive ─────────────────────────── */

        /* Tablet ≤ 960px */
        @media (max-width: 960px) {
          .lp-hero-row    { flex-direction: column !important; gap: 40px !important; }
          .lp-hero-text   { max-width: 100% !important; }
          .lp-hero-visual { padding-right: 0 !important; }
          .lp-build-grid  { grid-template-columns: 1fr !important; gap: 40px !important; }
          .lp-stats-grid  { grid-template-columns: 1fr 1fr !important; gap: 20px !important; }
        }

        /* Mobile ≤ 700px */
        @media (max-width: 700px) {
          /* Hero */
          .lp-hero-row    { text-align: center !important; }
          .lp-hero-h1     { font-size: 2rem !important; }
          .lp-hero-visual { display: none !important; }
          .lp-hero-text .lp-url-form { max-width: 100% !important; }
          .lp-trust-row   { justify-content: center !important; }

          /* Comparison — horizontal scroll */
          .lp-compare-outer { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .lp-compare-inner { min-width: 540px !important; border-radius: 0 !important; }

          /* Scroll-snap card rows */
          .lp-hscroll {
            display: flex !important;
            overflow-x: auto !important;
            gap: 14px !important;
            padding-bottom: 16px !important;
            padding-left: 4px !important;
            padding-right: 16px !important;
            scroll-snap-type: x mandatory !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .lp-hscroll::-webkit-scrollbar { display: none !important; }
          .lp-hscroll > * {
            flex-shrink: 0 !important;
            width: 278px !important;
            min-width: 278px !important;
            transform: none !important;
            scroll-snap-align: start !important;
          }
          /* Wider plan cards */
          .lp-plans > * { width: 300px !important; min-width: 300px !important; }

          /* Narrower step cards (they have arrow overlays) */
          .lp-steps > * { width: 256px !important; min-width: 256px !important; }

          /* CTA buttons stack */
          .lp-cta-btns { flex-direction: column !important; align-items: center !important; }
          .lp-cta-btns > * { width: 100% !important; max-width: 340px !important; justify-content: center !important; }

          /* Misc section padding */
          .lp-section-pad { padding-left: 16px !important; padding-right: 16px !important; }
        }

        /* Very small phones */
        @media (max-width: 420px) {
          .lp-stats-grid { grid-template-columns: 1fr 1fr !important; gap: 14px !important; }
          .lp-hscroll > * { width: 252px !important; min-width: 252px !important; }
          .lp-plans > *  { width: 270px !important; min-width: 270px !important; }
        }
      `}</style>
      <Navbar />

      {/* ══════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--color-white)',
          paddingTop: 'clamp(64px, 10vw, 112px)',
          paddingBottom: 'clamp(64px, 10vw, 112px)',
        }}
      >
        {/* Background grid */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%2315803d' fill-opacity='0.035'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")", pointerEvents: 'none' }} />
        <div aria-hidden="true" style={{ position: 'absolute', top: '-120px', right: '-120px', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,128,61,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div aria-hidden="true" style={{ position: 'absolute', bottom: '-80px', left: '-100px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,128,61,0.04) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div className="container lp-hero-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-16)', position: 'relative' }}>
          {/* Left */}
          <div className="lp-hero-text" style={{ flex: 1, maxWidth: '600px' }}>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-100)', color: 'var(--color-primary-dark)', fontSize: 'var(--text-xs)', fontWeight: 700, padding: '6px 14px', borderRadius: 'var(--radius-full)', marginBottom: 'var(--space-6)', letterSpacing: '0.3px' }}>
              <span>🚀</span>
              Trusted by 2,400+ developers · No code required
            </div>

            {/* Headline */}
            <h1 className="lp-hero-h1" style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.75rem)', fontWeight: 900, lineHeight: 1.06, letterSpacing: '-0.025em', color: 'var(--color-text-primary)', marginBottom: 'var(--space-5)' }}>
              Turn any website into a{' '}
              <span style={{ background: 'linear-gradient(135deg, #15803d 0%, #16a34a 40%, #0d9488 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                native Android app
              </span>
            </h1>

            <p style={{ fontSize: 'var(--text-body-lg)', color: 'var(--color-text-secondary)', lineHeight: 1.75, marginBottom: 'var(--space-8)', maxWidth: '520px' }}>
              Verify your domain, customize your brand, and Solo Store builds, signs, and publishes a
              production-ready APK — directly to our marketplace.{' '}
              <strong style={{ color: 'var(--color-text-primary)' }}>Zero code. Zero Android knowledge.</strong>
            </p>

            {/* URL input demo */}
            <form
              onSubmit={handleUrlSubmit}
              style={{ marginBottom: 'var(--space-8)' }}
            >
              <div
                style={{
                  display: 'flex',
                  background: 'var(--color-white)',
                  border: '2px solid var(--color-border)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                  transition: 'border-color var(--transition-fast)',
                  maxWidth: '520px',
                }}
                onFocus={() => {}}
              >
                <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 'var(--space-5)', color: 'var(--color-text-muted)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                </div>
                <input
                  ref={urlInputRef}
                  type="url"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    padding: 'var(--space-4) var(--space-3)',
                    fontSize: 'var(--text-body)',
                    color: 'var(--color-text-primary)',
                    background: 'transparent',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    margin: '4px',
                    padding: 'var(--space-3) var(--space-6)',
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-body-sm)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'background var(--transition-fast)',
                  }}
                >
                  Convert →
                </button>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)', paddingLeft: 'var(--space-5)' }}>
                Paste your site URL and we'll walk you through the rest.
              </p>
            </form>

            {/* Trust row */}
            <div className="lp-trust-row" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
              {[
                { icon: '✓', text: 'No credit card required' },
                { icon: '✓', text: 'Free plan forever' },
                { icon: '✓', text: freeAppsText },
              ].map((t) => (
                <span key={t.text} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{t.icon}</span>
                  {t.text}
                </span>
              ))}
            </div>
          </div>

          {/* Right — phone mockup */}
          <div className="lp-hero-visual" style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', paddingRight: 'var(--space-16)' }}>
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TECH STACK LOGOS
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-8) 0', background: 'var(--color-surface)' }}>
        <div className="container">
          <p style={{ textAlign: 'center', fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase', marginBottom: 'var(--space-6)' }}>
            Works with any website tech stack
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', justifyContent: 'center' }}>
            {TECH_STACKS.map((tech) => (
              <span
                key={tech.name}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  background: tech.bg,
                  color: tech.color,
                  fontSize: 'var(--text-body-sm)',
                  fontWeight: 700,
                  border: '1px solid ' + tech.color + '33',
                  letterSpacing: '0.2px',
                }}
              >
                {tech.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--color-primary)', padding: 'var(--space-10) 0' }}>
        <div className="container lp-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-8)' }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-1)' }}>{s.icon}</div>
              <div style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 'var(--text-body-sm)', color: 'rgba(255,255,255,0.6)', marginTop: '4px', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          THE OLD WAY vs SOLO STORE
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(64px, 8vw, 112px) 0', background: 'var(--color-white)' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-14)' }}>
            <div className="badge badge-green" style={{ display: 'inline-flex', marginBottom: 'var(--space-4)' }}>Why Solo Store</div>
            <h2 style={{ fontSize: 'var(--text-h1)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)' }}>
              Native app development is broken
            </h2>
            <p style={{ fontSize: 'var(--text-body-lg)', color: 'var(--color-text-secondary)', maxWidth: '520px', margin: '0 auto' }}>
              Six months of Kotlin and $50,000 to ship an app that's just your website with a toolbar. Solo Store collapses that to under 10 minutes — starting with a free plan.
            </p>
          </div>

          {/* Comparison table */}
          <div className="lp-compare-outer" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
          <div className="lp-compare-inner" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ padding: 'var(--space-4) var(--space-6)', fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}></div>
              <div style={{ padding: 'var(--space-4) var(--space-6)', fontSize: 'var(--text-body-sm)', fontWeight: 700, color: '#dc2626', textAlign: 'center', borderLeft: '1px solid var(--color-border)' }}>
                Traditional Native Dev
              </div>
              <div style={{ padding: 'var(--space-4) var(--space-6)', fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--color-primary)', textAlign: 'center', borderLeft: '1px solid var(--color-border)', background: 'var(--color-primary-50)' }}>
                ✦ Solo Store
              </div>
            </div>

            {COMPARISON_ROWS.map((row, i) => (
              <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: i < COMPARISON_ROWS.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <div style={{ padding: 'var(--space-4) var(--space-6)', fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  {row.label}
                </div>
                <div style={{ padding: 'var(--space-4) var(--space-6)', fontSize: 'var(--text-body-sm)', color: '#dc2626', textAlign: 'center', borderLeft: '1px solid var(--color-border)', fontWeight: 500, background: i % 2 === 0 ? 'transparent' : 'var(--color-surface)' }}>
                  ✗ {row.old}
                </div>
                <div style={{ padding: 'var(--space-4) var(--space-6)', fontSize: 'var(--text-body-sm)', color: '#15803d', textAlign: 'center', borderLeft: '1px solid var(--color-border)', fontWeight: 600, background: i % 2 === 0 ? 'var(--color-primary-50)' : 'rgba(21,128,61,0.04)' }}>
                  ✓ {row.solo}
                </div>
              </div>
            ))}
          </div>{/* /lp-compare-inner */}
          </div>{/* /lp-compare-outer */}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(64px, 8vw, 112px) 0', background: 'var(--color-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-16)' }}>
            <div className="badge badge-green" style={{ display: 'inline-flex', marginBottom: 'var(--space-4)' }}>The Process</div>
            <h2 style={{ fontSize: 'var(--text-h1)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)' }}>
              From URL to APK in five steps
            </h2>
            <p style={{ fontSize: 'var(--text-body-lg)', color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
              The entire pipeline runs on our infrastructure. You configure, we build, you download.
            </p>
          </div>

          <div className="lp-hscroll lp-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-5)', position: 'relative' }}>
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                style={{ background: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', position: 'relative', boxShadow: 'var(--shadow-sm)', transition: 'all var(--transition-normal)' }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.10)'; el.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = 'var(--shadow-sm)'; el.style.transform = 'none'; }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: 'white', fontSize: '12px', fontWeight: 800, marginBottom: 'var(--space-4)', letterSpacing: '0.5px' }}>
                  {step.num}
                </div>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>{step.icon}</div>
                <h3 style={{ fontSize: 'var(--text-body)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>{step.title}</h3>
                <p style={{ fontSize: 'var(--text-body-sm)', lineHeight: 1.7, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>{step.desc}</p>
                <p style={{ fontSize: 'var(--text-xs)', lineHeight: 1.6, color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>{step.detail}</p>

                {i < STEPS.length - 1 && (
                  <div aria-hidden="true" style={{ position: 'absolute', top: '28px', right: '-16px', fontSize: '16px', color: 'var(--color-primary)', fontWeight: 700, zIndex: 1 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          BUILD PROGRESS SHOWCASE
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(64px, 8vw, 112px) 0', background: 'var(--color-white)' }}>
        <div className="container lp-build-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-16)', alignItems: 'center' }}>
          {/* Text */}
          <div>
            <div className="badge badge-green" style={{ display: 'inline-flex', marginBottom: 'var(--space-4)' }}>Live Build Progress</div>
            <h2 style={{ fontSize: 'var(--text-h1)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-5)' }}>
              Watch your APK build in real time
            </h2>
            <p style={{ fontSize: 'var(--text-body-lg)', color: 'var(--color-text-secondary)', lineHeight: 1.75, marginBottom: 'var(--space-6)' }}>
              No blind CI/CD pipelines. No polling for status. Every stage of the build streams live to your browser via WebSocket — from dependency installation to APK signing.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {[
                { icon: '🔌', title: 'WebSocket-powered', desc: 'No polling. Instant updates pushed from the build server.' },
                { icon: '📋', title: 'Full build logs', desc: 'Every command, every output line — complete transparency.' },
                { icon: '⚡', title: 'Queue position', desc: 'See exactly where you are in the build queue and estimated completion.' },
              ].map((item) => (
                <div key={item.title} style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>{item.icon}</div>
                  <div>
                    <p style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 2px' }}>{item.title}</p>
                    <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Mockup */}
          <BuildShowcase />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(64px, 8vw, 112px) 0', background: 'var(--color-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-16)' }}>
            <div className="badge badge-green" style={{ display: 'inline-flex', marginBottom: 'var(--space-4)' }}>Platform Features</div>
            <h2 style={{ fontSize: 'var(--text-h1)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)' }}>
              Everything you need. Nothing you don't.
            </h2>
            <p style={{ fontSize: 'var(--text-body-lg)', color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
              Verification, building, signing, hosting, distribution, and analytics — all in one platform.
            </p>
          </div>

          <div className="lp-hscroll" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{ background: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '32px', transition: 'all var(--transition-normal)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '12px' }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 16px 48px rgba(0,0,0,0.10)'; el.style.transform = 'translateY(-4px)'; el.style.borderColor = f.color + '55'; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = 'var(--shadow-sm)'; el.style.transform = 'none'; el.style.borderColor = 'var(--color-border)'; }}
              >
                <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 'var(--text-h4)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{f.title}</h3>
                <p style={{ fontSize: 'var(--text-body-sm)', lineHeight: 1.75, color: 'var(--color-text-secondary)', margin: 0, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{f.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'auto', paddingTop: '4px' }}>
                  {f.tags.map((tag) => (
                    <span key={tag} style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: f.bg, color: f.color, border: '1px solid ' + f.color + '33', letterSpacing: '0.2px', whiteSpace: 'nowrap' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          WHO IT'S FOR
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(64px, 8vw, 112px) 0', background: 'var(--color-white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-14)' }}>
            <div className="badge badge-green" style={{ display: 'inline-flex', marginBottom: 'var(--space-4)' }}>Who It's For</div>
            <h2 style={{ fontSize: 'var(--text-h1)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)' }}>
              Built for every builder
            </h2>
            <p style={{ fontSize: 'var(--text-body-lg)', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '0 auto' }}>
              Whether you're shipping your first app or managing a portfolio, Solo Store scales with you.
            </p>
          </div>

          <div className="lp-hscroll" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
            {PERSONAS.map((p) => (
              <div key={p.title} style={{ background: p.bg, border: '1px solid ' + p.border, borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: '40px', marginBottom: 'var(--space-4)' }}>{p.icon}</div>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>{p.subtitle}</p>
                <h3 style={{ fontSize: 'var(--text-h3)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)' }}>{p.title}</h3>
                <p style={{ fontSize: 'var(--text-body-sm)', lineHeight: 1.75, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' }}>{p.desc}</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {p.bullets.map((b) => (
                    <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>→</span> {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(64px, 8vw, 112px) 0', background: 'var(--color-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-14)' }}>
            <div className="badge badge-green" style={{ display: 'inline-flex', marginBottom: 'var(--space-4)' }}>What Developers Say</div>
            <h2 style={{ fontSize: 'var(--text-h1)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Real results from real builders
            </h2>
          </div>

          <div className="lp-hscroll" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                style={{
                  background: 'var(--color-white)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Stars + opening quote on same row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} style={{ color: '#fbbf24', fontSize: '15px' }}>★</span>
                    ))}
                  </div>
                  <span style={{ fontSize: '32px', lineHeight: 1, color: t.color, opacity: 0.25, fontFamily: 'Georgia, serif' }}>"</span>
                </div>

                {/* Quote */}
                <p style={{ fontSize: 'var(--text-body-sm)', lineHeight: 1.8, color: 'var(--color-text-primary)', fontStyle: 'italic', margin: 0, overflowWrap: 'break-word', wordBreak: 'break-word', flex: 1 }}>
                  {t.quote}
                </p>

                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: t.bg, border: '2px solid ' + t.color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: t.color, flexShrink: 0 }}>
                    {t.avatar}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 'var(--text-body-sm)', fontWeight: 700, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</p>
                    <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(64px, 8vw, 112px) 0', background: 'var(--color-white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-14)' }}>
            <div className="badge badge-green" style={{ display: 'inline-flex', marginBottom: 'var(--space-4)' }}>Pricing</div>
            <h2 style={{ fontSize: 'var(--text-h1)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)' }}>
              Start free. Scale when you're ready.
            </h2>
            <p style={{ fontSize: 'var(--text-body-lg)', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '0 auto var(--space-5)' }}>
              No trial. No credit card. The free plan stays free forever — upgrade only when you need more.
            </p>
            <Link href="/plans" style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              See full feature comparison →
            </Link>
          </div>

          <div className="lp-hscroll lp-plans" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', maxWidth: '1080px', margin: '0 auto', alignItems: 'start' }}>
            {plans.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '32px', minHeight: '380px' }}>
                    {[55, 38, 32, 70, 32, 70, 70, 60].map((w, j) => (
                      <div key={j} className="skeleton" style={{ height: j === 2 ? 36 : 12, width: `${w}%`, borderRadius: 4, marginBottom: '16px' }} />
                    ))}
                  </div>
                ))
              : plans.map((plan) => {
                  const popular = isPopularPlan(plan, plans);
                  const bullets = planBullets(plan);
                  const priceLabel = plan.price === 0 ? 'Free' : `$${plan.price}`;
                  const subLabel  = plan.price === 0 ? 'forever' : `/${plan.interval === 'yearly' ? 'yr' : 'mo'}`;
                  const ctaLabel  = plan.price === 0 ? 'Start for free' : `Get ${plan.name}`;
                  const ctaHref   = plan.price === 0 ? '/register' : `/register?plan=${plan.slug}`;

                  return (
                    <div
                      key={plan._id}
                      style={{
                        background: popular ? 'var(--color-primary)' : 'var(--color-white)',
                        border: popular ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        borderRadius: '16px',
                        padding: '32px',
                        position: 'relative',
                        boxShadow: popular ? '0 24px 64px rgba(21,128,61,0.30)' : 'var(--shadow-sm)',
                        transform: popular ? 'scale(1.04)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0',
                      }}
                    >
                      {popular && (
                        <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#fbbf24', color: '#78350f', fontSize: '10px', fontWeight: 800, padding: '3px 14px', borderRadius: '999px', whiteSpace: 'nowrap', letterSpacing: '0.3px' }}>
                          ✦ Most Popular
                        </div>
                      )}

                      <p style={{ fontSize: '11px', fontWeight: 800, color: popular ? 'rgba(255,255,255,0.6)' : 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 10px' }}>{plan.name}</p>

                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', margin: '0 0 8px' }}>
                        <span style={{ fontSize: '2.6rem', fontWeight: 900, lineHeight: 1, color: popular ? 'white' : 'var(--color-text-primary)' }}>{priceLabel}</span>
                        <span style={{ fontSize: 'var(--text-body-sm)', color: popular ? 'rgba(255,255,255,0.5)' : 'var(--color-text-muted)', paddingBottom: '6px' }}>{subLabel}</span>
                      </div>

                      <p style={{ fontSize: 'var(--text-body-sm)', color: popular ? 'rgba(255,255,255,0.72)' : 'var(--color-text-secondary)', margin: '0 0 24px', lineHeight: 1.65, overflowWrap: 'break-word' }}>{plan.description}</p>

                      <Link
                        href={ctaHref}
                        style={{ display: 'block', textAlign: 'center', padding: '12px 16px', borderRadius: '999px', fontSize: 'var(--text-body-sm)', fontWeight: 700, textDecoration: 'none', margin: '0 0 24px', background: popular ? 'white' : 'var(--color-primary)', color: popular ? 'var(--color-primary)' : 'white', transition: 'all var(--transition-fast)' }}
                      >
                        {ctaLabel}
                      </Link>

                      <div style={{ borderTop: `1px solid ${popular ? 'rgba(255,255,255,0.15)' : 'var(--color-border)'}`, paddingTop: '20px' }}>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {bullets.map((b) => (
                            <li key={b.text} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: 'var(--text-body-sm)', color: b.ok ? (popular ? 'rgba(255,255,255,0.85)' : 'var(--color-text-secondary)') : (popular ? 'rgba(255,255,255,0.3)' : 'var(--color-text-muted)'), opacity: b.ok ? 1 : 0.55 }}>
                              <span style={{ flexShrink: 0, fontWeight: 800, fontSize: '12px', color: b.ok ? (popular ? 'rgba(255,255,255,0.7)' : 'var(--color-primary)') : (popular ? 'rgba(255,255,255,0.25)' : '#ccc'), marginTop: '2px' }}>{b.ok ? '✓' : '✗'}</span>
                              <span style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{b.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(64px, 8vw, 112px) 0', background: 'var(--color-surface)' }}>
        <div className="container" style={{ maxWidth: '820px' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-14)' }}>
            <div className="badge badge-green" style={{ display: 'inline-flex', marginBottom: 'var(--space-4)' }}>FAQ</div>
            <h2 style={{ fontSize: 'var(--text-h1)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)' }}>
              Frequently asked questions
            </h2>
            <p style={{ fontSize: 'var(--text-body-lg)', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '0 auto' }}>
              Everything you need to know before converting your first site.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-10)' }}>
            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
              Still have questions?
            </p>
            <Link href="/register" style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Create a free account and explore the dashboard →
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #052e16 0%, #14532d 35%, #15803d 70%, #16a34a 100%)',
          padding: 'clamp(80px, 10vw, 128px) 0',
          textAlign: 'center',
        }}
      >
        {/* Decorative orbs */}
        {[
          { top: '-80px', right: '-80px', size: '500px', op: '0.06' },
          { bottom: '-80px', left: '-80px', size: '400px', op: '0.05' },
          { top: '50%', left: '20%', size: '200px', op: '0.04' },
        ].map((orb, i) => (
          <div key={i} aria-hidden="true" style={{ position: 'absolute', width: orb.size, height: orb.size, borderRadius: '50%', background: `rgba(255,255,255,${orb.op})`, ...orb, pointerEvents: 'none' }} />
        ))}

        <div className="container" style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)', fontSize: 'var(--text-xs)', fontWeight: 700, padding: '6px 16px', borderRadius: 'var(--radius-full)', marginBottom: 'var(--space-6)', letterSpacing: '0.4px' }}>
            🚀 Join 2,400+ developers already building on Solo Store
          </div>

          <h2 style={{ color: 'white', fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 900, marginBottom: 'var(--space-5)', letterSpacing: '-0.025em', lineHeight: 1.08 }}>
            Your website is already an app.<br />
            <span style={{ opacity: 0.8 }}>It just needs the APK.</span>
          </h2>

          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 'var(--text-body-lg)', marginBottom: 'var(--space-10)', maxWidth: '500px', margin: '0 auto var(--space-10)', lineHeight: 1.7 }}>
            Start free, no credit card required. Your first Android app can be live in under 10 minutes — and it'll stay free forever.
          </p>

          <div className="lp-cta-btns" style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-10)' }}>
            <Link
              href="/register"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: 'var(--space-4) var(--space-10)', borderRadius: 'var(--radius-full)', background: 'white', color: 'var(--color-primary)', fontWeight: 800, fontSize: 'var(--text-body)', textDecoration: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', transition: 'all var(--transition-fast)' }}
            >
              Create free account →
            </Link>
            <Link
              href="/store"
              style={{ display: 'inline-flex', alignItems: 'center', padding: 'var(--space-4) var(--space-10)', borderRadius: 'var(--radius-full)', border: '1.5px solid rgba(255,255,255,0.4)', color: 'white', fontWeight: 600, fontSize: 'var(--text-body)', textDecoration: 'none', transition: 'all var(--transition-fast)' }}
            >
              Browse the store
            </Link>
          </div>

          {/* Bottom trust row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
            {['✓ No credit card', '✓ Free plan forever', '✓ Live in < 10 min', '✓ No code required'].map((t) => (
              <span key={t} style={{ fontSize: 'var(--text-body-sm)', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
