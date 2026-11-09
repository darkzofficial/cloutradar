import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import Nav from '@/components/Nav';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'CloutRadar', template: '%s · CloutRadar' },
  description: 'Check a TikTok account for warning signs of bought followers, bot likes and fake engagement.',
  icons: { icon: '/icon.svg' },
};
export const viewport: Viewport = { themeColor: '#070605', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700&display=swap" />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
        <footer>
          <div className="wrap">
            <span>CloutRadar reads only the numbers you enter. Not affiliated with TikTok.</span>
            <span>
              <Link href="/pricing">Pricing</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
