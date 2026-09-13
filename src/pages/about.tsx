import { ReactElement } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import PageTransition from '@/components/shared/PageTransition';
import SeoHead from '@/components/shared/SeoHead';
import { useLocale } from '@/contexts/LocaleContext';
import Card from '@/components/ui/Card';
import { ShieldCheck, Users, Target, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AboutPage() {
  const { t } = useLocale();
  return (
    <>
      <SeoHead title={t('seo.aboutTitle')} description={t('seo.aboutDesc')} path="/about" />
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
                Mengenal lebih dekat Allergen Detector - Sistem Deteksi Alergen Makanan
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-8"
            >
              <Card padding="lg">
                <h2 className="mb-4 text-xl font-semibold text-surface-900 dark:text-surface-100">
                  Misi Kami
                </h2>
                <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                  Allergen Detector hadir untuk membantu masyarakat Indonesia mengenali alergen pada produk
                  makanan dengan lebih mudah dan akurat. Kami menggunakan teknologi kecerdasan
                  buatan untuk mendeteksi potensi alergen dari label produk makanan.
                </p>
              </Card>

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
                  >
                    <Card padding="md">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-1 font-semibold text-surface-900 dark:text-surface-100">
                      {item.title}
                    </h3>
                    <p className="text-sm text-surface-600 dark:text-surface-400">
                      {item.desc}
                    </p>
                    </Card>
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
