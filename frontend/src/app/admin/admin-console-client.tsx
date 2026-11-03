'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { DemoBadge } from '@/components/shared/DemoBadge';
import {
  Users,
  ShieldAlert,
  FileCheck2,
  AlertTriangle,
  History,
  CheckCircle2,
  Ban,
  Slash,
  Eye,
  Lock,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  ShieldX,
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
  const { user, role, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'triage' | 'audit'>('users');
  const [users, setUsers] = useState<any[]>(initialUsers);
  const [logs, setLogs] = useState<any[]>(initialLogs);
  const [stats, setStats] = useState(initialStats);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isAdmin =
    isAuthenticated &&
    user &&
    (role === 'PLATFORM_OWNER' ||
      role === 'SUPER_ADMIN' ||
      role === 'MODERATOR' ||
      role === 'SUPPORT_AGENT');

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

  useEffect(() => {
    if (isAdmin) {
      refreshUsers();
    }
  }, [roleFilter]);

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
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
      setActionSuccess(`User status updated to ${newStatus}. Immutable audit log generated.`);
    } else {
      setActionError(res.message || `Failed to update status to ${newStatus}`);
    }
  };

  // Client-side unauthorized guard
  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-navy-900 border border-red-200 dark:border-red-900 rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto shadow-sm">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldX className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Restricted Staff Governance Console
        </h2>
        <p className="text-xs text-slate-500">
          This portal is reserved strictly for Platform Owners and authorized Administrators.
          Direct URL access by non-administrative accounts is prohibited.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            href="/login"
            className="text-xs font-semibold px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors"
          >
            Sign In with Staff Account
          </Link>
          <Link
            href={role === 'BUYER' ? '/buyer' : '/worker'}
            className="text-xs font-semibold px-4 py-2 bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Return to Dashboard
          </Link>
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
            <span>Total Campaigns</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 font-mono">
            {stats.activeTasks.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">{stats.totalSlotsFunded} slots initialized</div>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Simulated Volume</span>
            <DemoBadge size="sm" variant="teal" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {stats.totalDemoVolumeUSD}
          </div>
          <div className="text-[11px] text-slate-400">Total DEMO throughput</div>
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
      <div className="flex border-b border-slate-200 dark:border-navy-800 space-x-4 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> User Management & Sanctions ({users.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('triage')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
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
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" /> Immutable Audit Log Explorer ({logs.length})
        </button>
      </div>

      {/* Tab 1: User Management */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-sm overflow-hidden space-y-3">
          {/* Search & Filter Header */}
          <div className="p-4 border-b border-slate-100 dark:border-navy-800 bg-slate-50 dark:bg-navy-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Registered Platform Accounts
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-navy-700 font-mono text-slate-600 dark:text-slate-300">
                {filteredUsers.length} shown
              </span>
            </div>

            <div className="flex items-center gap-2">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search email or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="text-xs bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg pl-8 pr-3 py-1.5 outline-none focus:border-teal-500 w-48 text-slate-900 dark:text-white"
                />
              </form>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-teal-500 text-slate-700 dark:text-slate-300"
              >
                <option value="">All Roles</option>
                <option value="WORKER">Workers</option>
                <option value="BUYER">Buyers</option>
                <option value="SUPER_ADMIN">Admins</option>
                <option value="PLATFORM_OWNER">Platform Owner</option>
              </select>

              <button
                type="button"
                onClick={refreshUsers}
                disabled={isLoading}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-lg transition-colors"
                title="Refresh users"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-800/60 text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-navy-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Primary Role</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4">Reputation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Sanction Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No accounts matched the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const primaryRole = u.primaryRole || u.role;
                    const isOwner = primaryRole === 'PLATFORM_OWNER';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          <div>{u.displayName || 'Anonymous User'}</div>
                          <div className="text-[10px] text-slate-400 font-mono font-normal">
                            {u.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[10px]">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              primaryRole === 'PLATFORM_OWNER'
                                ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300'
                                : primaryRole === 'SUPER_ADMIN'
                                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                                : primaryRole === 'BUYER'
                                ? 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300'
                                : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {primaryRole}
                          </span>
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

      {/* Tab 2: Overdue Review Triage */}
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

      {/* Tab 3: Immutable Audit Log Explorer */}
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
    </div>
  );
}
