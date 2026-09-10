'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function CTASection() {
  return (
    <section className="bg-surface-50 px-4 py-20 dark:bg-surface-900 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-primary-700 p-8 sm:p-12 lg:p-16"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Siap Memulai?
            </h2>
            <p className="mt-4 text-lg text-primary-100">
              Mulai deteksi alergen pada produk makanan Anda sekarang juga. Gratis dan mudah digunakan.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white text-primary-600 hover:bg-primary-50 w-full sm:w-auto"
                >
                  Daftar Sekarang
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/detect">
                <Button
                  variant="ghost"
                  size="lg"
                  className="border border-white/30 text-white hover:bg-white/10 w-full sm:w-auto"
                >
                  Coba Tanpa Daftar
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
