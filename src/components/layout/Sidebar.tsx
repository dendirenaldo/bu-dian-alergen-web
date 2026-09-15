import { ReactNode, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ChevronLeft, LayoutDashboard, Package, Tags, AlertTriangle, ScanSearch, Users, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppName, useAppInitials } from '@/contexts/AppConfigContext';
import { useLocale } from '@/contexts/LocaleContext';

interface SidebarProps {
  isCollapsed?: boolean;
  onCollapse?: () => void;
}

export default function Sidebar({ isCollapsed = false, onCollapse }: SidebarProps) {
  const appName = useAppName();
  const appInitials = useAppInitials();
  const router = useRouter();
  const { t } = useLocale();

  const links = [
    { href: '/admin', label: t('sidebar.dashboard'), icon: LayoutDashboard },
    { href: '/admin/products', label: t('sidebar.products'), icon: Package },
    { href: '/admin/categories', label: t('sidebar.categories'), icon: Tags },
    { href: '/admin/allergens', label: t('sidebar.allergens'), icon: AlertTriangle },
    { href: '/admin/detections', label: t('sidebar.detections'), icon: ScanSearch },
    { href: '/admin/users', label: t('sidebar.users'), icon: Users },
    { href: '/admin/cms', label: t('sidebar.cms'), icon: FileText },
    { href: '/admin/settings', label: t('sidebar.settings'), icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen border-r border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-950 transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-surface-200 px-4 dark:border-surface-800">
        {!isCollapsed && (
          <Link href="/admin" className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">{appInitials}</div>
            <span className="truncate text-base font-bold text-surface-900 dark:text-surface-100">
              {appName}
            </span>
          </Link>
        )}
        {onCollapse && (
          <button
            onClick={onCollapse}
            aria-label={isCollapsed ? t('a11y.expandSidebar') : t('a11y.collapseSidebar')}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <ChevronLeft
              className={cn('h-5 w-5 transition-transform', isCollapsed && 'rotate-180')}
            />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => {
          const isActive =
            link.href === '/admin'
              ? router.pathname === '/admin'
              : router.pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? link.label : undefined}
            >
              <link.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-surface-200 p-3 dark:border-surface-800">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800 transition-colors',
            isCollapsed && 'justify-center'
          )}
        >
          <ChevronLeft className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>{t('sidebar.backToSite')}</span>}
        </Link>
      </div>
    </aside>
  );
}
