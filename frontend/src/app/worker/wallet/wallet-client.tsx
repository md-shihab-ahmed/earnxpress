'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { DemoBadge } from '@/components/shared/DemoBadge';
import { DemoLedgerTransaction } from '@/types';
import {
  Wallet,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface WalletClientProps {
  initialAvailable: string;
  initialEscrow: string;
  initialTransactions: DemoLedgerTransaction[];
}

export function WalletClient({
  initialAvailable,
  initialEscrow,
  initialTransactions,
}: WalletClientProps) {
  const [available, setAvailable] = useState(initialAvailable);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  const handleClaimFaucet = async () => {
    setClaiming(true);
    setClaimSuccess(null);

    try {
      const res = await api.claimFaucet();
      if (res.success) {
        setAvailable(res.newBalanceUSD);
        setClaimSuccess('Claimed DEMO $1,000.00 USD simulated testing grant!');
        // Refresh transactions list
        const updatedWallet = await api.getWallet();
        setTransactions(updatedWallet.transactions);
      }
    } catch {
      // Error handled
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Disclaimer Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>Demonstration Environment Notice:</strong> All currencies, escrows, and balances shown here are strictly simulated DEMO integer USD cents for testing. No real money movements, withdrawals, or fiat transactions exist.
        </div>
      </div>

      {/* Balance Cards & Faucet Action */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Available Balance</span>
            <DemoBadge size="sm" variant="teal" />
          </div>
          <div className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 font-mono">
            {available}
          </div>
          <div className="text-xs text-slate-400">Available for task settlements & tests</div>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>In Escrow (Locked)</span>
            <Coins className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {initialEscrow}
          </div>
          <div className="text-xs text-slate-400">Reserved for active work slots</div>
        </div>

        <div className="bg-gradient-to-br from-navy-900 to-navy-950 text-white border border-navy-700/80 rounded-xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Simulated Faucet
            </div>
            <div className="text-xs text-slate-300 mt-1">
              Top up your test wallet with $1,000 DEMO credits.
            </div>
          </div>

          <button
            type="button"
            disabled={claiming}
            onClick={handleClaimFaucet}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {claiming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Claiming Grant...
              </>
            ) : (
              <>
                <Coins className="w-4 h-4" /> Claim $1,000 DEMO Faucet
              </>
            )}
          </button>
        </div>
      </div>

      {claimSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {claimSuccess}
        </div>
      )}

      {/* Transaction History Ledger */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Double-Entry Transaction Ledger
          </h3>
          <span className="text-xs text-slate-400 font-mono">Currency: USD Cents (BIGINT)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-800/60 text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-navy-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Reference Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount (DEMO USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] font-semibold bg-slate-100 dark:bg-navy-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                      {tx.referenceType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium">{tx.description}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    <span
                      className={
                        tx.formattedAmountUSD.includes('+')
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                      }
                    >
                      {tx.formattedAmountUSD}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
