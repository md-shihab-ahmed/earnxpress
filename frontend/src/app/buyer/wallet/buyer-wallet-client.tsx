'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { DemoLedgerTransaction } from '@/types';
import { DepositModal } from '@/components/shared/DepositModal';
import { WithdrawalModal } from '@/components/shared/WithdrawalModal';
import {
  Wallet,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Building2,
  Smartphone,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface BuyerWalletClientProps {
  initialAvailable: string;
  initialEscrow: string;
  initialTransactions: DemoLedgerTransaction[];
}

export function BuyerWalletClient({
  initialAvailable,
  initialEscrow,
  initialTransactions,
}: BuyerWalletClientProps) {
  const [available, setAvailable] = useState(initialAvailable);
  const [escrow, setEscrow] = useState(initialEscrow);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const fetchDeposits = async () => {
    setLoadingDeposits(true);
    try {
      const data = await api.getMyDeposits();
      setDeposits(data || []);
    } catch {
      // ignore
    } finally {
      setLoadingDeposits(false);
    }
  };

  const refreshWallet = async () => {
    try {
      const updated = await api.getWallet();
      setAvailable(updated.formattedAvailableUSD);
      setEscrow(updated.formattedEscrowUSD);
      setTransactions(updated.transactions);
      await fetchDeposits();
    } catch {
      fetchDeposits();
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'FAILED':
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            <AlertTriangle className="w-3 h-3" /> Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase animate-pulse">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Notice Banner */}
      <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-teal-900 dark:text-teal-200 leading-relaxed">
            <strong>Binance-First Global Deposits:</strong> Deposit funds via <strong>Binance Pay (0% Fee)</strong>, USDT Crypto, bKash, or Local Bank Transfer. Funds are credited directly to your Buyer Available balance to launch high-scale campaigns.
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsDepositModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <ArrowDownLeft className="w-4 h-4" /> Deposit Funds
          </button>
          <button
            type="button"
            onClick={() => setIsWithdrawModalOpen(true)}
            className="bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700 font-bold text-xs px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4 text-teal-400" /> Withdraw
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Available Balance */}
        <div className="p-6 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Available Balance
            </span>
            <span className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
              {available}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Ready to fund new tasks, expand slot capacity, or withdraw.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsDepositModalOpen(true)}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
            >
              + Add funds with Binance Pay &gt;
            </button>
          </div>
        </div>

        {/* Escrow Locked */}
        <div className="p-6 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Escrow Locked (Active Campaigns)
            </span>
            <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
              {escrow}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Guaranteed escrow reserved for workers currently assigned to your tasks.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-xs text-slate-400">
              Released upon your deliverable review &amp; approval.
            </span>
          </div>
        </div>
      </div>

      {/* Deposit Requests History */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Deposit Orders &amp; Receipts
            </h3>
          </div>
          <button
            type="button"
            onClick={fetchDeposits}
            className="text-xs text-slate-500 hover:text-teal-600 flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingDeposits ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {deposits.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Coins className="w-8 h-8 mx-auto text-slate-400 stroke-[1.5]" />
            <p className="text-xs font-medium">No deposit requests recorded yet</p>
            <p className="text-[11px] text-slate-500">
              Click &quot;Deposit Funds&quot; above to submit your first funding receipt via Binance Pay, bKash, or Bank.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-navy-800">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Channel</th>
                  <th className="px-6 py-3">TxID / Reference</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
                {deposits.map((dep) => (
                  <tr key={dep.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/30">
                    <td className="px-6 py-3.5 font-mono text-[11px] text-slate-500">
                      {new Date(dep.createdAt).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-3.5 font-semibold">
                      <span className="capitalize">{dep.depositMethod?.replace('_', ' ') || 'Binance Pay'}</span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                      {dep.transactionReference}
                    </td>
                    <td className="px-6 py-3.5 font-bold font-mono text-slate-900 dark:text-white">
                      {dep.formattedUSD}
                    </td>
                    <td className="px-6 py-3.5">
                      {getStatusBadge(dep.status)}
                      {dep.failureReason && (
                        <p className="text-[10px] text-rose-500 mt-1">{dep.failureReason}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ledger Transactions */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Double-Entry Ledger Audit Trail
          </h3>
          <span className="text-xs text-slate-400 font-mono">Currency: USD</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-navy-800">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Reference Type</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3 text-right">Amount (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    No ledger transactions recorded yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/30">
                    <td className="px-6 py-3.5 font-mono text-[11px] text-slate-500">
                      {new Date(tx.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-[10px] font-semibold bg-slate-100 dark:bg-navy-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                        {tx.referenceType}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-medium">{tx.description}</td>
                    <td className="px-6 py-3.5 text-right font-bold font-mono text-slate-900 dark:text-white">
                      {tx.formattedAmountUSD}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onSuccess={() => {
          refreshWallet();
        }}
      />

      <WithdrawalModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        availableBalanceCents={Math.round(parseFloat(available.replace(/[^0-9.-]+/g, '')) * 100 || 0)}
        availableBalanceUSD={available}
        onWithdrawalSuccess={() => {
          refreshWallet();
        }}
      />
    </div>
  );
}
