'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
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
}

export function AdminConsoleClient({ initialStats, initialLogs }: AdminConsoleClientProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'triage' | 'audit'>('users');
  const [users, setUsers] = useState([
    {
      id: 'u-1',
      displayName: 'Rahim Chowdhury',
      email: 'worker@earnxpress.demo',
      role: 'WORKER',
      status: 'ACTIVE',
      country: 'BD',
      reputation: 4.98,
    },
    {
      id: 'u-2',
      displayName: 'Global Retail AI Lab',
      email: 'buyer@earnxpress.demo',
      role: 'BUYER',
      status: 'ACTIVE',
      country: 'US',
      reputation: 4.95,
    },
    {
      id: 'u-3',
      displayName: 'Flagged Account XYZ',
      email: 'suspicious@demo.com',
      role: 'WORKER',
      status: 'RESTRICTED',
      country: 'RU',
      reputation: 2.1,
    },
  ]);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleSanction = (userId: string, newStatus: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
    setActionSuccess(`User status updated to ${newStatus}. Immutable audit log entry generated.`);
  };

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
            {initialStats.totalUsers.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">Buyers & Workers</div>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Total Slots Funded</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 font-mono">
            {initialStats.totalSlotsFunded.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">{initialStats.activeTasks} active campaigns</div>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Simulated Volume</span>
            <DemoBadge size="sm" variant="teal" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {initialStats.totalDemoVolumeUSD}
          </div>
          <div className="text-[11px] text-slate-400">Total DEMO throughput</div>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Overdue Reviews</span>
            <AlertTriangle className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600 font-mono">
            {initialStats.overdueReviews}
          </div>
          <div className="text-[11px] text-slate-400">&gt;72h SLA escalation</div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {actionSuccess}
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
          <Users className="w-4 h-4" /> User Management & Sanctions
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
          <History className="w-4 h-4" /> Immutable Audit Log Explorer
        </button>
      </div>

      {/* Tab 1: User Management */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-navy-800 bg-slate-50 dark:bg-navy-800/60 flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Platform Accounts ({users.length})
            </span>
            <span className="text-xs text-slate-400">Enforce warnings, slot restrictions, and suspensions</span>
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
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div>{u.displayName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[10px]">
                      {u.role}
                    </td>
                    <td className="py-3.5 px-4">{u.country}</td>
                    <td className="py-3.5 px-4 font-bold text-amber-500">★ {u.reputation}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {u.status === 'ACTIVE' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSanction(u.id, 'RESTRICTED')}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 rounded text-[11px] font-semibold"
                          >
                            Restrict Slots
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSanction(u.id, 'SUSPENDED')}
                            className="bg-red-100 hover:bg-red-200 text-red-900 px-2.5 py-1 rounded text-[11px] font-semibold"
                          >
                            Suspend
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSanction(u.id, 'ACTIVE')}
                          className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 px-2.5 py-1 rounded text-[11px] font-semibold"
                        >
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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
          </div>

          <div className="p-4 bg-slate-50 dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                Task: Translate 50 Technical Documentation Articles (English to Bangla)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                REVIEW_OVERDUE (+4h past SLA)
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Worker @Rahim_BD submitted 50 markdown files on time. Buyer has not responded in 72 hours.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActionSuccess('Moderator approved overdue submission. Payout released to worker.')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg"
              >
                Adjudicate & Release Payout
              </button>
              <button
                type="button"
                onClick={() => setActionSuccess('Extended 24h final grace notice dispatched to Buyer.')}
                className="bg-slate-200 hover:bg-slate-300 dark:bg-navy-700 text-slate-800 dark:text-slate-200 font-bold text-xs px-4 py-2 rounded-lg"
              >
                Send 24h Final Warning to Buyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Immutable Audit Explorer */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-navy-800 bg-slate-50 dark:bg-navy-800/60 flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-teal-600" />
              PostgreSQL Trigger-Protected Audit Trail
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Enforced by trg_audit_logs_immutable</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-navy-800 text-xs">
            {initialLogs.map((log) => (
              <div key={log.id} className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                      {log.action}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-800 font-mono text-slate-600 dark:text-slate-300">
                      Actor: {log.actorRole}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-xs">
                  {log.reason}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Target: {log.resourceType} ({log.resourceId}) • IP: {log.ipAddress}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
