import { ReactElement, useState } from 'react';
import { BookOpen, FlaskConical, Play, RotateCcw, ShieldCheck, Timer } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import PublicLayout from '@/components/layout/PublicLayout';
import AdminRoute from '@/components/shared/AdminRoute';
import PageTransition from '@/components/shared/PageTransition';
import SeoHead from '@/components/shared/SeoHead';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useOnboarding } from '@/onboarding/OnboardingContext';

function TutorialCenter() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLocale();
  const {
    tutorials,
    activeTutorial,
    startTutorial,
    exitTutorial,
    restartTutorial,
    completed,
    resetSimulation,
    resetProgress,
    isSimulation,
  } = useOnboarding();
  const [notice, setNotice] = useState<string | null>(null);

  const featured = tutorials.find((x) => x.id === 'full');
  const modules = tutorials.filter((x) => x.id !== 'full');

  const handleReset = () => {
    resetSimulation();
    setNotice(t('onboarding.resetDone'));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          <FlaskConical className="h-3.5 w-3.5" />
          {t('onboarding.simulationBadge')}
        </div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">{t('onboarding.centerTitle')}</h1>
        <p className="max-w-2xl text-sm text-surface-500 dark:text-surface-400">{t('onboarding.centerSubtitle')}</p>
      </div>

      <Alert variant="info" title={t('onboarding.simulationBadge')}>
        {t('onboarding.simulationNotice')}
      </Alert>

      {notice && (
        <Alert variant="success" title={t('common.save')} onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      {activeTutorial && (
        <Card padding="md" className="border-amber-300 dark:border-amber-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                {t('onboarding.simulationBadge')}
              </p>
              <h2 className="mt-1 text-base font-semibold text-surface-900 dark:text-surface-100">
                {t(activeTutorial.titleKey)}
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">{t(activeTutorial.descKey)}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={restartTutorial}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                {t('onboarding.restart')}
              </Button>
              <Button size="sm" variant="ghost" onClick={exitTutorial}>
                {t('onboarding.exit')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {featured && !activeTutorial && (
        <Card padding="lg" className="border-primary-200 dark:border-primary-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-primary-100 p-2.5 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                <BookOpen className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">{t(featured.titleKey)}</h2>
                <p className="mt-1 max-w-xl text-sm text-surface-600 dark:text-surface-300">{t(featured.descKey)}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
                  <Timer className="h-3.5 w-3.5" />
                  {t('onboarding.duration', { min: featured.minutes })}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => startTutorial(featured.id)}>
              <Play className="mr-1.5 h-3.5 w-3.5" />
              {completed[featured.id] ? t('onboarding.replay') : t('onboarding.start')}
            </Button>
          </div>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">
          {t('onboarding.moduleTutorials')}
        </h2>
        {authLoading && <p className="mb-3 text-sm text-surface-500 dark:text-surface-400">{t('common.loading')}</p>}
        <div className="grid gap-4 sm:grid-cols-2" data-tour="tutorial-grid">
          {modules.map((tutorial) => {
            const done = !!completed[tutorial.id];
            return (
              <Card key={tutorial.id} padding="md">
                <div className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">{t(tutorial.titleKey)}</h3>
                    {done ? (
                      <Badge variant="success">{t('onboarding.completed')}</Badge>
                    ) : (
                      <Badge variant="default">{t('onboarding.available')}</Badge>
                    )}
                  </div>
                  <p className="mt-1 flex-1 text-sm text-surface-600 dark:text-surface-300">{t(tutorial.descKey)}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
                      <Timer className="h-3.5 w-3.5" />
                      {t('onboarding.duration', { min: tutorial.minutes })} • {t('onboarding.step', { current: tutorial.steps.length, total: tutorial.steps.length })}
                    </span>
                    <Button size="sm" variant={done ? 'secondary' : 'primary'} onClick={() => startTutorial(tutorial.id)}>
                      <Play className="mr-1.5 h-3.5 w-3.5" />
                      {done ? t('onboarding.replay') : t('onboarding.start')}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Card padding="md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                {t('onboarding.progressSaved')}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Role: {user?.role === 'admin' ? t('onboarding.role.admin') : t('onboarding.role.user')} •{' '}
                {isSimulation ? t('onboarding.simulationBadge') : t('onboarding.live')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={handleReset}>
              {t('onboarding.resetSim')}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetProgress}>
              {t('onboarding.resetProgress')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function GuidePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLocale();
  const isAdmin = user?.role === 'admin';
  const content = isAdmin ? (
    <AdminRoute>
      <PageTransition>
        <TutorialCenter />
      </PageTransition>
    </AdminRoute>
  ) : (
    <PageTransition>
      <TutorialCenter />
    </PageTransition>
  );
  const Shell = isAdmin ? AdminLayout : PublicLayout;
  return (
    <>
      <SeoHead title={t('onboarding.centerTitle')} description={t('onboarding.centerSubtitle')} path="/panduan" />
      <Shell>{content}</Shell>
    </>
  );
}

GuidePage.getLayout = (page: ReactElement) => page;
