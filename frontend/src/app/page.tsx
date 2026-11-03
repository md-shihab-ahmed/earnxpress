import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { TaskCard } from '@/components/shared/TaskCard';
import { DemoBadge } from '@/components/shared/DemoBadge';
import {
  Search,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  Globe2,
  Code2,
  Sparkles,
} from 'lucide-react';

export default async function HomePage() {
  const { data: tasks } = await api.getTasks();

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-navy-900 via-navy-950 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Glow Accents */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-800/80 text-xs font-semibold text-teal-300">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Open International Marketplace Architecture</span>
            <DemoBadge size="sm" variant="teal" />
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-white max-w-4xl mx-auto">
            One Task Can Empower{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">
              100 Workers
            </span>{' '}
            Simultaneously.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            EarnXpress is an open international task marketplace where Buyers fund scalable campaigns,
            and Workers claim transparent slots with isolated deadlines, verified milestones, and instant demo settlements.
          </p>

          {/* Quick Search Bar */}
          <div className="max-w-xl mx-auto pt-2">
            <form action="/tasks" method="GET" className="relative flex items-center shadow-lg">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                name="search"
                placeholder="Search tasks by skill, dataset, translation or bounty..."
                className="w-full bg-navy-800/90 border border-navy-700 focus:border-teal-400 text-white text-sm pl-12 pr-28 py-3.5 rounded-xl outline-none placeholder-slate-400 transition-colors"
              />
              <button
                type="submit"
                className="absolute right-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              >
                Find Work
              </button>
            </form>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-md transition-all hover:scale-102"
            >
              Browse Open Marketplace <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/buyer/tasks/new"
              className="inline-flex items-center gap-2 bg-navy-800 hover:bg-navy-700 border border-navy-700 text-slate-200 font-semibold text-sm px-6 py-3 rounded-xl transition-all"
            >
              Post a Campaign (5-Step Wizard)
            </Link>
          </div>

          {/* Live Trust Metrics Bar */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-navy-800/80">
            <div className="p-3">
              <div className="text-2xl font-extrabold text-teal-400 font-mono">100%</div>
              <div className="text-xs text-slate-400 mt-0.5">Open Marketplace Discovery</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-extrabold text-white font-mono">50+</div>
              <div className="text-xs text-slate-400 mt-0.5">Available Work Slots</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-extrabold text-teal-400 font-mono">72h SLA</div>
              <div className="text-xs text-slate-400 mt-0.5">Overdue Review Escalation</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-extrabold text-white font-mono">$1,000</div>
              <div className="text-xs text-slate-400 mt-0.5">Instant DEMO Faucet Grant</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars of EarnXpress */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Engineered for High-Capacity Crowdsourcing
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            How EarnXpress eliminates the friction of traditional single-freelancer marketplaces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 space-y-3 shadow-sm hover:border-teal-500/50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Multiple Workers Per Task
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Buyers set capacity (e.g. 50 slots). 50 workers claim slots simultaneously with independent
              deadlines, submissions, and demo payouts.
            </p>
          </div>

          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 space-y-3 shadow-sm hover:border-teal-500/50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Isolated Work Records
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              One worker’s failure or delay never impacts other workers. Each submission is evaluated and rewarded strictly on its own merits.
            </p>
          </div>

          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 space-y-3 shadow-sm hover:border-teal-500/50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Verified Milestones
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Progress percentages are calculated strictly from completed deliverable checkpoints. Self-reported progress slides are strictly prohibited.
            </p>
          </div>

          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 space-y-3 shadow-sm hover:border-teal-500/50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              72h Overdue Escalation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Buyer inactivity past 72 hours escalates to Platform Moderation for evidence review. Funds are never blindly auto-approved.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Marketplace Tasks */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              Featured Open Tasks
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Claim an available slot and begin work immediately without prior buyer negotiation.
            </p>
          </div>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
          >
            View All Marketplace Tasks ({tasks.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.slice(0, 3).map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </section>

      {/* Two Task Models Explainer Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-navy-900 text-white rounded-2xl p-8 border border-navy-800 shadow-md grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold tracking-wider uppercase text-teal-400 font-mono">
              Marketplace Mechanics
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Two Distinct Execution Models
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              EarnXpress empowers Buyers to publish tasks tailored to both collaborative data generation and competitive technical bounties.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-navy-950/80 border border-navy-800 p-4 rounded-xl space-y-1">
              <div className="text-sm font-bold text-blue-400 flex items-center gap-1.5">
                <Users className="w-4 h-4" /> 1. MULTI_WORKER Model
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multiple workers complete the work independently. Each approved worker receives their unit payout from reserved escrow.
              </p>
            </div>

            <div className="bg-navy-950/80 border border-navy-800 p-4 rounded-xl space-y-1">
              <div className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> 2. FIRST_APPROVED Bounty Model
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multiple workers compete concurrently. The first submission that satisfies acceptance criteria wins the full prize; other slots close cleanly.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
