'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import { FlaskConical, RotateCcw, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useLocale } from '@/contexts/LocaleContext';
import { useOnboarding } from './OnboardingContext';
import { stepNeedsAction } from './types';

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const TOOLTIP_WIDTH = 380;
const GAP = 14;

/**
 * Overlay panduan: menyorot target nyata, memvalidasi aksi, dan menampilkan
 * status simulasi. Tidak menggunakan library tambahan agar kontrol penuh
 * atas fokus, posisi, dan perilaku saat target hilang.
 */
export default function TourOverlay() {
  const { t } = useLocale();
  const router = useRouter();
  const {
    activeTutorial,
    currentStep,
    stepIndex,
    isSimulation,
    actionSatisfied,
    nextStep,
    prevStep,
    skipStep,
    exitTutorial,
    restartTutorial,
  } = useOnboarding();
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<TargetRect | null>(null);
  const [missing, setMissing] = useState(false);
  const [viewport, setViewport] = useState({ w: 1280, h: 800 });
  const [tipHeight, setTipHeight] = useState(260);
  const tipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const measure = useCallback((selector: string): boolean => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    return true;
  }, []);

  useEffect(() => {
    if (!isSimulation || !currentStep) {
      setRect(null);
      setMissing(false);
      return;
    }
    setRect(null);
    setMissing(false);
    const selector = currentStep.target;
    if (!selector) return;
    let cancelled = false;
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el) {
      // Instan (bukan smooth) agar rect yang diukur langsung akurat.
      el.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
    const found = measure(selector);
    if (found) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (cancelled) return;
      if (measure(selector)) {
        window.clearInterval(timer);
        return;
      }
      if (Date.now() - started > 3500) {
        window.clearInterval(timer);
        setMissing(true);
      }
    }, 150);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [currentStep, isSimulation, measure, router.pathname]);

  useEffect(() => {
    if (!isSimulation) return;
    const onScroll = () => {
      if (currentStep?.target) measure(currentStep.target);
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [currentStep?.target, isSimulation, measure]);

  // Target bisa bergeser karena filter/animasi/scroll tanpa event scroll.
  // Ukur ulang berkala selama langkah aktif agar sorotan & tooltip tidak
  // tertinggal di luar viewport.
  useEffect(() => {
    if (!isSimulation || !currentStep?.target) return;
    const timer = window.setInterval(() => {
      if (currentStep.target) measure(currentStep.target);
    }, 350);
    return () => window.clearInterval(timer);
  }, [currentStep?.target, isSimulation, measure]);

  // Ukur tinggi tooltip nyata supaya posisi tidak pernah keluar layar.
  useLayoutEffect(() => {
    if (tipRef.current) setTipHeight(tipRef.current.offsetHeight);
  }, [currentStep?.id, actionSatisfied, missing, viewport.h]);

  // Fokus berpindah ke tooltip saat langkah berubah agar pembaca layar dan
  // pengguna keyboard langsung mendapat konteks. Target tetap dapat difokus
  // dengan Tab; fokus tidak dijebak.
  useEffect(() => {
    if (!isSimulation) return;
    tipRef.current?.focus({ preventScroll: true });
  }, [currentStep?.id, isSimulation]);

  useEffect(() => {
    if (!isSimulation) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        exitTutorial();
      }
      if (e.key === 'ArrowRight' && actionSatisfied) {
        e.preventDefault();
        nextStep();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevStep();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actionSatisfied, exitTutorial, isSimulation, nextStep, prevStep]);

  const position = useMemo(() => {
    if (!rect) return null;
    const below = rect.top + rect.height + GAP;
    const above = rect.top - GAP - tipHeight;
    const placeBelow = below + tipHeight + 12 < viewport.h || above < 12;
    const left = Math.min(Math.max(12, rect.left), Math.max(12, viewport.w - TOOLTIP_WIDTH - 12));
    const rawTop = placeBelow ? below : above;
    const top = Math.min(Math.max(12, rawTop), Math.max(12, viewport.h - tipHeight - 12));
    return { top, left };
  }, [rect, viewport, tipHeight]);

  if (!mounted || !isSimulation || !activeTutorial || !currentStep) return null;

  const isLast = stepIndex >= activeTutorial.steps.length - 1;
  const needsAction = stepNeedsAction(currentStep);

  const tooltip = (
    <div
      role="dialog"
      aria-modal="false"
      tabIndex={-1}
      aria-label={t(currentStep.titleKey)}
      data-testid="tour-tooltip"
      ref={tipRef}
      className="fixed z-[1101] w-[380px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-2xl border border-surface-200 bg-white p-4 shadow-2xl outline-none focus:ring-2 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-900"
      style={{ top: position?.top ?? 80, left: position?.left ?? 12, maxHeight: 'calc(100vh - 24px)' }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          <FlaskConical className="h-3 w-3" />
          {t('onboarding.simulationBadge')}
        </span>
        <button
          type="button"
          onClick={exitTutorial}
          aria-label={t('onboarding.exit')}
          className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-[11px] font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400">
        {t('onboarding.step', { current: stepIndex + 1, total: activeTutorial.steps.length })}
      </p>
      <h2 className="mt-1 text-base font-semibold text-surface-900 dark:text-surface-100">{t(currentStep.titleKey)}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-surface-600 dark:text-surface-300">{t(currentStep.bodyKey)}</p>

      {missing && (
        <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          {t('onboarding.targetMissing')}
        </p>
      )}

      {needsAction && (
        <div className="mt-3 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-xs dark:border-surface-700 dark:bg-surface-800">
          <p className="font-medium text-surface-700 dark:text-surface-200">
            {currentStep.action?.hintKey ? t(currentStep.action.hintKey) : t('onboarding.actionHint')}
          </p>
          <p className={`mt-1 ${actionSatisfied ? 'text-green-600 dark:text-green-400' : 'text-surface-500 dark:text-surface-400'}`}>
            {actionSatisfied ? t('onboarding.actionDone') : t('onboarding.actionHint')}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={restartTutorial}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          {t('onboarding.restart')}
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {stepIndex > 0 && (
            <Button size="sm" variant="secondary" onClick={prevStep}>
              {t('onboarding.back')}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={skipStep}>
            {t('onboarding.skip')}
          </Button>
          <Button size="sm" onClick={nextStep} disabled={needsAction && !actionSatisfied && !missing}>
            {isLast ? t('onboarding.done') : t('onboarding.next')}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <div aria-live="polite">
      {rect ? (
        <div
          data-testid="tour-spotlight"
          className="pointer-events-none fixed z-[1100] rounded-xl ring-2 ring-amber-400"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.62)',
          }}
        />
      ) : (
        <div className="fixed inset-0 z-[1100] bg-surface-950/60" />
      )}
      {tooltip}
    </div>,
    document.body,
  );
}
