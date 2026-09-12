'use client';

import { motion } from 'framer-motion';
import { Camera, Zap, History } from 'lucide-react';
import Card from '@/components/ui/Card';

const features = [
  {
    icon: Camera,
    title: 'Upload Gambar',
    description: 'Foto label produk makanan dan sistem akan membaca informasi alergen secara otomatis.',
  },
  {
    icon: Zap,
    title: 'Deteksi Instan',
    description: 'Teknologi AI mendeteksi alergen dalam hitungan detik dengan tingkat akurasi tinggi.',
  },
  {
    icon: History,
    title: 'Riwayat Lengkap',
    description: 'Simpan dan pantau riwayat deteksi alergen untuk semua produk yang pernah Anda periksa.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-surface-50 px-4 py-20 dark:bg-surface-900 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold text-surface-900 dark:text-surface-100 sm:text-4xl">
            Fitur Unggulan
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
            Kemudahan deteksi alergen dalam genggaman Anda
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card padding="lg" hover className="dark:bg-surface-950">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-surface-900 dark:text-surface-100">
                {feature.title}
              </h3>
              <p className="text-surface-600 dark:text-surface-400">
                {feature.description}
              </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
