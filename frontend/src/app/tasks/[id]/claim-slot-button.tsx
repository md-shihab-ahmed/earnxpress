'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

interface ClaimSlotButtonProps {
  taskId: string;
  availableSlots: number;
}

export function ClaimSlotButton({ taskId, availableSlots }: ClaimSlotButtonProps) {
  const router = useRouter();
  const { role, switchRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    // If user is currently in Buyer or Admin view, automatically switch to Worker
    if (role !== 'WORKER') {
      switchRole('WORKER');
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.acceptSlot(taskId);
      if (res.success) {
        setClaimed(true);
        setTimeout(() => {
          router.push(`/worker/tasks/${taskId}`);
        }, 800);
      } else {
        setError(res.message || 'Slot claim failed');
      }
    } catch {
      setError('Network exception claiming slot');
    } finally {
      setLoading(false);
    }
  };

  if (availableSlots <= 0) {
    return (
      <button
        disabled
        className="bg-slate-200 dark:bg-navy-800 text-slate-400 font-bold text-xs px-6 py-3 rounded-xl cursor-not-allowed uppercase tracking-wider"
      >
        All Slots Claimed
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={loading || claimed}
        onClick={handleClaim}
        className={`inline-flex items-center gap-2 font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all ${
          claimed
            ? 'bg-emerald-600 text-white'
            : 'bg-teal-600 hover:bg-teal-500 text-white hover:scale-102'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Claiming Slot...
          </>
        ) : claimed ? (
          <>
            <CheckCircle2 className="w-4 h-4" /> Slot Claimed! Redirecting...
          </>
        ) : (
          <>
            Claim Available Work Slot <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
      {error && <span className="text-[11px] text-red-500 font-medium">{error}</span>}
    </div>
  );
}
