'use client';

import { AllergenSeverity } from '@/types';
import { cn } from '@/lib/utils';

interface AllergenTagProps {
  name: string;
  severity: AllergenSeverity;
  confidence?: number;
}

const severityColors: Record<AllergenSeverity, string> = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function AllergenTag({ name, severity, confidence }: AllergenTagProps) {
  const color = severityColors[severity] ?? severityColors.medium;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
        color
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {name}
      {confidence !== undefined && (
        <span className="text-xs opacity-70">({Math.round(confidence * 100)}%)</span>
      )}
    </span>
  );
}
