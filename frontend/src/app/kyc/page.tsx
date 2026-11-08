import React from 'react';
import Link from 'next/link';
import { KycClient } from './kyc-client';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function KycPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Marketplace
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-navy-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-teal-600" />
            Identity Verification &amp; Compliance Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global KYC verification to certify your EarnXpress account for instant payouts and high-volume tasks.
          </p>
        </div>
      </div>

      <KycClient />
    </div>
  );
}
