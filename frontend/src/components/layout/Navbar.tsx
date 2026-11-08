'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { triggerAppInstall } from '@/components/shared/PwaInstallPrompt';
import {
  Wallet,
  Menu,
  X,
  Briefcase,
  Users,
  ShieldAlert,
  ArrowRight,
  Sun,
  Moon,
  PlusCircle,
  Search,
  LogOut,
  User as UserIcon,
  Smartphone,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, role, switchRole, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const showDemoShortcuts = false;

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Dynamic role-based navigation links
  const getNavLinks = () => {
    if (!isAuthenticated || !user) {
      return [
        { label: 'Marketplace', href: '/tasks' },
        { label: 'Documentary', href: '/documentary' },
        { label: 'Refer & Earn', href: '/referrals' },
        { label: 'About', href: '/about' },
        { label: 'How It Works', href: '/help' },
      ];
    }

    if (role === 'WORKER') {
      return [
        { label: 'Marketplace', href: '/tasks' },
        { label: 'Worker Dashboard', href: '/worker' },
        { label: 'Documentary', href: '/documentary' },
        { label: 'Refer & Earn', href: '/referrals' },
        { label: 'My Wallet', href: '/worker/wallet' },
        { label: 'KYC', href: '/kyc' },
      ];
    }

    if (role === 'BUYER') {
      return [
        { label: 'Marketplace', href: '/tasks' },
        { label: 'Buyer Dashboard', href: '/buyer' },
        { label: 'Documentary', href: '/documentary' },
        { label: 'Refer & Earn', href: '/referrals' },
        { label: 'Submissions', href: '/buyer/submissions' },
        { label: 'Buyer Wallet', href: '/buyer/wallet' },
        { label: 'KYC', href: '/kyc' },
      ];
    }

    if (
      role === 'PLATFORM_OWNER' ||
      role === 'SUPER_ADMIN' ||
      role === 'MODERATOR' ||
      role === 'SUPPORT_AGENT'
    ) {
      return [
        { label: 'Admin Governance', href: '/shihab-vault-7860' },
        { label: 'Documentary', href: '/documentary' },
        { label: 'Marketplace', href: '/tasks' },
        { label: 'Refer & Earn', href: '/referrals' },
      ];
    }

    return [{ label: 'Marketplace', href: '/tasks' }];
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-50 bg-navy-900 text-white border-b border-navy-800 shadow-md">
      {/* Top Banner Notice */}
      <div className="bg-teal-950/80 border-b border-teal-900/60 px-4 py-1.5 text-center text-xs text-teal-300 flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
          Official
        </span>
        <span className="font-medium">EarnXpress Global Freelance &amp; Crowdsourcing Platform • Zero-Fee Direct Bank Transfers</span>
        <Link href="/help" className="underline font-medium hover:text-white ml-2 text-teal-200">
          FAQ &amp; Rules
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-white group">
              <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center font-bold text-lg text-white shadow-inner group-hover:bg-teal-500 transition-colors">
                EX
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1">
                  Earn<span className="text-teal-400">Xpress</span>
                </span>
                <span className="block text-[9px] text-slate-400 font-mono tracking-wider -mt-1 uppercase">
                  Open Marketplace
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-md text-xs font-semibold tracking-wide transition-colors ${
                      isActive
                        ? 'text-teal-400 bg-navy-800'
                        : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Role Switcher or Auth Controls */}
            {showDemoShortcuts ? (
              <div className="flex items-center bg-navy-950 border border-navy-700/80 p-0.5 rounded-lg text-xs font-medium">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider px-2 font-semibold">
                  Role:
                </span>
                <button
                  type="button"
                  onClick={() => switchRole('WORKER')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    role === 'WORKER'
                      ? 'bg-teal-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Worker
                </button>
                <button
                  type="button"
                  onClick={() => switchRole('BUYER')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    role === 'BUYER'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Buyer
                </button>
                <button
                  type="button"
                  onClick={() => switchRole('PLATFORM_OWNER')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    role === 'PLATFORM_OWNER'
                      ? 'bg-purple-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Admin
                </button>
              </div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-2.5">
                {/* User Identity Pill */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy-950 border border-navy-800 text-xs">
                  <UserIcon className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-slate-200 font-medium max-w-[120px] truncate">
                    {user.profile?.displayName || user.email}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                      role === 'PLATFORM_OWNER' || role === 'SUPER_ADMIN'
                        ? 'bg-purple-900/60 text-purple-300 border border-purple-800'
                        : role === 'BUYER'
                        ? 'bg-blue-900/60 text-blue-300'
                        : 'bg-teal-900/60 text-teal-300'
                    }`}
                  >
                    {role === 'PLATFORM_OWNER' ? 'OWNER' : role === 'SUPER_ADMIN' ? 'ADMIN' : role}
                  </span>
                </div>

                {/* Worker Specific Actions */}
                {role === 'WORKER' && (
                  <>
                    <Link
                      href="/worker/wallet"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700/80 border border-navy-700 text-slate-200 text-xs font-mono transition-colors"
                      title="Inspect Worker Wallet & Earnings"
                    >
                      <Wallet className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-teal-400 font-bold">Wallet</span>
                    </Link>
                    <Link
                      href="/tasks"
                      className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Find Tasks
                    </Link>
                  </>
                )}

                {/* Buyer Specific Actions */}
                {role === 'BUYER' && (
                  <>
                    <Link
                      href="/buyer/wallet"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700/80 border border-navy-700 text-slate-200 text-xs font-mono transition-colors"
                      title="Inspect Buyer Wallet & Escrow"
                    >
                      <Wallet className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-teal-400 font-bold">Wallet</span>
                    </Link>
                    <Link
                      href="/buyer/tasks/new"
                      className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Post Campaign
                    </Link>
                  </>
                )}

                {/* Admin Specific Actions */}
                {(role === 'PLATFORM_OWNER' || role === 'SUPER_ADMIN' || role === 'MODERATOR') && (
                  <Link
                    href="/shihab-vault-7860"
                    className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Admin Console
                  </Link>
                )}

                {/* Notification Bell */}
                <NotificationBell />

                {/* Sign Out */}
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-navy-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold px-3.5 py-1.5 text-slate-200 hover:text-white hover:bg-navy-800 rounded-lg transition-colors border border-navy-700"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-xs font-semibold px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Install App Button (Visible to everyone) */}
            <button
              type="button"
              onClick={triggerAppInstall}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/40 text-teal-300 text-xs font-bold transition-all shadow-sm"
              title="Install EarnXpress App on Mobile / PC"
            >
              <Smartphone className="w-3.5 h-3.5 text-teal-400" />
              <span>Install App</span>
            </button>

            {showDemoShortcuts && <NotificationBell />}

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-navy-800 transition-colors"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 text-slate-300 hover:text-white rounded-md"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white rounded-md hover:bg-navy-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-navy-800 bg-navy-950 px-4 pt-3 pb-6 space-y-4">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-navy-800"
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Install App Button */}
            <button
              type="button"
              onClick={() => {
                triggerAppInstall();
                setMobileMenuOpen(false);
              }}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-extrabold text-xs shadow-md border border-teal-400/30"
            >
              <Smartphone className="w-4 h-4" />
              <span>Install EarnXpress App</span>
            </button>
          </div>

          {showDemoShortcuts ? (
            <div className="border-t border-navy-800 pt-3 space-y-2">
              <div className="text-xs text-slate-400 uppercase font-semibold">Active Role</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    switchRole('WORKER');
                    setMobileMenuOpen(false);
                  }}
                  className={`py-1.5 text-xs font-semibold rounded text-center ${
                    role === 'WORKER' ? 'bg-teal-600 text-white' : 'bg-navy-800 text-slate-300'
                  }`}
                >
                  Worker
                </button>
                <button
                  type="button"
                  onClick={() => {
                    switchRole('BUYER');
                    setMobileMenuOpen(false);
                  }}
                  className={`py-1.5 text-xs font-semibold rounded text-center ${
                    role === 'BUYER' ? 'bg-blue-600 text-white' : 'bg-navy-800 text-slate-300'
                  }`}
                >
                  Buyer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    switchRole('PLATFORM_OWNER');
                    setMobileMenuOpen(false);
                  }}
                  className={`py-1.5 text-xs font-semibold rounded text-center ${
                    role === 'PLATFORM_OWNER' ? 'bg-purple-600 text-white' : 'bg-navy-800 text-slate-300'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>
          ) : isAuthenticated && user ? (
            <div className="border-t border-navy-800 pt-3 flex items-center justify-between">
              <span className="text-xs text-slate-300">
                {user.profile?.displayName || user.email} ({role})
              </span>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs font-semibold text-red-400 hover:underline"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="border-t border-navy-800 pt-3 grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-center font-semibold py-2 bg-navy-800 text-white rounded-lg"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-center font-semibold py-2 bg-teal-600 text-white rounded-lg"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
