'use client';

import { motion } from 'framer-motion';
import { Camera, Zap, History } from 'lucide-react';
import Card from '@/components/ui/Card';

function TechHint({ label, tip }: { label: string; tip: string }) {
  return (
    <span
      title={tip}
      className="cursor-help underline decoration-dotted underline-offset-2"
    >
      {label}
    </span>
  );
}

const features = [
  {
    icon: Camera,
    title: 'Foto langsung terbaca',
    description: (
      <>
        Jepret label kemasan, sistem mengubahnya jadi teks dan menandai bahan
        pemicu alergi. Arahkan kursor ke{' '}
        <TechHint
          label="istilah ini"
          tip="OCR (Optical Character Recognition): teknologi membaca tulisan dari gambar."
        />{' '}
        untuk detail teknis.
      </>
    ),
  },
  {
    icon: Zap,
    title: 'Hasil dalam hitungan detik',
    description: (
      <>
        Pemeriksaan berjalan cepat dan teliti, lengkap dengan skor keyakinan.
        Opsi{' '}
        <TechHint
          label="ketelitian tambahan"
          tip="Ensemble: gabungan beberapa model (termasuk BERT dan BiLSTM) untuk hasil lebih stabil."
        />{' '}
        tersedia di halaman Deteksi.
      </>
    ),
  },
  {
    icon: History,
    title: 'Riwayat tersimpan rapi',
    description: (
      <>
        Masuk untuk menyimpan semua hasil pemeriksaan. Pantau kembali kapan
        saja tanpa memotret ulang kemasan yang sama.
      </>
    ),
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
            Memeriksa kemasan jadi mudah untuk semua orang
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
