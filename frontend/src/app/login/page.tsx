'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DemoBadge } from '@/components/shared/DemoBadge';
import { UserRole } from '@/types';
import { Lock, Mail, ArrowRight, UserCheck, ShieldCheck, Briefcase } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('worker@earnxpress.demo');
  const [password, setPassword] = useState('DemoSecure123!');
  const [selectedRole, setSelectedRole] = useState<UserRole>('WORKER');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, selectedRole);
    if (selectedRole === 'WORKER') router.push('/worker');
    else if (selectedRole === 'BUYER') router.push('/buyer');
    else router.push('/admin');
  };

  const handleQuickLogin = (role: UserRole, demoEmail: string) => {
    setEmail(demoEmail);
    setSelectedRole(role);
    login(demoEmail, role);
    if (role === 'WORKER') router.push('/worker');
    else if (role === 'BUYER') router.push('/buyer');
    else router.push('/admin');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 p-8 rounded-2xl shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 justify-center mb-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
              EX
            </div>
            <span className="font-extrabold text-xl text-slate-900 dark:text-white">EarnXpress</span>
            <DemoBadge size="sm" variant="teal" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sign In to Your Portal</h2>
          <p className="text-xs text-slate-500">
            Select a demo role or sign in with your registered credentials.
          </p>
        </div>

        {/* 1-Click Demo Profiles */}
        <div className="bg-slate-50 dark:bg-navy-800/60 p-4 rounded-xl border border-slate-100 dark:border-navy-700/60 space-y-2.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Instant 1-Click Demo Login
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('WORKER', 'worker@earnxpress.demo')}
              className="p-2 text-center bg-white dark:bg-navy-700 hover:border-teal-500 border border-slate-200 dark:border-navy-600 rounded-lg transition-colors group"
            >
              <UserCheck className="w-4 h-4 mx-auto text-teal-600 mb-1" />
              <div className="text-xs font-bold text-slate-800 dark:text-white">Worker</div>
              <div className="text-[9px] text-slate-400">Rahim C.</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('BUYER', 'buyer@earnxpress.demo')}
              className="p-2 text-center bg-white dark:bg-navy-700 hover:border-blue-500 border border-slate-200 dark:border-navy-600 rounded-lg transition-colors group"
            >
              <Briefcase className="w-4 h-4 mx-auto text-blue-600 mb-1" />
              <div className="text-xs font-bold text-slate-800 dark:text-white">Buyer</div>
              <div className="text-[9px] text-slate-400">Retail AI</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('PLATFORM_OWNER', 'owner@earnxpress.demo')}
              className="p-2 text-center bg-white dark:bg-navy-700 hover:border-purple-500 border border-slate-200 dark:border-navy-600 rounded-lg transition-colors group"
            >
              <ShieldCheck className="w-4 h-4 mx-auto text-purple-600 mb-1" />
              <div className="text-xs font-bold text-slate-800 dark:text-white">Admin</div>
              <div className="text-[9px] text-slate-400">Root Owner</div>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs pl-9 pr-3 py-2.5 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
              <Link href="/forgot-password" className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs pl-9 pr-3 py-2.5 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs px-3 py-2 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white"
            >
              <option value="WORKER">Worker (Task Execution & Earnings)</option>
              <option value="BUYER">Buyer (Campaign Creation & Escrow)</option>
              <option value="PLATFORM_OWNER">Platform Owner / Admin</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs py-3 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            Sign In to Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">
            Register on EarnXpress
          </Link>
        </div>
      </div>
    </div>
  );
}
