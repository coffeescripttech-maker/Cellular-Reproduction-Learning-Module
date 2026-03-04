import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './main.css';
import { ClientAuthProvider } from '@/components/providers/client-auth-provider';
import { Toaster } from '@/components/ui/sonner';
import { PWAStatus } from '@/components/ui/pwa-status';

export const metadata: Metadata = {
  title: 'Cellular Reproduction Learning Module',
  description:
    'Comprehensive senior citizen registration and management system for OSCA and BASCA',
  generator: 'Next.js',
  manifest: '/manifest.json',
  keywords: [
    'senior citizen',
    'OSCA',
    'BASCA',
    'government',
    'management',
    'PWA'
  ],
  authors: [{ name: 'SCIMS Team' }],
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SCIMS'
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: 'website',
    siteName: 'Cellular Reproduction Learning Module',
    title: 'SCIMS - Senior Citizen Management',
    description:
      'Comprehensive senior citizen registration and management system for OSCA and BASCA'
  },
  twitter: {
    card: 'summary',
    title: 'SCIMS - Senior Citizen Management',
    description:
      'Comprehensive senior citizen registration and management system for OSCA and BASCA'
  }
};

export const viewport: Viewport = {
  minimumScale: 1,
  initialScale: 1,
  width: 'device-width',
  viewportFit: 'cover'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
        <meta name="theme-color" content="#00af8f" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <ClientAuthProvider>
          {children}
          <Toaster />
          <PWAStatus />
        </ClientAuthProvider>
      </body>
    </html>
  );
}
