'use client';

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';

export interface MenuSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Posisi panel fixed dari anchor: clamp horizontal + flip ke atas bila sempit. */
function placeMenu(r: DOMRect, menuHeight: number) {
  const gap = 4;
  const padding = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(r.width, Math.max(0, vw - padding * 2));
  const maxLeft = Math.max(padding, vw - width - padding);
  const left = Math.min(Math.max(r.left, padding), maxLeft);
  let top = r.bottom + gap;
  if (top + menuHeight > vh - padding) {
    top = Math.max(padding, r.top - menuHeight - gap);
  }
  return { left: Math.round(left), top: Math.round(top), width: Math.round(width) };
}

interface MenuSelectProps {
  label?: string;
  options?: ReadonlyArray<MenuSelectOption>;
  value: unknown;
  onChange: (...args: any[]) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  className?: string;
  required?: boolean;
  name?: string;
  id?: string;
  leftIcon?: ReactNode;
  renderOption?: (option: MenuSelectOption) => ReactNode;
  'aria-label'?: string;
}

/**
 * Select custom pengganti <select> native: tombol combobox + popup listbox
 * (portal, flip/clamp, keyboard, focus-restore) dengan token design system.
 * Model onChange: onChange({ target: { value } }) — drop-in untuk Select lama.
 */
