'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from './ThemeToggle';

const navLinks = [
  { href: '/store', label: 'Browse Apps' },
  { href: '/plans', label: 'Pricing' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isLoggedIn, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-sticky)',
          background: 'var(--color-glass-bg-solid)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-border)',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '100%',
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 800,
                fontSize: '16px',
              }}
            >
              S
            </div>
            <span
              style={{
                fontSize: 'var(--text-body-lg)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              Solo Store
            </span>
          </Link>

          {/* Center nav — hidden on mobile */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: 'var(--text-body-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: pathname.startsWith(link.href)
                      ? 'var(--color-primary)'
                      : 'var(--color-text-secondary)',
                    textDecoration: 'none',
                    transition: 'color var(--transition-fast)',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ThemeToggle />

            {!isMobile && (
              isLoggedIn && user ? (
                <>
                  <Link href="/dashboard" className="btn-ghost" style={{ padding: 'var(--space-2) var(--space-4)' }}>
                    Dashboard
                  </Link>
                  <button
                    onClick={() => logout()}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 'var(--text-body-sm)',
                      color: 'var(--color-text-secondary)',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    style={{
                      fontSize: 'var(--text-body-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text-secondary)',
                      textDecoration: 'none',
                      padding: 'var(--space-2) var(--space-3)',
                    }}
                  >
                    Sign in
                  </Link>
                  <Link href="/register" className="btn-primary" style={{ padding: 'var(--space-2) var(--space-4)' }}>
                    Get started
                  </Link>
                </>
              )
            )}

            {/* Hamburger — mobile only */}
            {isMobile && (
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Toggle menu"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '5px',
                  width: '36px',
                  height: '36px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    width: '20px',
                    height: '2px',
                    background: 'var(--color-text-primary)',
                    borderRadius: '2px',
                    transition: 'all 0.2s',
                    transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none',
                  }}
                />
                <span
                  style={{
                    display: 'block',
                    width: '20px',
                    height: '2px',
                    background: 'var(--color-text-primary)',
                    borderRadius: '2px',
                    transition: 'all 0.2s',
                    opacity: menuOpen ? 0 : 1,
                  }}
                />
                <span
                  style={{
                    display: 'block',
                    width: '20px',
                    height: '2px',
                    background: 'var(--color-text-primary)',
                    borderRadius: '2px',
                    transition: 'all 0.2s',
                    transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
                  }}
                />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {isMobile && menuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 'var(--z-overlay)',
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(2px)',
            }}
          />

          {/* Drawer */}
          <div
            style={{
              position: 'fixed',
              top: '64px',
              left: 0,
              right: 0,
              zIndex: 'var(--z-modal)',
              background: 'var(--color-white)',
              borderBottom: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-xl)',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: 'block',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-body)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: pathname.startsWith(link.href)
                    ? 'var(--color-primary)'
                    : 'var(--color-text-secondary)',
                  background: pathname.startsWith(link.href) ? 'var(--color-primary-50)' : 'transparent',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            ))}

            <div style={{ height: '1px', background: 'var(--color-border)', margin: 'var(--space-2) 0' }} />

            {isLoggedIn && user ? (
              <>
                <Link
                  href="/dashboard"
                  style={{
                    display: 'block',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-body)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text-secondary)',
                    textDecoration: 'none',
                  }}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-body)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-danger)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  style={{
                    display: 'block',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-body)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text-secondary)',
                    textDecoration: 'none',
                  }}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="btn-primary"
                  style={{ display: 'block', textAlign: 'center', padding: 'var(--space-3)' }}
                >
                  Get started — it&apos;s free
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
