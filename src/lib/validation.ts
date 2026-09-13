import { tr } from '@/lib/i18n';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validators = {
  required: (label: string) => (value: string): ValidationResult => {
    return !value.trim()
      ? { valid: false, error: `${label} ${tr('validation.required')}` }
      : { valid: true };
  },

  email: (value: string): ValidationResult => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value)
      ? { valid: true }
      : { valid: false, error: tr('validation.email') };
  },

  minLength: (min: number, label: string) => (value: string): ValidationResult => {
    return value.length < min
      ? { valid: false, error: `${label} ${tr('validation.minLength', { min })}` }
      : { valid: true };
  },

  password: (value: string): ValidationResult => {
    if (value.length < 8) return { valid: false, error: tr('validation.passwordStrong') };
    if (!/[A-Z]/.test(value)) return { valid: false, error: tr('validation.passwordStrong') };
    if (!/[0-9]/.test(value)) return { valid: false, error: tr('validation.passwordStrong') };
    return { valid: true };
  },

  matchField: (fieldValue: string, label: string) => (value: string): ValidationResult => {
    return value !== fieldValue
      ? { valid: false, error: `${label} ${tr('validation.mismatch')}` }
      : { valid: true };
  },

  phone: (value: string): ValidationResult => {
    if (!value) return { valid: true };
    const regex = /^[0-9]{10,15}$/;
    return regex.test(value)
      ? { valid: true }
      : { valid: false, error: tr('validation.phone') };
  },
};
