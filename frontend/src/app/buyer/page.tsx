import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  PlusCircle,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  AlertTriangle,
  Play,
  Pause,
} from 'lucide-react';

export default async function BuyerDashboardPage() {
  const { data: tasks } = await api.getTasks();
  const wallet = await api.getWallet();

  const totalFundedSlots = (tasks as any[]).reduce((sum: number, t: any) => sum + (t.totalSlots || 0), 0);
  const totalOpenSlots = (tasks as any[]).reduce((sum: number, t: any) => sum + (t.availableSlots || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-navy-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Buyer Campaign Control Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Author multi-worker campaigns, monitor participation metrics, and evaluate worker submissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/buyer/submissions"
            className="flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 dark:bg-navy-800 dark:hover:bg-navy-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg border border-navy-700 transition-colors"
          >
            <FileCheck2 className="w-4 h-4 text-amber-400" />
            <span>Review Queue</span>
          </Link>
          <Link
            href="/buyer/tasks/new"
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> Post New Campaign
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Active Campaigns</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {tasks.length}
          </div>
          <div className="text-[11px] text-slate-400">Open on marketplace</div>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Total Slots Funded</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 font-mono">
            {totalFundedSlots}
          </div>
          <div className="text-[11px] text-slate-400">{totalOpenSlots} slots remaining open</div>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Pending Reviews</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-500 font-mono">
            3
          </div>
          <div className="text-[11px] text-slate-400">72h SLA timer active</div>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Reserved Escrow</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {wallet.formattedEscrowUSD}
          </div>
          <div className="text-[11px] text-slate-400">Guaranteed in Escrow</div>
        </div>
      </div>

      {/* Campaign Management Table */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              My Published Task Campaigns
            </h3>
            <p className="text-xs text-slate-500">
              Control task capacity, pause new reservations, or inspect participant progress.
            </p>
          </div>
          <Link
            href="/buyer/tasks/new"
            className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" /> New Campaign
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-800/60 text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-navy-800">
              <tr>
                <th className="py-3 px-4">Campaign Title</th>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4">Capacity / Slots</th>
                <th className="py-3 px-4">Unit Budget</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                  <td className="py-3.5 px-4 font-semibold max-w-xs truncate text-slate-900 dark:text-white">
                    <Link href={`/tasks/${task.id}`} className="hover:text-teal-600">
                      {task.title}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                      {task.taskModel}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {task.availableSlots} / {task.totalSlots} Open
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                    {task.formattedUnitUSD}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                      {task.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded text-[11px] font-semibold"
                      >
                        Inspect
                      </Link>
                      <Link
                        href="/buyer/submissions"
                        className="bg-teal-600 hover:bg-teal-500 text-white px-2.5 py-1 rounded text-[11px] font-semibold"
                      >
                        Reviews
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
