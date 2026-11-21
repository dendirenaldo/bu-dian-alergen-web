'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import type { DatasetExportRecord, DatasetItem } from '@/types';
import { createSimDatasetRecords } from './simulation-data';
import { getTutorial, tutorialsForRole } from './tutorials';
import { setSimulationActive } from './runtime';
import { stepNeedsAction, subscribeTourAction, type Tutorial, type TourStep } from './types';

const PROGRESS_KEY = 'onboarding_progress_v1';

interface Progress {
  completed: Record<string, string>;
  lastStep: Record<string, number>;
}

function readProgress(): Progress {
  if (typeof window === 'undefined') return { completed: {}, lastStep: {} };
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { completed: {}, lastStep: {} };
    const parsed = JSON.parse(raw);
    return {
      completed: parsed?.completed && typeof parsed.completed === 'object' ? parsed.completed : {},
      lastStep: parsed?.lastStep && typeof parsed.lastStep === 'object' ? parsed.lastStep : {},
    };
  } catch {
    return { completed: {}, lastStep: {} };
  }
}

function writeProgress(p: Progress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    /* penyimpanan tidak tersedia — sesi tetap berjalan di memori */
  }
}

interface OnboardingContextValue {
  tutorials: Tutorial[];
  activeTutorial: Tutorial | null;
  currentStep: TourStep | null;
  stepIndex: number;
  isSimulation: boolean;
  actionSatisfied: boolean;
  lastAction: string | null;
  simRecords: DatasetItem[];
  simHistory: DatasetExportRecord[];
  completed: Record<string, string>;
  startTutorial: (id: string) => void;
  restartTutorial: () => void;
  exitTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipStep: () => void;
  resetSimulation: () => void;
  resetProgress: () => void;
  setSimRecords: (updater: DatasetItem[] | ((prev: DatasetItem[]) => DatasetItem[])) => void;
  setSimHistory: (updater: DatasetExportRecord[] | ((prev: DatasetExportRecord[]) => DatasetExportRecord[])) => void;
  notifyAction: (name: string) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const role = user?.role === 'admin' ? 'admin' : 'user';
  // Jangan tampilkan tutorial sebelum peran diketahui: mencegah admin
  // melihat daftar tutorial pengguna biasa lalu berkedip saat profil termuat.
  const tutorials = useMemo(
    () => (authLoading ? [] : tutorialsForRole(role)),
    [authLoading, role],
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [actionSatisfied, setActionSatisfied] = useState(true);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [simRecords, setSimRecordsState] = useState<DatasetItem[]>(() => createSimDatasetRecords());
  const [simHistory, setSimHistoryState] = useState<DatasetExportRecord[]>([]);
  const [progress, setProgress] = useState<Progress>(() => ({ completed: {}, lastStep: {} }));

  const activeTutorial = useMemo(() => getTutorial(activeId), [activeId]);
  const currentStep = activeTutorial?.steps[stepIndex] ?? null;
  const isSimulation = !!activeTutorial;

  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const stepRef = useRef<TourStep | null>(null);
  stepRef.current = currentStep;

  useEffect(() => {
    setProgress(readProgress());
  }, []);

  useEffect(() => {
    // Flag global: transport API menolak mutasi selama simulasi.
    setSimulationActive(isSimulation);
    return () => {
      setSimulationActive(false);
    };
  }, [isSimulation]);

  const persist = useCallback((next: Progress) => {
    setProgress(next);
    writeProgress(next);
  }, []);

  const resetSimulation = useCallback(() => {
    setSimRecordsState(createSimDatasetRecords());
    setSimHistoryState([]);
    setActionSatisfied(true);
    setLastAction(null);
  }, []);

  const startTutorial = useCallback(
    (id: string) => {
      const tutorial = getTutorial(id);
      if (!tutorial) return;
      if (!tutorial.roles.includes(role)) return;
      resetSimulation();
      setActiveId(id);
      setStepIndex(0);
      setActionSatisfied(!stepNeedsAction(tutorial.steps[0]));
      setLastAction(null);
      if (typeof window !== 'undefined' && router.pathname !== tutorial.route) {
        void router.push(tutorial.route);
      }
    },
    [resetSimulation, role, router],
  );

  const exitTutorial = useCallback(() => {
    const id = activeIdRef.current;
    if (id) {
      persist({
        ...progress,
        lastStep: { ...progress.lastStep, [id]: stepIndex },
      });
    }
    setActiveId(null);
    setStepIndex(0);
    setActionSatisfied(true);
    setLastAction(null);
    setSimulationActive(false);
  }, [persist, progress, stepIndex]);

  const completeTutorial = useCallback(() => {
    const id = activeIdRef.current;
    if (!id) return;
    persist({
      completed: { ...progress.completed, [id]: new Date().toISOString() },
      lastStep: { ...progress.lastStep, [id]: 0 },
    });
    setActiveId(null);
    setStepIndex(0);
    setActionSatisfied(true);
    setLastAction(null);
    setSimulationActive(false);
  }, [persist, progress]);

  const nextStep = useCallback(() => {
    const tutorial = getTutorial(activeIdRef.current);
    if (!tutorial) return;
    if (stepIndex >= tutorial.steps.length - 1) {
      completeTutorial();
      return;
    }
    const next = stepIndex + 1;
    setStepIndex(next);
    setActionSatisfied(!stepNeedsAction(tutorial.steps[next]));
    setLastAction(null);
  }, [completeTutorial, stepIndex]);

  const prevStep = useCallback(() => {
    setStepIndex((i) => {
      const next = Math.max(0, i - 1);
      const tutorial = getTutorial(activeIdRef.current);
      setActionSatisfied(!stepNeedsAction(tutorial?.steps[next]));
      return next;
    });
    setLastAction(null);
  }, []);

  const skipStep = useCallback(() => {
    const tutorial = getTutorial(activeIdRef.current);
    if (!tutorial) return;
    if (stepIndex >= tutorial.steps.length - 1) {
      completeTutorial();
      return;
    }
    const next = stepIndex + 1;
    setStepIndex(next);
    setActionSatisfied(!stepNeedsAction(tutorial.steps[next]));
    setLastAction(null);
  }, [completeTutorial, stepIndex]);

  const restartTutorial = useCallback(() => {
    const id = activeIdRef.current;
    if (!id) return;
    startTutorial(id);
  }, [startTutorial]);

  const resetProgress = useCallback(() => {
    persist({ completed: {}, lastStep: {} });
    resetSimulation();
  }, [persist, resetSimulation]);

  const setSimRecords = useCallback(
    (updater: DatasetItem[] | ((prev: DatasetItem[]) => DatasetItem[])) => {
      setSimRecordsState((prev) => (typeof updater === 'function' ? updater(prev) : updater));
    },
    [],
  );

  const setSimHistory = useCallback(
    (updater: DatasetExportRecord[] | ((prev: DatasetExportRecord[]) => DatasetExportRecord[])) => {
      setSimHistoryState((prev) => (typeof updater === 'function' ? updater(prev) : updater));
    },
    [],
  );

  const notifyAction = useCallback((name: string) => {
    setLastAction(name);
    const step = stepRef.current;
    if (!step?.action) return;
    if (step.action.event === name) setActionSatisfied(true);
  }, []);

  useEffect(() => subscribeTourAction((detail) => notifyAction(detail.name)), [notifyAction]);

  // Aksi navigasi dianggap selesai saat rute tujuan tercapai.
  useEffect(() => {
    const step = stepRef.current;
    if (!step?.action) return;
    if (step.action.type === 'navigate' && step.action.route === router.pathname) {
      setActionSatisfied(true);
    }
  }, [router.pathname]);

  const value: OnboardingContextValue = {
    tutorials,
    activeTutorial,
    currentStep,
    stepIndex,
    isSimulation,
    actionSatisfied,
    lastAction,
    simRecords,
    simHistory,
    completed: progress.completed,
    startTutorial,
    restartTutorial,
    exitTutorial,
    nextStep,
    prevStep,
    skipStep,
    resetSimulation,
    resetProgress,
    setSimRecords,
    setSimHistory,
    notifyAction,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}

/** Alias semantik untuk layanan data yang sadar simulasi. */
export function useIsSimulation(): boolean {
  return useOnboarding().isSimulation;
}
