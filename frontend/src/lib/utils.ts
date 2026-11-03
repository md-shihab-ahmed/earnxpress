import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format integer USD cents as DEMO $X.XX USD
 */
export function formatUSD(cents: number | bigint | string | null | undefined): string {
  if (cents === null || cents === undefined) return 'DEMO $0.00 USD';
  const num = typeof cents === 'bigint' ? Number(cents) : Number(cents);
  if (isNaN(num)) return 'DEMO $0.00 USD';
  return `DEMO $${(num / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
}

/**
 * Format date in friendly human-readable format
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Human-friendly countdown / time elapsed
 */
export function formatTimeRemaining(deadline: string | Date | null | undefined): string {
  if (!deadline) return 'No deadline set';
  const target = new Date(deadline).getTime();
  const now = Date.now();
  const diffMs = target - now;

  if (diffMs <= 0) return 'Deadline expired';

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    const remainingHours = diffHours % 24;
    return `${diffDays}d ${remainingHours}h remaining`;
  }

  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${diffHours}h ${diffMinutes}m remaining`;
}
