'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Mail, CheckCircle2, AlertCircle, Loader2, ArrowRight, RefreshCw, KeyRound, ShieldAlert } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const { verifyEmail, resendVerification, user } = useAuth();

  const tokenFromUrl = searchParams.get('token') || '';
  const [token, setToken] = useState(tokenFromUrl);
  const [resendEmail, setResendEmail] = useState(user?.email || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Auto-verify if token is provided in query params on page load
  useEffect(() => {
    if (tokenFromUrl && !isSuccess && !isVerifying) {
      handleVerify(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleVerify = async (tokenToUse?: string) => {
    const rawToken = (tokenToUse || token).trim();
    if (!rawToken) {
      setErrorMessage('Please enter a verification token.');
      return;
    }

    setErrorMessage(null);
    setIsVerifying(true);

    try {
      const res = await verifyEmail(rawToken);
      if (res.success) {
        setIsSuccess(true);
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Unable to connect to verification service.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim() || cooldownSeconds > 0) return;

    setResendMessage(null);
    setErrorMessage(null);
    setIsResending(true);

    try {
      const res = await resendVerification(resendEmail.trim());
      if (res.success) {
        setResendMessage(res.message);
        setCooldownSeconds(60); // 60s cooldown
      } else {
        setErrorMessage(res.message);
        if (res.retryAfterSeconds) {
          setCooldownSeconds(res.retryAfterSeconds);
        }
      }
    } catch {
      setErrorMessage('Unable to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 p-8 rounded-2xl shadow-sm">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 justify-center mb-1">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
              EX
            </div>
            <span className="font-extrabold text-xl text-slate-900 dark:text-white">EarnXpress</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verify Your Email</h2>
          <p className="text-xs text-slate-500">
            Confirm your email address to unlock full marketplace access.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-6 rounded-2xl space-y-3 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-100">
              Email Verified Successfully!
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              {successMessage || 'Your account is now fully verified. You can post campaigns, claim tasks, and request payouts.'}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href={user?.primaryRole === 'BUYER' ? '/buyer' : '/worker'}
                className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Policy Notice */}
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1">
                <span className="font-bold">Marketplace Security Requirement</span>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-normal">
                  In compliance with marketplace integrity standards, task creation, slot claims, deliverable submissions, and withdrawals require a verified email address.
                </p>
              </div>
            </div>

            {/* Manual Token Verification */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Verification Token
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter or paste 64-character verification token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs pl-9 pr-3 py-2.5 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleVerify()}
                disabled={isVerifying || !token.trim()}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-bold text-xs py-3 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying Token...
                  </>
                ) : (
                  'Confirm & Verify Email Address'
                )}
              </button>
            </div>

            {/* Resend Verification Section */}
            <div className="pt-4 border-t border-slate-200 dark:border-navy-800 space-y-3">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Didn&apos;t receive a verification link?
              </div>

              {resendMessage && (
                <div className="p-2.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-lg text-teal-700 dark:text-teal-300 text-xs">
                  {resendMessage}
                </div>
              )}

              <form onSubmit={handleResend} className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="Enter account email to resend"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs pl-9 pr-3 py-2.5 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isResending || cooldownSeconds > 0}
                  className="w-full bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 disabled:opacity-60 text-slate-700 dark:text-slate-200 font-semibold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                    </>
                  ) : cooldownSeconds > 0 ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Resend in {cooldownSeconds}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" /> Resend Verification Link (60s rate limit)
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-slate-500 pt-1">
          <Link href="/login" className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
