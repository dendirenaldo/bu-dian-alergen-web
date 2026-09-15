'use client';

import { HTMLAttributes, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Label aksesibilitas bila judul dirender manual oleh children. */
  ariaLabel?: string;
}

// Stack id modal terbuka (khusus modal bersarang, mis. dialog konfirmasi
// di dalam form): hanya modal teratas (terakhir dibuka) yang menangani
// Escape, dan body overflow hanya dipulihkan saat tumpukan kosong.
const openModalStack: number[] = [];
let modalSeq = 0;

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  className,
  ariaLabel,
}: ModalProps) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const wasOpenRef = useRef(false);
  const modalIdRef = useRef(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const myId = ++modalSeq;
    modalIdRef.current = myId;
    openModalStack.push(myId);
    const handleEscape = (e: KeyboardEvent) => {
      // Hanya modal teratas yang merespons Escape (hindari dobel-tutup).
      if (e.key === 'Escape' && openModalStack[openModalStack.length - 1] === myId) {
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', handleEscape);
    if (openModalStack.length === 1) document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      const idx = openModalStack.indexOf(myId);
      if (idx !== -1) openModalStack.splice(idx, 1);
      if (openModalStack.length === 0) document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fokus awal HANYA saat transisi tertutup -> terbuka, ke input pertama
  // (bukan tombol close). onClose sengaja tidak masuk deps agar keystroke
  // di form tidak memicu efek ini ulang.
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (!isOpen || wasOpen) {
      if (!isOpen && previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
      return;
    }
    previousFocusRef.current = document.activeElement as HTMLElement;
    const target =
      modalRef.current?.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [data-autofocus]'
      ) ??
      modalRef.current?.querySelector<HTMLElement>(
        'button:not([aria-label="Close"]), [href], [tabindex]:not([tabindex="-1"])'
      );
    target?.focus();
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusableElements?.length) return;
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!isOpen) return null;
  // Portal ke body: backdrop fixed tidak terjepit transform ancestor
  // (mis. animasi scale pada dialog induk) dan z-index konsisten.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200',
          visible ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      <div
        ref={modalRef}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative z-50 w-full rounded-2xl bg-white p-6 shadow-xl',
          'dark:bg-surface-900',
          'mx-4',
          'transition-all duration-200',
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2',
          sizes[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-label={!title ? ariaLabel : undefined}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h2 id="modal-title" className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:text-surface-300 dark:hover:bg-surface-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
