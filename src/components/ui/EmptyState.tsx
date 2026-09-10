import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center py-16 px-4 text-center',
          className
        )}
        {...props}
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
          {icon || <Inbox className="h-8 w-8 text-surface-400" />}
        </div>
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
          {title}
        </h3>
        {description && (
          <p className="mt-2 max-w-sm text-sm text-surface-500 dark:text-surface-400">
            {description}
          </p>
        )}
        {action && (
          <Button onClick={action.onClick} className="mt-6">
            {action.label}
          </Button>
        )}
      </div>
    );
  }
);
EmptyState.displayName = 'EmptyState';
export default EmptyState;
