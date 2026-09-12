'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const stats = [
  { value: 1500, suffix: '+', label: 'Produk Dianalisis' },
  { value: 50, suffix: '+', label: 'Jenis Alergen' },
  { value: 500, suffix: '+', label: 'Pengguna Aktif' },
  { value: 98, suffix: '%', label: 'Akurasi' },
];

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    if (!isInView) return;

    if (prefersReduced) {
      setCount(target);
      return;
    }

    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, target, prefersReduced]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="bg-primary-600 px-4 py-20 dark:bg-primary-900 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-white sm:text-4xl">
                <Counter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-2 text-sm text-primary-100 sm:text-base">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
