'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { DemoLedgerTransaction } from '@/types';
import { WithdrawalModal } from '@/components/shared/WithdrawalModal';
import {
  Wallet,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Clock,
  Building2,
  Smartphone,
  ExternalLink,
  RefreshCw,
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
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const isFaucetEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_FAUCET === 'true';

  // Parse available cents from formatted USD
  const parsedAvailableCents = Math.round(
    parseFloat(available.replace(/[^0-9.-]+/g, '')) * 100 || 0
  );

  const fetchWithdrawals = async () => {
    setLoadingWithdrawals(true);
    try {
      const data = await api.getMyWithdrawals();
      setWithdrawals(data || []);
    } catch {
      // ignore
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleWithdrawalSuccess = async () => {
    // Refresh wallet balances and withdrawal list
    try {
      const updated = await api.getWallet();
      setAvailable(updated.formattedAvailableUSD);
      setTransactions(updated.transactions);
      await fetchWithdrawals();
    } catch {
      fetchWithdrawals();
    }
  };

  const handleClaimFaucet = async () => {
    if (!isFaucetEnabled) {
      setClaimError('Sandbox test faucet is disabled in this environment.');
      return;
    }
    setClaiming(true);
    setClaimSuccess(null);
    setClaimError(null);

    try {
      const res = await api.claimFaucet();
      if (res.success && res.newBalanceUSD) {
        setAvailable(res.newBalanceUSD);
        setClaimSuccess('Claimed $1,000.00 USD sandbox testing grant!');
        // Refresh transactions list
        const updatedWallet = await api.getWallet();
        setTransactions(updatedWallet.transactions);
      } else {
        setClaimError(res.message || 'Faucet claim could not be processed.');
      }
    } catch {
      setClaimError('Faucet service error.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Payout & Transfer Banner */}
      <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 p-4 rounded-xl flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-teal-900 dark:text-teal-200 leading-relaxed">
            <strong>Direct Bank Payouts &amp; Zero Fees:</strong> All approved task earnings are deposited directly to your available balance. Withdrawals via <strong>Direct Local Bank Transfer (BEFTN/NPSB)</strong> have <strong>0% Platform Withdrawal Fees</strong>. International transfers supported via Binance Pay (USDT) and Wise.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsWithdrawModalOpen(true)}
          className="flex-shrink-0 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
        >
          <ArrowUpRight className="w-4 h-4" /> Withdraw Funds
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Available Balance</span>
              <Wallet className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 font-mono mt-1">
              {available}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Available for task settlements &amp; withdrawals
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsWithdrawModalOpen(true)}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4" /> Request Withdrawal (Cash Out)
          </button>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>In Escrow (Locked)</span>
              <Coins className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
              {initialEscrow}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Reserved for active work slots</div>
          </div>
          <div className="text-[11px] text-slate-400 bg-slate-50 dark:bg-navy-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-navy-800">
            Escrow locks automatically release upon buyer approval.
          </div>
        </div>

        {isFaucetEnabled ? (
          <div className="bg-gradient-to-br from-navy-900 to-navy-950 text-white border border-navy-700/80 rounded-xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Sandbox Test Faucet
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Add $1,000 test credits to explore campaigns and preview instant escrow locks.
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
                  <Coins className="w-4 h-4" /> Claim $1,000 Test Grant
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-navy-900 to-navy-950 text-white border border-navy-700/80 rounded-xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Real Ledger Payouts
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Local bank transfers, bKash, Nagad, Binance Pay (USDT) and Wise active. Request your payout anytime.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsWithdrawModalOpen(true)}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4" /> Open Payout Portal
            </button>
          </div>
        )}
      </div>

      {claimSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {claimSuccess}
        </div>
      )}

      {claimError && (
        <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-200">
          <ShieldAlert className="w-4 h-4 text-red-600" />
          {claimError}
        </div>
      )}

      {/* Withdrawal Requests & Payout Queue */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              Withdrawal Requests &amp; Payout Status
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              All withdrawal disbursements are tracked directly on the double-entry escrow ledger.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchWithdrawals}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            title="Refresh withdrawals"
          >
            <RefreshCw className={`w-4 h-4 ${loadingWithdrawals ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {withdrawals.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No withdrawal requests recorded yet. Once task earnings are approved, you can request payout at any time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-800/60 text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-navy-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Destination Details</th>
                  <th className="py-3 px-4 text-right">Amount (USD)</th>
                  <th className="py-3 px-4 text-right">Local Payout</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
                {withdrawals.map((w) => {
                  const dest = w.destinationDetailsMasked || {};
                  const isBdt = w.payoutCurrency === 'BDT';
                  return (
                    <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {new Date(w.requestedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold bg-slate-100 dark:bg-navy-800 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">
                          {w.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div>{dest.bankName || dest.provider || w.method}</div>
                        <div className="text-slate-400 text-[10px]">
                          {dest.accountMasked || dest.accountNumber || dest.mobileNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {w.formattedUSD}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        {isBdt && w.estimatedPayoutMinor
                          ? `৳${(Number(w.estimatedPayoutMinor) / 100).toFixed(2)} BDT`
                          : `${w.formattedUSD}`}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            w.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : w.status === 'APPROVED'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                              : w.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          }`}
                        >
                          {w.status}
                        </span>
                        {w.status === 'REJECTED' && w.rejectionReason && (
                          <div className="text-[10px] text-red-500 mt-0.5 max-w-xs mx-auto truncate" title={w.rejectionReason}>
                            Reason: {w.rejectionReason}
                          </div>
                        )}
                        {w.status === 'COMPLETED' && w.providerPayoutId && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Ref: {w.providerPayoutId}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                <th className="py-3 px-4 text-right">Amount (USD)</th>
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

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        availableBalanceCents={parsedAvailableCents}
        availableBalanceUSD={available}
        onWithdrawalSuccess={handleWithdrawalSuccess}
      />
    </div>
  );
}
