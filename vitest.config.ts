import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/web/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/web/setup.ts'],
    testTimeout: 10000,
  },
});
