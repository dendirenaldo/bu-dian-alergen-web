'use client';

interface StepConfirmationProps {
  data: {
    name: string;
    phone: string;
    email: string;
  };
  agreeToTerms: boolean;
  onToggleTerms: () => void;
  errors: Record<string, string>;
}

export default function StepConfirmation({
  data,
  agreeToTerms,
  onToggleTerms,
  errors,
}: StepConfirmationProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-surface-50 p-4 dark:bg-surface-800">
        <h4 className="mb-3 text-sm font-medium text-surface-700 dark:text-surface-300">
          Ringkasan Data
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-surface-500 dark:text-surface-400">Nama</span>
            <span className="font-medium text-surface-900 dark:text-surface-100">{data.name}</span>
          </div>
          {data.phone && (
            <div className="flex justify-between">
              <span className="text-surface-500 dark:text-surface-400">Telepon</span>
              <span className="font-medium text-surface-900 dark:text-surface-100">{data.phone}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-surface-500 dark:text-surface-400">Email</span>
            <span className="font-medium text-surface-900 dark:text-surface-100">{data.email}</span>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreeToTerms}
          onChange={onToggleTerms}
          className="mt-0.5 h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
        />
        <span className="text-sm text-surface-600 dark:text-surface-400">
          Saya menyetujui{' '}
          <span className="font-medium text-primary-600 dark:text-primary-400">
            Syarat &amp; Ketentuan
          </span>{' '}
          dan{' '}
          <span className="font-medium text-primary-600 dark:text-primary-400">
            Kebijakan Privasi
          </span>
        </span>
      </label>
      {errors.terms && (
        <p className="text-sm text-red-600 dark:text-red-400">{errors.terms}</p>
      )}
    </div>
  );
}
