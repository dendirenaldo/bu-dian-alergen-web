import { APP_NAME } from '@/lib/constants';

export default function Footer() {
  return (
    <footer className="border-t border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-600 text-white font-bold text-xs">
              BD
            </div>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
              {APP_NAME}
            </span>
          </div>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
