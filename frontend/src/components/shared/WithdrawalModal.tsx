'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import {
  X,
  Building2,
  Smartphone,
  Globe,
  Coins,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalanceCents: number;
  availableBalanceUSD: string;
  onWithdrawalSuccess: () => void;
}

type ChannelType = 'BINANCE_PAY' | 'BKASH' | 'NAGAD' | 'BANK_TRANSFER' | 'ROCKET' | 'WISE';

const BANGLADESH_BANKS = [
  'Dutch-Bangla Bank PLC',
  'Islami Bank Bangladesh PLC',
  'BRAC Bank PLC',
  'The City Bank PLC',
  'Eastern Bank PLC',
  'Mutual Trust Bank PLC',
  'Prime Bank PLC',
  'Dhaka Bank PLC',
  'United Commercial Bank (UCB)',
  'Sonali Bank PLC',
  'Pubali Bank PLC',
  'Standard Chartered Bangladesh',
  'HSBC Bangladesh',
  'Other Local Bank',
];

export function WithdrawalModal({
  isOpen,
  onClose,
  availableBalanceCents,
  availableBalanceUSD,
  onWithdrawalSuccess,
}: WithdrawalModalProps) {
  const [channel, setChannel] = useState<ChannelType>('BINANCE_PAY');
  const [usdAmount, setUsdAmount] = useState<string>('10');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [agreedToRules, setAgreedToRules] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  // Channel-specific form state
  const [bdtPhone, setBdtPhone] = useState('');
  const [accountType, setAccountType] = useState<'PERSONAL' | 'AGENT'>('PERSONAL');

  const [bankName, setBankName] = useState('Dutch-Bangla Bank PLC');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchRouting, setBranchRouting] = useState('');

  const [binancePayId, setBinancePayId] = useState('');
  const [binanceMethod, setBinanceMethod] = useState<'PAY_ID' | 'USDT_BEP20' | 'USDT_TRC20'>('PAY_ID');

  const [intlMethod, setIntlMethod] = useState<'WISE' | 'PAYONEER'>('WISE');
  const [intlEmailOrIban, setIntlEmailOrIban] = useState('');

  if (!isOpen) return null;

  const parsedCents = Math.round(Number(usdAmount || 0) * 100);
  const exchangeRateBDT = 121.50;
  const isBdtChannel = ['BKASH', 'NAGAD', 'ROCKET', 'BANK_TRANSFER'].includes(channel);
  const estimatedBDT = (Number(usdAmount || 0) * exchangeRateBDT).toFixed(2);
  const minCents = 400; // $4.00
  const isAmountValid = parsedCents >= minCents && parsedCents <= availableBalanceCents;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (parsedCents < minCents) {
      setErrorMsg('Minimum withdrawal amount is $4.00 USD (400 cents).');
      return;
    }

    if (parsedCents > availableBalanceCents) {
      setErrorMsg('Insufficient available balance in your wallet.');
      return;
    }

    if (!agreedToRules) {
      setErrorMsg('You must review and agree to the platform withdrawal rules before submitting.');
      return;
    }

    let destinationDetails: Record<string, any> = {};

    if (channel === 'BKASH' || channel === 'NAGAD' || channel === 'ROCKET') {
      if (!bdtPhone || bdtPhone.trim().length < 11) {
        setErrorMsg('Please enter a valid 11-digit mobile account number (e.g., 017XXXXXXXX).');
        return;
      }
      destinationDetails = {
        provider: channel,
        mobileNumber: bdtPhone.trim(),
        accountType,
      };
    } else if (channel === 'BANK_TRANSFER') {
      if (!accountHolder.trim() || !accountNumber.trim()) {
        setErrorMsg('Bank account holder name and account number are required.');
        return;
      }
      destinationDetails = {
        bankName,
        accountHolder: accountHolder.trim(),
        accountNumber: accountNumber.trim(),
        routingNumber: branchRouting.trim() || 'N/A',
      };
    } else if (channel === 'BINANCE_PAY') {
      if (!binancePayId.trim()) {
        setErrorMsg('Binance Pay ID / USDT Address is required.');
        return;
      }
      destinationDetails = {
        provider: 'BINANCE',
        binanceMethod,
        accountNumber: binancePayId.trim(),
      };
    } else if (channel === 'WISE') {
      if (!intlEmailOrIban.trim()) {
        setErrorMsg('Wise / Payoneer Email or IBAN account identifier is required.');
        return;
      }
      destinationDetails = {
        provider: intlMethod,
        accountHolder: intlEmailOrIban.trim(),
        accountNumber: intlEmailOrIban.trim(),
      };
    }

    setSubmitting(true);
    try {
      const res = await api.requestWithdrawal({
        amountCents: parsedCents,
        method: channel,
        payoutCurrency: isBdtChannel ? 'BDT' : 'USD',
        destinationDetails,
      });

      if (res.success && res.data) {
        setSuccessData(res.data);
        onWithdrawalSuccess();
      } else {
        setErrorMsg(res.message || 'Withdrawal request could not be processed.');
      }
    } catch {
      setErrorMsg('Server communication error. Please try again shortly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between bg-slate-50/50 dark:bg-navy-800/40">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              Withdraw Earnings &amp; Payout
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Guaranteed escrow clearance • 0% Local Bank &amp; Binance Pay fees
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {successData ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Withdrawal Request Submitted Successfully!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  Your funds are locked in the double-entry escrow ledger. Upon administrative verification, the payout will be dispatched directly to your designated destination.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-navy-800/70 p-4 rounded-xl text-left font-mono text-xs space-y-2 border border-slate-200 dark:border-navy-700 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500">Reference ID:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{successData.withdrawalId || successData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount (USD):</span>
                  <span className="font-semibold text-teal-600">{successData.formattedUSD}</span>
                </div>
                {successData.payoutCurrency === 'BDT' && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated (BDT):</span>
                    <span className="font-semibold text-emerald-600">৳{estimatedBDT} BDT</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Method:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{channel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]">
                    PENDING REVIEW
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition-colors"
              >
                Close &amp; View Ledger
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Balance Summary Box */}
              <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-teal-800 dark:text-teal-300 font-medium">
                    Available Balance for Withdrawal
                  </div>
                  <div className="text-2xl font-black text-teal-700 dark:text-teal-400 font-mono mt-0.5">
                    {availableBalanceUSD}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-teal-700 dark:text-teal-400">
                    Bangladesh Bank Mid Benchmark
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                    $1 = ৳{exchangeRateBDT.toFixed(2)} BDT
                  </div>
                </div>
              </div>

              {/* Payment Channel Selection Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Select Payout Channel
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'BINANCE_PAY' as ChannelType, label: 'Binance Pay', icon: Coins, tag: 'Primary • 0% Fee' },
                    { id: 'BKASH' as ChannelType, label: 'bKash', icon: Smartphone, tag: 'MFS' },
                    { id: 'NAGAD' as ChannelType, label: 'Nagad', icon: Smartphone, tag: 'MFS' },
                    { id: 'BANK_TRANSFER' as ChannelType, label: 'Local Bank', icon: Building2, tag: '0% Bank Fee' },
                    { id: 'ROCKET' as ChannelType, label: 'Rocket', icon: Smartphone, tag: 'MFS' },
                    { id: 'WISE' as ChannelType, label: 'Wise / Wire', icon: Globe, tag: 'Global' },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = channel === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setChannel(m.id);
                          setErrorMsg(null);
                        }}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/30'
                            : 'border-slate-200 dark:border-navy-700 hover:border-slate-300 dark:hover:border-navy-600 text-slate-600 dark:text-slate-400 bg-white dark:bg-navy-900'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px] font-bold leading-tight">{m.label}</span>
                        <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                          m.id === 'BINANCE_PAY' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {m.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Withdrawal Amount (USD) <span className="text-slate-400 font-normal">(Minimum $4.00)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="4"
                    step="1"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                    className="w-full pl-8 pr-20 py-2.5 rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="10"
                  />
                  <button
                    type="button"
                    onClick={() => setUsdAmount((availableBalanceCents / 100).toFixed(0))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold px-2 py-1 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded"
                  >
                    MAX
                  </button>
                </div>

                {/* Conversion Preview Box */}
                {isBdtChannel && (
                  <div className="bg-slate-50 dark:bg-navy-800/60 p-3 rounded-xl border border-slate-200 dark:border-navy-700 flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Estimated Local Payout (BDT):
                    </span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                      ৳{estimatedBDT} BDT
                    </span>
                  </div>
                )}
                {channel === 'BINANCE_PAY' && (
                  <div className="bg-slate-50 dark:bg-navy-800/60 p-3 rounded-xl border border-slate-200 dark:border-navy-700 flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      USDT Settlement Amount (1:1 USD Pegged):
                    </span>
                    <span className="font-extrabold text-teal-600 dark:text-teal-400 font-mono text-sm">
                      {usdAmount || '0'} USDT
                    </span>
                  </div>
                )}
              </div>

              {/* Dynamic Form by Channel */}
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-navy-800">
                {/* 1. Binance Pay / USDT */}
                {channel === 'BINANCE_PAY' && (
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="binanceMethod"
                          value="PAY_ID"
                          checked={binanceMethod === 'PAY_ID'}
                          onChange={() => setBinanceMethod('PAY_ID')}
                          className="text-teal-600"
                        />
                        Binance Pay ID / Email
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="binanceMethod"
                          value="USDT_BEP20"
                          checked={binanceMethod === 'USDT_BEP20'}
                          onChange={() => setBinanceMethod('USDT_BEP20')}
                          className="text-teal-600"
                        />
                        USDT (BEP-20)
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="binanceMethod"
                          value="USDT_TRC20"
                          checked={binanceMethod === 'USDT_TRC20'}
                          onChange={() => setBinanceMethod('USDT_TRC20')}
                          className="text-teal-600"
                        />
                        USDT (TRC-20)
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {binanceMethod === 'PAY_ID'
                          ? 'Binance Pay ID or Registered Binance Email'
                          : 'USDT Deposit Wallet Address'}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          binanceMethod === 'PAY_ID'
                            ? 'e.g. 123456789 or user@binance.com'
                            : 'e.g. 0x... (BEP-20) or T... (TRC-20)'
                        }
                        value={binancePayId}
                        onChange={(e) => setBinancePayId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                )}

                {/* 2. MFS (bKash / Nagad / Rocket) */}
                {(channel === 'BKASH' || channel === 'NAGAD' || channel === 'ROCKET') && (
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="accType"
                          value="PERSONAL"
                          checked={accountType === 'PERSONAL'}
                          onChange={() => setAccountType('PERSONAL')}
                          className="text-teal-600"
                        />
                        Personal Account
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="accType"
                          value="AGENT"
                          checked={accountType === 'AGENT'}
                          onChange={() => setAccountType('AGENT')}
                          className="text-teal-600"
                        />
                        Agent Account
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {channel === 'BKASH' ? 'bKash Mobile Number' : channel === 'NAGAD' ? 'Nagad Mobile Number' : 'Rocket Account Number'}
                      </label>
                      <input
                        type="text"
                        placeholder="01XXXXXXXXX"
                        value={bdtPhone}
                        onChange={(e) => setBdtPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* 3. Local Bank Transfer */}
                {channel === 'BANK_TRANSFER' && (
                  <div className="space-y-3">
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Direct Local Bank transfers have 0% Platform Withdrawal Fees. Dispatched via BEFTN/NPSB.</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Bank Name
                      </label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {BANGLADESH_BANKS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Account Holder Full Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Mohammad Rahim"
                          value={accountHolder}
                          onChange={(e) => setAccountHolder(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Account Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 2050XXXXXXXXX"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Branch Name or Routing Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Gulshan Branch / 090271234"
                        value={branchRouting}
                        onChange={(e) => setBranchRouting(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                )}

                {/* 4. Wise / Payoneer */}
                {channel === 'WISE' && (
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="intlMethod"
                          value="WISE"
                          checked={intlMethod === 'WISE'}
                          onChange={() => setIntlMethod('WISE')}
                          className="text-teal-600"
                        />
                        Wise Account
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="intlMethod"
                          value="PAYONEER"
                          checked={intlMethod === 'PAYONEER'}
                          onChange={() => setIntlMethod('PAYONEER')}
                          className="text-teal-600"
                        />
                        Payoneer
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {intlMethod === 'WISE' ? 'Wise Registered Email / IBAN' : 'Payoneer Registered Email'}
                      </label>
                      <input
                        type="text"
                        placeholder="recipient@example.com"
                        value={intlEmailOrIban}
                        onChange={(e) => setIntlEmailOrIban(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Contextual Rules & Legal Compliance Notification */}
              <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2.5 text-xs">
                <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  Withdrawal Policy &amp; Legal Compliance
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                  <li><strong>Accurate Account Details:</strong> You are solely responsible for ensuring your Binance Pay ID, Phone, or Bank details are correct. Incorrect destination details cannot be recovered.</li>
                  <li><strong>One Account Per Person:</strong> Operating multiple accounts or attempting fraudulent micro-withdrawals will lead to permanent account suspension and fund forfeiture.</li>
                  <li><strong>Settlement SLA:</strong> Verified payout requests are reviewed and settled via double-entry ledger within 1 to 24 hours.</li>
                </ul>
                <label className="flex items-start gap-2.5 pt-2 border-t border-amber-200/60 dark:border-amber-800/40 cursor-pointer text-slate-900 dark:text-white font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={agreedToRules}
                    onChange={(e) => {
                      setAgreedToRules(e.target.checked);
                      if (e.target.checked) setErrorMsg(null);
                    }}
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs">
                    I have read, understood, and agree to the EarnXpress Financial &amp; Withdrawal Policies. *
                  </span>
                </label>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !isAmountValid || !agreedToRules}
                  className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-300 dark:disabled:bg-navy-800 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing Withdrawal...
                    </>
                  ) : (
                    <>
                      Submit Payout Request <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
