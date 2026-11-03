import React from 'react';
import Link from 'next/link';
import { DemoBadge } from '../shared/DemoBadge';
import { Globe, Shield, Terminal } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-800/80 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center font-bold text-base text-white">
                EX
              </div>
              <span className="font-extrabold text-lg text-white">
                Earn<span className="text-teal-400">Xpress</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Open international freelance task marketplace engineered for multi-worker crowdsourcing,
              verifiable deliverable milestones, and tamper-evident auditability.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-navy-900 border border-navy-800 px-2.5 py-1 rounded-md">
                <Globe className="w-3.5 h-3.5 text-teal-400" />
                <span>English (US)</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-500 hover:text-slate-300 cursor-pointer">বাংলা (Soon)</span>
              </div>
              <DemoBadge size="sm" variant="amber" />
            </div>
          </div>

          {/* Column 1: Marketplace */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Marketplace</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><Link href="/tasks" className="hover:text-teal-400">Browse All Tasks</Link></li>
              <li><Link href="/tasks?taskModel=MULTI_WORKER" className="hover:text-teal-400">Multi-Worker Tasks</Link></li>
              <li><Link href="/tasks?taskModel=FIRST_APPROVED" className="hover:text-teal-400">First-Approved Bounties</Link></li>
              <li><Link href="/buyer/tasks/new" className="hover:text-teal-400">Post a Campaign</Link></li>
            </ul>
          </div>

          {/* Column 2: Portals */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Portals</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><Link href="/worker" className="hover:text-teal-400">Worker Dashboard</Link></li>
              <li><Link href="/buyer" className="hover:text-teal-400">Buyer Dashboard</Link></li>
              <li><Link href="/admin" className="hover:text-teal-400">Staff Governance</Link></li>
              <li><Link href="/worker/wallet" className="hover:text-teal-400">Demo Faucet Wallet</Link></li>
            </ul>
          </div>

          {/* Column 3: Trust & Legal */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Governance</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><Link href="/about" className="hover:text-teal-400">About Platform</Link></li>
              <li><Link href="/help" className="hover:text-teal-400">Rules & 72h SLA</Link></li>
              <li><Link href="/terms" className="hover:text-teal-400">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-teal-400">Privacy & KYC Scope</Link></li>
              <li><Link href="/contact" className="hover:text-teal-400">Contact & Support</Link></li>
            </ul>
          </div>
        </div>

        {/* Regulatory Demo Disclosure */}
        <div className="border-t border-navy-800/80 pt-6 space-y-3">
          <div className="p-3 rounded-lg bg-navy-900 border border-navy-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Demonstration Environment Notice:</span>{' '}
              All balances, payments, escrow locks, and disbursements shown on EarnXpress are strictly simulated in
              DEMO integer USD cents for testing. No real fiat, bank transfers, or cryptocurrency transactions are accepted or processed.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              © {new Date().getFullYear()} EarnXpress Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> API: NestJS 10 Modular Monolith (Healthy)
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
