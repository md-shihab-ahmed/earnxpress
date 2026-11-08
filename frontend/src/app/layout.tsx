import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { JsonLdSchema } from '@/components/shared/JsonLdSchema';
import { PwaInstallPrompt } from '@/components/shared/PwaInstallPrompt';
import { SplashScreen } from '@/components/shared/SplashScreen';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://earnxpress-marketplace.vercel.app';

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'EarnXpress — Full-Stack Freelance Task Marketplace',
    template: '%s | EarnXpress',
  },
  description:
    'EarnXpress is a verified crowdsourcing and freelance micro-task marketplace engineered with Next.js 15, TypeScript, and NestJS. Featuring automated escrow budget protection, verifiable proof of work, and instant payouts.',
  applicationName: 'EarnXpress',
  authors: [{ name: 'EarnXpress Global Team', url: siteUrl }],
  generator: 'Next.js',
  keywords: [
    'EarnXpress',
    'EarnXpress marketplace',
    'Freelance marketplace',
    'Microtask platform',
    'Crowdsourcing platform',
    'Full-stack web application',
    'Next.js 15',
    'TypeScript',
    'NestJS',
    'Automated escrow',
    'Cryptographic security',
    'Argon2id',
    'Software engineering',
    'Web development',
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'EarnXpress',
  publisher: 'EarnXpress',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    title: 'EarnXpress — Full-Stack Freelance Task Marketplace',
    description:
      'A verified crowdsourcing and freelance micro-task marketplace with automated escrow budget protection, verifiable proof of work, and instant payouts.',
    siteName: 'EarnXpress',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EarnXpress — Full-Stack Freelance Task Marketplace',
    description:
      'A verified crowdsourcing and freelance micro-task marketplace with automated escrow budget protection, verifiable proof of work, and instant payouts.',
  },
  manifest: '/manifest.webmanifest',
  verification: {
    google: 'Xe8B121UFXRXNyVu0LhrrbeL3bqnsvdtMN9IRRXNiU8',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta
          name="google-site-verification"
          content="Xe8B121UFXRXNyVu0LhrrbeL3bqnsvdtMN9IRRXNiU8"
        />
        <JsonLdSchema />
      </head>
      <body className="flex flex-col min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
        <AuthProvider>
          <SplashScreen />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <PwaInstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}
