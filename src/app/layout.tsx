import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';
import AppLayoutWrapper from '@/components/layout/AppLayoutWrapper';
import NextTopLoader from 'nextjs-toploader';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export const metadata: Metadata = {
  title: 'ÌRÍSÍ Nigeria | Multi-Brand Couture & Ready-to-Wear Marketplace',
  description: 'Shop Senator sets, bespoke native wear, streetwear hoodies, handcrafted leather footwear, bags, and luxury accessories from top Nigerian fashion designers.',
  icons: {
    icon: [
      { url: '/images/logo/irisi-icon.png' },
      { url: '/favicon.ico' },
      { url: '/favicon.png' },
    ],
    shortcut: '/images/logo/irisi-icon.png',
    apple: '/images/logo/irisi-icon.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`light ${cormorant.variable} ${plusJakarta.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var hasManualOverride = sessionStorage.getItem('irisi_manual_theme_override') === 'true';
                  var savedTheme = null;
                  if (hasManualOverride) {
                    var storage = localStorage.getItem('irisi-store-storage');
                    if (storage) {
                      var parsed = JSON.parse(storage);
                      savedTheme = parsed && parsed.state ? parsed.state.theme : null;
                    }
                  }
                  // App defaults to Light Mode unless user has an active manual theme override
                  var activeTheme = savedTheme || 'light';
                  if (activeTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased transition-colors duration-300 font-sans">
        <NextTopLoader
          color="#d4af37"
          initialPosition={0.12}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 12px #d4af37, 0 0 6px #f3e5ab"
          zIndex={99999}
        />
        <AppLayoutWrapper>
          {children}
        </AppLayoutWrapper>
      </body>
    </html>
  );
}
