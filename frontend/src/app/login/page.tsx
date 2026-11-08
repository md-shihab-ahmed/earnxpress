'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types';
import {
  Lock,
  Mail,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  Briefcase,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithCredentials } = useAuth();
  const showDemoShortcuts = process.env.NEXT_PUBLIC_ENABLE_DEMO_SHORTCUTS === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('WORKER');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await loginWithCredentials(email, password);
      if (res.success) {
        const userRole = res.user?.primaryRole || selectedRole;
        if (userRole === 'BUYER') router.push('/buyer');
        else router.push('/worker');
        return;
      }

      if (showDemoShortcuts && email.includes('@earnxpress.demo')) {
        // Fallback in demo mode
        login(email, selectedRole);
        if (selectedRole === 'BUYER') router.push('/buyer');
        else router.push('/worker');
        return;
      }

      setErrorMessage(res.message || 'Invalid email or password.');
    } catch {
      setErrorMessage('Authentication service temporarily unavailable. Please retry shortly.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (role: 'WORKER' | 'BUYER', demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setSelectedRole(role);
    login(demoEmail, role);
    if (role === 'BUYER') router.push('/buyer');
    else router.push('/worker');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-7 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 p-8 rounded-2xl shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 justify-center mb-1">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
              EX
            </div>
            <span className="font-extrabold text-xl text-slate-900 dark:text-white">EarnXpress</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sign In to Your Account</h2>
          <p className="text-xs text-slate-500">
            Enter your email and password to access your dashboard.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1-Click Fast Role Access (Worker / Buyer) */}
        <div className="bg-slate-50 dark:bg-navy-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-navy-700 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Fast 1-Click Role Access</span>
            <span className="text-[9px] text-teal-600 dark:text-teal-400 font-mono">Public Portal</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('WORKER', 'worker1@earnxpress.demo')}
              className="p-2 text-center bg-white dark:bg-navy-700 hover:border-teal-500 border border-slate-200 dark:border-navy-600 rounded-lg transition-colors group"
            >
              <UserCheck className="w-3.5 h-3.5 mx-auto text-teal-600 mb-1" />
              <div className="text-xs font-bold text-slate-800 dark:text-white">Worker</div>
              <div className="text-[9px] text-slate-400">Freelancer</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('BUYER', 'buyer@earnxpress.demo')}
              className="p-2 text-center bg-white dark:bg-navy-700 hover:border-blue-500 border border-slate-200 dark:border-navy-600 rounded-lg transition-colors group"
            >
              <Briefcase className="w-3.5 h-3.5 mx-auto text-blue-600 mb-1" />
              <div className="text-xs font-bold text-slate-800 dark:text-white">Buyer</div>
              <div className="text-[9px] text-slate-400">Campaigns</div>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs pl-9 pr-3 py-2.5 rounded-lg outline-none focus:border-teal-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
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
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-bold text-xs py-3 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Authenticating...
              </>
            ) : (
              <>
                Sign In to Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-1">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">
            Register on EarnXpress
          </Link>
        </div>
      </div>
    </div>
  );
}
