import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// RTL tidak auto-cleanup tanpa globals. Tanpa ini DOM/modal/hook bocor
// antar-test (efek Escape/resolve lintas file -> kegagalan palsu).
afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
});
