'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Globe, Shield } from 'lucide-react';

export function Footer() {
  const [tapCount, setTapCount] = useState(0);
  const router = useRouter();

  // Stealth Owner Trigger: 9 fast consecutive taps on the copyright text opens the secret door
  const handleSecretTap = () => {
    const next = tapCount + 1;
    if (next >= 9) {
      setTapCount(0);
      router.push('/shihab-vault-7860');
    } else {
      setTapCount(next);
      setTimeout(() => setTapCount(0), 2500);
    }
  };

  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-800/80 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center font-bold text-base text-white">
                EX
              </div>
              <span className="font-extrabold text-lg text-white">
                Earn<span className="text-teal-400">Xpress</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Open international freelance task marketplace engineered for multi-worker crowdsourcing,
              verifiable deliverable milestones, and tamper-evident auditability.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-navy-900 border border-navy-800 px-2.5 py-1 rounded-md">
                <Globe className="w-3.5 h-3.5 text-teal-400" />
                <span>English (US)</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-500">Bengali (Coming Soon)</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950/70 border border-teal-800/60 px-2 py-0.5 rounded">
                Verified Platform
              </span>
            </div>

            {/* Official Social & Community Channels */}
            <div className="pt-4 space-y-2.5">
              <div className="text-xs font-semibold text-slate-300">
                আমাদের কাজ সম্পর্কে জানতে এবং সব নতুন আপডেট পেতে আমাদের অফিসিয়াল চ্যানেলগুলো ফলো করুন:
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href="https://www.facebook.com/profile.php?id=100086879226470"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/40 text-blue-400 text-xs font-bold transition-all hover:scale-105 shadow-sm"
                  title="Follow Official Facebook Page"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>ফেসবুক পেজ ফলো করুন</span>
                </a>

                <a
                  href="https://www.youtube.com/@earnxpress-sahmed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/40 text-red-400 text-xs font-bold transition-all hover:scale-105 shadow-sm"
                  title="Subscribe to YouTube Channel"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  <span>ইউটিউব চ্যানেলে সাবস্ক্রাইব করুন</span>
                </a>

                <a
                  href="https://t.me/earnxpresssahmed1_2A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600/15 hover:bg-sky-600/25 border border-sky-500/40 text-sky-400 text-xs font-bold transition-all hover:scale-105 shadow-sm"
                  title="Join Official Telegram Channel"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.197 1.006.128.832.922z" />
                  </svg>
                  <span>টেলিগ্রাম চ্যানেলে জয়েন করুন</span>
                </a>
              </div>
            </div>
          </div>

          {/* Column 1: Marketplace */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Marketplace</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><Link href="/tasks" className="hover:text-teal-400">Browse All Tasks</Link></li>
              <li><Link href="/referrals" className="text-teal-300 font-bold hover:underline">🎁 Refer &amp; Earn (৳10 / 5%)</Link></li>
              <li><Link href="/tasks?taskModel=MULTI_WORKER" className="hover:text-teal-400">Multi-Worker Tasks</Link></li>
              <li><Link href="/tasks?taskModel=FIRST_APPROVED" className="hover:text-teal-400">First-Approved Bounties</Link></li>
              <li><Link href="/buyer/tasks/new" className="hover:text-teal-400">Post a Campaign</Link></li>
            </ul>
          </div>

          {/* Column 2: Portals */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Portals</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><Link href="/worker" className="hover:text-teal-400">Worker Dashboard</Link></li>
              <li><Link href="/buyer" className="hover:text-teal-400">Buyer Dashboard</Link></li>
              <li><Link href="/worker/wallet" className="hover:text-teal-400">Demo Faucet Wallet</Link></li>
            </ul>
          </div>

          {/* Column 3: Governance */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Governance</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><Link href="/documentary" className="text-teal-400 font-bold hover:underline flex items-center gap-1"><span>🎬</span> Platform Documentary</Link></li>
              <li><Link href="/about" className="hover:text-teal-400">About Platform</Link></li>
              <li><Link href="/help" className="hover:text-teal-400">Rules & 72h SLA</Link></li>
              <li><Link href="/terms" className="hover:text-teal-400">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-teal-400">Privacy & KYC Scope</Link></li>
              <li><Link href="/contact" className="hover:text-teal-400">Contact & Support</Link></li>
              <li><Link href="/shihab-vault-7860" className="text-slate-500 hover:text-slate-300">Platform Founder Gateway</Link></li>
            </ul>
          </div>
        </div>

        {/* Regulatory Demo Disclosure */}
        <div className="border-t border-navy-800/80 pt-6 space-y-3">
          <div className="p-3 rounded-lg bg-navy-900 border border-navy-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Demonstration Environment Notice:</span>{' '}
              All balances, payments, escrow locks, and disbursements shown on EarnXpress are strictly simulated in
              DEMO integer USD cents for testing. No real fiat, bank transfers, or cryptocurrency transactions are accepted or processed.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            {/* Stealth Click Zone: Triple-tap opens the secret door */}
            <div
              onClick={handleSecretTap}
              className="cursor-default select-none"
              title=""
            >
              © {new Date().getFullYear()} EarnXpress Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> System Status: All Systems Operational • 99.9% Uptime
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
