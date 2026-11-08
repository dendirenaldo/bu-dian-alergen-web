import { Check, Globe } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import Dropdown from '@/components/ui/Dropdown';

const LOCALES = [
  { value: 'id' as const, label: 'Indonesia', short: 'ID' },
  { value: 'en' as const, label: 'English', short: 'EN' },
];

export default function LocaleToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const active = LOCALES.find((l) => l.value === locale) ?? LOCALES[0];

  return (
    <Dropdown
      align="right"
      className={className}
      onSelect={(id) => {
        if (id === 'id' || id === 'en') setLocale(id);
      }}
      trigger={
        <span className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800 transition-colors">
          <Globe className="h-4 w-4" />
          <span className="uppercase">{active.short}</span>
        </span>
      }
      items={LOCALES.map((l) => ({
        id: l.value,
        label: l.label,
        icon:
          l.value === locale ? (
            <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          ) : (
            <span className="h-4 w-4" />
          ),
      }))}
    />
  );
}
