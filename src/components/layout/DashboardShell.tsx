'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import { useAuth } from '@/hooks/useAuth';

const SIDEBAR_BREAKPOINT = 1024;

interface DashboardShellProps {
  children: React.ReactNode;
  variant?: 'dashboard' | 'admin';
  title?: string;
}

export default function DashboardShell({ children, variant = 'dashboard', title }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < SIDEBAR_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const isAdmin = variant === 'admin';

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--color-surface)',
      }}
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={!isMobile || sidebarOpen}
        isMobile={isMobile}
        onClose={() => setSidebarOpen(false)}
        variant={variant}
      />

      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            zIndex: 'var(--z-overlay)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Main content area */}
      <div
        style={{
          marginLeft: isMobile ? 0 : '240px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'margin-left var(--transition-normal)',
          minWidth: 0,
        }}
      >
        {/* Topbar */}
        <header
          style={{
            height: '64px',
            background: 'var(--color-white)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 var(--space-6)',
            gap: 'var(--space-3)',
            position: 'sticky',
            top: 0,
            zIndex: 'var(--z-sticky)',
            flexShrink: 0,
          }}
        >
          {/* Hamburger (mobile only) */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--space-1)',
                flexShrink: 0,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}

          {/* Logo / title (mobile) */}
          {isMobile && (
            <Link
              href={isAdmin ? '/admin' : '/dashboard'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '13px',
                  flexShrink: 0,
                }}
              >
                S
              </div>
              <span
                style={{
                  fontSize: 'var(--text-body-sm)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {isAdmin ? 'Admin' : 'Solo Store'}
              </span>
            </Link>
          )}

          {/* Desktop title */}
          {!isMobile && title && (
            <span
              style={{
                fontSize: 'var(--text-body-sm)',
                color: 'var(--color-text-muted)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              {title}
            </span>
          )}

          <div style={{ flex: 1 }} />

          {/* Admin badge */}
          {isAdmin && (
            <span className="badge badge-red" style={{ fontSize: 'var(--text-xs)' }}>
              Admin
            </span>
          )}

          {/* Notification bell */}
          <NotificationBell />

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User avatar */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-primary-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              color: 'var(--color-primary-dark)',
              flexShrink: 0,
              cursor: 'default',
              border: '2px solid var(--color-primary-200)',
            }}
            title={user?.email}
          >
            {user?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
        </header>

        {/* Page content */}
        <main
          style={{
            flex: 1,
            padding: isMobile ? 'var(--space-5)' : 'var(--space-8)',
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
