import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-slate-200 dark:border-navy-800 pb-4 space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Terms of Service</h1>
        </div>
        <p className="text-xs text-slate-500">Effective Date: November 2026</p>
      </div>

      <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Demonstration Environment Status</h2>
          <p>
            EarnXpress is currently operating as a technology demonstration platform. All wallet balances, escrows, earnings, and financial ledger transactions are strictly simulated in DEMO USD integer cents. Users acknowledge that no real fiat or cryptocurrency assets are held or redeemable.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Open Marketplace Participation</h2>
          <p>
            Any registered user may discover and claim available task slots. Claiming a slot is a binding commitment governed by task-specific start deadlines and completion durations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Review Deadlines & SLA</h2>
          <p>
            Buyers agree to evaluate submitted deliverables within 72 hours. Inactivity past 72 hours triggers escalation to platform moderation for evidence-based adjudication.
          </p>
        </section>
      </div>
    </div>
  );
}
