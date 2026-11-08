import React from 'react';
import Link from 'next/link';
import { Users, Globe2, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5">
          <span className="text-xs uppercase font-bold tracking-wider text-teal-600 font-mono">
            Platform Mission
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          About EarnXpress
        </h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          The next-generation open international freelance task marketplace engineered for multi-worker crowdsourcing.
        </p>
      </div>

      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-8 shadow-sm space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Our Core Philosophy: The Open Marketplace</h2>
        <p>
          Traditional freelance platforms were built for 1:1 direct hiring, where a buyer negotiates with one worker for days before work starts. This model breaks down when businesses need 50 translators, 200 data annotators, or dozens of bug bounties executed concurrently.
        </p>
        <p>
          EarnXpress transforms task execution into an <strong>Open Marketplace</strong>. A Buyer publishes a single campaign with a defined slot capacity. Eligible workers globally discover the task and immediately claim slots with guaranteed start deadlines and isolated progress milestones.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4 text-teal-600" /> Multi-Worker Scalability
            </h3>
            <p className="text-xs text-slate-500">
              One worker’s failure or delay never impacts other workers. Each submission is evaluated and rewarded strictly on its own merits.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Tamper-Evident Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Built on a strict double-entry ledger operating in integer cents with trigger-protected audit trails.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
