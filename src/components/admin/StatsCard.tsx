'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import Card from '@/components/ui/Card';

interface StatsCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const colorMap = {
  primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
  success: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export default function StatsCard({ icon: Icon, value, label, color = 'primary' }: StatsCardProps) {
  return (
    <Card padding="md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{value}</p>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{label}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
