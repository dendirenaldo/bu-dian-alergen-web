import { ReactElement } from 'react';
import Head from 'next/head';
import PublicLayout from '@/components/layout/PublicLayout';
import PageTransition from '@/components/shared/PageTransition';
import DetectionHistoryTable from '@/components/detection/DetectionHistoryTable';
import { History } from 'lucide-react';

export default function HistoryPage() {
  return (
    <>
      <Head>
        <title>Riwayat Deteksi - Bu Dian</title>
      </Head>
      <PageTransition>
        <div className="page-container">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  Riwayat Deteksi
                </h1>
                <p className="text-surface-500 dark:text-surface-400">
                  Lihat semua riwayat deteksi alergen yang telah dilakukan.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card dark:border-surface-800 dark:bg-surface-900">
            <DetectionHistoryTable />
          </div>
        </div>
      </PageTransition>
    </>
  );
}

HistoryPage.getLayout = (page: ReactElement) => {
  return <PublicLayout>{page}</PublicLayout>;
};
