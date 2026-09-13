import { useRouter } from 'next/router';
import { Menu, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import ThemeToggle from '@/components/shared/ThemeToggle';
import LocaleToggle from '@/components/shared/LocaleToggle';
import Dropdown from '@/components/ui/Dropdown';
import Avatar from '@/components/ui/Avatar';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const { user, logout } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const roleLabel = user?.role === 'admin' ? t('topbar.roleAdmin') : t('topbar.roleUser');

  const handleSelect = (id: string) => {
    if (id === 'settings') {
      router.push('/admin/settings');
    } else if (id === 'logout') {
      logout();
      router.push('/login');
    }
  };

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
        <Dropdown
          align="right"
          onSelect={handleSelect}
          trigger={
            <span className="flex items-center gap-3 rounded-lg p-1 hover:bg-surface-100 dark:hover:bg-surface-800">
              <Avatar src={user?.avatarUrl} name={user?.name || 'User'} size="sm" />
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium text-surface-900 dark:text-surface-100">
                  {user?.name || 'User'}
                </span>
                <span className="block text-xs text-surface-500 dark:text-surface-400">
                  {roleLabel}
                </span>
              </span>
            </span>
          }
          items={[
            {
              id: 'header',
              label: `${user?.name || 'User'} • ${roleLabel}`,
              disabled: true,
            },
            { id: 'settings', label: t('topbar.settings'), icon: <Settings className="h-4 w-4" /> },
            { id: 'logout', label: t('topbar.logout'), icon: <LogOut className="h-4 w-4" />, danger: true },
          ]}
        />
      </div>
    </header>
  );
}
