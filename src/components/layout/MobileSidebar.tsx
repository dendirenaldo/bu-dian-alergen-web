import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ChevronLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppName, useAppInitials } from '@/contexts/AppConfigContext';
import { useLocale } from '@/contexts/LocaleContext';
import { LayoutDashboard, Package, Tags, AlertTriangle, ScanSearch, Users, FileText, Settings } from 'lucide-react';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const appName = useAppName();
  const appInitials = useAppInitials();
  const router = useRouter();
  const { t } = useLocale();
  const sidebarLinks = [
    { href: '/admin', label: t('sidebar.dashboard'), icon: LayoutDashboard },
    { href: '/admin/products', label: t('sidebar.products'), icon: Package },
    { href: '/admin/categories', label: t('sidebar.categories'), icon: Tags },
    { href: '/admin/allergens', label: t('sidebar.allergens'), icon: AlertTriangle },
    { href: '/admin/detections', label: t('sidebar.detections'), icon: ScanSearch },
    { href: '/admin/users', label: t('sidebar.users'), icon: Users },
    { href: '/admin/cms', label: t('sidebar.cms'), icon: FileText },
    { href: '/admin/settings', label: t('sidebar.settings'), icon: Settings },
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200" onClick={onClose} />
      <aside className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-surface-950 shadow-xl animate-in slide-in-from-left duration-200">
        <div className="flex h-16 items-center justify-between border-b border-surface-200 px-4 dark:border-surface-800">
          <Link href="/admin" onClick={onClose} className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">{appInitials}</div>
            <span className="truncate text-base font-bold text-surface-900 dark:text-surface-100">
              {appName}
            </span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 px-3 py-4">
          {sidebarLinks.map((link) => {
            const isActive =
              link.href === '/admin'
                ? router.pathname === '/admin'
                : router.pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                    : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800'
                )}
              >
                <link.icon className="h-5 w-5 flex-shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-surface-200 p-3 dark:border-surface-800">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
          >
            <ChevronLeft className="h-5 w-5 flex-shrink-0" />
            <span>{t('sidebar.backToSite')}</span>
          </Link>
        </div>
      </aside>
    </div>
  );
}
