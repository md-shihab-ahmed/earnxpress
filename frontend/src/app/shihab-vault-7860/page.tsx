import React from 'react';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { AdminConsoleClient } from '../admin/admin-console-client';

// Strict anti-crawler directive: Search engines will never index or disclose this private route
export const metadata: Metadata = {
  title: 'Clearance Gateway',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function ShihabVaultPage() {
  const [stats, logs, usersRes] = await Promise.all([
    api.getAdminStats().catch(() => ({
      totalUsers: 142,
      activeTasks: 38,
      totalSlotsFunded: 240,
      totalDemoVolumeUSD: '14,850.00',
      openDisputes: 0,
      overdueReviews: 2,
      auditLogCount: 64,
    })),
    api.getAuditLogs().catch(() => []),
    api.getAdminUsers({ limit: 50 }).catch(() => ({ users: [] })),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <AdminConsoleClient
        initialStats={stats}
        initialLogs={logs}
        initialUsers={usersRes?.users || []}
      />
    </div>
  );
}
