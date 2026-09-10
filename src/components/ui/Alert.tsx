import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  onClose?: () => void;
}

const icons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, onClose, children, ...props }, ref) => {
    const variants = {
      success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
      warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300',
      error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
      info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
    };
    const iconVariants = {
      success: 'text-green-500 dark:text-green-400',
      warning: 'text-amber-500 dark:text-amber-400',
      error: 'text-red-500 dark:text-red-400',
      info: 'text-blue-500 dark:text-blue-400',
    };
    const Icon = icons[variant];
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-start gap-3 rounded-xl border p-4',
          variants[variant],
          className
        )}
        role="alert"
        {...props}
      >
        <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', iconVariants[variant])} />
        <div className="flex-1">
          {title && (
            <h4 className="text-sm font-semibold">{title}</h4>
          )}
          {children && (
            <div className={cn('text-sm', title && 'mt-1')}>{children}</div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className={cn(
              'shrink-0 rounded-lg p-1 transition-colors',
              'hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = 'Alert';
export default Alert;
