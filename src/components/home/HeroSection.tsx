'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white px-4 py-20 dark:bg-surface-950 sm:px-6 lg:px-8 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-surface-50 dark:from-primary-950/20 dark:via-surface-950 dark:to-surface-950" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0tMS0ydjJoLTJ2LTJoMnptMSAydjJoLTJ2LTJoMnptMSAydjJoLTJ2LTJoMnptMS00djJoLTJ2LTJoMnptMSAydjJoLTJ2LTJoMnptMSAydjJoLTJ2LTJoMnptMS00djJoLTJ2LTJoMnptMSAydjJoLTJ2LTJoMnptMSAydjJoLTJ2LTJoMnptMS00djJoLTJ2LTJoMnptMSAydjJoLTJ2LTJoMnptMSAydjJoLTJ2LTJoMnptMS00djJoLTJ2LTJoMnptMSAydjJoLTJ2LTJoIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-400">
              <ShieldCheck className="h-4 w-4" />
              AI-Powered Detection
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-100 sm:text-5xl lg:text-6xl">
              Deteksi Alergen{' '}
              <span className="text-primary-600 dark:text-primary-400">
                Makanan
              </span>{' '}
              dengan Mudah
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-surface-600 dark:text-surface-400">
              Upload foto produk makanan dan dapatkan hasil deteksi alergen secara instan.
              Teknologi Word2Vec &amp; BiLSTM untuk akurasi tinggi.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/detect">
                <Button size="lg" className="w-full sm:w-auto">
                  Mulai Deteksi
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Pelajari Lebih Lanjut
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative mx-auto aspect-square max-w-md rounded-3xl bg-gradient-to-br from-primary-100 to-primary-200 p-8 dark:from-primary-900/30 dark:to-primary-800/30">
              <svg
                viewBox="0 0 200 200"
                className="h-full w-full text-primary-600 dark:text-primary-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="40" y="30" width="120" height="140" rx="12" />
                <circle cx="100" cy="80" r="25" />
                <path d="M60 140 Q100 110 140 140" />
                <line x1="70" y1="55" x2="130" y2="55" />
                <line x1="80" y1="65" x2="120" y2="65" />
                <circle cx="60" cy="60" r="8" fill="currentColor" opacity="0.2" />
                <circle cx="140" cy="60" r="8" fill="currentColor" opacity="0.2" />
                <path d="M85 120 L95 130 L115 110" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
