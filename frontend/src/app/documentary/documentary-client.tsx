'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Play,
  Download,
  CheckCircle2,
  Users,
  Briefcase,
  ShieldCheck,
  Zap,
  ArrowRight,
  Globe2,
  Sparkles,
  Smartphone,
  Lock,
  Wallet,
  Clock,
  FileCheck2,
} from 'lucide-react';

interface VideoItem {
  id: 'doc-en' | 'doc-bn' | 'promo-en' | 'promo-bn';
  title: string;
  badge: string;
  duration: string;
  size: string;
  aspect: 'widescreen' | 'vertical';
  src: string;
  description: string;
  features: string[];
}

const VIDEOS: VideoItem[] = [
  {
    id: 'doc-en',
    title: 'Official Platform Documentary (1080p Widescreen - English Edition)',
    badge: '1080p Full HD Widescreen',
    duration: '01:55',
    size: '3.28 MB',
    aspect: 'widescreen',
    src: '/EarnXpress-Documentary-English-1080p.mp4',
    description:
      'The definitive international documentary explaining EarnXpress zero-investment crowdsourcing, dual-role architecture, dedicated slot locking, and escrow security.',
    features: [
      'Studio Christopher Neural Voiceover',
      'Ambient Tech Cinematic Soundtrack',
      'Synchronized Slide Transitions',
    ],
  },
  {
    id: 'doc-bn',
    title: 'Official Platform Documentary (1080p Widescreen - Bengali Edition)',
    badge: '১০৮০p ফুল এইচডি ওয়াইডস্ক্রিন',
    duration: '01:55',
    size: '3.26 MB',
    aspect: 'widescreen',
    src: '/EarnXpress-Documentary-Bangla-1080p.mp4',
    description:
      'আন্তর্জাতিক ফ্রিল্যান্সিং সাইট হিসেবে কোনো ইনভেস্টমেন্ট ছাড়া কীভাবে ওয়ার্কাররা আয় করেন এবং বায়াররা কীভাবে কাজ পোস্ট করেন তার সম্পূর্ণ বাংলা ডকুমেন্টারি।',
    features: [
      'প্রদীপ নিউরাল বাংলা ভয়েসওভার',
      'ব্যাকগ্রাউন্ড মিউজিক সহ স্টুডিও অডিও',
      '১ মিনিট ৫৫ সেকেন্ড পূর্ণাঙ্গ উপস্থাপনা',
    ],
  },
  {
    id: 'promo-en',
    title: 'Social Viral Promo (1080x1920 Vertical Reels / Shorts - English)',
    badge: '9:16 Vertical Reels / Shorts',
    duration: '00:22',
    size: '16.68 MB',
    aspect: 'vertical',
    src: '/EarnXpress-Promo-Reels-English.mp4',
    description:
      'High-converting mobile vertical promo engineered for Facebook Reels, YouTube Shorts, and TikTok campaigns. Features bold kinetic typography and fast-paced narration.',
    features: [
      'Built for Mobile Reels & Shorts',
      'Punchy 22-Second Viral Hook',
      'Zero-Fee Direct Bank Payout Focus',
    ],
  },
  {
    id: 'promo-bn',
    title: 'Social Viral Promo (1080x1920 Vertical Reels / Shorts - Bengali)',
    badge: '৯:১৬ ভার্টিক্যাল রিলস / শর্টস',
    duration: '00:22',
    size: '16.67 MB',
    aspect: 'vertical',
    src: '/EarnXpress-Promo-Reels-Bangla.mp4',
    description:
      'ফেসবুক রিলস, ইউটিউব শর্টস ও টেলিগ্রাম চ্যানেলে শেয়ার ও বিজ্ঞাপনের জন্য তৈরি ২২ সেকেন্ডের দ্রুতগতির মার্কেটিং ভিডিও।',
    features: [
      'বাংলা ভাইরাল ভয়েসওভার',
      'মোবাইল স্ক্রিনের জন্য নিখুঁত ফরম্যাট',
      'এক ক্লিকে সোশ্যাল মিডিয়ায় শেয়ার উপযোগী',
    ],
  },
];

