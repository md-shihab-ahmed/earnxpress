import React from 'react';

export function JsonLdSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://earnxpress-marketplace.vercel.app';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'EarnXpress',
    alternateName: ['EarnXpress Global', 'EarnXpress Marketplace'],
    url: baseUrl,
    logo: `${baseUrl}/icon`,
    description:
      'EarnXpress is a verified crowdsourcing and freelance micro-task marketplace with automated escrow budget protection, verifiable proof of work, and instant payouts.',
    sameAs: [
      'https://twitter.com/earnxpress',
      'https://facebook.com/earnxpress',
      'https://t.me/earnxpress',
    ],
  };

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'EarnXpress — Full-Stack Freelance Task Marketplace',
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
        name: 'How does the EarnXpress freelance marketplace work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'EarnXpress connects clients with verified digital workers for micro-tasks and freelancing projects. Clients fund tasks with automated escrow protection, and workers receive guaranteed payouts upon submitting verifiable proof of work.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the minimum withdrawal threshold on EarnXpress?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The minimum global withdrawal threshold on EarnXpress is $4.00 USD. Users can withdraw their earnings instantly once their balance reaches this minimum amount.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which payout methods are supported on EarnXpress?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'EarnXpress supports instant 0% fee cryptocurrency payouts via Binance Pay (USDT) as well as global automated payment gateways and direct bank transfers.',
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
