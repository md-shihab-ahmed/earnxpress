'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Users,
  Zap,
  Coins,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

export function TaskCreationWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [buyerPolicyAgreed, setBuyerPolicyAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [taskModel, setTaskModel] = useState<'MULTI_WORKER' | 'FIRST_APPROVED'>('MULTI_WORKER');
  const [totalSlots, setTotalSlots] = useState(25);
  const [unitBudgetUSD, setUnitBudgetUSD] = useState('20.00');
  const [startDeadlineHours, setStartDeadlineHours] = useState(6);
  const [completionDurationHours, setCompletionDurationHours] = useState(24);
  const [maxRevisions, setMaxRevisions] = useState(2);
  const [descriptionMarkdown, setDescriptionMarkdown] = useState('');
  const [criteria, setCriteria] = useState([
    { key: 'accuracy', description: 'Deliverables must strictly follow the specifications with zero errors' },
    { key: 'completeness', description: 'All requested items and fields must be provided without blanks' },
  ]);

  // Derived financial math in integer cents
  const unitBudgetCents = Math.round(parseFloat(unitBudgetUSD || '0') * 100);
  const buyerFeeCents = Math.round(unitBudgetCents * 0.02); // 2% Buyer Fee
  const workerFeeCents = Math.round(unitBudgetCents * 0.04); // 4% Worker Fee
  const totalSlotEscrowCents = unitBudgetCents + buyerFeeCents;
  const totalEscrowCents = totalSlotEscrowCents * totalSlots;

  const handleAddCriterion = () => {
    setCriteria([...criteria, { key: `criterion_${criteria.length + 1}`, description: '' }]);
  };

  const handleRemoveCriterion = (idx: number) => {
    if (criteria.length <= 2) {
      setError('At least two objective acceptance criteria are required by platform governance.');
      return;
    }
    setCriteria(criteria.filter((_, i) => i !== idx));
  };

  const handlePublish = async () => {
    if (criteria.length < 2) {
      setError('Platform rules require at least two objective acceptance criteria.');
      return;
    }
    if (!title.trim() || !descriptionMarkdown.trim()) {
      setError('Title and task instructions cannot be empty.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        taskModel,
        totalSlots,
        unitBudgetCents: unitBudgetCents.toString(),
        startDeadlineHours,
        completionDurationHours,
        maxRevisions,
        descriptionMarkdown: descriptionMarkdown.trim(),
        acceptanceCriteria: criteria,
        deliverableRequirements: [
          { type: 'URL', label: 'Storage URL or GitHub link' },
          { type: 'TEXT', label: 'Summary notes' },
        ],
      };

      const res = await api.createBuyerTask(payload);
      if (res.success && res.task) {
        router.push(`/tasks/${res.task.id}`);
      } else {
        setError(res.message || 'Failed to publish campaign');
      }
    } catch {
      setError('Network exception publishing campaign');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Basics & Model' },
    { num: 2, label: 'Capacity & Time' },
    { num: 3, label: 'Budget & Escrow' },
    { num: 4, label: 'Acceptance Criteria' },
    { num: 5, label: 'Review & Publish' },
  ];

  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
      {/* Step Progress Stepper */}
      <div className="grid grid-cols-5 gap-2 border-b border-slate-100 dark:border-navy-800 pb-6">
        {steps.map((s) => (
          <div key={s.num} className="text-center space-y-1">
            <div
              className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s.num
                  ? 'bg-teal-600 text-white shadow-md ring-4 ring-teal-500/20'
                  : step > s.num
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-400'
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </div>
            <div
              className={`text-[11px] font-semibold hidden sm:block ${
                step === s.num ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'
              }`}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Step 1: Basics & Model */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Step 1: Campaign Basics</h2>
            <p className="text-xs text-slate-500">Define the core objective and select the marketplace execution model.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Campaign Title</label>
              <input
                type="text"
                placeholder="e.g. Translate 50 Technical Documentation Articles to Bangla"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs p-3 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Marketplace Execution Model</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setTaskModel('MULTI_WORKER')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    taskModel === 'MULTI_WORKER'
                      ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/20 ring-2 ring-teal-500/20'
                      : 'border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    <Users className="w-4 h-4 text-teal-600" /> MULTI-WORKER Model
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Multiple workers can claim slots and independently execute the task. Ideal for data annotation, translation, and large-scale reviews.
                  </p>
                </div>

                <div
                  onClick={() => setTaskModel('FIRST_APPROVED')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    taskModel === 'FIRST_APPROVED'
                      ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    <Zap className="w-4 h-4 text-amber-600" /> FIRST-APPROVED Bounty
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Multiple workers compete concurrently. The first valid approved deliverable claims the full bounty; remaining slots close automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Capacity & Deadlines */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Step 2: Capacity & Deadlines</h2>
            <p className="text-xs text-slate-500">Configure participant slots, start deadlines, and execution duration.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total Worker Capacity (Slots)</label>
              <input
                type="number"
                min={1}
                max={500}
                value={totalSlots}
                onChange={(e) => setTotalSlots(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs p-3 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400">Number of independent worker slots (1 to 500)</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Deadline (Hours)</label>
              <input
                type="number"
                min={1}
                max={48}
                value={startDeadlineHours}
                onChange={(e) => setStartDeadlineHours(parseInt(e.target.value) || 6)}
                className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs p-3 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400">Workers must check in within this time or slot auto-expires</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Completion Duration (Hours)</label>
              <input
                type="number"
                min={1}
                max={336}
                value={completionDurationHours}
                onChange={(e) => setCompletionDurationHours(parseInt(e.target.value) || 24)}
                className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs p-3 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400">Total time allowed for worker execution before deadline</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Max Revisions Allowed</label>
              <input
                type="number"
                min={0}
                max={5}
                value={maxRevisions}
                onChange={(e) => setMaxRevisions(parseInt(e.target.value) || 2)}
                className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs p-3 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400">Ceiling on revision requests before mandatory settlement</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Budget & Escrow Calculation */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Step 3: Budget & Escrow Calculation</h2>
            <p className="text-xs text-slate-500">All financial math executes strictly in integer USD cents without floating-point drift.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1 max-w-sm">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Unit Budget Per Worker (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
                <input
                  type="text"
                  value={unitBudgetUSD}
                  onChange={(e) => setUnitBudgetUSD(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs pl-8 pr-3 py-3 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white font-mono text-base font-bold"
                />
              </div>
            </div>

            {/* Live Financial Breakdown Card */}
            <div className="bg-slate-50 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-navy-700 pb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-teal-600" />
                  Escrow Lock Breakdown ({totalSlots} Slots)
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Unit Worker Base Payout:</span>
                  <span className="font-mono font-bold">${(unitBudgetCents / 100).toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Buyer Platform Fee (2.0%):</span>
                  <span className="font-mono">+${((buyerFeeCents * totalSlots) / 100).toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Worker Platform Fee Deducted on Approval (4.0%):</span>
                  <span className="font-mono text-slate-400">${(workerFeeCents / 100).toFixed(2)}/worker</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-navy-700 flex justify-between font-bold text-slate-900 dark:text-white text-sm">
                  <span>Total Escrow Reserved:</span>
                  <span className="font-mono text-teal-600 dark:text-teal-400 font-extrabold">
                    ${((totalEscrowCents) / 100).toFixed(2)} USD
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Instructions & Acceptance Criteria */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Step 4: Instructions & Acceptance Criteria</h2>
            <p className="text-xs text-slate-500">Provide clear guidelines and minimum 2 objective criteria for transparent evaluation.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Task Instructions & Deliverables Guide (Markdown)</label>
              <textarea
                rows={5}
                placeholder="Provide complete step-by-step instructions so workers can complete the work without private off-platform questions..."
                value={descriptionMarkdown}
                onChange={(e) => setDescriptionMarkdown(e.target.value)}
                className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs p-3 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-900 dark:text-white">Objective Acceptance Criteria Checklist</label>
                  <p className="text-[11px] text-slate-400">At least 2 objective criteria required by platform rules</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCriterion}
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-500"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Criterion
                </button>
              </div>

              <div className="space-y-2">
                {criteria.map((c, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-slate-50 dark:bg-navy-800 p-3 rounded-lg border border-slate-200 dark:border-navy-700">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 text-xs font-bold flex items-center justify-center mt-1">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        placeholder="Criterion key (e.g. grammar, schema_valid)"
                        value={c.key}
                        onChange={(e) => {
                          const updated = [...criteria];
                          updated[idx].key = e.target.value;
                          setCriteria(updated);
                        }}
                        className="w-full bg-white dark:bg-navy-700 border border-slate-200 dark:border-navy-600 text-xs px-2.5 py-1.5 rounded outline-none font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Objective requirement description..."
                        value={c.description}
                        onChange={(e) => {
                          const updated = [...criteria];
                          updated[idx].description = e.target.value;
                          setCriteria(updated);
                        }}
                        className="w-full bg-white dark:bg-navy-700 border border-slate-200 dark:border-navy-600 text-xs px-2.5 py-1.5 rounded outline-none"
                      />
                    </div>
                    {criteria.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterion(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-500 mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Review & Publish */}
      {step === 5 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Step 5: Review & Publish Campaign</h2>
            <p className="text-xs text-slate-500">Confirm campaign parameters. Escrow will be locked atomically upon publishing.</p>
          </div>

          <div className="bg-slate-50 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-5 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400">Campaign Title:</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{title}</p>
              </div>
              <div>
                <span className="text-slate-400">Execution Model:</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{taskModel}</p>
              </div>
              <div>
                <span className="text-slate-400">Total Capacity:</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{totalSlots} Independent Slots</p>
              </div>
              <div>
                <span className="text-slate-400">Unit Payout / Slot:</span>
                <p className="font-bold text-teal-600 dark:text-teal-400 font-mono mt-0.5">
                  ${(unitBudgetCents / 100).toFixed(2)} USD
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-navy-700">
              <span className="text-slate-400">Acceptance Criteria ({criteria.length}):</span>
              <ul className="mt-1 space-y-1 list-disc list-inside text-slate-700 dark:text-slate-300">
                {criteria.map((c, i) => (
                  <li key={i}>
                    <strong>{c.key}</strong>: {c.description}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* In-Situ Buyer Campaign Rules Notification Card */}
          <div className="p-4 bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 rounded-xl space-y-2.5 text-xs">
            <div className="font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
              Buyer Campaign Policy &amp; Escrow Agreement
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
              <li><strong>Privacy &amp; Security:</strong> Requesting worker passwords, banking credentials, National IDs, or distributing phishing software is strictly prohibited.</li>
              <li><strong>Fair Evaluation:</strong> Deliverables meeting all acceptance criteria must be approved. Malicious or unjustified rejections will result in account penalties.</li>
              <li><strong>72-Hour Auto-Clearance:</strong> Submissions unreviewed after 72 hours are automatically approved and settled from campaign escrow.</li>
              <li><strong>100% Refundable:</strong> You can close this campaign at any time and receive a 100% refund of all unfilled slot funds directly to your wallet.</li>
            </ul>
            <label className="flex items-start gap-2.5 pt-2 border-t border-teal-200/60 dark:border-teal-800/40 cursor-pointer text-slate-900 dark:text-white font-semibold select-none">
              <input
                type="checkbox"
                required
                checked={buyerPolicyAgreed}
                onChange={(e) => setBuyerPolicyAgreed(e.target.checked)}
                className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs">
                I have read, understood, and agree to the EarnXpress Buyer Campaign Guidelines and Escrow Policy. *
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Stepper Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-navy-800">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
        ) : (
          <div />
        )}

        {step < 5 ? (
          <button
            type="button"
            onClick={() => {
              if (step === 1 && !title.trim()) {
                setError('Please provide a campaign title.');
                return;
              }
              setError(null);
              setStep(step + 1);
            }}
            className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-colors"
          >
            Next Step <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={loading || !buyerPolicyAgreed}
            onClick={handlePublish}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-300 dark:disabled:bg-navy-800 disabled:cursor-not-allowed text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Locking Escrow & Publishing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Publish Campaign & Lock Escrow
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