export function DocumentaryClient() {
  const [selectedVideoId, setSelectedVideoId] = useState<'doc-en' | 'doc-bn' | 'promo-en' | 'promo-bn'>('doc-en');

  const activeVideo = VIDEOS.find((v) => v.id === selectedVideoId) || VIDEOS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Official Platform Documentary &amp; Video Suite</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          How EarnXpress Works: <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400">
            Zero-Investment International Freelancing
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-3xl mx-auto">
          Watch our official high-definition video productions explaining how Workers earn guaranteed payouts without any deposit or fees, how Buyers publish scalable campaigns, and how double-entry escrow protects every cent.
        </p>
      </div>

      {/* Main Video Cinema Showcase */}
      <div className="bg-navy-900 border border-teal-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-2 border-b border-navy-800 pb-4">
          {VIDEOS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedVideoId(v.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                selectedVideoId === v.id
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                  : 'bg-navy-950 text-slate-400 hover:text-white border border-navy-800'
              }`}
            >
              <span>{v.id.includes('en') ? '🌐' : '🇧🇩'}</span>
              <span>{v.title.split('(')[0].trim()}</span>
              <span className="text-[10px] font-mono opacity-80">({v.duration})</span>
            </button>
          ))}
        </div>

        {/* Active Player Frame */}
        <div className="flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white text-xs sm:text-sm">{activeVideo.title}</span>
            </div>
            <span className="font-mono text-teal-400 font-bold bg-navy-950 px-2.5 py-1 rounded-lg border border-navy-800 text-[11px]">
              {activeVideo.duration} • {activeVideo.badge}
            </span>
          </div>

          {activeVideo.aspect === 'widescreen' ? (
            <div className="w-full rounded-2xl overflow-hidden border-2 border-slate-700 bg-black aspect-video shadow-2xl flex items-center justify-center">
              <video
                key={activeVideo.src}
                controls
                playsInline
                preload="metadata"
                className="w-full h-full object-contain block"
                src={activeVideo.src}
              />
            </div>
          ) : (
            <div className="w-full py-4 bg-navy-950 rounded-2xl border-2 border-slate-700 shadow-2xl flex items-center justify-center">
              <div className="max-w-[300px] w-full aspect-[9/16] rounded-xl overflow-hidden border border-slate-800 bg-black shadow-xl">
                <video
                  key={activeVideo.src}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain block"
                  src={activeVideo.src}
                />
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-navy-800 mt-4 text-xs">
            <p className="text-slate-400 leading-relaxed max-w-xl">
              {activeVideo.description}
            </p>
            <a
              href={activeVideo.src}
              download={activeVideo.src.split('/').pop()}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download MP4 ({activeVideo.size})</span>
            </a>
          </div>
        </div>
      </div>

      {/* 4-Card Video Gallery Suite */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-navy-800 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400" />
              Complete Video Library (Direct Download &amp; Share)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Ready for immediate publishing to YouTube (@earnxpress-sahmed), Facebook (@earnxpress), and Telegram (@earnxpresssahmed1_2A).
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs font-mono font-bold self-start sm:self-auto">
            4 Studio MP4s
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VIDEOS.map((v) => (
            <div
              key={v.id}
              className="bg-navy-900 border border-slate-800 hover:border-teal-500/40 rounded-2xl p-5 shadow-xl space-y-4 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[11px] font-bold uppercase font-mono">
                    {v.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-400 font-bold">
                    {v.duration} • {v.size}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white leading-snug">
                  {v.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {v.description}
                </p>

                <div className={`rounded-xl overflow-hidden border border-slate-800 bg-black ${
                  v.aspect === 'widescreen' ? 'aspect-video w-full' : 'max-w-[220px] mx-auto aspect-[9/16]'
                }`}>
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain"
                    src={v.src}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-navy-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVideoId(v.id);
                    window.scrollTo({ top: 250, behavior: 'smooth' });
                  }}
                  className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" /> Watch Above
                </button>
                <a
                  href={v.src}
                  download={v.src.split('/').pop()}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download MP4
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How EarnXpress Works - 4 Core Pillars */}
      <div className="bg-navy-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            How EarnXpress Operates
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            A transparent four-step workflow built on fairness, zero investment, and verifiable deliverables.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-navy-950/70 border border-navy-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-sm border border-teal-500/20">
              01
            </div>
            <h3 className="font-bold text-white text-sm">30-Second Free Sign Up</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Create an account instantly using email and password. Zero upfront deposit, zero verification fees, and zero hidden subscription costs.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-navy-950/70 border border-navy-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-sm border border-teal-500/20">
              02
            </div>
            <h3 className="font-bold text-white text-sm">Dedicated Work Slots</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Claim an available slot on any campaign. Each worker receives an isolated personal deadline — one worker&apos;s delay never impacts your payout.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-navy-950/70 border border-navy-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-sm border border-teal-500/20">
              03
            </div>
            <h3 className="font-bold text-white text-sm">Automated Escrow Lock</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Buyers fund campaign budgets upfront into escrow before tasks go live. Your earned money is 100% guaranteed once deliverables are completed.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-navy-950/70 border border-navy-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-sm border border-teal-500/20">
              04
            </div>
            <h3 className="font-bold text-white text-sm">Instant Direct Payouts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Withdraw earnings directly to bKash, Nagad, Rocket, or local bank accounts with zero processing cuts on worker rewards.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Table: EarnXpress vs Scam Deposit Apps */}
      <div className="bg-navy-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-bold block mb-1">
            Trust &amp; Transparency
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Genuine Crowdsourcing vs. Deceptive Deposit Schemes
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Understanding the architectural differences between an authentic freelance marketplace and predatory earning apps:
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950 text-slate-400 font-bold border-b border-navy-800">
              <tr>
                <th className="py-3 px-4">Feature</th>
                <th className="py-3 px-4 text-red-400">Deceptive Deposit Schemes</th>
                <th className="py-3 px-4 text-emerald-400">EarnXpress International Marketplace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800 text-slate-300">
              <tr>
                <td className="py-3.5 px-4 font-semibold text-white">Upfront Deposit</td>
                <td className="py-3.5 px-4 text-red-400">Demands VIP membership or initial deposit</td>
                <td className="py-3.5 px-4 text-emerald-400 font-bold">100% Free Forever • Zero Deposits</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-white">Source of Money</td>
                <td className="py-3.5 px-4 text-red-400">Recycled money from new member deposits</td>
                <td className="py-3.5 px-4 text-emerald-400">Genuine campaign budgets funded by verified Buyers</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-white">Deliverable Proof</td>
                <td className="py-3.5 px-4 text-red-400">Fake spin wheels or arbitrary timers</td>
                <td className="py-3.5 px-4 text-emerald-400">Real deliverables: screenshots, app reviews, survey data</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-white">Withdrawal Rules</td>
                <td className="py-3.5 px-4 text-red-400">Blocks withdrawals, demands extra &ldquo;tax&rdquo; fees</td>
                <td className="py-3.5 px-4 text-emerald-400">Direct withdrawal to bKash, Nagad, Rocket, Bank</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-teal-900/40 via-navy-900 to-indigo-900/40 border border-teal-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-6">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
          Ready to Start Earning or Launch a Campaign?
        </h2>
        <p className="text-xs sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
          Join thousands of independent workers and verified buyers on the next-generation open crowdsourcing platform.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/tasks"
            className="px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-teal-900/40 flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Explore Open Tasks</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/buyer/tasks/new"
            className="px-6 py-3.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs sm:text-sm font-bold border border-navy-700 shadow-md transition-all cursor-pointer"
          >
            Post a Campaign as Buyer
          </Link>
          <Link
            href="/referrals"
            className="px-6 py-3.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs sm:text-sm font-bold border border-purple-500/40 transition-all cursor-pointer"
          >
            Refer &amp; Earn Bounty
          </Link>
        </div>
      </div>
    </div>
  );
}
