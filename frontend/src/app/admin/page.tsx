import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DemoBadge } from '@/components/shared/DemoBadge';
import { AdminConsoleClient } from './admin-console-client';
import { ShieldCheck } from 'lucide-react';

export default async function AdminPage() {
  const [stats, logs, usersRes] = await Promise.all([
    api.getAdminStats(),
    api.getAuditLogs(),
    api.getAdminUsers({ limit: 50 }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-navy-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-purple-600" />
              Staff Governance & Platform Administration
            </h1>
            <DemoBadge size="sm" variant="teal" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Platform Owner & Super Admin console for moderation, sanctions, and immutable audit logs.
          </p>
        </div>
      </div>

      <AdminConsoleClient
        initialStats={stats}
        initialLogs={logs}
        initialUsers={usersRes?.users || []}
      />
    </div>
  );
}
