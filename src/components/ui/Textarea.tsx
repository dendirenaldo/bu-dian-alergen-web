import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-surface-900',
            'placeholder:text-surface-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'transition-colors resize-y',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
              : 'border-surface-200 focus:border-primary-500 focus:ring-primary-500/20 dark:border-surface-700',
            'dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500',
            'dark:focus:border-primary-400',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-surface-500 dark:text-surface-400">{helperText}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
export default Textarea;
