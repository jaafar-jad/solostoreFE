import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Solo Store — Convert Websites to Android Apps',
    template: '%s | Solo Store',
  },
  description:
    'Turn any website into a native Android app in minutes. Verify your domain, customize your app, and publish to the Solo Store marketplace.',
  keywords: ['android app', 'website to app', 'app converter', 'TWA', 'web to app', 'app store'],
  authors: [{ name: 'Solo Store' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Solo Store',
    title: 'Solo Store — Convert Websites to Android Apps',
    description:
      'Turn any website into a native Android app in minutes and publish it to the Solo Store marketplace.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
