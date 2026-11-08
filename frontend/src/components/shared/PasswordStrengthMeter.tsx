'use client';

import React, { useMemo } from 'react';
import { Check, X, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { validatePassword, COMMON_PASSWORDS_BLACKLIST } from '@/lib/validators/password';

interface PasswordStrengthMeterProps {
  password: string;
  email?: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  email,
}) => {
  const result = useMemo(() => validatePassword(password, email), [password, email]);

  if (!password) {
    return null;
  }

  const hasLength = password.length >= 8 && password.length <= 64;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[@#$%^&*!_~<>()+=\-[\]{}|;:,.?/\\]/.test(password);
  const isNotBlacklisted = !COMMON_PASSWORDS_BLACKLIST.has(password.toLowerCase().trim());

  const getStrengthBarColor = () => {
    switch (result.strengthLabel) {
      case 'Weak':
        return 'bg-red-500';
      case 'Fair':
        return 'bg-amber-500';
      case 'Good':
        return 'bg-blue-500';
      case 'Strong':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-300';
    }
  };

  const getStrengthBadge = () => {
    switch (result.strengthLabel) {
      case 'Strong':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />,
          color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300',
        };
      case 'Good':
        return {
          icon: <Shield className="w-3.5 h-3.5 text-blue-600" />,
          color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300',
        };
      case 'Fair':
        return {
          icon: <Shield className="w-3.5 h-3.5 text-amber-600" />,
          color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300',
        };
      default:
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5 text-red-600" />,
          color: 'text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300',
        };
    }
  };

  const badge = getStrengthBadge();

  return (
    <div className="space-y-2 mt-2 p-3 bg-slate-50 dark:bg-navy-850 rounded-xl border border-slate-100 dark:border-navy-700/60 text-xs">
      {/* Strength Bar & Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {badge.icon}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            Password Strength:
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${badge.color}`}>
          {result.strengthLabel}
        </span>
      </div>

      <div className="w-full bg-slate-200 dark:bg-navy-700 h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getStrengthBarColor()}`}
          style={{ width: `${Math.max(15, (result.score / 4) * 100)}%` }}
        />
      </div>

      {/* Rules Checklist */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px]">
        <RuleItem checked={hasLength} label="8 to 64 characters" />
        <RuleItem checked={hasUpper} label="Uppercase letter (A-Z)" />
        <RuleItem checked={hasLower} label="Lowercase letter (a-z)" />
        <RuleItem checked={hasNumber} label="Number (0-9)" />
        <RuleItem checked={hasSymbol} label="Symbol (@, #, $, !, etc.)" />
        <RuleItem checked={isNotBlacklisted} label="Not easily guessed" />
      </div>

      {!isNotBlacklisted && (
        <p className="text-[11px] text-red-600 dark:text-red-400 font-medium pt-1">
          ⚠️ This password is too common or blacklisted. Choose a unique passphrase.
        </p>
      )}
    </div>
  );
};

const RuleItem: React.FC<{ checked: boolean; label: string }> = ({ checked, label }) => (
  <div className="flex items-center gap-1.5">
    {checked ? (
      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
    ) : (
      <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
    )}
    <span className={checked ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}>
      {label}
    </span>
  </div>
);
