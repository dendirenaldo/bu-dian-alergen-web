import { Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import ThemeToggle from '@/components/shared/ThemeToggle';
import LocaleToggle from '@/components/shared/LocaleToggle';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const { user } = useAuth();
  const { t } = useLocale();

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-200 bg-white px-4 dark:border-surface-800 dark:bg-surface-950 lg:px-6">
      <button
        onClick={onToggleSidebar}
        aria-label={t('topbar.toggleSidebar')}
        className="rounded-lg p-2 text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <LocaleToggle />
        <ThemeToggle />
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 text-sm font-medium">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {user?.role === 'admin' ? t('topbar.roleAdmin') : t('topbar.roleUser')}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
