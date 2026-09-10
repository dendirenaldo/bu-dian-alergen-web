'use client';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const stepLabels = ['Info Pribadi', 'Kredensial', 'Konfirmasi'];

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  step < currentStep
                    ? 'bg-primary-600 text-white'
                    : step === currentStep
                    ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-600 dark:bg-primary-900/30 dark:text-primary-400 dark:ring-primary-400'
                    : 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400'
                }`}
              >
                {step < currentStep ? '✓' : step}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  step <= currentStep
                    ? 'text-surface-900 dark:text-surface-100'
                    : 'text-surface-400 dark:text-surface-500'
                }`}
              >
                {stepLabels[step - 1]}
              </span>
            </div>
            {step < totalSteps && (
              <div
                className={`mx-2 h-0.5 w-12 sm:w-20 ${
                  step < currentStep
                    ? 'bg-primary-600'
                    : 'bg-surface-200 dark:bg-surface-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
