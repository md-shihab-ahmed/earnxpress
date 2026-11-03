import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { DemoBadge } from '@/components/shared/DemoBadge';
import { WorkspaceClient } from './workspace-client';
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface WorkerTaskWorkspacePageProps {
  params: {
    id: string;
  };
}

export default async function WorkerTaskWorkspacePage({ params }: WorkerTaskWorkspacePageProps) {
  const participations = await api.getWorkerParticipations();
  const participation = participations.find((p) => p.taskId === params.id) || participations[0];

  if (!participation || !participation.task) {
    notFound();
  }

  const { task } = participation;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/worker"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Worker Dashboard
        </Link>
      </div>

      {/* Task Top Meta Header */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              SLOT #{participation.slotNumber}
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-slate-300">
              STATUS: {participation.status}
            </span>
            <DemoBadge size="sm" variant="teal" />
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Execution Deadline: {new Date(participation.executionDeadlineAt).toLocaleString()}
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {task.title}
          </h1>
          <p className="text-xs text-slate-500">
            Unit Payout upon Approval:{' '}
            <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">
              {task.formattedUnitUSD}
            </span>
          </p>
        </div>
      </div>

      {/* Interactive Execution Workspace Client */}
      <WorkspaceClient initialParticipation={participation} />
    </div>
  );
}
