import { Metadata } from 'next';
import { ReferralsClient } from './referrals-client';

export const metadata: Metadata = {
  title: 'Affiliate & Referral Rewards Program | EarnXpress',
  description:
    'Invite workers and buyers to EarnXpress. Earn ৳10 per verified worker and 5% lifetime commissions on buyer campaign budgets with instant payouts.',
};

export default function ReferralsPage() {
  return <ReferralsClient />;
}
