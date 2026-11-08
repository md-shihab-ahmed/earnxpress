import React from 'react';

export function JsonLdSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://earnxpress-marketplace.vercel.app';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'EarnXpress',
    alternateName: ['EarnXpress Global', 'EarnXpress Marketplace', 'আর্নএক্সপ্রেস'],
    url: baseUrl,
    logo: `${baseUrl}/icon`,
    description:
      'EarnXpress is a premier global crowdsourcing and microtask freelancing platform enabling workers to earn money online with instant crypto (Binance Pay) and local payouts.',
    sameAs: [
      'https://twitter.com/earnxpress',
      'https://facebook.com/earnxpress',
      'https://t.me/earnxpress',
    ],
  };

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'EarnXpress - Earn Money Online',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/tasks?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'EarnXpress',
    operatingSystem: 'Android, iOS, Windows, macOS, Web',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '1240',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'EarnXpress-এ কিভাবে টাকা ইনকাম করা যায়? (How to earn money on EarnXpress?)',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'EarnXpress-এ ছোট ছোট মাইক্রোটাস্ক যেমন ডেটা এন্ট্রি, অনুবাদ, অ্যাপ টেস্টিং, সোশ্যাল মিডিয়া ক্যাম্পেইন এবং সার্ভে সম্পন্ন করে ডলার ($) ইনকাম করা যায়। কাজ জমা দেওয়ার পর বায়ার অ্যাপ্রুভ করলেই আপনার ব্যালেন্সে টাকা যোগ হয়।',
        },
      },
      {
        '@type': 'Question',
        name: 'EarnXpress-এ সর্বনিম্ন কত ডলার উইথড্র করা যায়? (What is the minimum withdrawal limit?)',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'EarnXpress-এ সার্বজনীন সর্বনিম্ন উইথড্রয়াল লিমিট মাত্র $৪.০০ মার্কিন ডলার ($4.00 USD)। ৪ ডলার ব্যালেন্স হলেই আপনি যেকোনো সময় উইথড্র রিকোয়েস্ট পাঠাতে পারবেন।',
        },
      },
      {
        '@type': 'Question',
        name: 'কোন কোন মাধ্যমে টাকা উইথড্র করা যায়? (Which payment methods are supported?)',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'আন্তর্জাতিকভাবে Binance Pay (USDT) এ ০% ফিতে উইথড্র করা যায়। এছাড়া বাংলাদেশে বিকাশ (bKash), নগদ (Nagad), রকেট এবং যেকোনো লোকাল ব্যাংক একাউন্টে সরাসরি টাকা নেওয়া যায়।',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
