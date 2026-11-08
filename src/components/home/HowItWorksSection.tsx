'use client';

import { motion } from 'framer-motion';
import { Upload, Cpu, CheckCircle2 } from 'lucide-react';

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

const steps = [
  {
    icon: Upload,
    step: '01',
    title: 'Foto labelnya',
    description: (
      <>
        Ambil foto daftar bahan pada kemasan. Usahakan tegak, terang, dan tidak
        terpotong agar{' '}
        <TechHint
          label="tulisannya terbaca"
          tip="Teknologi OCR (Optical Character Recognition): membaca tulisan dari foto secara otomatis."
        />{' '}
        dengan jelas.
      </>
    ),
  },
  {
    icon: Cpu,
    step: '02',
    title: 'Diperiksa otomatis',
    description: (
      <>
        Sistem membaca tulisan lalu mengenali bahan pemicu alergi dalam hitungan
        detik. Lihat{' '}
        <TechHint
          label="cara kerja detail"
          tip="Di balik layar memakai Word2Vec, BiLSTM, dan Ensemble (gabungan beberapa model, termasuk BERT)."
        />{' '}
        bila penasaran.
      </>
    ),
  },
  {
    icon: CheckCircle2,
    step: '03',
    title: 'Hasil mudah dibaca',
    description: (
      <>
        Tanda hijau berarti aman, merah berarti ada alergen. Dilengkapi bahan
        yang ditemukan dan tingkat bahayanya.
      </>
    ),
  },
];

export default function HowItWorksSection() {
  return (
    <section className="bg-white px-4 py-20 dark:bg-surface-950 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold text-surface-900 dark:text-surface-100 sm:text-4xl">
            Cara Kerja
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
            Tiga langkah sederhana untuk memeriksa kemasan
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative text-center"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white">
                <step.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-surface-900 dark:text-surface-100">
                {step.title}
              </h3>
              <p className="text-surface-600 dark:text-surface-400">
                {step.description}
              </p>
              {index < steps.length - 1 && (
                <div className="absolute left-[calc(50%+40px)] top-8 hidden h-0.5 w-[calc(100%-80px)] bg-surface-200 dark:bg-surface-700 md:block" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
