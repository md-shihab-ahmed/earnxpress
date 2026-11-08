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
    default: 'EarnXpress - Earn Money Online | সেরা অনলাইন ইনকাম ও মাইক্রোটাস্ক প্ল্যাটফর্ম',
    template: '%s | EarnXpress',
  },
  description:
    'EarnXpress হলো বিশ্বের শীর্ষস্থানীয় অনলাইন মাইক্রোটাস্ক ও ফ্রিল্যান্সিং প্ল্যাটফর্ম। মোবাইল বা কম্পিউটার দিয়ে ছোট ছোট কাজ (Data Entry, App Testing, Surveys) করে প্রতিদিন ডলার ইনকাম করুন এবং Binance Pay (USDT) ও বিকাশ-নগদে ইনস্ট্যান্ট উইথড্র নিন।',
  applicationName: 'EarnXpress',
  authors: [{ name: 'EarnXpress Global Team', url: siteUrl }],
  generator: 'Next.js',
  keywords: [
    'EarnXpress',
    'EarnXpress app',
    'EarnXpress marketplace',
    'টাকা ইনকাম',
    'টাকায় ইনকাম',
    'অনলাইন ইনকাম',
    'অনলাইনে টাকা ইনকাম',
    'মোবাইল দিয়ে টাকা ইনকাম',
    'আর্নিং',
    'আর্নিং অ্যাপ',
    'মাইক্রোটাস্ক',
    'মাইক্রো জবস',
    'Earn money online',
    'Make money online BD',
    'Online earning site',
    'Microtask jobs',
    'Data entry jobs',
    'Freelancing micro jobs',
    'Binance pay earning',
    'bKash earning site',
    'Nagad payment microtask',
    'ছাত্রদের জন্য অনলাইন ইনকাম',
    'ঘরে বসে টাকা ইনকাম',
    'International crowdsourcing marketplace',
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
    title: 'EarnXpress - Earn Money Online | বিশ্বস্ত অনলাইন ইনকাম প্ল্যাটফর্ম',
    description:
      'ঘরে বসে বা মোবাইল দিয়ে ছোট ছোট কাজ করে ডলার ইনকাম করুন। ১০০% বিশ্বস্ত লেনদেন, মিনিমাম $৪ উইথড্রয়াল ও ইনস্ট্যান্ট বাইন্যান্স/বিকাশ পেমেন্ট।',
    siteName: 'EarnXpress',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EarnXpress - Earn Money Online',
    description:
      'Premier global microtask & crowdsourcing freelance platform with guaranteed escrow and instant Binance payouts.',
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
