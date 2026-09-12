import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, type, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const resolvedType = isPassword && showPassword ? 'text' : type;

    const passwordToggle = isPassword ? (
      <button
        type="button"
        tabIndex={-1}
        className="pointer-events-auto text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
        onClick={() => setShowPassword((prev) => !prev)}
        aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    ) : null;

    const effectiveRightIcon = isPassword ? passwordToggle : rightIcon;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            className={cn(
              'block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-surface-900',
              'placeholder:text-surface-400',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'transition-colors',
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-surface-200 focus:border-primary-500 focus:ring-primary-500/20 dark:border-surface-700',
              'dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500',
              'dark:focus:border-primary-400',
              leftIcon ? 'pl-10' : '',
              effectiveRightIcon ? 'pr-10' : '',
              className
            )}
            {...props}
          />
          {effectiveRightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-400">
              {effectiveRightIcon}
            </div>
          )}
        </div>
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
Input.displayName = 'Input';
export default Input;
