import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DemoBadge } from '@/components/shared/DemoBadge';
import { WalletClient } from './wallet-client';
import { ArrowLeft, Wallet } from 'lucide-react';

export default async function WorkerWalletPage() {
  const wallet = await api.getWallet();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link
          href="/worker"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Worker Dashboard
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-navy-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-6 h-6 text-teal-600" />
              Demo Simulation Wallet
            </h1>
            <DemoBadge size="sm" variant="teal" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Simulated double-entry ledger with instant test faucet grants.
          </p>
        </div>
      </div>

      <WalletClient
        initialAvailable={wallet.formattedAvailableUSD}
        initialEscrow={wallet.formattedEscrowUSD}
        initialTransactions={wallet.transactions}
      />
    </div>
  );
}