export default function MenuSelect({
  label,
  options: optionsProp = [],
  value,
  onChange,
  placeholder,
  error,
  helperText,
  disabled,
  searchable = false,
  clearable = false,
  onClear,
  className = '',
  required = false,
  name,
  id,
  leftIcon,
  renderOption,
  'aria-label': ariaLabel,
}: MenuSelectProps) {
  const { t } = useLocale();
  const placeholderText = placeholder ?? t('select.placeholder');
  const hasError = !!error;
  const autoId = useId();
  const buttonId = id || name || `menu-select-btn-${autoId}`;
  const listboxId = `menu-select-list-${autoId}`;
  const labelId = label ? `menu-select-label-${autoId}` : undefined;
  const errorId = error ? `menu-select-err-${autoId}` : undefined;
  const helperId = !error && helperText ? `menu-select-help-${autoId}` : undefined;
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState({ left: 0, top: 0, width: 0 });
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const triggerBoxRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const reduce = useReducedMotion();

  const selected = optionsProp.find((o) => o.value === value);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = useMemo(
    () => optionsProp.filter((o) => o.label.toLowerCase().includes(keyword.toLowerCase())),
    [optionsProp, keyword],
  );

  const enabledIndexes = useMemo(
    () => filtered.reduce<number[]>((acc, o, i) => (o.disabled ? acc : [...acc, i]), []),
    [filtered],
  );

  const updatePos = useCallback(() => {
    const anchor = triggerBoxRef.current;
    const r = anchor?.getBoundingClientRect();
    if (!r) return;
    setRect(r);
    const menuHeight = menuRef.current?.offsetHeight || 264;
    setMenuStyle(placeMenu(r, menuHeight));
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    const raf = requestAnimationFrame(updatePos);
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [open, updatePos, filtered]);

  useEffect(() => {
    if (!open) return;
    const listener = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (triggerBoxRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    const currentIdx = filtered.findIndex((o) => o.value === value);
    setHighlightedIndex(currentIdx >= 0 ? currentIdx : enabledIndexes[0] ?? -1);
    if (searchable) requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const openMenu = useCallback(() => {
    if (disabled) return;
    const anchor = triggerBoxRef.current;
    const r = anchor?.getBoundingClientRect();
    if (r) {
      setRect(r);
      setMenuStyle(placeMenu(r, 264));
    }
    setKeyword('');
    setOpen(true);
  }, [disabled]);

  const restoreTriggerFocus = useCallback(() => {
    requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  }, []);

  const selectOption = useCallback(
    (opt: MenuSelectOption) => {
      if (opt.disabled) return;
      onChange({ target: { value: opt.value } });
      setOpen(false);
      restoreTriggerFocus();
    },
    [onChange, restoreTriggerFocus],
  );

  const clearValue = useCallback(() => {
    setKeyword('');
    if (onClear) onClear();
    else onChange({ target: { value: '' } });
    restoreTriggerFocus();
  }, [onClear, onChange, restoreTriggerFocus]);

  const moveHighlight = useCallback(
    (dir: 1 | -1) => {
      if (filtered.length === 0 || enabledIndexes.length === 0) return;
      setHighlightedIndex((current) => {
        let pos = enabledIndexes.indexOf(current);
        if (pos === -1) pos = dir === 1 ? -1 : enabledIndexes.length;
        const next = pos + dir;
        if (next < 0 || next >= enabledIndexes.length) return current;
        return enabledIndexes[next];
      });
    },
    [filtered.length, enabledIndexes],
  );

  const handleTriggerKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!open) openMenu();
        else moveHighlight(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!open) openMenu();
        else moveHighlight(-1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!open) openMenu();
        else if (highlightedIndex >= 0) selectOption(filtered[highlightedIndex]);
      } else if (e.key === 'Escape') {
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
          restoreTriggerFocus();
        }
      }
    },
    [disabled, open, openMenu, moveHighlight, highlightedIndex, selectOption, filtered, restoreTriggerFocus],
  );

  const handleMenuKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveHighlight(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveHighlight(-1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        if (enabledIndexes.length) setHighlightedIndex(enabledIndexes[0]);
      } else if (e.key === 'End') {
        e.preventDefault();
        if (enabledIndexes.length) setHighlightedIndex(enabledIndexes[enabledIndexes.length - 1]);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0) selectOption(filtered[highlightedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        restoreTriggerFocus();
      } else if (e.key === 'Tab') {
        setOpen(false);
      }
    },
    [moveHighlight, enabledIndexes, highlightedIndex, selectOption, filtered, restoreTriggerFocus],
  );

  const activeOptionId = highlightedIndex >= 0 ? `${listboxId}-opt-${highlightedIndex}` : undefined;
  const hasValue = value !== undefined && value !== null && value !== '';
  const showClear = clearable && hasValue && !disabled && !required;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <span
          id={labelId}
          className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5"
        >
          <label htmlFor={buttonId}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </span>
      )}
      <div
        ref={triggerBoxRef}
        className={cn(
          'relative flex rounded-lg border overflow-hidden bg-white transition-all duration-200 dark:bg-surface-900',
          hasError
            ? 'border-red-300 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20'
            : 'border-surface-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 dark:border-surface-700',
        )}
      >
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-surface-400 shrink-0">
            {leftIcon}
          </span>
        )}
        <button
          ref={triggerRef}
          id={buttonId}
          type="button"
          name={name}
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          aria-labelledby={label ? labelId : undefined}
          aria-label={label ? undefined : ariaLabel}
          aria-invalid={hasError || undefined}
          aria-required={required || undefined}
          aria-describedby={[helperId, errorId].filter(Boolean).join(' ') || undefined}
          onClick={() => (open ? setOpen(false) : openMenu())}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2 bg-transparent px-3.5 py-2.5 pr-10 text-left text-sm text-surface-900 outline-none disabled:opacity-50 dark:text-surface-100',
            leftIcon ? 'pl-11' : '',
          )}
        >
          <span className={cn('min-w-0 flex-1 truncate', selected ? '' : 'text-surface-400 dark:text-surface-500')} title={selected?.label ?? placeholderText}>
            {selected?.label ?? placeholderText}
          </span>
        </button>
        {showClear ? (
          <button
            type="button"
            aria-label={t('common.clear')}
            title={t('common.clear')}
            onClick={(e) => {
              e.stopPropagation();
              clearValue();
            }}
            className="absolute inset-y-0 right-8 flex items-center px-1.5 text-surface-400 transition-colors hover:text-surface-700 dark:hover:text-surface-300"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
        <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center text-surface-400">
          <ChevronDown className={cn('h-4 w-4 transition-transform duration-150', open && 'rotate-180')} aria-hidden="true" />
        </div>
      </div>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && rect && (
              <motion.div
                initial={reduce ? undefined : { opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                className="fixed z-50"
                style={{ left: menuStyle.left, top: menuStyle.top, width: menuStyle.width }}
              >
                <div
                  ref={menuRef}
                  id={listboxId}
                  role="listbox"
                  aria-labelledby={labelId}
                  aria-label={ariaLabel}
                  aria-activedescendant={activeOptionId}
                  onKeyDown={handleMenuKeyDown}
                  className="max-h-64 overflow-auto rounded-xl border border-surface-200 bg-white py-1 shadow-lg dark:border-surface-700 dark:bg-surface-900"
                >
                  {searchable && (
                    <div className="px-2 pt-2 pb-1 sticky top-0 bg-white dark:bg-surface-900">
                      <input
                        ref={searchRef}
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder={t('common.search')}
                        aria-label={t('common.search')}
                        className="w-full rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
                      />
                    </div>
                  )}
                  {filtered.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-surface-500 dark:text-surface-400">{t('common.noOptions')}</p>
                  ) : null}
                  {filtered.map((opt, i) => (
                    <button
                      key={opt.value}
                      type="button"
                      id={`${listboxId}-opt-${i}`}
                      role="option"
                      tabIndex={-1}
                      aria-selected={opt.value === value}
                      disabled={opt.disabled}
                      data-option-index={i}
                      onMouseEnter={() => {
                        if (!opt.disabled) setHighlightedIndex(i);
                      }}
                      onClick={() => selectOption(opt)}
                      className={cn(
                        'flex min-h-10 w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-100 disabled:opacity-50 dark:hover:bg-surface-800',
                        i === highlightedIndex ? 'bg-primary-50 font-medium text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'text-surface-700 dark:text-surface-300',
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate" title={opt.label}>
                        {renderOption ? renderOption(opt) : opt.label}
                      </span>
                      {opt.value === value ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
      {error && <p id={errorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {helperText && !error && (
        <p id={helperId} className="mt-1.5 text-sm text-surface-500 dark:text-surface-400">{helperText}</p>
      )}
    </div>
  );
}
