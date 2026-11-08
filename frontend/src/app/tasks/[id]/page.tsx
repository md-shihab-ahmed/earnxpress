import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { ParticipationDashboard } from '@/components/shared/ParticipationDashboard';
import { TaskQnA } from '@/components/shared/TaskQnA';
import { ClaimSlotButton } from './claim-slot-button';
import {
  Users,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  ArrowLeft,
  Calendar,
  Share2,
} from 'lucide-react';

interface TaskDetailPageProps {
  params: {
    id: string;
  };
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const task = await api.getTaskById(params.id);

  if (!task) {
    notFound();
  }

  const isMultiWorker = task.taskModel === 'MULTI_WORKER';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Open Marketplace
        </Link>
      </div>

      {/* Hero Header */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                isMultiWorker
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              }`}
            >
              {isMultiWorker ? 'MULTI-WORKER (Collaborative)' : 'FIRST-APPROVED (Competitive Bounty)'}
            </span>
            <span className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full font-bold">
              STATUS: {task.status}
            </span>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1 font-mono">
            <Calendar className="w-3.5 h-3.5" /> Published {new Date(task.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {task.title}
          </h1>
          {task.category && (
            <div className="text-xs text-slate-500">
              Category: <span className="font-semibold text-slate-700 dark:text-slate-300">{task.category.name}</span>
            </div>
          )}
        </div>

        {/* Financial & Deadline Summary Pill Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/70 dark:border-navy-700/60">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Unit Payout Per Worker</div>
            <div className="text-xl font-extrabold text-teal-600 dark:text-teal-400 font-mono mt-0.5">
              {task.formattedUnitUSD}
            </div>
            <div className="text-[10px] text-slate-400">Disbursed upon approval</div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Available Slots</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              {task.availableSlots} / {task.totalSlots}
            </div>
            <div className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">Open for claim</div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Start Deadline</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              {task.startDeadlineHours}h
            </div>
            <div className="text-[10px] text-slate-400">To check in & begin</div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Max Revisions</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              {task.maxRevisions}
            </div>
            <div className="text-[10px] text-slate-400">Review SLA: {task.reviewSlaHours}h</div>
          </div>
        </div>

        {/* Claim Action Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-navy-800">
          <div className="text-xs text-slate-500 max-w-md">
            Claiming a slot reserves capacity exclusively for you under PostgreSQL row-level locks. You will have {task.completionDurationHours} hours to finish and submit.
          </div>

          <ClaimSlotButton taskId={task.id} availableSlots={task.availableSlots} />
        </div>
      </div>

      {/* Main Grid: Details + Participation Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Full Instructions & Criteria */}
        <div className="lg:col-span-2 space-y-6">
          {/* Instructions Box */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2 border-b border-slate-100 dark:border-navy-800 pb-3">
              <FileText className="w-5 h-5 text-teal-600" />
              Task Instructions (Version {task.instructions?.versionNumber || 1})
            </h3>

            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {task.instructions?.descriptionMarkdown}
            </div>
          </div>

          {/* Objective Acceptance Criteria */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 border-b border-slate-100 dark:border-navy-800 pb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Objective Acceptance Criteria
            </h3>
            <p className="text-xs text-slate-500">
              Buyer evaluations must evaluate strictly against these criteria. Rejections require citing failed checklist items.
            </p>

            <div className="space-y-2.5">
              {task.instructions?.acceptanceCriteria?.map((c: any, idx: number) => {
                const key = typeof c === 'string' ? `Criterion ${idx + 1}` : c.key || `Criterion ${idx + 1}`;
                const description = typeof c === 'string' ? c : c.description || c.text || '';
                return (
                  <div
                    key={`${key}-${idx}`}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200/80 dark:border-navy-700/60 flex items-start gap-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                        {key}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Public In-Platform Q&A Section */}
          <TaskQnA taskId={task.id} buyerId={task.buyer?.id} />
        </div>

        {/* Right Column: Participation Dashboard & Buyer Profile */}
        <div className="space-y-6">
          {/* Real-time Participation Dashboard */}
          {task.participationStats && (
            <ParticipationDashboard stats={task.participationStats} taskTitle={task.title} />
          )}

          {/* Buyer Profile Card */}
          {task.buyer?.profile && (
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Campaign Publisher
              </h4>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-800 text-teal-400 font-bold flex items-center justify-center text-sm border border-navy-700">
                  {task.buyer.profile.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {task.buyer.profile.displayName}
                  </div>
                  <div className="text-xs text-slate-500">{task.buyer.profile.countryCode} • Verified Buyer</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-navy-800 text-center">
                <div className="bg-slate-50 dark:bg-navy-800 p-2 rounded-lg">
                  <div className="text-xs font-bold text-amber-500">★ {Number(task.buyer.profile.reputationScore || 5.0).toFixed(1)}</div>
                  <div className="text-[10px] text-slate-400">Reputation</div>
                </div>
                <div className="bg-slate-50 dark:bg-navy-800 p-2 rounded-lg">
                  <div className="text-xs font-bold text-emerald-500">{Number(task.buyer.profile.completionRate || 100).toFixed(0)}%</div>
                  <div className="text-[10px] text-slate-400">Settlement Rate</div>
                </div>
              </div>
            </div>
          )}

          {/* SLA & Governance Summary Card */}
          <div className="bg-slate-50 dark:bg-navy-900/40 border border-slate-200 dark:border-navy-800 rounded-xl p-5 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Platform Guarantees
            </h4>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold">•</span>
                <span><strong>Guaranteed Escrow:</strong> 100% of the campaign budget is pre-locked in verified escrow before publishing.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold">•</span>
                <span><strong>72-Hour SLA:</strong> Unreviewed submissions escalate to platform moderation for objective review.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold">•</span>
                <span><strong>Isolated Record:</strong> Other participants cannot see your private workspace or deliverables.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
