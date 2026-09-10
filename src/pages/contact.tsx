import { ReactElement, useState } from 'react';
import Head from 'next/head';
import PublicLayout from '@/components/layout/PublicLayout';
import PageTransition from '@/components/shared/PageTransition';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { validators } from '@/lib/validation';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    const nameResult = validators.required('Nama')(form.name);
    if (!nameResult.valid) errs.name = nameResult.error!;
    const emailRequired = validators.required('Email')(form.email);
    if (!emailRequired.valid) errs.email = emailRequired.error!;
    else {
      const emailFormat = validators.email(form.email);
      if (!emailFormat.valid) errs.email = emailFormat.error!;
    }
    const subjectResult = validators.required('Subjek')(form.subject);
    if (!subjectResult.valid) errs.subject = subjectResult.error!;
    const messageResult = validators.required('Pesan')(form.message);
    if (!messageResult.valid) errs.message = messageResult.error!;
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <>
      <Head>
        <title>Kontak - Bu Dian</title>
      </Head>
      <PageTransition>
        <div className="page-container">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12 text-center"
            >
              <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100 sm:text-4xl">
                Hubungi Kami
              </h1>
              <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
                Punya pertanyaan atau masukan? Kami siap membantu.
              </p>
            </motion.div>

            <div className="grid gap-8 lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-4"
              >
                {[
                  { icon: Mail, label: 'Email', value: 'info@budian.id' },
                  { icon: Phone, label: 'Telepon', value: '+62 123 456 789' },
                  { icon: MapPin, label: 'Alamat', value: 'Jakarta, Indonesia' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-4 rounded-2xl border border-surface-200 bg-white p-4 shadow-card dark:border-surface-800 dark:bg-surface-900"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                        {item.label}
                      </p>
                      <p className="text-surface-900 dark:text-surface-100">{item.value}</p>
                    </div>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:col-span-2"
              >
                <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card dark:border-surface-800 dark:bg-surface-900">
                  {isSubmitted ? (
                    <div className="py-12 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                        <Send className="h-6 w-6" />
                      </div>
                      <p className="font-medium text-surface-900 dark:text-surface-100">
                        Pesan berhasil dikirim!
                      </p>
                      <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                        Kami akan segera menghubungi Anda.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                          label="Nama"
                          placeholder="Masukkan nama"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          error={errors.name}
                          required
                        />
                        <Input
                          label="Email"
                          type="email"
                          placeholder="Masukkan email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          error={errors.email}
                          required
                        />
                      </div>
                      <Input
                        label="Subjek"
                        placeholder="Masukkan subjek"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        error={errors.subject}
                        required
                      />
                      <Textarea
                        label="Pesan"
                        placeholder="Tulis pesan Anda..."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        rows={5}
                        error={errors.message}
                        required
                      />
                      <Button type="submit" className="w-full">
                        <Send className="mr-2 h-4 w-4" />
                        Kirim Pesan
                      </Button>
                    </form>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </PageTransition>
    </>
  );
}

ContactPage.getLayout = (page: ReactElement) => {
  return <PublicLayout>{page}</PublicLayout>;
};
