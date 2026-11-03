import React from 'react';
import { DemoBadge } from '@/components/shared/DemoBadge';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-slate-200 dark:border-navy-800 pb-4 space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Privacy & Identity Governance</h1>
          <DemoBadge size="sm" variant="teal" />
        </div>
        <p className="text-xs text-slate-500">Effective Date: November 2026</p>
      </div>

      <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Identity Verification Invariant (MVP Safeguards)</h2>
          <p>
            EarnXpress does NOT collect or store real government-issued identity documents (passports, national ID cards) or biometric face scans in this demonstration release.
          </p>
          <p>
            All verification demonstrations utilize simulated mock verification adapters with masked synthetic document references, ensuring zero exposure of sensitive personally identifiable information (PII).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Data Retention & Isolation</h2>
          <p>
            Worker participation records, task deliverables, and private notes are restricted to the participating worker and the task publisher. Other marketplace participants cannot access another worker&apos;s submissions.
          </p>
        </section>
      </div>
    </div>
  );
}
