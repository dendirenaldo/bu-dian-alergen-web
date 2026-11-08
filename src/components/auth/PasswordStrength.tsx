'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export interface PasswordCriterion {
  id: string;
  label: string;
  met: boolean;
}

export function evaluatePassword(password: string): { score: number; criteria: PasswordCriterion[] } {
  const pw = password || '';
  const criteria: PasswordCriterion[] = [
    { id: 'length', label: '≥ 8 karakter', met: pw.length >= 8 },
    { id: 'lower', label: 'huruf kecil (a-z)', met: /[a-z]/.test(pw) },
    { id: 'upper', label: 'huruf besar (A-Z)', met: /[A-Z]/.test(pw) },
    { id: 'digit', label: 'angka (0-9)', met: /[0-9]/.test(pw) },
    { id: 'symbol', label: 'simbol (!@#…)', met: /[^A-Za-z0-9]/.test(pw) },
  ];
  return { score: criteria.filter((c) => c.met).length, criteria };
}

/**
 * Indikator kekuatan password (visual saja — tidak memblokir submit).
 * Menampilkan label + bar + 5 bullet (satu per kriteria).
 */
export default function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const { t } = useLocale();
  const { score, criteria } = useMemo(() => evaluatePassword(password), [password]);

  const level =
    score <= 1 ? 'weak' : score === 2 ? 'fair' : score === 3 ? 'medium' : score === 4 ? 'good' : 'strong';

  const labelMap: Record<string, string> = {
    weak: t('password.strength.weak'),
    fair: t('password.strength.fair'),
    medium: t('password.strength.medium'),
    good: t('password.strength.good'),
    strong: t('password.strength.strong'),
  };

  const barColor =
    score <= 1
      ? 'bg-red-500'
      : score === 2
        ? 'bg-orange-500'
        : score === 3
          ? 'bg-amber-500'
          : score === 4
            ? 'bg-lime-500'
            : 'bg-green-600';

  if (!password) return null;

  return (
    <div className={cn('space-y-2', className)} aria-live="polite">
      <div className="flex items-center justify-between text-xs">
        <span className="text-surface-500 dark:text-surface-400">{t('password.strength.label')}</span>
        <span
          className={cn(
            'font-semibold',
            score <= 1
              ? 'text-red-600 dark:text-red-400'
              : score === 2
                ? 'text-orange-600 dark:text-orange-400'
                : score === 3
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-green-600 dark:text-green-400',
          )}
        >
          {labelMap[level]}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={5}
        aria-label={t('password.strength.label')}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-300', barColor)}
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1">
        {criteria.map((c) => (
          <li
            key={c.id}
            className={cn(
              'flex items-center gap-1.5 text-xs',
              c.met ? 'text-green-600 dark:text-green-400' : 'text-surface-400 dark:text-surface-500',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'inline-block h-1.5 w-1.5 rounded-full',
                c.met ? 'bg-green-500' : 'bg-surface-300 dark:bg-surface-600',
              )}
            />
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
