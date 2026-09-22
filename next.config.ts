import type { NextConfig } from 'next';

// Fail-fast saat build: NEXT_PUBLIC_* di-inline oleh bundler JIKA ada.
// Tanpa ini, build production diam-diam memakai fallback runtime yang salah.
if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    'NEXT_PUBLIC_API_URL tidak diset saat build production. ' +
      'Isi .env.production (dipakai saat next build).',
  );
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
