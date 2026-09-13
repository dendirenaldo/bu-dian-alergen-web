'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, X, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/shared/ThemeToggle';
import LocaleToggle from '@/components/shared/LocaleToggle';
import { useAppName, useAppInitials } from '@/contexts/AppConfigContext';

export default function Navbar() {
  const appName = useAppName();
  const appInitials = useAppInitials();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/detect', label: t('nav.detection') },
    { href: '/history', label: t('nav.history') },
    { href: '/about', label: t('nav.about') },
    { href: '/contact', label: t('nav.contact') },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-surface-200 bg-white/80 backdrop-blur-lg dark:border-surface-800 dark:bg-surface-950/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">{appInitials}</div>
          <span className="text-lg font-bold text-surface-900 dark:text-surface-100">
            {appName}
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                router.pathname === link.href
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <LocaleToggle />
          <ThemeToggle />
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href={user?.role === 'admin' ? '/admin' : '/detect'}
                className="text-sm font-medium text-surface-700 hover:text-primary-600 dark:text-surface-300 dark:hover:text-primary-400"
              >
                {t('nav.dashboard')}
              </Link>
              <button
                onClick={logout}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800 transition-colors"
              >
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-surface-700 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                {t('nav.login')}
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-lg p-2 text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800 md:hidden"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {isMobileMenuOpen && (
        <div className="border-t border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-950 md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  router.pathname === link.href
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                    : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-surface-200 px-4 py-3 dark:border-surface-800">
            {isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <Link
                  href={user?.role === 'admin' ? '/admin' : '/detect'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-surface-700 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800"
                >
                  {t('nav.dashboard')}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-surface-700 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg bg-primary-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-primary-700"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
