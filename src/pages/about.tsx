import { ReactElement } from 'react';
import Head from 'next/head';
import PublicLayout from '@/components/layout/PublicLayout';
import PageTransition from '@/components/shared/PageTransition';
import { ShieldCheck, Users, Target, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>Tentang Kami - Bu Dian</title>
      </Head>
      <PageTransition>
        <div className="page-container">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12 text-center"
            >
              <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100 sm:text-4xl">
                Tentang Kami
              </h1>
              <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
                Mengenal lebih dekat Bu Dian - Sistem Deteksi Alergen Makanan
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-8"
            >
              <div className="rounded-2xl border border-surface-200 bg-white p-8 shadow-card dark:border-surface-800 dark:bg-surface-900">
                <h2 className="mb-4 text-xl font-semibold text-surface-900 dark:text-surface-100">
                  Misi Kami
                </h2>
                <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                  Bu Dian hadir untuk membantu masyarakat Indonesia mengenali alergen pada produk
                  makanan dengan lebih mudah dan akurat. Kami menggunakan teknologi kecerdasan
                  buatan untuk mendeteksi potensi alergen dari label produk makanan.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {[
                  { icon: ShieldCheck, title: 'Akurasi Tinggi', desc: 'Menggunakan model Word2Vec & BiLSTM untuk deteksi alergen yang akurat.' },
                  { icon: Users, title: 'Untuk Semua', desc: 'Tersedia untuk umum, membantu penderita alergi memilih makanan yang aman.' },
                  { icon: Target, title: 'Fokus Lokal', desc: 'Dirancang khusus untuk produk makanan Indonesia.' },
                  { icon: BookOpen, title: 'Edukasi', desc: 'Memberikan informasi lengkap tentang berbagai jenis alergen makanan.' },
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card dark:border-surface-800 dark:bg-surface-900"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-1 font-semibold text-surface-900 dark:text-surface-100">
                      {item.title}
                    </h3>
                    <p className="text-sm text-surface-600 dark:text-surface-400">
                      {item.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    </>
  );
}

AboutPage.getLayout = (page: ReactElement) => {
  return <PublicLayout>{page}</PublicLayout>;
};
