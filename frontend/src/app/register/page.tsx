'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { CountrySelect } from '@/components/shared/CountrySelect';
import { PasswordStrengthMeter } from '@/components/shared/PasswordStrengthMeter';
import { validatePassword } from '@/lib/validators/password';
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { registerWithCredentials } = useAuth();
  const [role, setRole] = useState<'WORKER' | 'BUYER'>('WORKER');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('BD');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success state showing email verification details
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    email: string;
    actionUrl?: string;
    message: string;
  } | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Frontend validations
    if (!displayName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Email address is required.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Password and confirm password do not match.');
      return;
    }

    const pwdCheck = validatePassword(password, email);
    if (!pwdCheck.isValid) {
      setErrorMessage(pwdCheck.errors.join(' '));
      return;
    }

    if (!agreed) {
      setErrorMessage('You must agree to the Terms of Service to create an account.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await registerWithCredentials({
        email,
        pass: password,
        confirmPass: confirmPassword,
        displayName,
        countryCode: country,
        primaryRole: role,
      });

      if (res.success) {
        setRegistrationSuccess({
          email,
          actionUrl: res.emailDelivery?.actionUrl,
          message:
            res.emailDelivery?.message ||
            'Your account has been registered! Please verify your email to unlock all marketplace privileges.',
        });
        return;
      }

      setErrorMessage(res.message || 'Registration failed. Please check your details and try again.');
    } catch {
      setErrorMessage('Unable to contact authentication service. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 p-8 rounded-2xl shadow-sm">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 justify-center mb-1">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
              EX
            </div>
            <span className="font-extrabold text-xl text-slate-900 dark:text-white">EarnXpress</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create Your Account</h2>
          <p className="text-xs text-slate-500">
            Join the open international task marketplace as a Worker or Buyer.
          </p>
        </div>

        {/* Success Confirmation Card */}
        {registrationSuccess ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-6 rounded-2xl space-y-4 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-100">
                Account Created Successfully!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                A verification link has been generated for <strong>{registrationSuccess.email}</strong>.
              </p>
            </div>

            <div className="text-xs bg-white dark:bg-navy-900 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 text-slate-700 dark:text-slate-300 text-left">
              <p className="font-semibold text-slate-900 dark:text-white mb-1">Email Verification Required:</p>
              <p className="text-[11px] text-slate-500">
                Unverified accounts can browse tasks, but cannot claim tasks, post campaigns, or request payouts until their email is verified.
              </p>
            </div>

            {registrationSuccess.actionUrl && (
              <div className="pt-1">
                <a
                  href={registrationSuccess.actionUrl}
                  className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  Verify Email Address Now <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <p className="text-[10px] text-slate-400 mt-1">
                  (Sandbox delivery mode: click above to verify immediately)
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 flex flex-col items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => router.push(role === 'WORKER' ? '/worker' : '/buyer')}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl shadow-sm transition-all"
              >
                Enter Your {role === 'WORKER' ? 'Worker' : 'Buyer'} Dashboard &rarr;
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Error Alert */}
            {errorMessage && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Role Toggle Switch - STRICTLY WORKER OR BUYER (No Admin) */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-navy-800 rounded-xl">
              <button
                type="button"
                onClick={() => setRole('WORKER')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  role === 'WORKER'
                    ? 'bg-white dark:bg-navy-700 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                I want to Work (Earn)
              </button>
              <button
                type="button"
                onClick={() => setRole('BUYER')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  role === 'BUYER'
                    ? 'bg-white dark:bg-navy-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                I want to Hire (Campaigns)
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name / Display Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahim Chowdhury"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs pl-9 pr-3 py-2.5 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs pl-9 pr-3 py-2.5 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Country Select (All 249 ISO 3166-1 Countries) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Country of Residence
                  </label>
                  <span className="text-[10px] text-slate-400">Searchable ISO 3166-1</span>
                </div>
                <CountrySelect value={country} onChange={setCountry} />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password (8-64 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 8 chars (upper, lower, number, symbol)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs pl-9 pr-9 py-2.5 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator & Requirements Checklist */}
                <PasswordStrengthMeter password={password} email={email} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password to confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-navy-800 border text-xs pl-9 pr-9 py-2.5 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-red-500'
                        : 'border-slate-200 dark:border-navy-700'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-[11px] text-red-500">Passwords do not match.</p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2 pt-1 text-xs text-slate-500">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="terms">
                  I agree to the{' '}
                  <Link href="/terms" className="text-teal-600 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and Privacy Policy.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-bold text-xs py-3 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating Account...
                  </>
                ) : (
                  <>
                    Create Account &rarr;
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* Footer Navigation */}
        <div className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
