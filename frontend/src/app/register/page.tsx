'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DemoBadge } from '@/components/shared/DemoBadge';
import { UserRole } from '@/types';
import { Lock, Mail, User as UserIcon, Globe, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>('WORKER');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('BD');
  const [agreed, setAgreed] = useState(true);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    login(email || 'newuser@earnxpress.demo', role);
    if (role === 'WORKER') router.push('/worker');
    else router.push('/buyer');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 p-8 rounded-2xl shadow-sm">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 justify-center mb-1">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
              EX
            </div>
            <span className="font-extrabold text-xl text-slate-900 dark:text-white">EarnXpress</span>
            <DemoBadge size="sm" variant="teal" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create Your Account</h2>
          <p className="text-xs text-slate-500">
            Join the open international task marketplace as a Worker or Buyer.
          </p>
        </div>

        {/* Role Toggle Switch */}
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

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name / Display Name</label>
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

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
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

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs pl-9 pr-3 py-2.5 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Country of Residence</label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs pl-9 pr-3 py-2.5 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white"
              >
                <option value="BD">Bangladesh (BD)</option>
                <option value="US">United States (US)</option>
                <option value="GB">United Kingdom (GB)</option>
                <option value="DE">Germany (DE)</option>
                <option value="IN">India (IN)</option>
                <option value="SG">Singapore (SG)</option>
              </select>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-1 text-xs text-slate-500">
            <input
              type="checkbox"
              id="terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="terms">
              I agree to the <Link href="/terms" className="text-teal-600 hover:underline">Terms of Service</Link> and understand that all wallet balances are in simulated DEMO funds.
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs py-3 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            Create Account & Enter Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

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
