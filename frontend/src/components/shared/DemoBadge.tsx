import React from 'react';

interface DemoBadgeProps {
  variant?: 'amber' | 'teal' | 'slate';
  size?: 'sm' | 'md';
}

export function DemoBadge({ variant = 'amber', size = 'sm' }: DemoBadgeProps) {
  const styles = {
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300/60 dark:border-amber-800/60',
    teal: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300/60 dark:border-teal-800/60',
    slate: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  };

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5 tracking-wider font-bold rounded',
    md: 'text-xs px-2.5 py-1 tracking-wider font-bold rounded-md',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 border uppercase font-mono select-none ${styles[variant]} ${sizes[size]}`}
      title="This platform operates exclusively with simulated funds for demonstration purposes. No real money movement."
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
      DEMO
    </span>
  );
}
