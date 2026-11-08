import {
  Task,
  ParticipationStats,
  WorkerParticipation,
  DemoLedgerAccount,
  DemoLedgerTransaction,
  User,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
export const ENABLE_DEMO_SHORTCUTS = process.env.NEXT_PUBLIC_ENABLE_DEMO_SHORTCUTS !== 'false';
export const ENABLE_DEMO_FAUCET = process.env.NEXT_PUBLIC_ENABLE_DEMO_FAUCET !== 'false';

// In-memory demo state for seamless client interactions when offline
export const demoDb = {
  tasks: [
    {
      id: 'task-viral-yt-1m',
      title: 'YouTube 1M Mission: Watch EarnXpress Video, Like & Subscribe (@earnxpress-sahmed)',
      taskModel: 'MULTI_WORKER' as const,
      status: 'OPEN' as const,
      totalSlots: 500,
      availableSlots: 482,
      unitBudgetCents: '12',
      formattedUnitUSD: '$0.12 USD',
      startDeadlineHours: 2,
      completionDurationHours: 12,
      reviewSlaHours: 72,
      maxRevisions: 2,
      createdAt: new Date().toISOString(),
      category: { id: 'c-viral', name: 'Social & Media Growth', slug: 'social-media' },
      subcategory: { id: 'sc-yt', name: 'YouTube Growth', slug: 'youtube-growth' },
      buyer: {
        id: 'buyer-earnxpress-hq',
        profile: {
          id: 'p-earnxpress',
          displayName: 'EarnXpress Official Growth Lab',
          headline: 'Verified Platform Community Campaign',
          countryCode: 'BD',
          reputationScore: 5.0,
          completionRate: 100.0,
          totalReviewsCount: 520,
        },
      },
      participationStats: {
        totalCapacity: 500,
        remainingAvailableSlots: 482,
        acceptedTotal: 18,
        currentlyWorking: 12,
        submittedForReview: 4,
        reviewOverdue: 0,
        approvedSettled: 2,
        rejectedTerminated: 0,
      },
      instructions: {
        versionNumber: 1,
        descriptionMarkdown: `### 🎯 Goal: Reach 1 Million YouTube Subscribers!
Earn guaranteed payout by helping grow the official EarnXpress YouTube community.

### 📋 Instructions:
1. Visit our official YouTube Channel: **https://www.youtube.com/@earnxpress-sahmed**
2. Watch the latest EarnXpress documentary / promo video for at least **2 full minutes**.
3. Click the **Subscribe** button and turn on the **Notification Bell 🔔**.
4. Leave a **thumbs up (like)** and an encouraging comment about the platform.
5. Take a clear screenshot showing your subscription, bell icon, and liked video.`,
        acceptanceCriteria: [
          { key: 'subscription', description: 'Actively subscribed to @earnxpress-sahmed with notification bell turned on' },
          { key: 'watch_time', description: 'Watched at least 2 minutes of the EarnXpress video and left a thumbs up' },
          { key: 'proof', description: 'Clear unedited screenshot showing subscription status and your YouTube username' },
        ],
        deliverableRequirements: [
          { type: 'FILE', label: 'Screenshot of active subscription with bell icon & liked video' },
          { type: 'TEXT', label: 'Your YouTube Username or Profile URL' },
        ],
      },
    },
    {
      id: 'task-viral-fb-1m',
      title: 'Facebook 1M Mission: Follow Official Page, Like Pinned Post & Share',
      taskModel: 'MULTI_WORKER' as const,
      status: 'OPEN' as const,
      totalSlots: 500,
      availableSlots: 465,
      unitBudgetCents: '10',
      formattedUnitUSD: '$0.10 USD',
      startDeadlineHours: 2,
      completionDurationHours: 12,
      reviewSlaHours: 72,
      maxRevisions: 2,
      createdAt: new Date().toISOString(),
      category: { id: 'c-viral', name: 'Social & Media Growth', slug: 'social-media' },
      subcategory: { id: 'sc-fb', name: 'Facebook Growth', slug: 'facebook-growth' },
      buyer: {
        id: 'buyer-earnxpress-hq',
        profile: {
          id: 'p-earnxpress',
          displayName: 'EarnXpress Official Growth Lab',
          headline: 'Verified Platform Community Campaign',
          countryCode: 'BD',
          reputationScore: 5.0,
          completionRate: 100.0,
          totalReviewsCount: 520,
        },
      },
      participationStats: {
        totalCapacity: 500,
        remainingAvailableSlots: 465,
        acceptedTotal: 35,
        currentlyWorking: 20,
        submittedForReview: 10,
        reviewOverdue: 0,
        approvedSettled: 5,
        rejectedTerminated: 0,
      },
      instructions: {
        versionNumber: 1,
        descriptionMarkdown: `### 🎯 Goal: Reach 1 Million Facebook Page Followers!
Join our official Facebook growth campaign and earn instant balance upon verification.

### 📋 Instructions:
1. Open our official Facebook Page: **https://www.facebook.com/profile.php?id=100086879226470**
2. Click the **Follow** button.
3. Like the top pinned video/announcement post.
4. Share the post to your Facebook timeline or an active earning/freelancing group.
5. Submit your Facebook profile link and a screenshot showing the 'Followed' button.`,
        acceptanceCriteria: [
          { key: 'follow_status', description: 'Must actively follow the official EarnXpress Facebook page' },
          { key: 'engagement', description: 'Liked the pinned post and shared it publicly' },
          { key: 'screenshot', description: 'Screenshot showing the followed page with your account visible' },
        ],
        deliverableRequirements: [
          { type: 'FILE', label: 'Screenshot of followed Facebook page and liked pinned post' },
          { type: 'TEXT', label: 'Your Facebook Profile URL or Name' },
        ],
      },
    },
    {
      id: 'task-viral-tg-1m',
      title: 'Telegram 1M Community Mission: Join Official Channel & Stay Active',
      taskModel: 'MULTI_WORKER' as const,
      status: 'OPEN' as const,
      totalSlots: 500,
      availableSlots: 440,
      unitBudgetCents: '8',
      formattedUnitUSD: '$0.08 USD',
      startDeadlineHours: 2,
      completionDurationHours: 12,
      reviewSlaHours: 72,
      maxRevisions: 2,
      createdAt: new Date().toISOString(),
      category: { id: 'c-viral', name: 'Social & Media Growth', slug: 'social-media' },
      subcategory: { id: 'sc-tg', name: 'Telegram Community', slug: 'telegram-community' },
      buyer: {
        id: 'buyer-earnxpress-hq',
        profile: {
          id: 'p-earnxpress',
          displayName: 'EarnXpress Official Growth Lab',
          headline: 'Verified Platform Community Campaign',
          countryCode: 'BD',
          reputationScore: 5.0,
          completionRate: 100.0,
          totalReviewsCount: 520,
        },
      },
      participationStats: {
        totalCapacity: 500,
        remainingAvailableSlots: 440,
        acceptedTotal: 60,
        currentlyWorking: 25,
        submittedForReview: 15,
        reviewOverdue: 0,
        approvedSettled: 20,
        rejectedTerminated: 0,
      },
      instructions: {
        versionNumber: 1,
        descriptionMarkdown: `### 🎯 Goal: Reach 1 Million Telegram Members!
Stay connected with the EarnXpress team and receive instant alerts for exclusive high-paying tasks.

### 📋 Instructions:
1. Join our official Telegram Channel: **https://t.me/earnxpresssahmed1_2A**
2. Unmute notifications so you never miss new task drops.
3. Submit your Telegram @username and a screenshot from inside the channel.`,
        acceptanceCriteria: [
          { key: 'channel_member', description: 'Active member of @earnxpresssahmed1_2A on Telegram' },
          { key: 'authenticity', description: 'Authentic account with valid username' },
        ],
        deliverableRequirements: [
          { type: 'FILE', label: 'Screenshot inside the Telegram channel' },
          { type: 'TEXT', label: 'Your Telegram @username' },
        ],
      },
    },
    {
      id: 'task-viral-watch-boost',
      title: 'Real Video Monetization Watch: Watch Full Documentary Video (2+ Mins) & Comment',
      taskModel: 'MULTI_WORKER' as const,
      status: 'OPEN' as const,
      totalSlots: 500,
      availableSlots: 491,
      unitBudgetCents: '15',
      formattedUnitUSD: '$0.15 USD',
      startDeadlineHours: 2,
      completionDurationHours: 12,
      reviewSlaHours: 72,
      maxRevisions: 2,
      createdAt: new Date().toISOString(),
      category: { id: 'c-viral', name: 'Social & Media Growth', slug: 'social-media' },
      subcategory: { id: 'sc-yt', name: 'Watch Time & Engagement', slug: 'watch-time' },
      buyer: {
        id: 'buyer-earnxpress-hq',
        profile: {
          id: 'p-earnxpress',
          displayName: 'EarnXpress Official Growth Lab',
          headline: 'Verified Platform Community Campaign',
          countryCode: 'BD',
          reputationScore: 5.0,
          completionRate: 100.0,
          totalReviewsCount: 520,
        },
      },
      participationStats: {
        totalCapacity: 500,
        remainingAvailableSlots: 491,
        acceptedTotal: 9,
        currentlyWorking: 6,
        submittedForReview: 2,
        reviewOverdue: 0,
        approvedSettled: 1,
        rejectedTerminated: 0,
      },
      instructions: {
        versionNumber: 1,
        descriptionMarkdown: `### 🎯 Watch Time & Real Views Engagement Campaign
Help boost organic search rankings and watch time for the EarnXpress international documentary video!

### 📋 Instructions:
1. Open YouTube: **https://www.youtube.com/@earnxpress-sahmed**
2. Play the official EarnXpress documentary / promo video from beginning to end without fast-forwarding.
3. Like the video and post a thoughtful comment explaining what you like about the zero-fee escrow platform.
4. Take a screenshot showing the red progress bar filled to the end and your posted comment.`,
        acceptanceCriteria: [
          { key: 'full_watch', description: 'Watched the video for at least 2 minutes (evidenced by progress bar)' },
          { key: 'authentic_comment', description: 'Comment must be constructive and relevant (no bot spam)' },
        ],
        deliverableRequirements: [
          { type: 'FILE', label: 'Screenshot of completed video watch and your comment' },
          { type: 'TEXT', label: 'Your YouTube Username' },
        ],
      },
    },
    {
      id: 'task-viral-ref-bounty',
      title: 'Viral Affiliate Bounty: Invite 3 Active Friends Using Your Referral Link (/referrals)',
      taskModel: 'MULTI_WORKER' as const,
      status: 'OPEN' as const,
      totalSlots: 250,
      availableSlots: 234,
      unitBudgetCents: '30',
      formattedUnitUSD: '$0.30 USD',
      startDeadlineHours: 24,
      completionDurationHours: 72,
      reviewSlaHours: 72,
      maxRevisions: 2,
      createdAt: new Date().toISOString(),
      category: { id: 'c-viral', name: 'Affiliate & Referral', slug: 'affiliate' },
      subcategory: { id: 'sc-ref', name: 'Friend Invitations', slug: 'referral-growth' },
      buyer: {
        id: 'buyer-earnxpress-hq',
        profile: {
          id: 'p-earnxpress',
          displayName: 'EarnXpress Official Growth Lab',
          headline: 'Verified Platform Community Campaign',
          countryCode: 'BD',
          reputationScore: 5.0,
          completionRate: 100.0,
          totalReviewsCount: 520,
        },
      },
      participationStats: {
        totalCapacity: 250,
        remainingAvailableSlots: 234,
        acceptedTotal: 16,
        currentlyWorking: 10,
        submittedForReview: 4,
        reviewOverdue: 0,
        approvedSettled: 2,
        rejectedTerminated: 0,
      },
      instructions: {
        versionNumber: 1,
        descriptionMarkdown: `### 🎯 Referral Multiplier Bounty!
Earn an extra $0.30 cash bonus on top of your standard ৳10 per-worker commission by inviting 3 active friends!

### 📋 Instructions:
1. Go to your Referral Center at **/referrals** and copy your unique link or code.
2. Share your link with friends in freelancing groups, WhatsApp, or Facebook.
3. Once 3 of your friends register their free accounts and verify their email, submit their email prefixes or usernames.
4. You receive this $0.30 bounty plus your regular referral commissions!`,
        acceptanceCriteria: [
          { key: 'genuine_users', description: 'Minimum 3 real friends registered with your referral link' },
          { key: 'email_verified', description: 'Referred friends must have verified their email' },
        ],
        deliverableRequirements: [
          { type: 'TEXT', label: 'Your Referral Code and the 3 invited emails/usernames' },
          { type: 'FILE', label: 'Screenshot of your referral dashboard or WhatsApp invite chats' },
        ],
      },
    },
    {
      id: 'task-app-qa-1',
      title: 'Mobile App QA & Usability Review: Install Android App, Test Signup & Share Experience',
      taskModel: 'MULTI_WORKER' as const,
      status: 'OPEN' as const,
      totalSlots: 150,
      availableSlots: 64,
      unitBudgetCents: '125',
      formattedUnitUSD: '$1.25 USD',
      startDeadlineHours: 3,
      completionDurationHours: 12,
      reviewSlaHours: 48,
      maxRevisions: 2,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      category: { id: 'c-app', name: 'App Testing & QA', slug: 'app-testing' },
      subcategory: { id: 'sc-qa', name: 'Mobile Usability', slug: 'mobile-usability' },
      buyer: {
        id: 'buyer-novafintech',
        profile: {
          id: 'p-novafintech',
          displayName: 'NovaFintech Digital Labs',
          headline: 'Mobile Payment App Testing Team',
          countryCode: 'GB',
          reputationScore: 4.98,
          completionRate: 99.1,
          totalReviewsCount: 340,
        },
      },
      participationStats: {
        totalCapacity: 150,
        remainingAvailableSlots: 64,
        acceptedTotal: 86,
        currentlyWorking: 14,
        submittedForReview: 12,
        reviewOverdue: 0,
        approvedSettled: 60,
        rejectedTerminated: 0,
      },
      instructions: {
        versionNumber: 1,
        descriptionMarkdown: `### 🎯 Campaign Goal:
Test our new mobile app onboarding flow and verify signup performance on Android devices.

### 📋 Step-by-Step Instructions:
1. Download and install the app from Google Play or provided test link.
2. Open the app, create a test account using your email, and explore the main dashboard for 3 minutes.
3. Take a screenshot showing the app running on your phone's home screen.
4. Submit a genuine 2-sentence user experience feedback regarding speed and navigation.`,
        acceptanceCriteria: [
          { key: 'install_proof', description: 'Clear unedited screenshot of app installed on device' },
          { key: 'genuine_feedback', description: 'At least 2 constructive sentences describing onboarding smoothness' },
        ],
        deliverableRequirements: [
          { type: 'FILE', label: 'Screenshot of installed app on your mobile screen' },
          { type: 'TEXT', label: 'Brief feedback & device model (e.g. Samsung A52, Android 13)' },
        ],
      },
    },
    {
      id: 'task-lead-gen-2',
      title: 'B2B Market Research: Collect 25 Fashion Boutiques in Dhaka with Phone & Active Facebook Page',
      taskModel: 'MULTI_WORKER' as const,
      status: 'OPEN' as const,
      totalSlots: 25,
      availableSlots: 9,
      unitBudgetCents: '450',
      formattedUnitUSD: '$4.50 USD',
      startDeadlineHours: 6,
      completionDurationHours: 24,
      reviewSlaHours: 48,
      maxRevisions: 2,
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      category: { id: 'c-leads', name: 'Market Research & Leads', slug: 'market-research' },
      subcategory: { id: 'sc-b2b', name: 'Local Business Leads', slug: 'b2b-leads' },
      buyer: {
        id: 'buyer-apextrade',
        profile: {
          id: 'p-apextrade',
          displayName: 'Apex Trade & Logistics BD',
          headline: 'Verified Commercial Merchant',
          countryCode: 'BD',
          reputationScore: 5.0,
          completionRate: 100.0,
          totalReviewsCount: 185,
        },
      },
      participationStats: {
        totalCapacity: 25,
        remainingAvailableSlots: 9,
        acceptedTotal: 16,
        currentlyWorking: 5,
        submittedForReview: 3,
        reviewOverdue: 0,
        approvedSettled: 8,
        rejectedTerminated: 0,
      },
      instructions: {
        versionNumber: 1,
        descriptionMarkdown: `### 🎯 Campaign Goal:
Build a verified directory of 25 independent clothing & fashion boutiques operating in Dhaka.

### 📋 Instructions:
1. Search Facebook, Instagram, or Google Maps for retail fashion boutiques located in Dhaka (e.g. Dhanmondi, Banani, Uttara, Mirpur).
2. For each boutique, record: Store Name, Physical Address/Area, Active Phone Number, and Facebook Page URL.
3. Organize the 25 entries in a clean Google Sheet or Excel table.
4. Ensure all phone numbers are working and active.`,
        acceptanceCriteria: [
          { key: 'completeness', description: 'Full 25 entries with valid name, area, phone number, and social URL' },
          { key: 'no_duplicates', description: 'All 25 boutiques must be unique within Dhaka metropolitan' },
        ],
        deliverableRequirements: [
          { type: 'URL', label: 'Google Sheets link (View/Comment access enabled)' },
          { type: 'TEXT', label: 'Summary of top 3 areas researched' },
        ],
      },
    },
    {
      id: 'task-canva-design-3',
      title: 'YouTube Thumbnail Creative Pack: Design 3 High-CTR Thumbnails in Canva (1280x720)',
      taskModel: 'MULTI_WORKER' as const,
      status: 'OPEN' as const,
      totalSlots: 15,
      availableSlots: 5,
      unitBudgetCents: '600',
      formattedUnitUSD: '$6.00 USD',
      startDeadlineHours: 8,
      completionDurationHours: 24,
      reviewSlaHours: 48,
      maxRevisions: 2,
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      category: { id: 'c-design', name: 'Graphic Design & Creative', slug: 'graphic-design' },
      subcategory: { id: 'sc-thumb', name: 'Social Media Thumbnails', slug: 'thumbnails' },
      buyer: {
        id: 'buyer-techbyte',
        profile: {
          id: 'p-techbyte',
          displayName: 'TechByte Creator Network',
          headline: 'International Tech Media & Creator Studio',
          countryCode: 'US',
          reputationScore: 4.96,
          completionRate: 98.8,
          totalReviewsCount: 220,
        },
      },
      participationStats: {
        totalCapacity: 15,
        remainingAvailableSlots: 5,
        acceptedTotal: 10,
        currentlyWorking: 3,
        submittedForReview: 2,
        reviewOverdue: 0,
        approvedSettled: 5,
        rejectedTerminated: 0,
      },
      instructions: {
        versionNumber: 1,
        descriptionMarkdown: `### 🎯 Campaign Goal:
Create 3 modern, high-converting YouTube video thumbnails (1280x720) in Canva or Photoshop.

### 📋 Instructions:
1. Video Topic: "How to Start Freelancing in 2026 Without Investment".
2. Use bold readable typography (maximum 4 words on thumbnail), high-contrast gradients, and engaging visual hierarchy.
3. Design 3 unique layout variations so we can A/B test them on YouTube.
4. Export high-resolution JPG/PNG and provide the shareable Canva link.`,
        acceptanceCriteria: [
          { key: 'resolution', description: 'Exact 1280x720 pixels (16:9 aspect ratio)' },
          { key: 'visual_quality', description: 'Clean readable text on mobile screens with high contrast' },
        ],
        deliverableRequirements: [
          { type: 'URL', label: 'Shareable Canva view/edit link or Google Drive folder' },
          { type: 'FILE', label: 'Direct PNG/JPG thumbnail image preview' },
        ],
      },
    },
    {
      id: 'task-reels-caption-4',
      title: 'Shorts / Reels Video Captioning: Create Synced Bengali & English Subtitles for 60-Sec Video',
      taskModel: 'MULTI_WORKER' as const,
      status: 'OPEN' as const,
      totalSlots: 40,
      availableSlots: 18,
      unitBudgetCents: '280',
      formattedUnitUSD: '$2.80 USD',
      startDeadlineHours: 4,
      completionDurationHours: 12,
      reviewSlaHours: 48,
      maxRevisions: 2,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      category: { id: 'c-video', name: 'Video & Audio Editing', slug: 'video-editing' },
      subcategory: { id: 'sc-subs', name: 'Subtitles & Captions', slug: 'captions' },
      buyer: {
        id: 'buyer-sparksocial',
        profile: {
          id: 'p-sparksocial',
          displayName: 'Spark Social Media Studio',
          headline: 'Viral Short-Form Content Agency',
          countryCode: 'AE',
          reputationScore: 5.0,
          completionRate: 100.0,
          totalReviewsCount: 165,
        },
      },
      participationStats: {
        totalCapacity: 40,
        remainingAvailableSlots: 18,
        acceptedTotal: 22,
        currentlyWorking: 7,
        submittedForReview: 4,
        reviewOverdue: 0,
        approvedSettled: 11,
        rejectedTerminated: 0,
      },
      instructions: {
        versionNumber: 1,
        descriptionMarkdown: `### 🎯 Campaign Goal:
Transcribe and generate accurately timed captions for a 60-second marketing reel.

### 📋 Instructions:
1. Listen to the provided 60-second audio/video snippet.
2. Produce word-by-word synced captions formatted for CapCut or SRT subtitle format.
3. Ensure zero spelling errors in Bengali terminology and clean English formatting.
4. Deliver SRT file or clear timestamped text script.`,
        acceptanceCriteria: [
          { key: 'accuracy', description: '100% accurate transcription matching spoken audio' },
          { key: 'timing', description: 'Accurate second-by-second timestamps for fast-paced vertical video' },
        ],
        deliverableRequirements: [
          { type: 'TEXT', label: 'Timestamped captions script' },
          { type: 'URL', label: 'SRT subtitle file link or Google Doc' },
        ],
      },
    },
    {
      id: 'task-local-audit-5',
      title: 'Local Merchant Usability Audit: Verify Shop Location, Opening Hours & Upload Front Photo',
      taskModel: 'MULTI_WORKER' as const,
      status: 'OPEN' as const,
      totalSlots: 200,
      availableSlots: 114,
      unitBudgetCents: '90',
      formattedUnitUSD: '$0.90 USD',
      startDeadlineHours: 4,
      completionDurationHours: 16,
      reviewSlaHours: 48,
      maxRevisions: 2,
      createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
      category: { id: 'c-field', name: 'Field Research & Verification', slug: 'field-research' },
      subcategory: { id: 'sc-audit', name: 'Location Audits', slug: 'location-audit' },
      buyer: {
        id: 'buyer-geodata',
        profile: {
          id: 'p-geodata',
          displayName: 'GeoData Map Intelligence',
          headline: 'Enterprise Mapping & Location Intelligence',
          countryCode: 'SG',
          reputationScore: 4.97,
          completionRate: 99.4,
          totalReviewsCount: 480,
        },
      },
      participationStats: {
        totalCapacity: 200,
        remainingAvailableSlots: 114,
        acceptedTotal: 86,
        currentlyWorking: 22,
        submittedForReview: 14,
        reviewOverdue: 0,
        approvedSettled: 50,
        rejectedTerminated: 0,
      },
      instructions: {
        versionNumber: 1,
        descriptionMarkdown: `### 🎯 Campaign Goal:
Verify local commercial businesses, opening hours, and street signage for our merchant directory.

### 📋 Instructions:
1. Locate any commercial retail shop, restaurant, or service center in your local market area.
2. Take a clear daytime photo of the storefront showing the business name signboard.
3. Check and note the current opening and closing hours.
4. Take a screenshot showing your Google Maps GPS pin at that location.`,
        acceptanceCriteria: [
          { key: 'signboard_photo', description: 'Clear readable photo of merchant signboard' },
          { key: 'hours_info', description: 'Accurate operating hours and business days' },
        ],
        deliverableRequirements: [
          { type: 'FILE', label: 'Storefront signboard photo' },
          { type: 'TEXT', label: 'Business Name, Area & Opening Hours' },
        ],
      },
    },
    {
      id: 'task-shopify-catalog-6',
      title: 'E-Commerce Store Catalog Upload: Add 15 Apparel Products with Titles, Prices & Clean Images',
      taskModel: 'MULTI_WORKER' as const,
      status: 'OPEN' as const,
      totalSlots: 12,
      availableSlots: 4,
      unitBudgetCents: '800',
      formattedUnitUSD: '$8.00 USD',
      startDeadlineHours: 8,
      completionDurationHours: 36,
      reviewSlaHours: 48,
      maxRevisions: 2,
      createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
      category: { id: 'c-ecom', name: 'E-Commerce & Virtual Assistance', slug: 'ecommerce-va' },
      subcategory: { id: 'sc-upload', name: 'Product Catalog Management', slug: 'product-upload' },
      buyer: {
        id: 'buyer-stylebazaar',
        profile: {
          id: 'p-stylebazaar',
          displayName: 'StyleBazaar BD Fashion',
          headline: 'Leading Online Retail Brand',
          countryCode: 'BD',
          reputationScore: 5.0,
          completionRate: 100.0,
          totalReviewsCount: 95,
        },
      },
      participationStats: {
        totalCapacity: 12,
        remainingAvailableSlots: 4,
        acceptedTotal: 8,
        currentlyWorking: 2,
        submittedForReview: 1,
        reviewOverdue: 0,
        approvedSettled: 5,
        rejectedTerminated: 0,
      },
      instructions: {
        versionNumber: 1,
        descriptionMarkdown: `### 🎯 Campaign Goal:
Upload 15 new lifestyle apparel items to our store catalog sheet with formatted details.

### 📋 Instructions:
1. Review the provided supplier photo album (link in task).
2. For each of the 15 items, write an SEO-optimized product title (e.g. "Men's Slim Fit Cotton Polo Shirt - Navy Blue").
3. Assign proper category, color tag, available sizes (M, L, XL, XXL), and retail price.
4. Deliver completed catalog spreadsheet or CSV file.`,
        acceptanceCriteria: [
          { key: 'formatting', description: 'Clean CSV or Google Sheet with non-empty attributes' },
          { key: 'seo_titles', description: 'Grammatically sound product titles without typos' },
        ],
        deliverableRequirements: [
          { type: 'URL', label: 'Completed Google Sheet or CSV cloud link' },
          { type: 'TEXT', label: 'Catalog summary count & notes' },
        ],
      },
    },
  ] as Task[],

  participations: [
    {
      id: 'part-201',
      taskId: 'task-viral-yt-1m',
      slotNumber: 7,
      workerId: 'worker-user-1',
      status: 'IN_PROGRESS' as const,
      startDeadlineAt: new Date(Date.now() + 4 * 3600000).toISOString(),
      executionDeadlineAt: new Date(Date.now() + 20 * 3600000).toISOString(),
      revisionsUsed: 0,
      progressPercentage: 66,
      milestones: [
        {
          id: 'm1',
          participationId: 'part-201',
          milestoneOrder: 1,
          title: 'Sample 100 entries batch verified',
          isCompleted: true,
          isVerified: true,
          completedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        },
        {
          id: 'm2',
          participationId: 'part-201',
          milestoneOrder: 2,
          title: '1,000 titles annotated (50% progress)',
          isCompleted: true,
          isVerified: true,
          completedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: 'm3',
          participationId: 'part-201',
          milestoneOrder: 3,
          title: 'Complete 2,000 dataset validated',
          isCompleted: false,
          isVerified: false,
        },
      ],
      task: {
        id: 'task-viral-yt-1m',
        title: 'YouTube 1M Mission: Watch EarnXpress Video, Like & Subscribe (@earnxpress-sahmed)',
        taskModel: 'MULTI_WORKER' as const,
        status: 'OPEN' as const,
        totalSlots: 50,
        availableSlots: 28,
        unitBudgetCents: '2500',
        formattedUnitUSD: '$25.00 USD',
        startDeadlineHours: 6,
        completionDurationHours: 24,
        reviewSlaHours: 72,
        maxRevisions: 2,
        createdAt: new Date().toISOString(),
      },
    },
    {
      id: 'part-202',
      taskId: 'task-viral-fb-1m',
      slotNumber: 3,
      workerId: 'worker-user-1',
      status: 'SUBMITTED' as const,
      startDeadlineAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      executionDeadlineAt: new Date(Date.now() + 3600000 * 14).toISOString(),
      submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      reviewOverdueAt: new Date(Date.now() + 3600000 * 68).toISOString(),
      revisionsUsed: 0,
      progressPercentage: 100,
      milestones: [
        {
          id: 'm10',
          participationId: 'part-202',
          milestoneOrder: 1,
          title: 'First 10 articles translated',
          isCompleted: true,
          isVerified: true,
        },
        {
          id: 'm11',
          participationId: 'part-202',
          milestoneOrder: 2,
          title: '30 articles completed',
          isCompleted: true,
          isVerified: true,
        },
        {
          id: 'm12',
          participationId: 'part-202',
          milestoneOrder: 3,
          title: 'All 50 articles proofread',
          isCompleted: true,
          isVerified: true,
        },
      ],
      submissionVersions: [
        {
          id: 'subv-1',
          versionNumber: 1,
          textNotes: 'Completed full Bangla translation of the 50 articles with preserved bash code snippets.',
          deliverableUrls: ['https://storage.earnxpress.demo/deliverables/bangla-docs-v1.zip'],
          submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
      ],
      task: {
        id: 'task-viral-fb-1m',
        title: 'Facebook 1M Mission: Follow Official Page, Like Pinned Post & Share',
        taskModel: 'MULTI_WORKER' as const,
        status: 'OPEN' as const,
        totalSlots: 20,
        availableSlots: 6,
        unitBudgetCents: '4500',
        formattedUnitUSD: '$45.00 USD',
        startDeadlineHours: 8,
        completionDurationHours: 48,
        reviewSlaHours: 72,
        maxRevisions: 2,
        createdAt: new Date().toISOString(),
      },
    },
  ] as WorkerParticipation[],

  wallet: {
    availableCents: 18500, // DEMO $185.00
    escrowCents: 4500,     // DEMO $45.00
    transactions: [
      {
        id: 'tx-1',
        referenceType: 'DEMO_FAUCET_CLAIM',
        referenceId: 'faucet-init',
        description: 'DEMO faucet credit (welcome testing balance)',
        amountCents: '100000',
        formattedAmountUSD: 'DEMO +$1,000.00 USD',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'tx-2',
        referenceType: 'DEMO_TASK_ESCROW_LOCK',
        referenceId: 'task-viral-yt-1m',
        description: 'Escrow allocated for YouTube 1M Community Campaign',
        amountCents: '127500',
        formattedAmountUSD: 'DEMO -$1,275.00 USD',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'tx-3',
        referenceType: 'DEMO_TASK_SLOT_PAYOUT',
        referenceId: 'part-prev',
        description: 'DEMO payout received: Data cleaning completed slot',
        amountCents: '2400',
        formattedAmountUSD: 'DEMO +$24.00 USD',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ] as DemoLedgerTransaction[],
  },

  users: [
    {
      id: 'user-shihab-owner',
      email: 'shihab.owner@earnxpress.com',
      role: 'PLATFORM_OWNER',
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      profile: {
        id: 'p-shihab',
        displayName: 'Shihab Ahmed (Platform Founder & Owner)',
        headline: 'Executive Platform Architect & Systems Administrator',
        countryCode: 'BD',
        reputationScore: 5.0,
        completionRate: 100.0,
        totalReviewsCount: 1250,
      },
    },
    {
      id: 'user-rakib-worker',
      email: 'rakib.worker@gmail.com',
      role: 'WORKER',
      status: 'ACTIVE',
      createdAt: '2026-01-15T08:30:00.000Z',
      profile: {
        id: 'p-rakib',
        displayName: 'Rakib Hasan',
        headline: 'Top-Rated Microtask Specialist & Video Reviewer',
        countryCode: 'BD',
        reputationScore: 4.96,
        completionRate: 99.4,
        totalReviewsCount: 148,
      },
    },
    {
      id: 'user-nusrat-worker',
      email: 'nusrat.freelance@gmail.com',
      role: 'WORKER',
      status: 'ACTIVE',
      createdAt: '2026-02-01T10:15:00.000Z',
      profile: {
        id: 'p-nusrat',
        displayName: 'Nusrat Jahan',
        headline: 'Social Media Campaigner & Translation Pro',
        countryCode: 'BD',
        reputationScore: 4.98,
        completionRate: 98.7,
        totalReviewsCount: 96,
      },
    },
    {
      id: 'user-tanvir-worker',
      email: 'tanvir.coder@gmail.com',
      role: 'WORKER',
      status: 'ACTIVE',
      createdAt: '2026-02-10T14:20:00.000Z',
      profile: {
        id: 'p-tanvir',
        displayName: 'Tanvir Ahmed',
        headline: 'App QA Tester & Community Growth Scout',
        countryCode: 'BD',
        reputationScore: 4.89,
        completionRate: 97.5,
        totalReviewsCount: 64,
      },
    },
    {
      id: 'user-growth-buyer',
      email: 'campaigns@growthagency.bd',
      role: 'BUYER',
      status: 'ACTIVE',
      createdAt: '2026-01-10T12:00:00.000Z',
      profile: {
        id: 'p-growth',
        displayName: 'Digital Growth Agency BD',
        headline: 'Verified Enterprise Marketing & Traffic Network',
        countryCode: 'BD',
        reputationScore: 5.0,
        completionRate: 100.0,
        totalReviewsCount: 310,
      },
    },
    {
      id: 'user-apex-buyer',
      email: 'reach@apexmarketing.org',
      role: 'BUYER',
      status: 'ACTIVE',
      createdAt: '2026-01-20T09:45:00.000Z',
      profile: {
        id: 'p-apex',
        displayName: 'Apex Global Media Lab',
        headline: 'International Tech & Crowdsourced Operations',
        countryCode: 'US',
        reputationScore: 4.95,
        completionRate: 99.1,
        totalReviewsCount: 185,
      },
    },
  ],

  deposits: [
    {
      id: 'dep-1',
      orderId: 'ORD-DEP-2026-001',
      userId: 'user-growth-buyer',
      userName: 'Digital Growth Agency BD',
      userEmail: 'campaigns@growthagency.bd',
      paymentMethod: 'BKASH_MERCHANT',
      amountUSD: '50.00',
      amountBDT: '6,000.00 BDT',
      status: 'PENDING',
      transactionRef: '9K82JD91A',
      senderNumber: '01786-543210',
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
    {
      id: 'dep-2',
      orderId: 'ORD-DEP-2026-002',
      userId: 'user-apex-buyer',
      userName: 'Apex Global Media Lab',
      userEmail: 'reach@apexmarketing.org',
      paymentMethod: 'NAGAD_DIRECT',
      amountUSD: '120.00',
      amountBDT: '14,400.00 BDT',
      status: 'SUCCEEDED',
      transactionRef: '8M32PL09B',
      senderNumber: '01812-345678',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 'dep-3',
      orderId: 'ORD-DEP-2026-003',
      userId: 'user-growth-buyer',
      userName: 'Digital Growth Agency BD',
      userEmail: 'campaigns@growthagency.bd',
      paymentMethod: 'ROCKET_PAY',
      amountUSD: '35.00',
      amountBDT: '4,200.00 BDT',
      status: 'SUCCEEDED',
      transactionRef: '7X41MN82C',
      senderNumber: '01923-456789',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: 'dep-4',
      orderId: 'ORD-DEP-2026-004',
      userId: 'user-growth-buyer',
      userName: 'Digital Growth Agency BD',
      userEmail: 'campaigns@growthagency.bd',
      paymentMethod: 'BANK_TRANSFER',
      amountUSD: '500.00',
      amountBDT: '60,000.00 BDT',
      status: 'SUCCEEDED',
      transactionRef: 'CBL-9921827',
      senderNumber: 'City Bank BD AC #210344819',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
    {
      id: 'dep-5',
      orderId: 'ORD-DEP-2026-005',
      userId: 'user-apex-buyer',
      userName: 'Apex Global Media Lab',
      userEmail: 'reach@apexmarketing.org',
      paymentMethod: 'BKASH_MERCHANT',
      amountUSD: '25.00',
      amountBDT: '3,000.00 BDT',
      status: 'PENDING',
      transactionRef: '6P99LQ14D',
      senderNumber: '01611-223344',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
  ],

  withdrawals: [

    {
      id: 'w-1',
      userId: 'user-rakib-worker',
      userName: 'Rakib Hasan',
      userEmail: 'rakib.worker@gmail.com',
      method: 'BKASH',
      amountUSD: '25.00',
      amountBDT: '3,000.00 BDT',
      status: 'PENDING',
      accountNumber: '01711-223344',
      requestedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'w-2',
      userId: 'user-nusrat-worker',
      userName: 'Nusrat Jahan',
      userEmail: 'nusrat.freelance@gmail.com',
      method: 'NAGAD',
      amountUSD: '15.00',
      amountBDT: '1,800.00 BDT',
      status: 'PENDING',
      accountNumber: '01822-334455',
      requestedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: 'w-3',
      userId: 'user-tanvir-worker',
      userName: 'Tanvir Ahmed',
      userEmail: 'tanvir.coder@gmail.com',
      method: 'ROCKET',
      amountUSD: '40.00',
      amountBDT: '4,800.00 BDT',
      status: 'COMPLETED',
      accountNumber: '01933-445566',
      payoutTxId: 'ROK-SETTLE-8812',
      requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      settledAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    },
    {
      id: 'w-4',
      userId: 'user-rakib-worker',
      userName: 'Rakib Hasan',
      userEmail: 'rakib.worker@gmail.com',
      method: 'BANK_WIRE',
      amountUSD: '100.00',
      amountBDT: '12,000.00 BDT',
      status: 'COMPLETED',
      accountNumber: 'Islami Bank BD AC #2050182736',
      payoutTxId: 'IBBL-WIRE-9901',
      requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      settledAt: new Date(Date.now() - 1000 * 60 * 60 * 65).toISOString(),
    },
  ],

  disputes: [
    {
      id: 'disp-1',
      taskId: 'task-viral-yt-1m',
      taskTitle: 'YouTube 1M Mission: Watch EarnXpress Video, Like & Subscribe',
      initiatorRole: 'WORKER',
      workerName: 'Rakib Hasan',
      buyerName: 'EarnXpress Official Growth Lab',
      status: 'OPEN',
      reason: 'Submitted verified screenshot showing channel subscribed & bell on. Awaiting review clearance.',
      disputedAmountUSD: '$0.12 USD',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      id: 'disp-2',
      taskId: 'task-viral-yt-1m',
      taskTitle: 'YouTube 1M Mission: Watch Video & Subscribe',
      initiatorRole: 'BUYER',
      workerName: 'Farzana Akter',
      buyerName: 'Apex Global Media Lab',
      status: 'RESOLVED',
      resolution: 'Worker uploaded corrected JSON tagging schema per buyer guidelines. 100% payout released.',
      disputedAmountUSD: '$24.00 USD',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    },
  ],

  submissions: [
    {
      id: 'sub-1',
      taskId: 'task-viral-yt-1m',
      taskTitle: 'YouTube 1M Mission: Watch EarnXpress Video, Like & Subscribe (@earnxpress-sahmed)',
      workerId: 'user-rakib-worker',
      workerName: 'Rakib Hasan',
      workerEmail: 'rakib.worker@gmail.com',
      status: 'SUBMITTED',
      unitBudgetCents: '12',
      formattedPayout: '$0.12 USD',
      submittedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      deliverableText: 'Subscribed to @earnxpress-sahmed with notification bell turned on! Watched full 1:55 documentary video. Channel name: @rakib_freelance',
      deliverableFile: 'https://earnxpress-marketplace.vercel.app/youtube-banner-2560x1440.png',
    },
    {
      id: 'sub-2',
      taskId: 'task-viral-fb-1m',
      taskTitle: 'Facebook 1M Mission: Follow Official Page, Like Pinned Post & Share',
      workerId: 'user-nusrat-worker',
      workerName: 'Nusrat Jahan',
      workerEmail: 'nusrat.freelance@gmail.com',
      status: 'SUBMITTED',
      unitBudgetCents: '10',
      formattedPayout: '$0.10 USD',
      submittedAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      deliverableText: 'Followed Facebook page and shared the pinned documentary video publicly to my profile: facebook.com/nusrat.freelancer',
      deliverableFile: 'https://earnxpress-marketplace.vercel.app/youtube-profile-1024x1024.png',
    },
    {
      id: 'sub-3',
      taskId: 'task-viral-tg-1m',
      taskTitle: 'Telegram Community Surge: Join Official Channel & React to Pinned Alert',
      workerId: 'user-tanvir-worker',
      workerName: 'Tanvir Ahmed',
      workerEmail: 'tanvir.coder@gmail.com',
      status: 'APPROVED',
      unitBudgetCents: '8',
      formattedPayout: '$0.08 USD',
      submittedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      approvedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      deliverableText: 'Joined @earnxpresssahmed1_2A, left rocket reaction on pinned announcement. Telegram handle: @tanvir_dev',
      deliverableFile: 'https://earnxpress-marketplace.vercel.app/youtube-profile-1024x1024.png',
    },
    {
      id: 'sub-4',
      taskId: 'task-viral-watch-boost',
      taskTitle: 'Video Watch & High-Retention Boost: Watch 2-Min Promo & Share Thoughts',
      workerId: 'user-rakib-worker',
      workerName: 'Rakib Hasan',
      workerEmail: 'rakib.worker@gmail.com',
      status: 'SUBMITTED',
      unitBudgetCents: '15',
      formattedPayout: '$0.15 USD',
      submittedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      deliverableText: 'Watched full 1:55 documentary video. Commented: EarnXpress zero-fee microtask system is truly revolutionary for freelancers!',
      deliverableFile: 'https://earnxpress-marketplace.vercel.app/youtube-banner-2560x1440.png',
    },
  ],

  auditLogs: [
    {
      id: 'audit-1',
      actorRole: 'PLATFORM_OWNER',
      action: 'PLATFORM_BOOTSTRAP',
      resourceType: 'System',
      resourceId: 'root-sys',
      ipAddress: '127.0.0.1',
      reason: 'Initialized EarnXpress Phase 1 backend modular monolith',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'audit-2',
      actorRole: 'BUYER',
      action: 'TASK_PUBLISHED',
      resourceType: 'Task',
      resourceId: 'task-101',
      ipAddress: '192.168.1.10',
      reason: 'Published campaign with 50 slots and locked demo escrow',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'audit-3',
      actorRole: 'WORKER',
      action: 'TASK_SLOT_ACCEPTED',
      resourceType: 'WorkerParticipation',
      resourceId: 'part-201',
      ipAddress: '192.168.1.45',
      reason: 'Worker claimed slot on open marketplace with row-level lock',
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
      id: 'audit-4',
      actorRole: 'WORKER',
      action: 'WORK_SUBMITTED',
      resourceType: 'WorkerParticipation',
      resourceId: 'part-202',
      ipAddress: '192.168.1.45',
      reason: 'Worker submitted deliverables for review',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ],
};

// Helper to get auth headers with JWT from localStorage
function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('earnxpress_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

// Centralized Typed API Client
export const api = {
  // Public Market Stats
  async getPublicStats(): Promise<{
    activeTasksCount: number;
    verifiedWorkersCount: number;
    totalSlotsCount: number;
    availableSlotsCount: number;
    totalParticipationsCount: number;
    settlementRatePercent: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/public/platform-stats`);
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // ignore
    }
    return {
      activeTasksCount: 0,
      verifiedWorkersCount: 0,
      totalSlotsCount: 0,
      availableSlotsCount: 0,
      totalParticipationsCount: 0,
      settlementRatePercent: '100.0',
    };
  },

  // Tasks
  async getTasks(params?: { search?: string; categoryId?: string; taskModel?: string }): Promise<{ data: Task[]; meta: { totalCount: number } }> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.categoryId) query.append('categoryId', params.categoryId);
      if (params?.taskModel) query.append('taskModel', params.taskModel);

      const res = await fetch(`${API_BASE_URL}/tasks?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const taskArray = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : null;
        if (taskArray && taskArray.length > 0) {
          return { data: taskArray, meta: json.meta || { totalCount: taskArray.length } };
        }
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      let results = [...demoDb.tasks];
      if (params?.search) {
        const s = params.search.toLowerCase();
        results = results.filter((t) => t.title.toLowerCase().includes(s));
      }
      if (params?.taskModel) {
        results = results.filter((t) => t.taskModel === params.taskModel);
      }
      return { data: results, meta: { totalCount: results.length } };
    }

    return { data: [], meta: { totalCount: 0 } };
  },

  async getTaskById(id: string): Promise<Task | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${id}`);
      if (res.ok) {
        const json = await res.json();
        const task = json.data || json;
        if (task && task.id) {
          return task as Task;
        }
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      const found = demoDb.tasks.find((t) => t.id === id);
      if (found) return found;
      return demoDb.tasks[0] || null;
    }

    return null;
  },

  async acceptSlot(taskId: string): Promise<{ success: boolean; participation?: any; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/accept-slot`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, ...(json.data || json) };
      } else {
        const errJson = await res.json().catch(() => null);
        return { success: false, message: errJson?.message || 'Failed to claim task slot' };
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      const task = demoDb.tasks.find((t) => t.id === taskId);
      if (task && task.availableSlots > 0) {
        task.availableSlots -= 1;
        if (task.participationStats) {
          task.participationStats.remainingAvailableSlots -= 1;
          task.participationStats.acceptedTotal += 1;
          task.participationStats.currentlyWorking += 1;
        }

        const newParticipation: WorkerParticipation = {
          id: `part-${Date.now()}`,
          taskId: task.id,
          slotNumber: task.totalSlots - task.availableSlots,
          workerId: 'worker-user-1',
          status: 'IN_PROGRESS',
          startDeadlineAt: new Date(Date.now() + task.startDeadlineHours * 3600000).toISOString(),
          executionDeadlineAt: new Date(Date.now() + task.completionDurationHours * 3600000).toISOString(),
          revisionsUsed: 0,
          progressPercentage: 0,
          task,
          milestones: task.instructions?.milestones?.map((m) => ({
            id: `m-${Date.now()}-${m.order}`,
            participationId: `part-${Date.now()}`,
            milestoneOrder: m.order,
            title: m.title,
            isCompleted: false,
            isVerified: false,
          })) || [],
        };

        demoDb.participations.unshift(newParticipation);
        return { success: true, participation: newParticipation };
      }
      return { success: false, message: 'All slots claimed' };
    }

    return { success: false, message: 'Server communication error claiming slot' };
  },

  // Worker Endpoints
  async getWorkerParticipations(): Promise<WorkerParticipation[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/participations/my`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        if (list.length > 0) return list;
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      return [...demoDb.participations];
    }

    return [];
  },

  async getParticipationById(id: string): Promise<WorkerParticipation | undefined> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/participations/${id}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const part = json.data || json;
        if (part && part.id) return part;
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      return demoDb.participations.find((p) => p.id === id) || demoDb.participations[0];
    }

    return undefined;
  },

  async updateMilestone(participationId: string, milestoneId: string, isCompleted: boolean) {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/participations/${participationId}/milestones/${milestoneId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isCompleted }),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      const part = demoDb.participations.find((p) => p.id === participationId);
      if (part && part.milestones) {
        const m = part.milestones.find((x) => x.id === milestoneId);
        if (m) {
          m.isCompleted = isCompleted;
          m.isVerified = isCompleted;
        }
        const completed = part.milestones.filter((x) => x.isCompleted).length;
        part.progressPercentage = Math.round((completed / part.milestones.length) * 100);
        return { success: true, progressPercentage: part.progressPercentage };
      }
      return { success: true, progressPercentage: 100 };
    }

    return { success: false, message: 'Server error updating milestone' };
  },

  async submitWork(participationId: string, content: string, deliverableUrls?: string[]) {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/participations/${participationId}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: content || 'Deliverable submission', deliverableUrls: deliverableUrls || [] }),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, ...(json.data || json) };
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      const part = demoDb.participations.find((p) => p.id === participationId);
      if (part) {
        part.status = 'SUBMITTED';
        part.progressPercentage = 100;
        part.submittedAt = new Date().toISOString();
        part.reviewOverdueAt = new Date(Date.now() + 72 * 3600000).toISOString();
        if (!part.submissionVersions) part.submissionVersions = [];
        part.submissionVersions.push({
          id: `subv-${Date.now()}`,
          versionNumber: part.submissionVersions.length + 1,
          textNotes: content,
          deliverableUrls,
          submittedAt: new Date().toISOString(),
        });
        return { success: true, status: 'SUBMITTED', submissionVersion: part.submissionVersions.length };
      }
      return { success: true, status: 'SUBMITTED' };
    }

    return { success: false, message: 'Server error submitting deliverables' };
  },

  // Buyer Endpoints
  async createBuyerTask(data: any): Promise<{ success: boolean; task?: any; message?: string }> {
    try {
      const payload = {
        categoryId: data.categoryId || 'd2fdddae-e0ce-49c6-a04f-98b3cbf04928',
        subcategoryId: data.subcategoryId || 'a7c8c961-93cb-472a-9322-b64932680076',
        taskModel: data.taskModel || 'MULTI_WORKER',
        title: data.title,
        descriptionMarkdown: data.descriptionMarkdown || data.description || 'Task instructions and details',
        totalSlots: Number(data.totalSlots) || 1,
        unitBudgetCents: Number(data.unitBudgetCents) || 2500,
        maxRevisions: Number(data.maxRevisions) || 2,
        startDeadlineHours: Number(data.startDeadlineHours) || 6,
        completionDurationHours: Number(data.completionDurationHours) || 24,
        acceptanceCriteria: (data.acceptanceCriteria && data.acceptanceCriteria.length >= 2
          ? data.acceptanceCriteria
          : [
              { key: 'criterion_1', description: 'Deliverable complies with all technical guidelines' },
              { key: 'criterion_2', description: 'Zero defects or missing assets upon review' },
            ]
        ).map((c: any, i: number) =>
          typeof c === 'string' ? { key: `c_${i + 1}`, description: c } : { key: c.key || `c_${i + 1}`, description: c.description || 'Requirement' }
        ),
        deliverableRequirements: (data.deliverableRequirements && data.deliverableRequirements.length > 0
          ? data.deliverableRequirements
          : [{ type: 'URL', label: 'Cloud repository URL or deliverables file' }]
        ).map((d: any) =>
          typeof d === 'string' ? { type: 'URL', label: d } : { type: d.type || 'URL', label: d.label || 'Deliverable' }
        ),
      };

      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, task: json.data || json };
      } else {
        const errJson = await res.json().catch(() => null);
        return { success: false, message: errJson?.message || 'Failed to create task on server' };
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: data.title,
        taskModel: data.taskModel || 'MULTI_WORKER',
        status: 'OPEN',
        totalSlots: Number(data.totalSlots) || 10,
        availableSlots: Number(data.totalSlots) || 10,
        unitBudgetCents: String(data.unitBudgetCents),
        formattedUnitUSD: `DEMO $${(Number(data.unitBudgetCents) / 100).toFixed(2)} USD`,
        startDeadlineHours: Number(data.startDeadlineHours) || 6,
        completionDurationHours: Number(data.completionDurationHours) || 24,
        reviewSlaHours: 72,
        maxRevisions: Number(data.maxRevisions) || 2,
        createdAt: new Date().toISOString(),
        category: { id: 'c1', name: 'General Tasks', slug: 'general' },
        participationStats: {
          totalCapacity: Number(data.totalSlots) || 10,
          remainingAvailableSlots: Number(data.totalSlots) || 10,
          acceptedTotal: 0,
          currentlyWorking: 0,
          submittedForReview: 0,
          reviewOverdue: 0,
          approvedSettled: 0,
          rejectedTerminated: 0,
        },
        instructions: {
          versionNumber: 1,
          descriptionMarkdown: data.descriptionMarkdown,
          acceptanceCriteria: data.acceptanceCriteria || [],
          deliverableRequirements: data.deliverableRequirements || [],
        },
      };

      demoDb.tasks.unshift(newTask);
      return { success: true, task: newTask };
    }

    return { success: false, message: 'Failed to create task on server' };
  },

  async reviewParticipation(participationId: string, decision: 'APPROVE' | 'REQUEST_REVISION' | 'REJECT', feedback: string, rating?: number) {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/participations/${participationId}/review`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ decision, feedback: feedback || `Evaluation decision: ${decision}`, rating: rating || 5 }),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, ...(json.data || json) };
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      const part = demoDb.participations.find((p) => p.id === participationId);
      if (part) {
        if (decision === 'APPROVE') {
          part.status = 'APPROVED';
          part.approvedAt = new Date().toISOString();
          demoDb.wallet.availableCents += 2400; // Worker earned
        } else if (decision === 'REQUEST_REVISION') {
          part.status = 'REVISION_REQUESTED';
          part.revisionsUsed += 1;
          part.feedback = feedback;
        } else {
          part.status = 'REJECTED';
          part.rejectionReason = feedback;
        }
        return { success: true, status: part.status };
      }
      return { success: true, status: decision };
    }

    return { success: false, message: 'Failed to record submission evaluation' };
  },

  // Wallet
  async getWallet() {
    try {
      const [wRes, txRes] = await Promise.all([
        fetch(`${API_BASE_URL}/demo-finance/wallets`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/demo-finance/transactions`, { headers: getAuthHeaders() }),
      ]);
      if (wRes.ok) {
        const wJson = await wRes.json();
        const txJson = txRes.ok ? await txRes.json() : null;
        const accounts = wJson.data?.accounts || [];
        const avail = accounts.find((a: any) => a.accountType.includes('AVAILABLE'));
        const escrow = accounts.find((a: any) => a.accountType.includes('ESCROW'));
        const availCents = avail ? Number(avail.balanceCents) : 0;
        const escrowCents = escrow ? Number(escrow.balanceCents) : 0;
        const rawTxs = txJson?.data?.transactions || [];
        const transactions: DemoLedgerTransaction[] = rawTxs.map((t: any) => ({
          id: t.id,
          referenceType: t.referenceType,
          referenceId: t.referenceId,
          description: t.description,
          amountCents: String(t.amountCents),
          formattedAmountUSD: `$${(Number(t.amountCents) / 100).toFixed(2)} USD`,
          createdAt: t.createdAt,
        }));

        return {
          availableBalanceCents: availCents,
          formattedAvailableUSD: `$${(availCents / 100).toFixed(2)} USD`,
          escrowBalanceCents: escrowCents,
          formattedEscrowUSD: `$${(escrowCents / 100).toFixed(2)} USD`,
          transactions,
        };
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      return {
        availableBalanceCents: demoDb.wallet.availableCents,
        formattedAvailableUSD: `$${(demoDb.wallet.availableCents / 100).toFixed(2)} USD`,
        escrowBalanceCents: demoDb.wallet.escrowCents,
        formattedEscrowUSD: `$${(demoDb.wallet.escrowCents / 100).toFixed(2)} USD`,
        transactions: demoDb.wallet.transactions,
      };
    }

    return {
      availableBalanceCents: 0,
      formattedAvailableUSD: '$0.00 USD',
      escrowBalanceCents: 0,
      formattedEscrowUSD: '$0.00 USD',
      transactions: [],
    };
  },

  async claimFaucet() {
    if (!ENABLE_DEMO_FAUCET) {
      return {
        success: false,
        message: 'Sandbox faucet is disabled in this environment.',
      };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/demo-finance/faucet`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amountCents: 100000 }),
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        return {
          success: true,
          creditedUSD: data.formattedCreditedUSD || '$1,000.00 USD',
          newBalanceUSD: data.formattedCurrentBalanceUSD || '$1,000.00 USD',
        };
      } else {
        const errJson = await res.json().catch(() => null);
        return {
          success: false,
          message: errJson?.message || 'Sandbox faucet claim rejected.',
        };
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      demoDb.wallet.availableCents += 100000;
      const newTx: DemoLedgerTransaction = {
        id: `tx-${Date.now()}`,
        referenceType: 'SANDBOX_FAUCET_CLAIM',
        referenceId: 'faucet',
        description: 'Sandbox faucet grant credited for test scenarios',
        amountCents: '100000',
        formattedAmountUSD: '+$1,000.00 USD',
        createdAt: new Date().toISOString(),
      };
      demoDb.wallet.transactions.unshift(newTx);
      return {
        success: true,
        creditedUSD: '$1,000.00 USD',
        newBalanceUSD: `$${(demoDb.wallet.availableCents / 100).toFixed(2)} USD`,
      };
    }

    return {
      success: false,
      message: 'Demo faucet is unavailable.',
    };
  },

  // Admin
  async getAdminStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const d = json.data || json;
        return {
          totalUsers: d.totalUsers ?? 0,
          activeTasks: d.activeTasks ?? 0,
          totalSlotsFunded: d.totalSlotsFunded ?? 0,
          totalDemoVolumeUSD: d.formattedVolumeUSD ?? 'DEMO $0.00 USD',
          openDisputes: d.openDisputes ?? 0,
          overdueReviews: d.overdueReviews ?? 0,
          auditLogCount: d.auditLogCount ?? 0,
        };
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      return {
        totalUsers: 1842,
        activeTasks: demoDb.tasks.length,
        totalSlotsFunded: 2450,
        totalDemoVolumeUSD: '$148,500.00 USD',
        openDisputes: 2,
        overdueReviews: 1,
        auditLogCount: demoDb.auditLogs.length,
      };
    }

    return {
      totalUsers: 0,
      activeTasks: 0,
      totalSlotsFunded: 0,
      totalDemoVolumeUSD: '$0.00 USD',
      openDisputes: 0,
      overdueReviews: 0,
      auditLogCount: 0,
    };
  },

  async getAuditLogs() {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const logs = json.data?.logs || json.data || json;
        if (Array.isArray(logs) && logs.length > 0) {
          return logs;
        }
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      return demoDb.auditLogs;
    }

    return [];
  },

  async getAdminUsers(params?: {
    role?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ users: any[]; meta: { totalCount: number } }> {
    try {
      const query = new URLSearchParams();
      if (params?.role) query.append('role', params.role);
      if (params?.status) query.append('status', params.status);
      if (params?.search) query.append('search', params.search);
      if (params?.limit) query.append('limit', String(params.limit));
      if (params?.offset) query.append('offset', String(params.offset));

      const res = await fetch(`${API_BASE_URL}/admin/users?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      let filtered = [...demoDb.users];
      if (params?.role) filtered = filtered.filter((u) => u.role === params.role);
      if (params?.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter((u) =>
          u.email.toLowerCase().includes(s) ||
          u.profile?.displayName?.toLowerCase().includes(s)
        );
      }
      return { users: filtered, meta: { totalCount: filtered.length } };
    }

    return { users: [], meta: { totalCount: 0 } };
  },

  async sanctionUser(userId: string, newStatus: string, reason: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/sanction`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ newStatus, reason }),
      });
      if (res.ok) {
        return { success: true };
      }
      const err = await res.json().catch(() => null);
      return { success: false, message: err?.message || 'Failed to sanction user' };
    } catch {
      return { success: false, message: 'Server communication error while sanctioning user' };
    }
  },

  async assignUserRole(userId: string, newRole: string, reason: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ newRole, reason }),
      });
      if (res.ok) {
        return { success: true };
      }
      const err = await res.json().catch(() => null);
      return { success: false, message: err?.message || 'Failed to assign role' };
    } catch {
      return { success: false, message: 'Server communication error while assigning role' };
    }
  },

  // ---------------------------------------------------------------------------
  // PHASE 2: EVIDENCE, DISPUTES & CONVERSATION API
  // ---------------------------------------------------------------------------

  async uploadEvidenceFile(
    file: File,
    options?: {
      taskId?: string;
      participationId?: string;
      submissionVersionId?: string;
      disputeId?: string;
    },
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (options?.taskId) formData.append('taskId', options.taskId);
      if (options?.participationId) formData.append('participationId', options.participationId);
      if (options?.submissionVersionId) formData.append('submissionVersionId', options.submissionVersionId);
      if (options?.disputeId) formData.append('disputeId', options.disputeId);

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/evidence/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const json = await res.json();
      if (res.ok) {
        return { success: true, data: json.data || json };
      }
      return { success: false, message: json?.error?.message || json?.message || 'Upload failed' };
    } catch {
      return { success: false, message: 'Server connection error during evidence upload' };
    }
  },

  async getEvidenceSignedUrl(fileId: string): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/evidence/${fileId}/signed-url`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        return data.signedUrl || null;
      }
    } catch {}
    return null;
  },

  async createDispute(data: {
    participationId: string;
    reasonCode: string;
    statement: string;
    evidenceFileIds?: string[];
  }): Promise<{ success: boolean; disputeId?: string; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/disputes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        const d = json.data || json;
        return { success: true, disputeId: d.disputeId };
      }
      return { success: false, message: json?.error?.message || json?.message || 'Failed to create dispute' };
    } catch {
      return { success: false, message: 'Server connection error while filing dispute' };
    }
  },

  async getDisputes(status?: string): Promise<any[]> {
    try {
      const query = status ? `?status=${status}` : '';
      const res = await fetch(`${API_BASE_URL}/disputes${query}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {}

    if (ENABLE_DEMO_SHORTCUTS) {
      let list = [...demoDb.disputes];
      if (status && status !== 'ALL') {
        list = list.filter((d) => d.status === status);
      }
      return list;
    }

    return [];
  },

  async getDisputeById(disputeId: string): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/disputes/${disputeId}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {}
    return null;
  },

  async addDisputeEvidence(
    disputeId: string,
    evidenceFileIds: string[],
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/disputes/${disputeId}/evidence`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ evidenceFileIds }),
      });
      if (res.ok) return { success: true };
      const err = await res.json().catch(() => null);
      return { success: false, message: err?.message || 'Failed to attach evidence' };
    } catch {
      return { success: false, message: 'Server error attaching evidence' };
    }
  },

  async resolveDispute(
    disputeId: string,
    data: {
      verdict: string;
      arbitrationNotes: string;
      workerPayoutCents?: string;
      buyerRefundCents?: string;
    },
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        return { success: true, data: json.data || json };
      }
      return {
        success: false,
        message: json?.error?.message || json?.message || 'Arbitration ruling failed',
      };
    } catch {
      return { success: false, message: 'Server communication error resolving dispute' };
    }
  },

  async getTaskQnA(taskId: string): Promise<{ conversationId?: string; messages: any[] }> {
    try {
      const res = await fetch(`${API_BASE_URL}/conversations/task/${taskId}/qna`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        return {
          conversationId: data.id,
          messages: data.messages || [],
        };
      }
    } catch {}
    return { messages: [] };
  },

  async postTaskQnA(taskId: string, content: string): Promise<{ success: boolean; message?: any }> {
    try {
      const res = await fetch(`${API_BASE_URL}/conversations/task/${taskId}/qna`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, message: json.data || json };
      }
    } catch {}
    return { success: false };
  },

  async getPrivateSlotThread(taskId: string, workerId: string, buyerId: string): Promise<{ id: string; messages: any[] } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/conversations/slot/${taskId}/worker/${workerId}/buyer/${buyerId}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {}
    return null;
  },

  async sendChatMessage(conversationId: string, content: string): Promise<{ success: boolean; message?: any }> {
    try {
      const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, message: json.data || json };
      }
    } catch {}
    return { success: false };
  },

  async escalateOverdueReview(participationId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/participations/${participationId}/escalate-overdue`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok) {
        return { success: true, message: json.data?.message || 'Escalated to REVIEW_OVERDUE' };
      }
      return { success: false, message: json?.error?.message || json?.message || 'Failed to escalate' };
    } catch {
      return { success: false, message: 'Server connection error during escalation' };
    }
  },

  // Real Payments & Multi-Channel Withdrawals
  async requestWithdrawal(dto: {
    amountCents: number;
    method: string;
    payoutCurrency?: string;
    destinationDetails: Record<string, any>;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/withdrawals`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto),
      });
      const json = await res.json();
      if (res.ok) {
        return { success: true, data: json.data || json };
      }
      return {
        success: false,
        message: json?.error?.message || json?.message || 'Withdrawal request failed.',
      };
    } catch {
      return { success: false, message: 'Server communication error requesting payout.' };
    }
  },

  async getMyWithdrawals(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/withdrawals/my`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json || [];
      }
    } catch {}
    return [];
  },

  async getAdminWithdrawals(status?: string): Promise<{ total: number; items: any[] }> {
    try {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const res = await fetch(`${API_BASE_URL}/payments/withdrawals${query}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const d = json.data || json;
        return {
          total: d.total ?? (Array.isArray(d) ? d.length : 0),
          items: d.items ?? (Array.isArray(d) ? d : []),
        };
      }
    } catch {}

    if (ENABLE_DEMO_SHORTCUTS) {
      let items = [...demoDb.withdrawals];
      if (status && status !== 'ALL') {
        items = items.filter((w) => w.status === status);
      }
      return { total: items.length, items };
    }

    return { total: 0, items: [] };
  },

  async processWithdrawal(
    withdrawalId: string,
    dto: {
      decision: 'APPROVE' | 'COMPLETE' | 'REJECT';
      providerPayoutId?: string;
      rejectionReason?: string;
    },
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/withdrawals/${withdrawalId}/process`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto),
      });
      const json = await res.json();
      if (res.ok) {
        return { success: true, data: json.data || json };
      }
      return {
        success: false,
        message: json?.error?.message || json?.message || 'Failed to process withdrawal.',
      };
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      const w: any = demoDb.withdrawals.find((item) => item.id === withdrawalId);
      if (w) {
        if (dto.decision === 'APPROVE') {
          w.status = 'APPROVED';
        } else if (dto.decision === 'COMPLETE') {
          w.status = 'COMPLETED';
          w.settledAt = new Date().toISOString();
          if (dto.providerPayoutId) w.payoutTxId = dto.providerPayoutId;
        } else {
          w.status = 'REJECTED';
          (w as any).rejectionReason = dto.rejectionReason || 'Rejected by administrator';
        }
        return { success: true, data: w };
      }
      return { success: true };
    }

    return { success: false, message: 'Server error processing withdrawal decision.' };
  },

  async getExchangeRates(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/exchange-rates`);
      if (res.ok) {
        const json = await res.json();
        return json.data || json || [];
      }
    } catch {}
    return [
      {
        sourceCurrency: 'USD',
        targetCurrency: 'BDT',
        rate: 121.5,
        provider: 'BANGLADESH_BANK_MID',
        description: 'Bangladesh Bank Reference Exchange Benchmark Rate',
      },
      {
        sourceCurrency: 'USD',
        targetCurrency: 'EUR',
        rate: 0.92,
        provider: 'ECB_MID',
      },
    ];
  },

  async reconcileLedger(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/reconciliation`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {}
    return { reconciled: true, discrepancyCount: 0 };
  },

  async getRealWorkerWallet(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/wallets/worker`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {}
    return null;
  },

  async getRealBuyerWallet(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/wallets/buyer`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {}
    return null;
  },

  // Manual Deposits (Binance Pay / USDT / bKash / Bank)
  async submitManualDeposit(dto: {
    amountCents: number;
    depositMethod: string;
    senderIdentifier: string;
    transactionReference: string;
    proofScreenshotUrl?: string;
    notes?: string;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/deposits/manual`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto),
      });
      const json = await res.json();
      if (res.ok) {
        return { success: true, data: json.data || json };
      }
      return {
        success: false,
        message: json?.error?.message || json?.message || 'Manual deposit submission failed.',
      };
    } catch {
      return { success: false, message: 'Server communication error submitting deposit.' };
    }
  },

  async getMyDeposits(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/deposits/my`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json || [];
      }
    } catch {}
    return [];
  },

  async getAdminDeposits(status?: string): Promise<{ total: number; items: any[] }> {
    try {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const res = await fetch(`${API_BASE_URL}/payments/deposits${query}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const d = json.data || json;
        return {
          total: d.total ?? (Array.isArray(d) ? d.length : 0),
          items: d.items ?? (Array.isArray(d) ? d : []),
        };
      }
    } catch {}

    if (ENABLE_DEMO_SHORTCUTS) {
      let items = [...demoDb.withdrawals];
      if (status && status !== 'ALL') {
        items = items.filter((w) => w.status === status);
      }
      return { total: items.length, items };
    }

    return { total: 0, items: [] };
  },

  async processDeposit(
    orderId: string,
    dto: { decision: 'APPROVE' | 'REJECT'; rejectionReason?: string; adminNotes?: string },
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/deposits/${orderId}/process`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto),
      });
      const json = await res.json();
      if (res.ok) {
        return { success: true, message: json.message };
      }
      return {
        success: false,
        message: json?.error?.message || json?.message || 'Failed to process deposit.',
      };
    } catch {
      // Fallback
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      const dep: any = demoDb.deposits.find((d) => d.id === orderId || d.orderId === orderId);
      if (dep) {
        dep.status = dto.decision === 'APPROVE' ? 'SUCCEEDED' : 'FAILED';
        return { success: true, message: `Deposit order marked ${dep.status} successfully.` };
      }
      return { success: true, message: 'Deposit state updated in active ledger.' };
    }

    return { success: false, message: 'Server communication error processing deposit.' };
  },


  async getAdminSubmissions(status?: string): Promise<any[]> {
    try {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const res = await fetch(`${API_BASE_URL}/tasks/admin-submissions${query}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json || [];
      }
    } catch {}

    if (ENABLE_DEMO_SHORTCUTS) {
      let subs = [...demoDb.submissions];
      if (status && status !== 'ALL') {
        subs = subs.filter((s) => s.status === status);
      }
      return subs;
    }
    return [];
  },

  async reviewAdminSubmission(submissionId: string, decision: 'APPROVE' | 'REJECT', feedback?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/admin-submissions/${submissionId}/review`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ decision, feedback }),
      });
      if (res.ok) {
        return { success: true };
      }
    } catch {}

    if (ENABLE_DEMO_SHORTCUTS) {
      const sub: any = demoDb.submissions.find((s) => s.id === submissionId);
      if (sub) {
        sub.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        if (decision === 'APPROVE') sub.approvedAt = new Date().toISOString();
        return { success: true, message: `Submission marked ${sub.status}.` };
      }
      return { success: true };
    }
    return { success: false, message: 'Server communication error.' };
  },

  // In-App Notifications
  async getNotifications(limit = 20): Promise<{ unreadCount: number; notifications: any[] }> {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications?limit=${limit}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return {
          unreadCount: json.unreadCount ?? 0,
          notifications: json.notifications ?? [],
        };
      }
    } catch {}
    return { unreadCount: 0, notifications: [] };
  },

  async markNotificationRead(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async markAllNotificationsRead(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // International KYC & Identity Verification
  async getKycStatus(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/idv/status`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {}
    return { isIdentityVerified: false, status: 'UNVERIFIED' };
  },

  async getSupportedKycDocuments(countryCode = 'BD'): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/idv/supported-documents?countryCode=${countryCode}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json || [];
      }
    } catch {}
    return [];
  },

  async submitKycVerification(dto: {
    countryCode: string;
    documentType: string;
    documentNumberMasked: string;
    documentDedupSeed?: string;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/idv/submit-mock`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto),
      });
      const json = await res.json();
      if (res.ok) {
        return { success: true, data: json.data || json };
      }
      return {
        success: false,
        message: json?.error?.message || json?.message || 'KYC verification failed.',
      };
    } catch {
      return { success: false, message: 'Server communication error submitting KYC.' };
    }
  },
};
