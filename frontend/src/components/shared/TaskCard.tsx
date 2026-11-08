import React from 'react';
import Link from 'next/link';
import { Task } from '@/types';
import { Users, Clock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const percentFilled = task.totalSlots > 0
    ? Math.round(((task.totalSlots - task.availableSlots) / task.totalSlots) * 100)
    : 0;

  const isMultiWorker = task.taskModel === 'MULTI_WORKER';

  return (
    <div className="group bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 hover:border-teal-500/50 dark:hover:border-teal-500/50 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div className="space-y-3">
        {/* Badges & Category */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                isMultiWorker
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              }`}
            >
              {isMultiWorker ? (
                <>
                  <Users className="w-3 h-3" /> MULTI-WORKER
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3" /> FIRST-APPROVED BOUNTY
                </>
              )}
            </span>
          </div>

          {task.category && (
            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-navy-800 px-2 py-0.5 rounded">
              {task.category.name}
            </span>
          )}
        </div>

        {/* Title */}
        <Link href={`/tasks/${task.id}`}>
          <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 text-base line-clamp-2 transition-colors">
            {task.title}
          </h3>
        </Link>

        {/* Buyer info */}
        {task.buyer?.profile && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {task.buyer.profile.displayName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-0.5 text-amber-500 font-medium">
              ★ {Number(task.buyer.profile.reputationScore || 5.0).toFixed(1)}
            </span>
            <span>•</span>
            <span>{task.buyer.profile.countryCode}</span>
          </div>
        )}

        {/* Capacity overview bar */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5 text-teal-600" />
              {task.availableSlots} of {task.totalSlots} Slots Open
            </span>
            <span className="text-[11px] text-slate-400">{percentFilled}% filled</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
            <div
              style={{ width: `${percentFilled}%` }}
              className="h-full bg-teal-600 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Footer Payout & Action */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-800/80 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Unit Payout
          </div>
          <div className="text-lg font-bold text-teal-600 dark:text-teal-400 font-mono">
            {task.formattedUnitUSD}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Start in {task.startDeadlineHours}h
            </div>
            <div className="text-[10px] text-slate-400">
              Duration {task.completionDurationHours}h
            </div>
          </div>

          <Link
            href={`/tasks/${task.id}`}
            className="inline-flex items-center gap-1 bg-navy-900 hover:bg-navy-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            Inspect <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
