# Bu Dian Web Frontend

Dashboard web admin dan halaman publik untuk sistem deteksi alergen makanan. Dibangun dengan Next.js 16 dan Tailwind CSS.

## Tech Stack

- Next.js 16 (Turbopack)
- React 19 + TypeScript 5.5
- Tailwind CSS 3.4
- Framer Motion 11 (animasi)
- Lucide React (icons)

## Fitur

- **Halaman Publik**: Landing page, About, Kontak
- **Autentikasi**: Login & Register
- **Deteksi Alergen**: Upload gambar makanan → hasil deteksi
- **Riwayat Deteksi**: Melihat history deteksi user
- **Admin Dashboard**: Kelola produk, kategori, alergen, konten
- **Responsive Design**: Mobile-first dengan Tailwind CSS
- **Animasi**: Transisi halaman & micro-interaction dengan Framer Motion

## Halaman

| Halaman | Path | Deskripsi |
|---------|------|-----------|
| Beranda | `/` | Landing page utama |
| Login | `/login` | Halaman login |
| Register | `/register` | Halaman registrasi |
| Deteksi | `/detect` | Upload & deteksi alergen |
| Riwayat | `/history` | History deteksi |
| About | `/about` | Tentang aplikasi |
| Kontak | `/contact` | Informasi kontak |
| Admin | `/admin/*` | Dashboard admin |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Konfigurasi environment

Buat file `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 3. Jalankan development server

```bash
npm run dev
```

Akses: http://localhost:3000

## Scripts

| Script | Deskripsi |
|--------|-----------|
| `npm run dev` | Jalankan dev server (Turbopack) |
| `npm run build` | Build untuk production |
| `npm run start` | Jalankan production server |
| `npm run lint` | Jalankan ESLint |
| `npm run typecheck` | Type checking tanpa emit |

## Struktur Project

```
src/
├── components/    # Komponen UI reusable
├── contexts/      # React context providers
├── hooks/         # Custom hooks
├── layouts/       # Layout komponen
├── lib/           # Utility functions
├── pages/         # Halaman Next.js
├── styles/        # CSS & Tailwind config
└── types/         # TypeScript type definitions
```
