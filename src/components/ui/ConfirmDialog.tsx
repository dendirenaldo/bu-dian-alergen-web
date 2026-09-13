import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { useLocale } from '@/contexts/LocaleContext';

interface ConfirmDialogProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const { t } = useLocale();
  const confirmText = confirmLabel ?? t('common.confirm');
  const cancelText = cancelLabel ?? t('common.cancel');
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            'mb-4 flex h-12 w-12 items-center justify-center rounded-full',
            variant === 'danger'
              ? 'bg-red-100 dark:bg-red-900/30'
              : 'bg-primary-100 dark:bg-primary-900/30'
          )}
        >
          <AlertTriangle
            className={cn(
              'h-6 w-6',
              variant === 'danger'
                ? 'text-red-600 dark:text-red-400'
                : 'text-primary-600 dark:text-primary-400'
            )}
          />
        </div>
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            {description}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
