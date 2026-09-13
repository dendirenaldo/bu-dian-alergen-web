import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

/**
 * Cegah kehilangan perubahan form saat tombol kembali / navigasi / reload.
 * Pakai: const guard = useUnsavedGuard(dirty); ... <guard.Dialog />
 */
export function useUnsavedGuard(dirty: boolean, message = 'Perubahan belum disimpan. Yakin ingin keluar?') {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const pendingUrl = useRef<string | null>(null);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = message;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [message]);

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
    }
  }, [router]);

  const Dialog = useCallback(
    ({ onClose: extraOnClose }: { onClose?: () => void } = {}) => (
      <ConfirmDialog
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false);
          pendingUrl.current = null;
          extraOnClose?.();
        }}
        onConfirm={confirmLeave}
        title="Buang perubahan?"
        description={message}
        confirmLabel="Ya, keluar"
        cancelLabel="Tetap di sini"
        variant="primary"
      />
    ),
    [showDialog, confirmLeave, message],
  );

  return { showDialog, setShowDialog, confirmLeave, Dialog };
}
