import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  title?: string;
  hidden?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  onSelect: (id: string) => void;
  align?: 'left' | 'right';
  className?: string;
}

/** Hitung posisi panel fixed dari rect trigger: clamp horizontal + flip ke atas bila sempit. */
function placeMenu(r: DOMRect, menuWidth: number, menuHeight: number, align: 'left' | 'right') {
  const gap = 6;
  const padding = 8;
  let left = align === 'right' ? r.right - menuWidth : r.left;
  left = Math.max(padding, Math.min(left, window.innerWidth - menuWidth - padding));
  let top = r.bottom + gap;
  if (top + menuHeight > window.innerHeight - padding) {
    top = Math.max(padding, r.top - menuHeight - gap);
  }
  return { left: Math.round(left), top: Math.round(top) };
}

const FOCUSABLE_MENU_ITEM = 'button[role="menuitem"]:not([disabled])';

export default function Dropdown({
  trigger,
  items,
  onSelect,
  align = 'left',
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState({ left: 0, top: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePos = useCallback(() => {
    const r = anchorRef.current?.getBoundingClientRect();
    if (!r) return;
    const w = menuRef.current?.offsetWidth ?? 224;
    const h = menuRef.current?.offsetHeight ?? 0;
    setMenuStyle(placeMenu(r, w, h, align));
  }, [align]);

  useEffect(() => {
    if (!isOpen) return;
    updatePos();
    const raf = requestAnimationFrame(updatePos);
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [isOpen, updatePos]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setIsOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Konsumsi agar Dialog induk tidak ikut tertutup.
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const openMenu = useCallback(() => {
    // Ukur sinkron SEBELUM open agar portal tidak first-paint di (0,0).
    const r = anchorRef.current?.getBoundingClientRect();
    if (r) setMenuStyle(placeMenu(r, 224, menuRef.current?.offsetHeight || 0, align));
    setIsOpen(true);
    requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLButtonElement>(FOCUSABLE_MENU_ITEM)?.focus({ preventScroll: true });
    });
  }, [align]);

  const handleMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>(FOCUSABLE_MENU_ITEM) ?? []);
    if (buttons.length === 0) return;
    const idx = buttons.findIndex((b) => b === document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      buttons[(idx + 1 + buttons.length) % buttons.length].focus({ preventScroll: true });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      buttons[(idx - 1 + buttons.length) % buttons.length].focus({ preventScroll: true });
    } else if (e.key === 'Home') {
      e.preventDefault();
      buttons[0].focus({ preventScroll: true });
    } else if (e.key === 'End') {
      e.preventDefault();
      buttons[buttons.length - 1].focus({ preventScroll: true });
    }
  }, []);

  const visibleItems = items.filter((item) => !item.hidden);

  return (
    <div ref={anchorRef} className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="cursor-pointer"
      >
        {trigger}
      </button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={reduce ? undefined : { opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                className="fixed z-50 origin-top"
                style={{ left: menuStyle.left, top: menuStyle.top }}
              >
                <div
                  ref={menuRef}
                  role="menu"
                  onKeyDown={handleMenuKeyDown}
                  className="w-56 max-h-72 overflow-y-auto rounded-xl border border-surface-200 bg-white py-1.5 shadow-lg dark:border-surface-700 dark:bg-surface-900"
                >
                  {visibleItems.map((item) =>
                    item.divider ? (
                      <div key={item.id} className="my-1.5 border-t border-surface-200 dark:border-surface-700" />
                    ) : (
                      <button
                        key={item.id}
                        role="menuitem"
                        title={item.title}
                        onClick={() => {
                          if (item.disabled) return;
                          onSelect(item.id);
                          setIsOpen(false);
                        }}
                        disabled={item.disabled}
                        className={cn(
                          'flex w-full items-center gap-2 px-3.5 py-2 text-sm transition-colors text-left',
                          item.danger
                            ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                            : 'text-surface-700 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800',
                          item.disabled && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {item.icon && <span className="shrink-0">{item.icon}</span>}
                        {item.label}
                      </button>
                    )
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

export { Dropdown };
