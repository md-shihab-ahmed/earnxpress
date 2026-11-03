'use client';

import React, { useState } from 'react';
import { ProgressMilestone } from '@/types';
import { CheckCircle2, Circle, CheckSquare, Square } from 'lucide-react';

interface MilestoneTrackerProps {
  milestones: ProgressMilestone[];
  participationId: string;
  readOnly?: boolean;
  onUpdate?: (milestoneId: string, isCompleted: boolean) => void;
}

export function MilestoneTracker({
  milestones: initialMilestones,
  readOnly = false,
  onUpdate,
}: MilestoneTrackerProps) {
  const [milestones, setMilestones] = useState(initialMilestones);

  const completedCount = milestones.filter((m) => m.isCompleted).length;
  const progressPercent = milestones.length > 0
    ? Math.round((completedCount / milestones.length) * 100)
    : 0;

  const handleToggle = (id: string, currentState: boolean) => {
    if (readOnly) return;
    const newState = !currentState;
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isCompleted: newState, isVerified: newState } : m))
    );
    if (onUpdate) {
      onUpdate(id, newState);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-navy-900/50 border border-slate-200 dark:border-navy-700/80 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            Verified Milestone Checklist
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Progress is derived strictly from verified deliverables — self-reported percentages are prohibited.
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-teal-600 dark:text-teal-400 font-mono">
            {progressPercent}%
          </span>
          <div className="text-[10px] text-slate-400 font-medium">
            {completedCount} of {milestones.length} Done
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-slate-200 dark:bg-navy-800 rounded-full overflow-hidden">
        <div
          style={{ width: `${progressPercent}%` }}
          className="h-full bg-teal-600 rounded-full transition-all duration-300"
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-2.5 pt-2">
        {milestones.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No incremental milestones configured for this task.</p>
        ) : (
          milestones.map((m) => (
            <div
              key={m.id}
              onClick={() => handleToggle(m.id, m.isCompleted)}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                readOnly ? 'cursor-default' : 'cursor-pointer hover:border-teal-500/50'
              } ${
                m.isCompleted
                  ? 'bg-teal-50/70 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/50'
                  : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-navy-700/60'
              }`}
            >
              <button
                type="button"
                disabled={readOnly}
                className="mt-0.5 text-teal-600 dark:text-teal-400 flex-shrink-0"
              >
                {m.isCompleted ? (
                  <CheckSquare className="w-5 h-5 text-teal-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-medium ${
                    m.isCompleted
                      ? 'text-teal-900 dark:text-teal-200 line-through opacity-85'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {m.milestoneOrder}. {m.title}
                </div>
                {m.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {m.description}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
