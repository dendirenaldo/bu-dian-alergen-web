import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', width, height, style, ...props }, ref) => {
    const variants = {
      text: 'rounded-md',
      circular: 'rounded-full',
      rectangular: 'rounded-xl',
    };
    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse bg-surface-200 dark:bg-surface-700',
          variants[variant],
          className
        )}
        style={{
          width: width || '100%',
          height: height || (variant === 'text' ? '1em' : '100%'),
          ...style,
        }}
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';
export default Skeleton;
