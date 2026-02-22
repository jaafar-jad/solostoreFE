import Link from 'next/link';

const links = {
  Product: [
    { href: '/store', label: 'Browse Apps' },
    { href: '/plans', label: 'Pricing' },
    { href: '/convert', label: 'Convert Website' },
  ],
  Company: [
    { href: '/about', label: 'About' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact', label: 'Contact' },
  ],
  Legal: [
    { href: '/terms', label: 'Terms of Service' },
    { href: '/privacy', label: 'Privacy Policy' },
  ],
};

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--color-text-primary)',
        color: 'var(--color-text-muted)',
        paddingTop: 'var(--space-16)',
        paddingBottom: 'var(--space-8)',
        marginTop: 'auto',
      }}
    >
      <div className="container" style={{ paddingInline: 'var(--space-4)' }}>
        <div
          style={{
            
            // This is the magic line: it creates a 2fr column for brand, 
            // but wraps items to new lines if they drop below 150px
            gridTemplateColumns: 'wrap(auto-fit, minmax(150px, 1fr))',
            // For a more controlled look, we use a flex-wrap approach or a better grid:
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-10)',
            marginBottom: 'var(--space-12)',
          }}
        >
          {/* Brand - Set to flex-basis to take more space on desktop */}
          <div style={{ flex: '1 1 300px', minWidth: '250px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
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
              <span style={{ color: 'white', fontWeight: 700, fontSize: 'var(--text-body-lg)' }}>
                Solo Store
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-body-sm)', lineHeight: 1.7, maxWidth: '320px' }}>
              Convert any website into a native Android app and publish it on the Solo Store
              marketplace — no coding required.
            </p>
          </div>

          {/* Link columns - Flex grow/shrink handles the responsiveness */}
          <div style={{ 
            display: 'flex', 
            flex: '2 1 400px', 
            flexWrap: 'wrap', 
            gap: 'var(--space-10)',
            justifyContent: 'space-between' 
          }}>
            {Object.entries(links).map(([group, items]) => (
              <div key={group} style={{ minWidth: '120px' }}>
                <p
                  style={{
                    color: 'white',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--text-body-sm)',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  {group}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        style={{
                          fontSize: 'var(--text-body-sm)',
                          color: 'var(--color-text-muted)',
                          textDecoration: 'none',
                          transition: 'color var(--transition-fast)',
                        }}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <hr style={{ borderColor: 'rgba(255,255,255,0.10)', marginBottom: 'var(--space-8)' }} />

        {/* Bottom Bar - Wraps on mobile */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            fontSize: 'var(--text-xs)',
          }}
        >
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} Solo Store. All rights reserved.</p>
          <p style={{ margin: 0 }}>Built to convert the web into apps.</p>
        </div>
      </div>
    </footer>
  );
}