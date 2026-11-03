import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DemoBadge } from '@/components/shared/DemoBadge';
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Search,
} from 'lucide-react';

export default async function WorkerDashboardPage() {
  const participations = await api.getWorkerParticipations();
  const wallet = await api.getWallet();

  const activeSlots = participations.filter((p) => p.status === 'IN_PROGRESS');
  const submittedSlots = participations.filter((p) => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW');
  const approvedSlots = participations.filter((p) => p.status === 'APPROVED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-navy-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Worker Execution Dashboard
            </h1>
            <DemoBadge size="sm" variant="teal" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track active task slots, submit completed deliverables, and review simulated demo payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/worker/wallet"
            className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 dark:bg-navy-800 dark:hover:bg-navy-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg border border-navy-700 transition-colors"
          >
            <Wallet className="w-4 h-4 text-teal-400" />
            <span>Wallet ({wallet.formattedAvailableUSD})</span>
          </Link>
          <Link
            href="/tasks"
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <Search className="w-3.5 h-3.5" /> Find Open Slots
          </Link>
        </div>
      </div>

      {/* 4 Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Available Balance</span>
            <Wallet className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 font-mono">
            {wallet.formattedAvailableUSD}
          </div>
          <div className="text-[11px] text-slate-400">Instant test credits</div>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Active Slots</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {activeSlots.length}
          </div>
          <div className="text-[11px] text-slate-400">Currently in execution</div>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Under Review</span>
            <FileCheck2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {submittedSlots.length}
          </div>
          <div className="text-[11px] text-slate-400">Within 72h SLA window</div>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Approved Work</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {approvedSlots.length}
          </div>
          <div className="text-[11px] text-slate-400">100% payout released</div>
        </div>
      </div>

      {/* Active Slots Execution Workspace Table */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              My Claimed Task Slots
            </h3>
            <p className="text-xs text-slate-500">
              Each slot maintains an isolated deadline and independent deliverable review.
            </p>
          </div>
          <Link href="/tasks" className="text-xs font-bold text-teal-600 hover:underline">
            Claim New Slot →
          </Link>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-navy-800">
          {participations.map((part) => (
            <div
              key={part.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-navy-800/40 transition-colors"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 font-mono">
                    Slot #{part.slotNumber}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      part.status === 'IN_PROGRESS'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                        : part.status === 'SUBMITTED'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {part.status}
                  </span>
                </div>

                <Link href={`/worker/tasks/${part.taskId}`}>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm hover:text-teal-600 transition-colors">
                    {part.task?.title}
                  </h4>
                </Link>

                {/* Progress bar */}
                <div className="flex items-center gap-3 text-xs text-slate-500 max-w-md">
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${part.progressPercentage}%` }}
                      className="h-full bg-teal-600 rounded-full"
                    />
                  </div>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {part.progressPercentage}% Milestones
                  </span>
                </div>
              </div>

              {/* Right column: Deadline & Action */}
              <div className="flex items-center justify-between md:justify-end gap-6 text-right">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Unit Payout</div>
                  <div className="text-sm font-bold text-teal-600 dark:text-teal-400 font-mono">
                    {part.task?.formattedUnitUSD}
                  </div>
                </div>

                <Link
                  href={`/worker/tasks/${part.taskId}`}
                  className="bg-navy-900 hover:bg-navy-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  Workspace <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
