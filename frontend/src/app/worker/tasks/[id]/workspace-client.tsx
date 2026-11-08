'use client';

import React, { useState } from 'react';
import { WorkerParticipation } from '@/types';
import { MilestoneTracker } from '@/components/shared/MilestoneTracker';
import { WorkspaceChat } from '@/components/shared/WorkspaceChat';
import { api } from '@/lib/api';
import {
  Send,
  Loader2,
  CheckCircle2,
  FileCheck2,
  Link as LinkIcon,
  AlertCircle,
  History,
  ShieldCheck,
} from 'lucide-react';

interface WorkspaceClientProps {
  initialParticipation: WorkerParticipation;
}

export function WorkspaceClient({ initialParticipation }: WorkspaceClientProps) {
  const [participation, setParticipation] = useState(initialParticipation);
  const [content, setContent] = useState('');
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [attestationConfirmed, setAttestationConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMilestoneUpdate = async (milestoneId: string, isCompleted: boolean) => {
    try {
      const res = await api.updateMilestone(participation.id, milestoneId, isCompleted);
      if (res.success) {
        setParticipation((prev) => ({
          ...prev,
          progressPercentage: res.progressPercentage,
        }));
      }
    } catch {
      // Error handled silently
    }
  };

  const handleSubmitDeliverables = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please provide submission notes describing your completed work.');
      return;
    }
    if (!attestationConfirmed) {
      setError('You must confirm that your deliverables satisfy all published criteria.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const urls = deliverableUrl.trim() ? [deliverableUrl.trim()] : [];
      const res = await api.submitWork(participation.id, content, urls);

      if (res.success) {
        setSubmitSuccess(true);
        setParticipation((prev) => ({
          ...prev,
          status: 'SUBMITTED',
          progressPercentage: 100,
          submissionVersions: [
            ...(prev.submissionVersions || []),
            {
              id: `subv-${Date.now()}`,
              versionNumber: (prev.submissionVersions?.length || 0) + 1,
              textNotes: content,
              deliverableUrls: urls,
              submittedAt: new Date().toISOString(),
            },
          ],
        }));
      } else {
        setError(res.message || 'Submission failed');
      }
    } catch {
      setError('Failed to submit deliverables');
    } finally {
      setSubmitting(false);
    }
  };

  const isAlreadySubmitted = participation.status === 'SUBMITTED' || participation.status === 'UNDER_REVIEW';
  const isApproved = participation.status === 'APPROVED';

  return (
    <div className="space-y-8">
      {/* Status Alert Banner */}
      {isApproved ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="text-xs text-emerald-800 dark:text-emerald-300">
            <strong>Deliverables Approved!</strong> The Buyer accepted your submission and your payout has been disbursed directly to your wallet.
          </div>
        </div>
      ) : isAlreadySubmitted ? (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-center gap-3">
          <FileCheck2 className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="text-xs text-amber-800 dark:text-amber-300">
            <strong>Deliverables Under Review:</strong> Your work has been submitted. The Buyer has up to 72 hours under our SLA to review or request revisions before escalation.
          </div>
        </div>
      ) : null}

      {/* Section 1: Milestone Checklist */}
      <div className="space-y-2">
        <MilestoneTracker
          milestones={participation.milestones || []}
          participationId={participation.id}
          readOnly={isApproved}
          onUpdate={handleMilestoneUpdate}
        />
      </div>

      {/* Section 2: Deliverable Submission Form */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 dark:border-navy-800 pb-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Send className="w-4 h-4 text-teal-600" />
            Deliverable Submission & Evidence Locker
          </h3>
          <p className="text-xs text-slate-500">
            Provide links to completed assets and detailed notes for buyer verification.
          </p>
        </div>

        {submitSuccess && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Deliverables successfully submitted for review!
          </div>
        )}

        <form onSubmit={handleSubmitDeliverables} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Work Notes & Deliverable Description
            </label>
            <textarea
              rows={4}
              required
              disabled={isApproved || submitting}
              placeholder="Detail how you satisfied the objective acceptance criteria, methodology used, and instructions for testing..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs p-3 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Deliverable Storage URL / Pull Request Link
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="url"
                disabled={isApproved || submitting}
                placeholder="https://storage.earnxpress.demo/files/dataset.csv or GitHub repo"
                value={deliverableUrl}
                onChange={(e) => setDeliverableUrl(e.target.value)}
                className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs pl-9 pr-3 py-2.5 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* In-Situ Worker Rules Notification Card */}
          <div className="p-4 bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 rounded-xl space-y-2.5 text-xs">
            <div className="font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
              Task Deliverable Submission Guidelines &amp; Anti-Fraud Policy
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
              <li><strong>100% Original Work:</strong> Submitting fake, stolen, or duplicate screenshots will lead to immediate and permanent account termination.</li>
              <li><strong>Acceptance Criteria Compliance:</strong> Verify that your deliverable meets every requirement specified in the task description.</li>
              <li><strong>72-Hour Escrow Protection:</strong> Buyers have up to 72 hours to evaluate your submission; if unattended, the escrow funds are automatically disbursed to your balance.</li>
            </ul>
            <label className="flex items-start gap-2.5 pt-2 border-t border-teal-200/60 dark:border-teal-800/40 cursor-pointer text-slate-900 dark:text-white font-semibold select-none">
              <input
                type="checkbox"
                id="attest"
                required
                checked={attestationConfirmed}
                onChange={(e) => setAttestationConfirmed(e.target.checked)}
                className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs">
                I certify that I have thoroughly completed this work with genuine proof, complying with all EarnXpress submission rules. *
              </span>
            </label>
          </div>

          {error && <div className="text-xs text-red-500 font-semibold">{error}</div>}

          {!isApproved && (
            <button
              type="submit"
              disabled={submitting || !attestationConfirmed}
              className="bg-teal-600 hover:bg-teal-500 disabled:bg-slate-300 dark:disabled:bg-navy-800 disabled:cursor-not-allowed text-white font-bold text-xs px-6 py-3 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting Work...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit Deliverables for Review
                </>
              )}
            </button>
          )}
        </form>
      </div>

      {/* Section 3: Submission & Revision History */}
      {participation.submissionVersions && participation.submissionVersions.length > 0 && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 border-b border-slate-100 dark:border-navy-800 pb-3">
            <History className="w-4 h-4 text-slate-500" />
            Revision & Submission History
          </h3>

          <div className="space-y-3">
            {participation.submissionVersions.map((v) => (
              <div
                key={v.id}
                className="p-4 rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200/80 dark:border-navy-700/60 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">
                    Version #{v.versionNumber}
                  </span>
                  <span className="text-slate-400">
                    {new Date(v.submittedAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {v.textNotes}
                </p>
                {v.deliverableUrls && v.deliverableUrls.length > 0 && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-mono truncate">
                    Attachment: {v.deliverableUrls[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In-Task Workspace Direct Chat with Buyer */}
      <WorkspaceChat
        taskId={participation.taskId}
        workerId={participation.workerId}
        buyerId={participation.task?.buyer?.id || (participation.task as any)?.buyerId || 'buyer-alex'}
        peerName={participation.task?.buyer?.profile?.displayName || 'Campaign Buyer'}
      />
    </div>
  );
}
