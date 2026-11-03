import React from 'react';
import Link from 'next/link';
import { DemoBadge } from '@/components/shared/DemoBadge';
import { HelpCircle, Clock, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';

export default function HelpPage() {
  const faqs = [
    {
      q: 'How does the 72-Hour Review SLA work?',
      a: 'When a worker submits deliverables, a 72-hour review clock begins. If the Buyer does not evaluate the work or request revisions within 72 hours, the submission transitions to REVIEW_OVERDUE and escalates to Platform Moderation for evidence review. Funds are never blindly auto-approved without verification.',
    },
    {
      q: 'What is the difference between Multi-Worker and First-Approved models?',
      a: 'In the MULTI_WORKER model, every participating worker executes independently and receives a full unit payout upon approval. In the FIRST_APPROVED model, workers compete concurrently; the first submission that satisfies all acceptance criteria claims the full bounty, and remaining slots close gracefully.',
    },
    {
      q: 'How are progress percentages calculated?',
      a: 'EarnXpress strictly prohibits subjective self-reported progress percentages. Progress percentages are derived directly from verified completed milestone checkpoints on the worker checklist.',
    },
    {
      q: 'Are the wallet balances real money?',
      a: 'No. EarnXpress MVP operates strictly in simulated DEMO USD cents for testing and demonstration. You can top up your test wallet using the $1,000 DEMO Faucet button at any time.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5">
          <DemoBadge size="sm" variant="teal" />
          <span className="text-xs uppercase font-bold tracking-wider text-teal-600 font-mono">
            Knowledge Base
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Help Center & Platform Rules
        </h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Understand the rules of participation, review SLAs, and governance guidelines.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((f, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm space-y-2"
          >
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />
              {f.q}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
              {f.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
