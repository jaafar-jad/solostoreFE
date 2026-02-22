import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api').replace(/\/$/, '');

  let app: { name?: string; shortDescription?: string; accentColor?: string; icon?: string } = {};
  try {
    const res = await fetch(`${apiBase}/store/apps/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      app = json.data ?? {};
    }
  } catch { /* use defaults */ }

  const name = app.name ?? 'SoloStore App';
  const accentColor = app.accentColor ?? '#15803d';
  const iconUrl = app.icon && !app.icon.startsWith('data:') ? app.icon : null;

  const icons = iconUrl
    ? [
        { src: iconUrl, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: iconUrl, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ]
    : [{ src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }];

  const manifest = {
    name,
    short_name: name.substring(0, 12),
    description: app.shortDescription ?? 'Installed via Solo Store',
    start_url: `/install/${id}/?launch=1`,
    scope: '/install/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: accentColor,
    icons,
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
