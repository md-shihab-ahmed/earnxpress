import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DemoBadge } from '@/components/shared/DemoBadge';
import { ReviewQueueClient } from './review-queue-client';
import { ArrowLeft, FileCheck2 } from 'lucide-react';

export default async function BuyerSubmissionsPage() {
  const participations = await api.getWorkerParticipations();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link
          href="/buyer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Buyer Portal
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-navy-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-teal-600" />
              Submissions Review Queue
            </h1>
            <DemoBadge size="sm" variant="teal" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Evaluate worker deliverable packages against objective criteria within the 72-hour review SLA.
          </p>
        </div>
      </div>

      <ReviewQueueClient initialParticipations={participations} />
    </div>
  );
}
