import React from 'react';
import { ParticipationStats } from '@/types';
import { Users, Clock, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react';

interface ParticipationDashboardProps {
  stats: ParticipationStats;
  taskTitle?: string;
}

export function ParticipationDashboard({ stats }: ParticipationDashboardProps) {
  const percentClaimed = stats.totalCapacity > 0
    ? Math.round(((stats.totalCapacity - stats.remainingAvailableSlots) / stats.totalCapacity) * 100)
    : 0;

  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-navy-800 pb-3">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            Task Participation Dashboard
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time open marketplace participant metrics
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
          {stats.remainingAvailableSlots} of {stats.totalCapacity} Slots Open
        </span>
      </div>

      {/* Progress Capacity Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
          <span>Capacity Filled: {percentClaimed}%</span>
          <span className="text-teal-600 dark:text-teal-400 font-semibold">{stats.remainingAvailableSlots} slots remaining</span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${percentClaimed}%` }}
            className="h-full bg-teal-600 rounded-full transition-all duration-500"
          />
        </div>
      </div>

      {/* 4 Key Stat Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="bg-slate-50 dark:bg-navy-800/60 p-3 rounded-lg border border-slate-100 dark:border-navy-700/50">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" /> Working
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {stats.currentlyWorking}
          </div>
          <div className="text-[11px] text-slate-400">In-progress execution</div>
        </div>

        <div className="bg-slate-50 dark:bg-navy-800/60 p-3 rounded-lg border border-slate-100 dark:border-navy-700/50">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-amber-500" /> Submitted
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {stats.submittedForReview}
          </div>
          <div className="text-[11px] text-slate-400">Under buyer review</div>
        </div>

        <div className="bg-slate-50 dark:bg-navy-800/60 p-3 rounded-lg border border-slate-100 dark:border-navy-700/50">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Approved
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.approvedSettled}
          </div>
          <div className="text-[11px] text-slate-400">Payout disbursed</div>
        </div>

        <div className="bg-slate-50 dark:bg-navy-800/60 p-3 rounded-lg border border-slate-100 dark:border-navy-700/50">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-purple-500" /> Overdue
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {stats.reviewOverdue}
          </div>
          <div className="text-[11px] text-slate-400">&gt; 72h SLA escalation</div>
        </div>
      </div>
    </div>
  );
}
