export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validators = {
  required: (label: string) => (value: string): ValidationResult => {
    return !value.trim()
      ? { valid: false, error: `${label} wajib diisi` }
      : { valid: true };
  },

  email: (value: string): ValidationResult => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value)
      ? { valid: true }
      : { valid: false, error: 'Format email tidak valid' };
  },

  minLength: (min: number, label: string) => (value: string): ValidationResult => {
    return value.length < min
      ? { valid: false, error: `${label} minimal ${min} karakter` }
      : { valid: true };
  },

  password: (value: string): ValidationResult => {
    if (value.length < 8) return { valid: false, error: 'Password minimal 8 karakter' };
    if (!/[A-Z]/.test(value)) return { valid: false, error: 'Password harus mengandung huruf besar' };
    if (!/[0-9]/.test(value)) return { valid: false, error: 'Password harus mengandung angka' };
    return { valid: true };
  },

  matchField: (fieldValue: string, label: string) => (value: string): ValidationResult => {
    return value !== fieldValue
      ? { valid: false, error: `${label} tidak cocok` }
      : { valid: true };
  },

  phone: (value: string): ValidationResult => {
    if (!value) return { valid: true };
    const regex = /^[0-9]{10,15}$/;
    return regex.test(value)
      ? { valid: true }
      : { valid: false, error: 'Nomor telepon tidak valid' };
  },
};
