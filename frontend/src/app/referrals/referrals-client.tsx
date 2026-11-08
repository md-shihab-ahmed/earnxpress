'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  Copy,
  Check,
  Share2,
  Users,
  Gift,
  Wallet,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Award,
} from 'lucide-react';

export function ReferralsClient() {
  const { user, isAuthenticated } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedBanglaPromo, setCopiedBanglaPromo] = useState(false);
  const [copiedEnglishPromo, setCopiedEnglishPromo] = useState(false);

  // User Referral Code
  const refCode = user?.id ? `EX-${user.id.slice(0, 8).toUpperCase()}` : 'EX-GLOBAL786';
  const referralUrl = `https://earnxpress-marketplace.vercel.app/register?ref=${refCode}`;

  const copyToClipboard = (text: string, type: 'link' | 'code' | 'bn_promo' | 'en_promo') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else if (type === 'bn_promo') {
      setCopiedBanglaPromo(true);
      setTimeout(() => setCopiedBanglaPromo(false), 2000);
    } else {
      setCopiedEnglishPromo(true);
      setTimeout(() => setCopiedEnglishPromo(false), 2000);
    }
  };

  const banglaPromoText = `🔥 কোনো ইনভেস্টমেন্ট ছাড়াই আন্তর্জাতিক ফ্রিল্যান্সিং কাজ করে প্রতিদিন ইনকাম করুন!
✅ ফেসবুক পেজ ফলো, ইউটিউব সাবস্ক্রাইব, অ্যাপ টেস্টিং এবং ডাটা এন্ট্রির শত শত সহজ কাজ।
✅ কোনো ডিপোজিট ফি নেই, ১০০% ফ্রি রেজিস্ট্রেশন।
✅ সরাসরি বিকাশ, নগদ এবং Binance Pay USDT-তে ইনস্ট্যান্ট ক্যাশআউট!

👉 এখনই জয়েন করুন: ${referralUrl}
(রেফারেল কোড: ${refCode})`;

  const englishPromoText = `🚀 Earn money working from anywhere with EarnXpress — the open international freelance microtask crowdsourcing marketplace!
✨ 100% Free registration • Zero upfront investment
✨ Fast payouts via Binance Pay USDT, bKash & Nagad
✨ Complete social media tasks, app testing & surveys

Sign up now: ${referralUrl} (Referral Code: ${refCode})`;

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(banglaPromoText);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`,
      '_blank'
    );
  };

  const shareOnTelegram = () => {
    const text = encodeURIComponent(banglaPromoText);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${text}`, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Hero Section */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider">
          <Gift className="w-3.5 h-3.5" />
          <span>EarnXpress Affiliate &amp; Referral Program</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Invite Friends &amp; Businesses, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">
            Earn Guaranteed Lifetime Income
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Get <strong className="text-teal-400 font-bold">৳10 ($0.08)</strong> cash for every active worker you invite, plus a <strong className="text-cyan-400 font-bold">5% Lifetime Commission</strong> on all campaign budgets deposited by buyers you refer!
        </p>
      </div>

      {/* Main Referral Link Card */}
      <div className="bg-navy-900 border border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-800 pb-5">
          <div>
            <div className="text-xs font-mono font-bold uppercase text-teal-400">Your Personal Affiliate Center</div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Share Your Unique Referral Link</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Referral Code:</span>
            <span className="font-mono text-sm font-black text-teal-300 bg-navy-950 px-3 py-1.5 rounded-xl border border-teal-500/30">
              {refCode}
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(refCode, 'code')}
              className="p-2 rounded-xl bg-navy-950 hover:bg-navy-800 border border-navy-800 text-slate-300 transition-all"
              title="Copy Referral Code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Link input with copy button */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Your Invitation URL</label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 bg-navy-950 border border-slate-700 rounded-2xl px-4 py-3 font-mono text-xs sm:text-sm text-teal-200 truncate select-all">
              {referralUrl}
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(referralUrl, 'link')}
              className="px-6 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 shrink-0"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Referral Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 1-Click Social Sharing Buttons */}
        <div className="pt-2 space-y-2">
          <div className="text-xs font-semibold text-slate-400">Quick Share to Social Media:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={shareOnWhatsApp}
              className="p-3.5 rounded-2xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/40 text-emerald-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <span>💬 Share on WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={shareOnFacebook}
              className="p-3.5 rounded-2xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/40 text-blue-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <span>🔵 Share on Facebook</span>
            </button>
            <button
              type="button"
              onClick={shareOnTelegram}
              className="p-3.5 rounded-2xl bg-sky-600/15 hover:bg-sky-600/25 border border-sky-500/40 text-sky-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <span>✈️ Share on Telegram</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rewards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-navy-900 border border-teal-500/20 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Users className="w-6 h-6" />
          </div>
          <div className="text-xs font-mono font-bold uppercase text-teal-400">Reward 1</div>
          <h3 className="text-xl font-black text-white">Worker Referral Bonus</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Get <strong className="text-white font-bold">৳10 ($0.08)</strong> cash credited directly to your account for every worker who signs up through your link and completes their first verified task.
          </p>
          <div className="pt-2 text-xs font-bold text-teal-300">
            ✓ Unlimited invitations • Zero cap
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-navy-900 border border-cyan-500/20 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="text-xs font-mono font-bold uppercase text-cyan-400">Reward 2</div>
          <h3 className="text-xl font-black text-white">5% Buyer Commission</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Invite businesses, agencies, and creators. When they fund task budgets in escrow, you receive an automated <strong className="text-white font-bold">5% Lifetime Royalty</strong> on every single campaign deposit!
          </p>
          <div className="pt-2 text-xs font-bold text-cyan-300">
            ✓ Passive income for life
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-navy-900 border border-amber-500/20 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div className="text-xs font-mono font-bold uppercase text-amber-400">Reward 3</div>
          <h3 className="text-xl font-black text-white">Super Affiliate Milestone</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Reach <strong className="text-white font-bold">50 active members</strong> and unlock an instant <strong className="text-amber-400 font-bold">৳1,000 ($8.00) Cash Bonus</strong>, VIP support badges, and priority payouts.
          </p>
          <div className="pt-2 text-xs font-bold text-amber-300">
            ✓ Instant unlock &amp; badge
          </div>
        </div>
      </div>

      {/* Live Earnings Stats (Demo/Real) */}
      <div className="bg-navy-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">📊 Your Affiliate Dashboard Overview</h3>
            <p className="text-xs text-slate-400">Track referrals, commissions, and withdrawal status</p>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950 border border-teal-800 px-3 py-1 rounded-lg">
            Silver Affiliate Tier
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-navy-950 border border-navy-800 space-y-1">
            <div className="text-xs text-slate-400">Total Clicks</div>
            <div className="text-2xl font-black text-white">142</div>
            <div className="text-[10px] text-teal-400 font-bold">↑ Active Link Tracking</div>
          </div>
          <div className="p-4 rounded-2xl bg-navy-950 border border-navy-800 space-y-1">
            <div className="text-xs text-slate-400">Users Registered</div>
            <div className="text-2xl font-black text-white">18</div>
            <div className="text-[10px] text-teal-400 font-bold">14 Workers • 4 Buyers</div>
          </div>
          <div className="p-4 rounded-2xl bg-navy-950 border border-navy-800 space-y-1">
            <div className="text-xs text-slate-400">Commissions Paid</div>
            <div className="text-2xl font-black text-emerald-400">৳1,450</div>
            <div className="text-[10px] text-slate-400 font-mono">≈ $11.60 USD</div>
          </div>
          <div className="p-4 rounded-2xl bg-navy-950 border border-navy-800 space-y-1">
            <div className="text-xs text-slate-400">Pending Review</div>
            <div className="text-2xl font-black text-amber-400">৳250</div>
            <div className="text-[10px] text-slate-400 font-mono">Disburses upon 72h SLA</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-400 border-t border-navy-800">
          <span>All approved referral rewards disburse directly into your EarnXpress Main Balance.</span>
          <Link
            href="/wallet"
            className="text-teal-400 hover:text-teal-300 font-bold inline-flex items-center gap-1"
          >
            <span>View Wallet &amp; Cashout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Copy-Paste Marketing Kit */}
      <div className="bg-navy-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white">📢 Ready-Made Marketing Promotional Kit</h3>
          <p className="text-xs text-slate-400">
            Copy these pre-written messages and post them directly on Facebook Groups, WhatsApp Status, and Telegram to get referrals instantly!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bengali Post */}
          <div className="p-5 rounded-2xl bg-navy-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-400">🇧🇩 বাংলা সোশ্যাল মিডিয়া পোস্ট</span>
              <button
                type="button"
                onClick={() => copyToClipboard(banglaPromoText, 'bn_promo')}
                className="px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 text-xs font-bold border border-teal-500/30 transition-all flex items-center gap-1.5"
              >
                {copiedBanglaPromo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBanglaPromo ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
              </button>
            </div>
            <div className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-line bg-slate-900 p-3 rounded-xl border border-slate-800 select-all">
              {banglaPromoText}
            </div>
          </div>

          {/* English Post */}
          <div className="p-5 rounded-2xl bg-navy-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400">🌐 International English Post</span>
              <button
                type="button"
                onClick={() => copyToClipboard(englishPromoText, 'en_promo')}
                className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition-all flex items-center gap-1.5"
              >
                {copiedEnglishPromo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEnglishPromo ? 'Copied!' : 'Copy Post'}</span>
              </button>
            </div>
            <div className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-line bg-slate-900 p-3 rounded-xl border border-slate-800 select-all">
              {englishPromoText}
            </div>
          </div>
        </div>
      </div>

      {/* Rules & Transparency */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-teal-500/20 space-y-3 text-xs text-slate-400 leading-relaxed">
        <h4 className="font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Fair Referral Policy &amp; Anti-Fraud Guarantees</span>
        </h4>
        <p>
          EarnXpress uses automated device footprinting and IP velocity tracking to prevent self-referral and bot exploitation. Referrals are credited when the invited account verifies their email and submits legitimate task deliverables. Payouts are instant via Binance Pay USDT, bKash, and Nagad.
        </p>
      </div>
    </div>
  );
}
