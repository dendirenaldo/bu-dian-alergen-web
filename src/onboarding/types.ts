export type TourActionType = 'navigate' | 'click' | 'input' | 'select' | 'submit' | 'none';

export interface TourStepAction {
  type: TourActionType;
  /** Nama event yang dipancarkan UI saat aksi dilakukan. */
  event?: string;
  /** Rute yang harus dicapai (untuk aksi navigate). */
  route?: string;
  hintKey?: string;
}

export interface TourStep {
  id: string;
  titleKey: string;
  bodyKey: string;
  /** Selector CSS target, mis. `[data-tour="dataset-search"]`. */
  target?: string;
  /** Rute tempat langkah ini masuk akal. */
  route?: string;
  action?: TourStepAction;
  /** Bila target tidak ada, langkah tetap bisa dilewati aman. */
  optional?: boolean;
}

export type TourRole = 'admin' | 'user';

export interface Tutorial {
  id: string;
  titleKey: string;
  descKey: string;
  roles: TourRole[];
  route: string;
  minutes: number;
  steps: TourStep[];
}

export const TOUR_EVENT = 'allergen:tour-action';

/** Langkah wajib aksi hanya bila punya aksi DAN tidak ditandai opsional. */
export function stepNeedsAction(step: TourStep | null | undefined): boolean {
  return !!step?.action && !step.optional;
}

export function emitTourAction(name: string, detail?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TOUR_EVENT, { detail: { name, ...detail } }));
}

export function subscribeTourAction(
  handler: (detail: { name: string } & Record<string, unknown>) => void,
): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const listener = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail && typeof detail.name === 'string') handler(detail);
  };
  window.addEventListener(TOUR_EVENT, listener);
  return () => window.removeEventListener(TOUR_EVENT, listener);
}
