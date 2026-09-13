import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useLocale } from '@/contexts/LocaleContext';

/**
 * Cegah kehilangan perubahan form saat tombol kembali / navigasi / reload.
 * Pakai: const guard = useUnsavedGuard(dirty); ... <guard.Dialog />
 */
export function useUnsavedGuard(dirty: boolean, message?: string) {
  const router = useRouter();
  const { t } = useLocale();
  const guardMessage = message ?? t('guard.message');
  const [showDialog, setShowDialog] = useState(false);
  const pendingUrl = useRef<string | null>(null);
  const onConfirmExtraRef = useRef<(() => void) | null>(null);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = guardMessage;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [guardMessage]);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (!dirtyRef.current || url === router.asPath) return;
      pendingUrl.current = url;
      setShowDialog(true);
      router.events.emit('routeChangeError');
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw 'routeChange aborted by unsaved guard';
    };
    router.events.on('routeChangeStart', handleRouteChange);
    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [router]);

  const confirmLeave = useCallback(() => {
    dirtyRef.current = false;
    setShowDialog(false);
    if (pendingUrl.current) {
      router.push(pendingUrl.current);
      pendingUrl.current = null;
    } else {
      // Dipicu dari tombol close modal (bukan navigasi): tutup modal induk
      // + reset form via callback yang diberikan Dialog.
      onConfirmExtraRef.current?.();
      onConfirmExtraRef.current = null;
    }
  }, [router]);

  const Dialog = useCallback(
    ({ onClose: extraOnClose }: { onClose?: () => void } = {}) => (
      <ConfirmDialog
        isOpen={showDialog}
        onClose={() => {
          // Batal: hanya tutup popup, modal induk TETAP terbuka.
          setShowDialog(false);
          pendingUrl.current = null;
          onConfirmExtraRef.current = null;
        }}
        onConfirm={() => {
          onConfirmExtraRef.current = extraOnClose ?? null;
          confirmLeave();
        }}
        title={t('guard.title')}
        description={guardMessage}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.back')}
        variant="primary"
      />
    ),
    [showDialog, confirmLeave, guardMessage, t],
  );

  return { showDialog, setShowDialog, confirmLeave, Dialog };
}
