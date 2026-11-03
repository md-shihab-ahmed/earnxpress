'use client';

import React, { useState } from 'react';
import { WorkerParticipation } from '@/types';
import { api } from '@/lib/api';
import { DemoBadge } from '@/components/shared/DemoBadge';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Star,
  Clock,
  Loader2,
  FileCheck2,
} from 'lucide-react';

interface ReviewQueueClientProps {
  initialParticipations: WorkerParticipation[];
}

export function ReviewQueueClient({ initialParticipations }: ReviewQueueClientProps) {
  const [participations, setParticipations] = useState(initialParticipations);
  const [selectedPart, setSelectedPart] = useState<WorkerParticipation | null>(
    initialParticipations[0] || null
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('Deliverables verified and accepted.');
  const [rating, setRating] = useState(5);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleReview = async (decision: 'APPROVE' | 'REQUEST_REVISION' | 'REJECT') => {
    if (!selectedPart) return;

    setActionLoading(true);
    setActionSuccess(null);

    try {
      const res = await api.reviewParticipation(selectedPart.id, decision, feedback, rating);
      if (res.success) {
        setActionSuccess(
          decision === 'APPROVE'
            ? 'Submission APPROVED! Demo payout disbursed to worker.'
            : decision === 'REQUEST_REVISION'
            ? 'Revision requested. Worker notified.'
            : 'Deliverables rejected. 72h dispute appeal window active.'
        );

        // Update list
        setParticipations((prev) =>
          prev.map((p) => (p.id === selectedPart.id ? { ...p, status: res.status } : p))
        );
        setSelectedPart((prev) => (prev ? { ...prev, status: res.status } : null));
      }
    } catch {
      // Error handled
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Submissions List */}
      <div className="lg:col-span-1 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-[700px]">
        <div className="p-4 border-b border-slate-100 dark:border-navy-800 bg-slate-50 dark:bg-navy-800/60 flex items-center justify-between">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Pending Queue ({participations.length})
          </span>
          <DemoBadge size="sm" variant="teal" />
        </div>

        <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-navy-800 flex-1">
          {participations.map((part) => (
            <div
              key={part.id}
              onClick={() => {
                setSelectedPart(part);
                setActionSuccess(null);
              }}
              className={`p-4 cursor-pointer transition-all ${
                selectedPart?.id === part.id
                  ? 'bg-teal-50/70 dark:bg-teal-950/20 border-l-4 border-l-teal-600'
                  : 'hover:bg-slate-50 dark:hover:bg-navy-800/50'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  Slot #{part.slotNumber}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    part.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : part.status === 'REVISION_REQUESTED'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {part.status}
                </span>
              </div>
              <div className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-1">
                {part.task?.title}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Worker: @Rahim_BD</span>
                <span className="font-mono text-teal-600 font-bold">{part.task?.formattedUnitUSD}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review & Evaluation Console */}
      <div className="lg:col-span-2 space-y-6">
        {selectedPart ? (
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-4">
              <div>
                <span className="text-xs text-slate-400 font-mono">Evaluating Slot #{selectedPart.slotNumber}</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedPart.task?.title}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Unit Escrow</div>
                <div className="text-base font-bold text-teal-600 dark:text-teal-400 font-mono">
                  {selectedPart.task?.formattedUnitUSD}
                </div>
              </div>
            </div>

            {actionSuccess && (
              <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {actionSuccess}
              </div>
            )}

            {/* Worker Deliverables Card */}
            <div className="bg-slate-50 dark:bg-navy-800/60 rounded-xl p-5 border border-slate-200 dark:border-navy-700/60 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-teal-600" /> Worker Deliverable Package
              </h4>

              <div className="space-y-2 text-xs">
                <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-white dark:bg-navy-900 p-3 rounded-lg border border-slate-200 dark:border-navy-700">
                  {selectedPart.submissionVersions?.[0]?.textNotes ||
                    'Completed full dataset tagging following published acceptance criteria with 99.4% agreement rate.'}
                </div>

                {selectedPart.submissionVersions?.[0]?.deliverableUrls && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Storage Asset:</span>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-teal-600 hover:underline flex items-center gap-1 font-mono"
                    >
                      {selectedPart.submissionVersions[0].deliverableUrls[0]}{' '}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Evaluation Actions Form */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Reviewer Feedback / Revision Instructions
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Detail acceptance confirmation or specify exact criteria that require revision..."
                  className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs p-3 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Performance Rating:
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-amber-500 ml-1">
                    {rating}.0
                  </span>
                </div>
              </div>

              {/* 3 Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={actionLoading || selectedPart.status === 'APPROVED'}
                  onClick={() => handleReview('APPROVE')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Approve Deliverables & Release Payout
                </button>

                <button
                  type="button"
                  disabled={actionLoading || selectedPart.status === 'APPROVED'}
                  onClick={() => handleReview('REQUEST_REVISION')}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Request Revision
                </button>

                <button
                  type="button"
                  disabled={actionLoading || selectedPart.status === 'APPROVED'}
                  onClick={() => handleReview('REJECT')}
                  className="bg-slate-200 hover:bg-red-600 hover:text-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject Deliverables
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-12 text-center text-slate-400 text-xs">
            Select a worker submission from the queue to inspect deliverables.
          </div>
        )}
      </div>
    </div>
  );
}
