'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Scale, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { EvidenceUploader, UploadedEvidenceItem } from './EvidenceUploader';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  participationId: string;
  taskTitle: string;
  unitBudgetUSD?: string;
  onDisputeCreated?: (disputeId: string) => void;
}

const REASON_CODES = [
  { value: 'UNJUSTIFIED_REJECTION', label: 'Unjustified Rejection — Deliverables met requirements' },
  { value: 'BUYER_UNRESPONSIVE_SLA', label: 'Buyer Unresponsive — Review SLA breached (72h)' },
  { value: 'NON_COMPLIANT_DELIVERABLE', label: 'Non-Compliant Deliverables — Fails acceptance criteria' },
  { value: 'COMMUNICATION_BREAKDOWN', label: 'Communication Breakdown — Instructions contradicted' },
  { value: 'EVIDENCE_OF_FRAUD', label: 'Suspicious Activity or Plagiarism' },
  { value: 'OTHER', label: 'Other Arbitration Request' },
];

export function DisputeModal({
  isOpen,
  onClose,
  participationId,
  taskTitle,
  unitBudgetUSD,
  onDisputeCreated,
}: DisputeModalProps) {
  const [reasonCode, setReasonCode] = useState(REASON_CODES[0].value);
  const [statement, setStatement] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<UploadedEvidenceItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim() || statement.trim().length < 20) {
      setErrorMessage('Please provide a detailed dispute statement of at least 20 characters.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await api.createDispute({
        participationId,
        reasonCode,
        statement: statement.trim(),
        evidenceFileIds: evidenceFiles.map((f) => f.id),
      });

      if (!res.success || !res.disputeId) {
        throw new Error(res.message || 'Failed to file dispute');
      }

      setIsSuccess(true);
      onDisputeCreated?.(res.disputeId);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating dispute');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Scale className="w-5 h-5" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Initiate Formal Dispute Arbitration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
              Dispute Submitted to Moderation
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your dispute has been logged. An independent platform arbitrator will review the
              complete dossier and attached evidence.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Task:</strong> {taskTitle}
                {unitBudgetUSD && <span> • <strong>Escrow Budget:</strong> {unitBudgetUSD}</span>}
                <p className="mt-1">
                  Disputes transition the slot to an isolated arbitration state. Escrow funds remain
                  safely locked until moderator resolution.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Dispute Reason Code
              </label>
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {REASON_CODES.map((code) => (
                  <option key={code.value} value={code.value}>
                    {code.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Detailed Statement & Justification
              </label>
              <textarea
                rows={4}
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Explain clearly why the review decision was incorrect, citing instructions or timestamps..."
                className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-400">Minimum 20 characters</span>
            </div>

            <div>
              <EvidenceUploader
                participationId={participationId}
                label="Attach Supporting Evidence (Screenshots, PDFs, Datasets)"
                maxFiles={4}
                onFilesChange={setEvidenceFiles}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Dispute...
                  </>
                ) : (
                  'File Dispute'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
