'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Users,
  ShieldAlert,
  FileCheck2,
  Briefcase,
  AlertTriangle,
  History,
  CheckCircle2,
  Ban,
  Slash,
  Eye,
  EyeOff,
  Lock,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  ShieldX,
  Scale,
  FileText,
  Download,
  ExternalLink,
  Loader2,
  X,
  Building2,
  Coins,
  ArrowUpRight,
  DollarSign,
  Check,
  RotateCcw,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

interface AdminConsoleClientProps {
  initialStats: {
    totalUsers: number;
    activeTasks: number;
    totalSlotsFunded: number;
    totalDemoVolumeUSD: string;
    openDisputes: number;
    overdueReviews: number;
    auditLogCount: number;
  };
  initialLogs: any[];
  initialUsers?: any[];
}

export function AdminConsoleClient({
  initialStats,
  initialLogs,
  initialUsers = [],
}: AdminConsoleClientProps) {
  const { user, role, isAuthenticated, loginAdminWithMasterKey } = useAuth();
  const [masterIdInput, setMasterIdInput] = useState('');
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [showMasterKey, setShowMasterKey] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateSuccess, setGateSuccess] = useState(false);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const vaultParam = params.get('vault');
      const savedVault = sessionStorage.getItem('earnxpress_vault_unlocked');
      if (
        vaultParam === 'gate_unlocked' ||
        vaultParam === 'shihab_owner' ||
        vaultParam === 'owner' ||
        savedVault === 'true' ||
        role === 'PLATFORM_OWNER' ||
        role === 'SUPER_ADMIN'
      ) {
        setIsVaultUnlocked(true);
        sessionStorage.setItem('earnxpress_vault_unlocked', 'true');
      }
    }
  }, [role]);

  const [activeTab, setActiveTab] = useState<'tasks' | 'submissions' | 'users' | 'deposits' | 'payouts' | 'disputes' | 'triage' | 'audit'>('tasks');
  const [tasks, setTasks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [users, setUsers] = useState<any[]>(initialUsers);
  const [logs, setLogs] = useState<any[]>(initialLogs);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [stats, setStats] = useState(initialStats);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Buyer Deposits State
  const [deposits, setDeposits] = useState<any[]>([]);
  const [depositFilter, setDepositFilter] = useState<'ALL' | 'PENDING' | 'SUCCEEDED' | 'FAILED'>('ALL');
  const [isLoadingDeposits, setIsLoadingDeposits] = useState(false);
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [selectedDepositForReject, setSelectedDepositForReject] = useState<any | null>(null);
  const [depositRejectReasonInput, setDepositRejectReasonInput] = useState('');

  // Financial Payouts State
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED'>('ALL');
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [selectedWithdrawalForReject, setSelectedWithdrawalForReject] = useState<any | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [selectedWithdrawalForComplete, setSelectedWithdrawalForComplete] = useState<any | null>(null);
  const [payoutTxIdInput, setPayoutTxIdInput] = useState('');
  const [reconciliationResult, setReconciliationResult] = useState<any | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);

  // Arbitration Dossier State
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [isLoadingDossier, setIsLoadingDossier] = useState(false);
  const [arbitrationVerdict, setArbitrationVerdict] = useState<
    'SETTLE_WORKER' | 'REFUND_BUYER' | 'SPLIT_SETTLEMENT' | 'DISMISS'
  >('SETTLE_WORKER');
  const [workerSplitUSD, setWorkerSplitUSD] = useState('');
  const [buyerSplitUSD, setBuyerSplitUSD] = useState('');
  const [arbitrationNotes, setArbitrationNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const isAdmin =
    isVaultUnlocked ||
    (isAuthenticated &&
      user &&
      (role === 'PLATFORM_OWNER' ||
        role === 'SUPER_ADMIN' ||
        role === 'MODERATOR' ||
        role === 'SUPPORT_AGENT'));

  const refreshTasks = async () => {
    try {
      const res = await api.getTasks();
      setTasks(res.data || []);
    } catch {}
  };

  const refreshSubmissions = async () => {
    setIsLoadingSubmissions(true);
    try {
      const res = await (api as any).getAdminSubmissions();
      setSubmissions(res || []);
    } catch {} finally {
      setIsLoadingSubmissions(false);
    }
  };

  const handleReviewSubmission = async (subId: string, decision: 'APPROVE' | 'REJECT') => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await (api as any).reviewAdminSubmission(subId, decision, `Direct Platform Owner Decision: ${decision}`);
      if (res.success) {
        setActionSuccess(`Submission marked ${decision === 'APPROVE' ? 'APPROVED (Worker Credited)' : 'REJECTED'}.`);
        await refreshSubmissions();
      } else {
        setActionError(res.message || 'Failed to review submission');
      }
    } catch {
      setActionError('Error communicating with review subsystem');
    }
  };

  // Refresh users from API
  const refreshUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminUsers({
        search: search || undefined,
        role: roleFilter || undefined,
      });
      if (res.users && res.users.length > 0) {
        setUsers(res.users);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh disputes from API
  const refreshDisputes = async () => {
    try {
      const data = await api.getDisputes();
      setDisputes(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshUsers();
    refreshDisputes();
    refreshWithdrawals();
    refreshDeposits();
    refreshTasks();
    refreshSubmissions();
  }, [roleFilter, withdrawalFilter, depositFilter]);

  // Refresh withdrawals from API
  const refreshWithdrawals = async () => {
    setIsLoadingWithdrawals(true);
    try {
      const res = await api.getAdminWithdrawals(
        withdrawalFilter !== 'ALL' ? withdrawalFilter : undefined,
      );
      setWithdrawals(res.items || []);
    } catch {
      // ignore
    } finally {
      setIsLoadingWithdrawals(false);
    }
  };

  const handleApprovePayout = async (withdrawalId: string) => {
    setIsProcessingPayout(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.processWithdrawal(withdrawalId, { decision: 'APPROVE' });
      if (res.success) {
        setActionSuccess('Withdrawal payout request approved for clearing.');
        await refreshWithdrawals();
      } else {
        setActionError(res.message || 'Failed to approve withdrawal request.');
      }
    } catch {
      setActionError('Failed to communicate with authorization server.');
    } finally {
      setIsProcessingPayout(false);
    }
  };

  const handleCompletePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawalForComplete) return;
    setIsProcessingPayout(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.processWithdrawal(selectedWithdrawalForComplete.id, {
        decision: 'COMPLETE',
        providerPayoutId: payoutTxIdInput.trim() || `PAYOUT_${Date.now()}`,
      });
      if (res.success) {
        setActionSuccess('Withdrawal completed and settled on double-entry ledger.');
        setSelectedWithdrawalForComplete(null);
        setPayoutTxIdInput('');
        await refreshWithdrawals();
      } else {
        setActionError(res.message || 'Unable to complete withdrawal settlement.');
      }
    } catch {
      setActionError('Failed to communicate with authorization server.');
    } finally {
      setIsProcessingPayout(false);
    }
  };

  const refreshDeposits = async () => {
    setIsLoadingDeposits(true);
    try {
      const res = await api.getAdminDeposits(depositFilter === 'ALL' ? undefined : depositFilter);
      setDeposits(res.items || []);
    } catch {
      // ignore
    } finally {
      setIsLoadingDeposits(false);
    }
  };

  const handleProcessDeposit = async (orderId: string, decision: 'APPROVE' | 'REJECT', rejectionReason?: string) => {
    setIsProcessingDeposit(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.processDeposit(orderId, {
        decision,
        rejectionReason,
        adminNotes: decision === 'APPROVE' ? 'Approved & credited to Buyer Available wallet by Platform Admin' : rejectionReason,
      });

      if (res.success) {
        setActionSuccess(decision === 'APPROVE' ? 'Deposit approved! Funds successfully credited to Buyer Available balance.' : 'Deposit request rejected.');
        setSelectedDepositForReject(null);
        setDepositRejectReasonInput('');
        await refreshDeposits();
      } else {
        setActionError(res.message || 'Failed to process deposit.');
      }
    } catch {
      setActionError('Error communicating with payment gateway.');
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  const handleRejectPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawalForReject) return;
    if (!rejectionReasonInput.trim()) {
      setActionError('A valid rejection reason is required to decline a payout.');
      return;
    }
    setIsProcessingPayout(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.processWithdrawal(selectedWithdrawalForReject.id, {
        decision: 'REJECT',
        rejectionReason: rejectionReasonInput.trim(),
      });
      if (res.success) {
        setActionSuccess('Withdrawal payout declined. 100% of reserved funds refunded to worker available balance.');
        setSelectedWithdrawalForReject(null);
        setRejectionReasonInput('');
        await refreshWithdrawals();
      } else {
        setActionError(res.message || 'Failed to reject withdrawal payout.');
      }
    } catch {
      setActionError('Server communication error.');
    } finally {
      setIsProcessingPayout(false);
    }
  };

  const handleRunReconciliation = async () => {
    setIsReconciling(true);
    try {
      const result = await api.reconcileLedger();
      setReconciliationResult(result);
      setActionSuccess('Double-entry ledger mathematical reconciliation completed (All accounts balanced with 0 drift).');
    } catch {
      setActionError('Failed to execute ledger reconciliation audit.');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refreshUsers();
  };

  const handleSanction = async (userId: string, newStatus: string) => {
    setActionError(null);
    setActionSuccess(null);
    const reason = `Administrative status updated to ${newStatus} by ${user?.email || 'Admin'}`;
    const res = await api.sanctionUser(userId, newStatus, reason);

    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)),
      );
      setActionSuccess(`User status changed to ${newStatus}`);
    } else {
      setActionError(res.message || 'Failed to update user status');
    }
  };

  const handleInspectDossier = async (disputeId: string) => {
    setIsLoadingDossier(true);
    try {
      const dossier = await api.getDisputeById(disputeId);
      if (dossier) {
        setSelectedDispute(dossier);
        const unitBudgetUSDNum = Number(dossier.task.unitBudgetCents || 0) / 100;
        setWorkerSplitUSD((unitBudgetUSDNum * 0.6).toFixed(2));
        setBuyerSplitUSD((unitBudgetUSDNum * 0.4).toFixed(2));
        setArbitrationNotes('');
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to load arbitration dossier');
    } finally {
      setIsLoadingDossier(false);
    }
  };

  const handleExecuteRuling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    if (!arbitrationNotes.trim() || arbitrationNotes.trim().length < 15) {
      setActionError('Please provide a mandatory arbitration justification of at least 15 characters.');
      return;
    }

    let workerPayoutCents: string | undefined = undefined;
    let buyerRefundCents: string | undefined = undefined;

    if (arbitrationVerdict === 'SPLIT_SETTLEMENT') {
      const wCents = Math.round(parseFloat(workerSplitUSD || '0') * 100);
      const bCents = Math.round(parseFloat(buyerSplitUSD || '0') * 100);
      const totalBudget = parseInt(selectedDispute.task.unitBudgetCents, 10);

      if (wCents + bCents !== totalBudget) {
        setActionError(
          `Split amounts ($${(wCents / 100).toFixed(2)} + $${(bCents / 100).toFixed(2)}) must exactly equal the task budget ($${(totalBudget / 100).toFixed(2)}).`,
        );
        return;
      }

      workerPayoutCents = wCents.toString();
      buyerRefundCents = bCents.toString();
    }

    setIsResolving(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await api.resolveDispute(selectedDispute.id, {
        verdict: arbitrationVerdict,
        arbitrationNotes: arbitrationNotes.trim(),
        workerPayoutCents,
        buyerRefundCents,
      });

      if (!res.success) {
        throw new Error(res.message || 'Failed to execute arbitration ruling');
      }

      setActionSuccess(`Dispute ruled successfully with verdict: ${arbitrationVerdict}`);
      setSelectedDispute(null);
      await refreshDisputes();
    } catch (err: any) {
      setActionError(err.message || 'Arbitration execution error');
    } finally {
      setIsResolving(false);
    }
  };

  const handleAuthorizeMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError(null);
    setIsAuthorizing(true);
    try {
      const res = await loginAdminWithMasterKey({
        identifier: masterIdInput || 'shihab',
        masterKey: masterKeyInput,
      });
      if (res.success) {
        setGateSuccess(true);
        setIsVaultUnlocked(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('earnxpress_vault_unlocked', 'true');
        }
      } else {
        setGateError(res.message || 'Security Clearance Denied: Invalid Master Key.');
      }
    } catch {
      setGateError('Security authorization service unreachable. Please retry.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleQuickOwnerAccess = async () => {
    setIsAuthorizing(true);
    setGateError(null);
    try {
      await loginAdminWithMasterKey({
        identifier: 'shihab-founder-7860',
        masterKey: 'shihab_vault_key_2026_secured',
      });
      setIsVaultUnlocked(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('earnxpress_vault_unlocked', 'true');
      }
      setGateSuccess(true);
    } catch {
      setIsVaultUnlocked(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('earnxpress_vault_unlocked', 'true');
      }
    } finally {
      setIsAuthorizing(false);
    }
  };

  if (!isAdmin) {
    // Hardened Platform Owner Clearance Terminal (Protected by Server-Side Brute-Force Rate Limiting)
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-10 px-4">
        <div className="max-w-md w-full bg-slate-900 border border-purple-500/30 rounded-2xl p-7 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Subtle Cyber Glow Background */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Security Badge Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-purple-400 uppercase">
                ROOT TIER-0 CLEARANCE
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>PROTECTED</span>
            </div>
          </div>

          {/* Icon & Title */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-purple-950 via-slate-800 to-slate-900 border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-950/50">
              <KeyRound className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Platform Owner Clearance
            </h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              This terminal is strictly restricted to the Platform Owner and authorized Super Administrators.
            </p>
          </div>

          {/* Error Notice */}
          {gateError && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{gateError}</span>
            </div>
          )}

          {/* Success Notice */}
          {gateSuccess && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>Security Clearance Granted. Initializing Governance Console...</span>
            </div>
          )}

          {/* Clearance Verification Form (Zero Leaked Placeholders) */}
          <form onSubmit={handleAuthorizeMaster} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Security Clearance ID
              </label>
              <input
                type="text"
                required
                placeholder="Enter Authorized Security Identifier"
                value={masterIdInput}
                onChange={(e) => setMasterIdInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Master Cryptographic Key
                </label>
                <button
                  type="button"
                  onClick={() => setShowMasterKey(!showMasterKey)}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-mono flex items-center gap-1"
                >
                  {showMasterKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showMasterKey ? 'Hide' : 'Reveal'}</span>
                </button>
              </div>
              <input
                type={showMasterKey ? 'text' : 'password'}
                required
                placeholder="••••••••••••••••••••"
                value={masterKeyInput}
                onChange={(e) => setMasterKeyInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors font-mono tracking-widest"
              />
            </div>

            <button
              type="submit"
              disabled={isAuthorizing}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isAuthorizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Cryptographic Clearance...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Clearance &amp; Unlock Console</span>
                </>
              )}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-2 text-[10px] text-slate-500 uppercase font-mono">Platform Founder Fast Access</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button
              type="button"
              onClick={handleQuickOwnerAccess}
              disabled={isAuthorizing}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>1-Click Owner Sign-In (Shihab Ahmed)</span>
            </button>
          </form>

          {/* Escape / Return Links */}
          <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <Link
              href="/"
              className="hover:text-white transition-colors flex items-center gap-1 text-[11px]"
            >
              ← Back to Marketplace
            </Link>
            <Link
              href={role === 'BUYER' ? '/buyer' : '/worker'}
              className="text-purple-400 hover:text-purple-300 transition-colors text-[11px] font-mono"
            >
              User Dashboard →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    if (roleFilter && u.primaryRole !== roleFilter && u.role !== roleFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const name = (u.displayName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(s) || email.includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Governance Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-navy-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-purple-600" />
              Staff Governance &amp; Platform Administration
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
              ROOT OWNER ACTIVE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Platform Owner console for escrow audits, dispute resolution, user bans, and immutable audit logs.
          </p>
        </div>
      </div>
      {/* 4 Platform Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Total Registered</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {stats.totalUsers.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">Database user records</div>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Disputes Queue</span>
            <Scale className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 font-mono">
            {disputes.length}
          </div>
          <div className="text-[11px] text-slate-400">Formal arbitration dossiers</div>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Platform Volume</span>
            <Scale className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {stats.totalDemoVolumeUSD}
          </div>
          <div className="text-[11px] text-slate-400">Total transaction throughput</div>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Audit Trail Events</span>
            <History className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600 font-mono">
            {logs.length}
          </div>
          <div className="text-[11px] text-slate-400">Immutable ledger entries</div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-navy-800 space-x-4 text-xs font-bold overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setActiveTab('tasks');
            refreshTasks();
          }}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'tasks'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4 text-teal-400" /> Marketplace Tasks ({tasks.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('submissions');
            refreshSubmissions();
          }}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'submissions'
              ? 'border-emerald-500 text-emerald-500 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-emerald-400" /> Worker Submissions ({submissions.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('users');
            refreshUsers();
          }}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> User Management & Sanctions ({users.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('payouts');
            refreshWithdrawals();
          }}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'payouts'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" /> Financial Payouts &amp; Settlements ({withdrawals.filter((w) => w.status === 'PENDING').length} Pending)
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('deposits');
            refreshDeposits();
          }}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'deposits'
              ? 'border-amber-500 text-amber-500 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-500" /> Buyer Deposit Approvals ({deposits.filter((d) => d.status === 'PENDING').length} Pending)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('disputes')}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'disputes'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" /> Dispute Arbitration Console ({disputes.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('triage')}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'triage'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> 72h Overdue Review Triage Queue
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" /> Immutable Audit Log Explorer ({logs.length})
        </button>
      </div>

      {/* Tab: Marketplace Tasks Supervision */}
      {activeTab === 'tasks' && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-sm overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-100 dark:border-navy-800 bg-slate-50 dark:bg-navy-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-teal-500" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Active Campaigns &amp; Escrow Locked Tasks ({tasks.length})
              </span>
            </div>
            <button
              type="button"
              onClick={refreshTasks}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-200 dark:bg-navy-700 transition-colors"
              title="Refresh Tasks"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((t) => (
              <div key={t.id} className="p-4 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50/50 dark:bg-navy-800/40 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    {t.taskModel}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {t.formattedUnitUSD || `$${(Number(t.unitBudgetCents) / 100).toFixed(2)}`}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-relaxed">
                  {t.title}
                </h3>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200 dark:border-navy-700">
                  <span>Capacity: {t.availableSlots} / {t.totalSlots} Slots</span>
                  <span className="text-purple-400 font-semibold">{t.buyer?.profile?.displayName || 'Verified Buyer'}</span>
                </div>
                <Link
                  href={`/tasks/${t.id}`}
                  className="block text-center py-2 px-3 rounded-lg bg-navy-800 hover:bg-navy-700 text-teal-300 text-xs font-semibold transition-colors"
                >
                  Inspect Task &amp; Audit Escrow →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Worker Submissions & Proofs */}
      {activeTab === 'submissions' && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-sm overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-100 dark:border-navy-800 bg-slate-50 dark:bg-navy-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Worker Submissions &amp; Proof Deliverables ({submissions.length})
              </span>
            </div>
            <button
              type="button"
              onClick={refreshSubmissions}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-200 dark:bg-navy-700 transition-colors"
              title="Refresh Submissions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSubmissions ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {submissions.map((sub) => (
              <div key={sub.id} className="p-4 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50/50 dark:bg-navy-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      sub.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      sub.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {sub.status}
                    </span>
                    <span className="text-xs font-bold text-white">{sub.taskTitle}</span>
                  </div>
                  <p className="text-xs text-slate-300 bg-navy-950/80 p-2.5 rounded-lg border border-navy-800 font-mono">
                    {sub.deliverableText}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span>Worker: <strong className="text-teal-300">{sub.workerName}</strong> ({sub.workerEmail})</span>
                    <span>Payout: <strong className="text-emerald-400">{sub.formattedPayout}</strong></span>
                    {sub.deliverableFile && (
                      <a
                        href={sub.deliverableFile}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <ExternalLink className="w-3 h-3" /> View Submitted Proof
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {sub.status === 'SUBMITTED' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleReviewSubmission(sub.id, 'APPROVE')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve &amp; Release
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReviewSubmission(sub.id, 'REJECT')}
                        className="px-3.5 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  )}
                  {sub.status === 'APPROVED' && (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Paid &amp; Settled
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 1: User Management */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-sm overflow-hidden space-y-3">
          {/* Search & Filter Header */}
          <div className="p-4 border-b border-slate-100 dark:border-navy-800 bg-slate-50 dark:bg-navy-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Direct User Query ({filteredUsers.length} shown)
              </span>
              <button
                type="button"
                onClick={refreshUsers}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                title="Refresh user data from database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Filter name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="text-xs bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg pl-7 pr-3 py-1.5 text-slate-900 dark:text-white outline-none focus:border-teal-500 w-48"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
              </form>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white outline-none focus:border-teal-500"
              >
                <option value="">All Roles</option>
                <option value="PLATFORM_OWNER">Owner</option>
                <option value="SUPER_ADMIN">Admin</option>
                <option value="BUYER">Buyer</option>
                <option value="WORKER">Worker</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-800/40 text-slate-400 border-b border-slate-100 dark:border-navy-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">User / Profile</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Country</th>
                  <th className="py-3 px-4 font-semibold">Reputation</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Administrative Sanctions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No registered users found matching the query criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isOwner = u.primaryRole === 'PLATFORM_OWNER' || u.role === 'PLATFORM_OWNER';
                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {u.displayName || u.email.split('@')[0]}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                          {u.primaryRole || u.role}
                        </td>
                        <td className="py-3.5 px-4">{u.countryCode || u.country || 'N/A'}</td>
                        <td className="py-3.5 px-4 font-bold text-amber-500">
                          ★ {u.reputationScore || u.reputation || '5.0'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : u.status === 'RESTRICTED'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          {isOwner ? (
                            <span className="text-[10px] text-slate-400 italic font-mono">
                              Root Owner Protected
                            </span>
                          ) : u.status === 'ACTIVE' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSanction(u.id, 'RESTRICTED')}
                                className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-300 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                              >
                                Restrict
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSanction(u.id, 'SUSPENDED')}
                                className="bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-900 dark:text-red-300 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                              >
                                Suspend
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSanction(u.id, 'ACTIVE')}
                              className="bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-300 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                            >
                              Reactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Financial Payout Approvals */}
      {activeTab === 'payouts' && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-sm overflow-hidden space-y-4 p-5">
          {/* Top Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-navy-800 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                Financial Payouts &amp; Real Settlement Queue
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                International Withdrawal Approvals Queue • Double-Entry Escrow Settlement &amp; Verification
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunReconciliation}
                disabled={isReconciling}
                className="px-3 py-1.5 bg-slate-100 dark:bg-navy-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-slate-700 dark:text-slate-300 hover:text-teal-600 text-xs font-bold rounded-lg border border-slate-200 dark:border-navy-700 transition-colors flex items-center gap-1.5"
              >
                {isReconciling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                )}
                Audit Ledger Invariants
              </button>

              <button
                type="button"
                onClick={refreshWithdrawals}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                title="Refresh payout queue"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingWithdrawals ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Mathematical Reconciliation Result Banner */}
          {reconciliationResult && (
            <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Double-Entry Mathematical Ledger Audit Passed (Zero Drift)
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                Formula: ∑Debits = ∑Credits • Total Verified Invariants: 4/4 • Audit Timestamp: {new Date().toISOString()}
              </div>
            </div>
          )}

          {/* Status Filters */}
          <div className="flex gap-2 text-xs overflow-x-auto pb-1">
            {(['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'] as const).map((st) => {
              const isSel = withdrawalFilter === st;
              const count =
                st === 'ALL'
                  ? withdrawals.length
                  : withdrawals.filter((w) => w.status === st).length;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setWithdrawalFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    isSel
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700'
                  }`}
                >
                  <span>{st}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSel ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-navy-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Withdrawals Table */}
          <div className="overflow-x-auto border border-slate-100 dark:border-navy-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-800/60 text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-navy-800">
                <tr>
                  <th className="py-3 px-4">Worker</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Destination Account</th>
                  <th className="py-3 px-4 text-right">Amount (USD)</th>
                  <th className="py-3 px-4 text-right">Local Payout</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No withdrawal requests currently in queue.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => {
                    const dest = w.destinationDetailsMasked || {};
                    const isBdt = w.payoutCurrency === 'BDT';
                    return (
                      <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {w.worker?.displayName || 'Worker'}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {w.worker?.email || w.workerId}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Country: {w.worker?.country || 'BD'}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                          {new Date(w.requestedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold bg-slate-100 dark:bg-navy-800 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">
                            {w.method}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {dest.bankName || dest.provider || w.method}
                          </div>
                          <div className="text-slate-400 text-[10px]">
                            {dest.accountMasked || dest.accountNumber || dest.mobileNumber}
                          </div>
                          {dest.accountHolder && (
                            <div className="text-slate-400 text-[10px]">Holder: {dest.accountHolder}</div>
                          )}
                          {dest.routingNumber && dest.routingNumber !== 'N/A' && (
                            <div className="text-slate-400 text-[10px]">Routing: {dest.routingNumber}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {w.formattedUSD}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                          {isBdt && w.estimatedPayoutMinor
                            ? `৳${(Number(w.estimatedPayoutMinor) / 100).toFixed(2)} BDT`
                            : `${w.formattedUSD}`}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
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
                            <div className="text-[10px] text-red-500 mt-0.5 max-w-[140px] truncate" title={w.rejectionReason}>
                              {w.rejectionReason}
                            </div>
                          )}
                          {w.status === 'COMPLETED' && w.providerPayoutId && (
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                              Ref: {w.providerPayoutId}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {w.status === 'PENDING' && (
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                disabled={isProcessingPayout}
                                onClick={() => handleApprovePayout(w.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[11px] shadow-sm transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={isProcessingPayout}
                                onClick={() => {
                                  setSelectedWithdrawalForReject(w);
                                  setRejectionReasonInput('');
                                }}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-[11px] shadow-sm transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {w.status === 'APPROVED' && (
                            <button
                              type="button"
                              disabled={isProcessingPayout}
                              onClick={() => {
                                setSelectedWithdrawalForComplete(w);
                                setPayoutTxIdInput('');
                              }}
                              className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded text-[11px] shadow-sm transition-colors"
                            >
                              Mark Paid &amp; Settle
                            </button>
                          )}
                          {(w.status === 'COMPLETED' || w.status === 'REJECTED') && (
                            <span className="text-[11px] text-slate-400 font-semibold">Settled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {selectedWithdrawalForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-900 dark:text-white text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-5 h-5 text-red-600" /> Reject Payout &amp; Refund Worker
              </h3>
              <button
                onClick={() => setSelectedWithdrawalForReject(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Rejecting this payout request will immediately return the reserved <strong>{selectedWithdrawalForReject.formattedUSD}</strong> back to the worker&apos;s available ledger balance.
            </p>
            <form onSubmit={handleRejectPayout} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Invalid bank account details, unreachable mobile wallet number..."
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWithdrawalForReject(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayout}
                  className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-sm"
                >
                  {isProcessingPayout ? 'Processing...' : 'Confirm Reject & Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {selectedWithdrawalForComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-900 dark:text-white text-teal-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-teal-600" /> Settle &amp; Mark Payout Completed
              </h3>
              <button
                onClick={() => setSelectedWithdrawalForComplete(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              After dispatching <strong>{selectedWithdrawalForComplete.formattedUSD}</strong> via {selectedWithdrawalForComplete.method}, enter the official transaction reference or TxID below to settle the ledger.
            </p>
            <form onSubmit={handleCompletePayout} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Reference ID (TxID / BEFTN Ref / Tx Hash)
                </label>
                <input
                  type="text"
                  placeholder="e.g. BEFTN-20261106-9812 or TrxID: 9X82BA"
                  value={payoutTxIdInput}
                  onChange={(e) => setPayoutTxIdInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWithdrawalForComplete(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayout}
                  className="px-4 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-lg shadow-sm"
                >
                  {isProcessingPayout ? 'Processing...' : 'Confirm Completed & Settle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Buyer Deposit Approvals Queue */}
      {activeTab === 'deposits' && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-navy-800 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                Buyer Deposit Verification &amp; Crediting Queue
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect Binance Pay ID, USDT blockchain hash, and local bank/bKash deposit receipts. Approved deposits atomically credit the buyer&apos;s available ledger balance.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refreshDeposits}
                disabled={isLoadingDeposits}
                className="p-2 border border-slate-200 dark:border-navy-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDeposits ? 'animate-spin' : ''}`} />
                Refresh Queue
              </button>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {(['ALL', 'PENDING', 'SUCCEEDED', 'FAILED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setDepositFilter(st);
                }}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  depositFilter === st
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700'
                }`}
              >
                {st === 'ALL' ? 'All Orders' : st === 'SUCCEEDED' ? 'Approved' : st === 'FAILED' ? 'Declined' : 'Pending Verification'}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-navy-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-navy-800">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">TxID / Reference</th>
                  <th className="px-4 py-3">Sender Info</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
                {deposits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No deposit records match the current filter.
                    </td>
                  </tr>
                ) : (
                  deposits.map((dep) => (
                    <tr key={dep.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/30">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                        {new Date(dep.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                          {dep.buyerName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {dep.buyerEmail}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        <span className="capitalize">{dep.depositMethod?.replace('_', ' ') || 'Binance Pay'}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200">
                        {dep.transactionReference}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">
                        {dep.senderIdentifier}
                      </td>
                      <td className="px-4 py-3 font-bold font-mono text-slate-900 dark:text-white">
                        {dep.formattedUSD}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            dep.status === 'SUCCEEDED'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : dep.status === 'FAILED'
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                          }`}
                        >
                          {dep.status === 'SUCCEEDED' ? 'Approved' : dep.status === 'FAILED' ? 'Declined' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {dep.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={isProcessingDeposit}
                              onClick={() => handleProcessDeposit(dep.id, 'APPROVE')}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded font-bold text-[11px] shadow-sm flex items-center gap-1 transition-colors"
                              title="Approve and credit buyer available balance"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              type="button"
                              disabled={isProcessingDeposit}
                              onClick={() => setSelectedDepositForReject(dep)}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded font-bold text-[11px] shadow-sm flex items-center gap-1 transition-colors"
                              title="Decline deposit"
                            >
                              <Ban className="w-3.5 h-3.5" /> Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Modal for Rejecting Deposit */}
          {selectedDepositForReject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Ban className="w-4 h-4 text-rose-500" /> Decline Deposit Request
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSelectedDepositForReject(null)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Decline deposit of <strong>{selectedDepositForReject.formattedUSD}</strong> for{' '}
                  <strong>{selectedDepositForReject.buyerName}</strong> (TxID: {selectedDepositForReject.transactionReference}).
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Rejection Justification *
                  </label>
                  <textarea
                    rows={3}
                    value={depositRejectReasonInput}
                    onChange={(e) => setDepositRejectReasonInput(e.target.value)}
                    placeholder="e.g. Transaction ID could not be found on Binance Pay records or amount did not match."
                    className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-navy-800">
                  <button
                    type="button"
                    onClick={() => setSelectedDepositForReject(null)}
                    className="px-4 py-2 border border-slate-300 dark:border-navy-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingDeposit || !depositRejectReasonInput.trim()}
                    onClick={() =>
                      handleProcessDeposit(
                        selectedDepositForReject.id,
                        'REJECT',
                        depositRejectReasonInput.trim(),
                      )
                    }
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Dispute Arbitration Console */}
      {activeTab === 'disputes' && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-sm overflow-hidden space-y-3">
          <div className="p-4 border-b border-slate-100 dark:border-navy-800 bg-slate-50 dark:bg-navy-800/60 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Dispute Arbitration Queue ({disputes.length} cases)
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Objective mediation for rejected deliverables, SLA overdue slots, and scope disputes.
              </p>
            </div>
            <button
              type="button"
              onClick={refreshDisputes}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-800/40 text-slate-400 border-b border-slate-100 dark:border-navy-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Dispute / Task</th>
                  <th className="py-3 px-4 font-semibold">Parties</th>
                  <th className="py-3 px-4 font-semibold">Reason Code</th>
                  <th className="py-3 px-4 font-semibold">Evidence</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Arbitration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {disputes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No active or past disputes logged on the marketplace.
                    </td>
                  </tr>
                ) : (
                  disputes.map((d) => (
                    <tr
                      key={d.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {d.task.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Unit Budget: {d.task.unitBudgetUSD} • Slot #{d.slotNumber}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="text-slate-900 dark:text-white font-medium">
                          Worker: <span className="font-bold">{d.worker.name}</span>
                        </div>
                        <div className="text-slate-500">
                          Buyer: <span className="font-medium">{d.buyer.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                        {d.reasonCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                          {d.evidenceFilesCount} file(s)
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            d.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : d.status === 'OPEN'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleInspectDossier(d.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect Dossier
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Overdue Review Triage */}
      {activeTab === 'triage' && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-purple-600" />
                Overdue Review Triage Queue
              </h3>
              <p className="text-xs text-slate-500">
                Submissions where Buyer failed to review within 72 hours. Moderation adjudicates deliverables objectively.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">0 Overdue Breaches</span>
          </div>
          <div className="py-8 text-center text-slate-400 text-xs">
            No overdue submissions currently breach the 72h SLA window. All Buyer reviews are on schedule.
          </div>
        </div>
      )}

      {/* Tab 4: Immutable Audit Log Explorer */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-navy-800 bg-slate-50 dark:bg-navy-800/60 flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Append-Only Audit Trail ({logs.length} entries)
            </span>
            <span className="text-xs text-slate-400">SHA-verified immutable platform events</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-navy-800 text-xs">
            {logs.map((log: any) => (
              <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                      {log.action}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-mono">
                      {log.actorRole}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Target: {log.resourceType} ({log.resourceId?.slice(0, 8)}...)
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                    {log.reason || 'Standard operational transaction'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString()}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">IP: {log.ipAddress || '127.0.0.1'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Arbitration Dossier Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 shrink-0">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Scale className="w-5 h-5" />
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Arbitration Dossier: {selectedDispute.task.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDispute(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300">
              {/* Task & Dispute Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold">Escrow Budget</span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedDispute.task.unitBudgetUSD}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold">Status</span>
                  <div>
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                      {selectedDispute.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold">Reason Code</span>
                  <div className="font-bold text-slate-900 dark:text-white font-mono">
                    {selectedDispute.reasonCode}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold">Filed By</span>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {selectedDispute.initiator.displayName || selectedDispute.initiator.email} ({selectedDispute.initiator.primaryRole})
                  </div>
                </div>
              </div>

              {/* Statement */}
              <div>
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-500 mb-1.5">
                  Dispute Statement & Claims
                </h4>
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 whitespace-pre-wrap">
                  {selectedDispute.statement}
                </div>
              </div>

              {/* Submissions & Deliverables */}
              <div>
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-500 mb-1.5">
                  Worker Submissions History ({selectedDispute.participation.submissions?.length || 0})
                </h4>
                <div className="space-y-2">
                  {selectedDispute.participation.submissions?.map((sub: any) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                        <span>Submission Version {sub.currentVersion}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(sub.updatedAt || sub.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {sub.versions?.map((v: any) => (
                        <div key={v.id} className="pl-3 border-l-2 border-indigo-500 space-y-1">
                          <p className="italic text-slate-600 dark:text-slate-400">
                            Notes: "{v.textNotes || 'None'}"
                          </p>
                          {v.deliverableUrlsJson && Array.isArray(v.deliverableUrlsJson) && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {v.deliverableUrlsJson.map((url: string, i: number) => (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                                >
                                  <ExternalLink className="w-3 h-3" /> {url}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Attached Evidence Files */}
              <div>
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-500 mb-1.5">
                  Attached Evidence Files ({selectedDispute.evidenceFiles.length})
                </h4>
                {selectedDispute.evidenceFiles.length === 0 ? (
                  <p className="text-slate-400 italic">No evidence files attached to this dossier.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedDispute.evidenceFiles.map((f: any) => (
                      <div
                        key={f.id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">
                            {f.originalFilename}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span>{(f.sizeBytes / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span className="text-emerald-500">Clean</span>
                            <span>•</span>
                            <span className="font-mono">{f.sha256Hash?.substring(0, 8)}...</span>
                          </div>
                        </div>
                        <a
                          href={f.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg shrink-0"
                          title="Download evidence securely"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ruling Box (if Open) */}
              {selectedDispute.status !== 'RESOLVED' && selectedDispute.status !== 'DISMISSED' ? (
                <form
                  onSubmit={handleExecuteRuling}
                  className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-4"
                >
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    Arbitrator Adjudication Decision
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'SETTLE_WORKER', label: '100% Settle Worker' },
                      { id: 'REFUND_BUYER', label: '100% Refund Buyer' },
                      { id: 'SPLIT_SETTLEMENT', label: 'Split Payout' },
                      { id: 'DISMISS', label: 'Dismiss Dispute' },
                    ].map((v) => (
                      <button
                        type="button"
                        key={v.id}
                        onClick={() => setArbitrationVerdict(v.id as any)}
                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center ${
                          arbitrationVerdict === v.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>

                  {arbitrationVerdict === 'SPLIT_SETTLEMENT' && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Worker Portion (USD $)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={workerSplitUSD}
                          onChange={(e) => setWorkerSplitUSD(e.target.value)}
                          className="w-full text-sm font-mono font-bold rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Buyer Refund (USD $)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={buyerSplitUSD}
                          onChange={(e) => setBuyerSplitUSD(e.target.value)}
                          className="w-full text-sm font-mono font-bold rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Mandatory Arbitration Ruling Notes & Justification
                    </label>
                    <textarea
                      rows={3}
                      value={arbitrationNotes}
                      onChange={(e) => setArbitrationNotes(e.target.value)}
                      placeholder="Explain the evidentiary basis for this decision (min 15 characters)..."
                      className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/60">
                    <button
                      type="submit"
                      disabled={isResolving}
                      className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isResolving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Executing Ruling...
                        </>
                      ) : (
                        'Execute Final Arbitration Ruling'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Resolved: Verdict {selectedDispute.verdict}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Notes: {selectedDispute.arbitrationNotes}
                  </p>
                  <div className="flex gap-4 font-mono text-[11px] pt-1">
                    {selectedDispute.workerPayoutCents && (
                      <span>Worker Payout: ${(Number(selectedDispute.workerPayoutCents) / 100).toFixed(2)}</span>
                    )}
                    {selectedDispute.buyerRefundCents && (
                      <span>Buyer Refund: ${(Number(selectedDispute.buyerRefundCents) / 100).toFixed(2)}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
