'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';

export interface CalendarPickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseISO(v: string): { y: number; m: number; d: number } | null {
  if (!ISO_RE.test(v)) return null;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return { y, m, d };
}

function toISO(y: number, m: number, d: number): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${y}-${p(m)}-${p(d)}`;
}

function compareDay(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function CalendarPicker({
  value,
  onChange,
  label,
  minDate,
  maxDate,
  placeholder,
  error,
  helperText,
  disabled,
  required,
  clearable = false,
  className = '',
  id,
  name,
}: CalendarPickerProps) {
  const { t, locale } = useLocale();
  const intlLocale = locale === 'en' ? 'en-US' : 'id-ID';
  const reduce = useReducedMotion();
  const autoId = useId();
  const inputId = id ?? name ?? `calendar-${autoId}`;
  const calendarId = `${inputId}-calendar`;
  const errorId = `${inputId}-feedback`;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [draft, setDraft] = useState(value);
  const [draftError, setDraftError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);

  const todayISO = toISO(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
  const parsed = parseISO(value);
  const [viewYear, setViewYear] = useState(parsed?.y ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.m ?? new Date().getMonth() + 1);
  const [activeDay, setActiveDay] = useState(value && parsed ? value : todayISO);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setDraft(value);
    const p = parseISO(value);
    if (p) {
      setViewYear(p.y);
      setViewMonth(p.m);
      setActiveDay(value);
    }
  }, [value]);

  const inRange = (iso: string) => {
    if (minDate && compareDay(iso, minDate) < 0) return false;
    if (maxDate && compareDay(iso, maxDate) > 0) return false;
    return true;
  };

  const updatePos = () => {
    const r = buttonRef.current?.getBoundingClientRect();
    if (!r) return;
    const gap = 4;
    const padding = 8;
    const width = 288;
    const height = portalRef.current?.offsetHeight || 320;
    const left = Math.max(padding, Math.min(r.left, window.innerWidth - width - padding));
    let top = r.bottom + gap;
    if (top + height > window.innerHeight - padding) {
      top = Math.max(padding, r.top - height - gap);
    }
    setPosition({ left: Math.round(left), top: Math.round(top) });
  };

  useEffect(() => {
    if (!open) return;
    updatePos();
    const raf = requestAnimationFrame(updatePos);
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        buttonRef.current?.focus({ preventScroll: true });
      }
    };
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (containerRef.current?.contains(t) || portalRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, viewYear, viewMonth]);

  const openCalendar = () => {
    if (disabled) return;
    const r = buttonRef.current?.getBoundingClientRect();
    if (r) {
      const width = 288;
      const padding = 8;
      const left = Math.max(padding, Math.min(r.left, window.innerWidth - width - padding));
      setPosition({ left: Math.round(left), top: Math.round(r.bottom + 4) });
    }
    setDraft(value);
    setDraftError(null);
    setOpen(true);
  };

  const commit = (iso: string) => {
    if (!inRange(iso)) return;
    onChange(iso);
    setOpen(false);
    buttonRef.current?.focus({ preventScroll: true });
  };

  const commitDraft = () => {
    const v = draft.trim();
    if (!v) {
      if (clearable) {
        onChange('');
        setDraftError(null);
        setOpen(false);
      } else {
        setDraftError(t('calendar.invalid'));
      }
      return;
    }
    const p = parseISO(v);
    if (!p) {
      setDraftError(t('calendar.invalid'));
      return;
    }
    if (!inRange(v)) {
      setDraftError(t('calendar.outOfRange'));
      return;
    }
    setDraftError(null);
    commit(v);
  };

  const monthLabel = new Intl.DateTimeFormat(intlLocale, { month: 'long', year: 'numeric' }).format(
    new Date(viewYear, viewMonth - 1, 1),
  );
  const weekdayNames = (() => {
    // Senin dulu (ID) — konsisten untuk kedua locale agar grid deterministik.
    const base = new Date(2024, 0, 1); // Senin
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return new Intl.DateTimeFormat(intlLocale, { weekday: 'short' }).format(d);
    });
  })();

  const cells: Array<{ iso: string; day: number; inMonth: boolean; disabled: boolean } | null> = (() => {
    const first = new Date(viewYear, viewMonth - 1, 1);
    // getDay: 0=Min … 6=Sab; geser agar Senin=0.
    const lead = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const out: Array<{ iso: string; day: number; inMonth: boolean; disabled: boolean } | null> = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toISO(viewYear, viewMonth, d);
      out.push({ iso, day: d, inMonth: true, disabled: !inRange(iso) });
    }
    return out;
  })();

  const moveMonth = (dir: 1 | -1) => {
    let y = viewYear;
    let m = viewMonth + dir;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setViewYear(y);
    setViewMonth(m);
  };

  const moveDay = (iso: string, delta: number) => {
    const p = parseISO(iso);
    if (!p) return iso;
    const dt = new Date(p.y, p.m - 1, p.d + delta);
    return toISO(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
  };

  const handleGridKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveDay((cur) => moveDay(cur, -1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveDay((cur) => moveDay(cur, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveDay((cur) => moveDay(cur, -7));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveDay((cur) => moveDay(cur, 7));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (inRange(activeDay)) commit(activeDay);
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      moveMonth(-1);
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      moveMonth(1);
    }
  };

  const displayValue = value && parseISO(value)
    ? new Intl.DateTimeFormat(intlLocale, { day: 'numeric', month: 'long', year: 'numeric' }).format(
        new Date(parseISO(value)!.y, parseISO(value)!.m - 1, parseISO(value)!.d),
      )
    : '';

  const showClear = clearable && !!value && !disabled;

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          id={inputId}
          type="button"
          name={name}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? calendarId : undefined}
          onClick={() => (open ? setOpen(false) : openCalendar())}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg border bg-white px-3.5 py-2.5 pr-16 text-left text-sm text-surface-900 outline-none transition-all duration-200 disabled:opacity-50 dark:bg-surface-900 dark:text-surface-100',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700',
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-surface-400" aria-hidden="true" />
          <span className={cn('min-w-0 flex-1 truncate', !displayValue && 'text-surface-400 dark:text-surface-500')}>
            {displayValue || placeholder || t('calendar.placeholder')}
          </span>
        </button>
        {showClear && (
          <button
            type="button"
            aria-label={t('common.clear')}
            title={t('common.clear')}
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="absolute inset-y-0 right-9 flex items-center px-1.5 text-surface-400 transition-colors hover:text-surface-700 dark:hover:text-surface-300"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
        <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center text-surface-400">
          <ChevronDown className={cn('h-4 w-4 transition-transform duration-150', open && 'rotate-180')} aria-hidden="true" />
        </div>
      </div>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={reduce ? undefined : { opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                className="fixed z-50"
                style={{ left: position.left, top: position.top, width: 288 }}
              >
                <div
                  ref={portalRef}
                  id={calendarId}
                  role="dialog"
                  aria-label={label || t('calendar.title')}
                  onKeyDown={handleGridKeyDown}
                  className="rounded-xl border border-surface-200 bg-white p-3 shadow-lg dark:border-surface-700 dark:bg-surface-900"
                >
                  <div className="mb-1 flex gap-2">
                    <input
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        setDraftError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          commitDraft();
                        }
                        e.stopPropagation();
                      }}
                      placeholder="YYYY-MM-DD"
                      inputMode="numeric"
                      aria-label={t('calendar.typeDate')}
                      className="min-w-0 flex-1 rounded-lg border border-surface-200 bg-white px-2.5 py-1.5 font-mono text-xs outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
                    />
                    <button
                      type="button"
                      onClick={commitDraft}
                      className="shrink-0 rounded-lg bg-primary-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700"
                    >
                      OK
                    </button>
                  </div>
                  {draftError && (
                    <p role="alert" className="mb-1 text-xs text-red-600 dark:text-red-400">
                      {draftError}
                    </p>
                  )}
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => moveMonth(-1)}
                      aria-label={t('calendar.prevMonth')}
                      className="rounded-lg p-1.5 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span className="text-sm font-semibold text-surface-900 dark:text-surface-100" aria-live="polite">
                      {monthLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => moveMonth(1)}
                      aria-label={t('calendar.nextMonth')}
                      className="rounded-lg p-1.5 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5" role="grid" aria-label={monthLabel}>
                    {weekdayNames.map((w, i) => (
                      <span key={i} className="py-1 text-center text-[11px] font-medium uppercase text-surface-400 dark:text-surface-500">
                        {w}
                      </span>
                    ))}
                    {cells.map((c, i) =>
                      !c ? (
                        <span key={`e-${i}`} />
                      ) : (
                        <button
                          key={c.iso}
                          type="button"
                          role="gridcell"
                          aria-selected={c.iso === value}
                          aria-label={c.iso}
                          tabIndex={c.iso === activeDay ? 0 : -1}
                          disabled={c.disabled}
                          onClick={() => commit(c.iso)}
                          onFocus={() => setActiveDay(c.iso)}
                          onMouseEnter={() => setActiveDay(c.iso)}
                          className={cn(
                            'flex h-8 items-center justify-center rounded-lg text-sm transition-colors',
                            c.iso === value
                              ? 'bg-primary-600 font-semibold text-white hover:bg-primary-700'
                              : c.iso === todayISO
                                ? 'font-semibold text-primary-600 ring-1 ring-inset ring-primary-500 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20'
                                : 'text-surface-700 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800',
                            c.disabled && 'opacity-30 cursor-not-allowed hover:bg-transparent',
                          )}
                        >
                          {c.day}
                        </button>
                      ),
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-surface-200 pt-2 dark:border-surface-700">
                    <button
                      type="button"
                      onClick={() => {
                        const t2 = todayISO;
                        if (inRange(t2)) commit(t2);
                      }}
                      className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400"
                    >
                      {t('calendar.today')}
                    </button>
                    {clearable && value && (
                      <button
                        type="button"
                        onClick={() => {
                          onChange('');
                          setOpen(false);
                        }}
                        className="text-xs font-medium text-surface-500 transition-colors hover:text-red-600 dark:text-surface-400"
                      >
                        {t('common.clear')}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
      {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-surface-500 dark:text-surface-400">{helperText}</p>
      )}
    </div>
  );
}

export const DatePicker = CalendarPicker;
export type DatePickerProps = CalendarPickerProps;
