'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Building2,
  Smartphone,
  Coins,
  QrCode,
  ArrowRight,
  Info,
} from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type DepositMethod = 'BINANCE_PAY' | 'USDT_CRYPTO' | 'BKASH' | 'NAGAD' | 'BANK_TRANSFER';

export function DepositModal({ isOpen, onClose, onSuccess }: DepositModalProps) {
  const [method, setMethod] = useState<DepositMethod>('BINANCE_PAY');
  const [amountUSD, setAmountUSD] = useState<string>('50.00');
  const [senderId, setSenderId] = useState<string>('');
  const [txRef, setTxRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [agreedToRules, setAgreedToRules] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const parsedAmount = parseFloat(amountUSD) || 0;
  const isAmountValid = parsedAmount >= 1.0; // Min $1.00 USD
  const isFormValid = isAmountValid && senderId.trim() && txRef.trim() && agreedToRules;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    setSubmitting(true);
    setErrorMsg(null);

    const amountCents = Math.round(parsedAmount * 100);

    try {
      const res = await api.submitManualDeposit({
        amountCents,
        depositMethod: method,
        senderIdentifier: senderId.trim(),
        transactionReference: txRef.trim(),
        notes: notes.trim() || undefined,
      });

      if (res.success && res.data) {
        setSuccessData(res.data);
        onSuccess();
      } else {
        setErrorMsg(res.message || 'Deposit submission failed. Please try again.');
      }
    } catch {
      setErrorMsg('Network error communicating with the financial gateway.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-navy-950 text-white flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Deposit Funds to Escrow</h3>
              <p className="text-[11px] text-slate-400">Instant funding for tasks &amp; multi-worker campaigns</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-200">
          {successData ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Deposit Submitted Successfully!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Your deposit of <strong>{successData.formattedUSD}</strong> via{' '}
                  <strong>{successData.depositMethod}</strong> (TxID: {successData.transactionReference}) is currently pending admin verification.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200 dark:border-navy-800 max-w-sm mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{successData.orderId.slice(0, 16)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-semibold text-amber-500 uppercase">{successData.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Verification:</span>
                  <span className="font-semibold text-teal-600 dark:text-teal-400">5 – 15 Minutes</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-sm transition-all"
              >
                Close &amp; View Wallet
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Payment Channel Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select Deposit Channel
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Binance Pay - Primary */}
                  <button
                    type="button"
                    onClick={() => setMethod('BINANCE_PAY')}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      method === 'BINANCE_PAY'
                        ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white shadow-sm'
                        : 'border-slate-200 dark:border-navy-800 hover:border-slate-300 dark:hover:border-navy-700 bg-slate-50/50 dark:bg-navy-950/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="absolute top-2 right-2">
                      <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                        Primary • 0% Fee
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-xs">Binance Pay</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Instant global zero-fee USDT
                    </p>
                  </button>

                  {/* Direct USDT Crypto */}
                  <button
                    type="button"
                    onClick={() => setMethod('USDT_CRYPTO')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      method === 'USDT_CRYPTO'
                        ? 'border-teal-500 bg-teal-500/10 text-slate-900 dark:text-white shadow-sm'
                        : 'border-slate-200 dark:border-navy-800 hover:border-slate-300 dark:hover:border-navy-700 bg-slate-50/50 dark:bg-navy-950/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <QrCode className="w-4 h-4 text-teal-500" />
                      <span className="font-bold text-xs">USDT (BEP20 / TRC20)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Direct Web3 crypto transfer
                    </p>
                  </button>

                  {/* bKash */}
                  <button
                    type="button"
                    onClick={() => setMethod('BKASH')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      method === 'BKASH'
                        ? 'border-pink-500 bg-pink-500/10 text-slate-900 dark:text-white shadow-sm'
                        : 'border-slate-200 dark:border-navy-800 hover:border-slate-300 dark:hover:border-navy-700 bg-slate-50/50 dark:bg-navy-950/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Smartphone className="w-4 h-4 text-pink-500" />
                      <span className="font-bold text-xs">bKash (Send Money)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      1 USD = 121.50 BDT
                    </p>
                  </button>

                  {/* Islami Bank Bangladesh PLC */}
                  <button
                    type="button"
                    onClick={() => setMethod('BANK_TRANSFER')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      method === 'BANK_TRANSFER'
                        ? 'border-emerald-500 bg-emerald-500/10 text-slate-900 dark:text-white shadow-sm'
                        : 'border-slate-200 dark:border-navy-800 hover:border-slate-300 dark:hover:border-navy-700 bg-slate-50/50 dark:bg-navy-950/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-xs">Islami Bank (IBBL)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Cheque / Cash Deposit / iBanking
                    </p>
                  </button>
                </div>
              </div>

              {/* Deposit Channel Destination Details Card */}
              <div className="p-4 bg-slate-100 dark:bg-navy-950 rounded-xl border border-slate-200 dark:border-navy-800 space-y-2.5 text-xs">
                {method === 'BINANCE_PAY' && (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-navy-800">
                      <span className="text-slate-500 font-medium">Binance Pay ID:</span>
                      <div className="flex items-center gap-2 font-mono font-bold text-amber-500">
                        <span>857219403</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('857219403', 'payId')}
                          className="text-slate-400 hover:text-amber-500 p-1 rounded"
                          title="Copy Binance Pay ID"
                        >
                          {copiedField === 'payId' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Send USDT from your Binance app: <strong>Pay &gt; Send &gt; Enter Pay ID 857219403</strong>. Zero network gas fees apply.
                    </div>
                  </>
                )}

                {method === 'USDT_CRYPTO' && (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-navy-800">
                      <span className="text-slate-500 font-medium">Network:</span>
                      <span className="font-mono font-bold text-teal-400">USDT (BNB Smart Chain / BEP-20)</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 font-medium block">USDT Deposit Address:</span>
                      <div className="flex items-center justify-between bg-white dark:bg-navy-900 p-2 rounded border border-slate-200 dark:border-navy-800 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                        <span className="truncate mr-2">0x71C8F7E4193582490F7aE0d7681335b2eB9bFA32</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('0x71C8F7E4193582490F7aE0d7681335b2eB9bFA32', 'address')}
                          className="text-slate-400 hover:text-teal-400 p-1 rounded flex-shrink-0"
                          title="Copy Address"
                        >
                          {copiedField === 'address' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {method === 'BKASH' && (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-navy-800">
                      <span className="text-slate-500 font-medium">bKash Personal Number:</span>
                      <div className="flex items-center gap-2 font-mono font-bold text-pink-500">
                        <span>01712-345678</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('01712345678', 'bkash')}
                          className="text-slate-400 hover:text-pink-500 p-1 rounded"
                        >
                          {copiedField === 'bkash' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Send Money to the number above. Calculation: <strong>${amountUSD} USD × 121.50 = {(parsedAmount * 121.5).toFixed(0)} BDT</strong>.
                    </div>
                  </>
                )}

                {method === 'BANK_TRANSFER' && (
                  <>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bank Name:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Islami Bank Bangladesh PLC (IBBL)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Account Name:</span>
                        <span className="font-semibold">EarnXpress Operations (Md Shihab Ahmed)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Account Number:</span>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white">
                          <span>2050-1450-2003-9182</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('2050145020039182', 'bankAc')}
                            className="text-slate-400 hover:text-emerald-500 p-0.5 rounded"
                          >
                            {copiedField === 'bankAc' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Branch &amp; Routing:</span>
                        <span>Dhaka Principal Branch • 125272641</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Form Input: Amount in USD */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deposit Amount (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amountUSD}
                    onChange={(e) => setAmountUSD(e.target.value)}
                    placeholder="50.00"
                    required
                    className="w-full pl-7 pr-16 py-2 bg-white dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                    USD
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>Minimum deposit: $1.00 USD</span>
                  <span>≈ {(parsedAmount * 121.5).toFixed(0)} BDT</span>
                </div>
              </div>

              {/* Form Input: Sender Identifier */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {method === 'BINANCE_PAY'
                    ? 'Your Binance Pay ID or Binance Email *'
                    : method === 'BKASH' || method === 'NAGAD'
                    ? 'Your Sender Mobile Number *'
                    : 'Your Sender Bank Name / Account Name *'}
                </label>
                <input
                  type="text"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  placeholder={
                    method === 'BINANCE_PAY'
                      ? 'e.g. 192849102 or user@email.com'
                      : method === 'BKASH' || method === 'NAGAD'
                      ? 'e.g. 017XXXXXXXX'
                      : 'e.g. Dutch Bangla Bank - John Doe'
                  }
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Form Input: Transaction Reference (TxID) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Reference (TxID / TrxID / Transfer Slip) *
                </label>
                <input
                  type="text"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  placeholder="e.g. 24891829104 or BL82919481 or Slip #00412"
                  required
                  className="w-full px-3 py-2 font-mono bg-white dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Contextual Rules & Anti-Fraud Compliance Box */}
              <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  Deposit Verification &amp; Anti-Fraud Policy
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                  <li>Transfers must match the exact amount submitted. Mismatched deposits will require manual auditing.</li>
                  <li>Submitting false or duplicate Transaction IDs results in immediate account suspension.</li>
                  <li>Binance Pay deposits are typically verified within 5 to 15 minutes by Platform Governance.</li>
                </ul>
                <label className="flex items-start gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-800/40 cursor-pointer text-slate-900 dark:text-white font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={agreedToRules}
                    onChange={(e) => setAgreedToRules(e.target.checked)}
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs">
                    I confirm that I have transferred the exact amount to the specified EarnXpress address/account and provided the authentic Transaction ID. *
                  </span>
                </label>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isFormValid || submitting}
                  className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-slate-300 dark:disabled:bg-navy-800 disabled:cursor-not-allowed text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting Deposit Request...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Submit Deposit for Verification (${parsedAmount.toFixed(2)} USD)
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
