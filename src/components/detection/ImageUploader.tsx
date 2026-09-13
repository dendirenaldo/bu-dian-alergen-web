'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  isProcessing: boolean;
}

const MAX_SIZE = 5 * 1024 * 1024;

export default function ImageUploader({ onImageSelect, isProcessing }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.type.startsWith('image/')) {
        setError('File harus berupa gambar (JPG/PNG/WEBP).');
        return;
      }
      if (file.size > MAX_SIZE) {
        setError('Ukuran gambar maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      onImageSelect(file);
    },
    [onImageSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (isProcessing) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile, isProcessing]
  );

  const clearPreview = () => {
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (preview) {
    return (
      <div className="relative">
        <div className="relative h-80 w-full overflow-hidden rounded-xl border border-surface-200 dark:border-surface-700">
          <Image src={preview} alt="Pratinjau gambar terunggah" fill className="object-contain" unoptimized sizes="100vw" />
        </div>
        <button
          onClick={clearPreview}
          aria-label="Hapus gambar"
          title="Hapus gambar"
          disabled={isProcessing}
          className="absolute right-2 top-2 rounded-lg bg-white/80 p-1.5 text-surface-600 transition-colors hover:bg-white disabled:opacity-50 dark:bg-surface-800/80 dark:text-surface-400 dark:hover:bg-surface-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); if (!isProcessing) setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        className={cn(
          'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200',
          isDragging
            ? 'scale-[1.01] border-primary-500 bg-primary-50 dark:bg-primary-900/10'
            : 'border-surface-300 hover:border-primary-400 dark:border-surface-700 dark:hover:border-primary-500'
        )}
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
          {isProcessing ? (
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          ) : (
            <Upload className="h-8 w-8 text-surface-400" />
          )}
        </div>
        <p className="mb-2 text-sm font-medium text-surface-700 dark:text-surface-300">
          {isDragging ? 'Lepaskan gambar di sini' : 'Seret & letakkan gambar di sini'}
        </p>
        <p className="mb-4 text-xs text-surface-500 dark:text-surface-400">atau</p>
        <label>
          <input ref={inputRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" disabled={isProcessing} aria-label="Pilih gambar" />
          <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
            <ImageIcon className="h-4 w-4" />
            Pilih Gambar
          </span>
        </label>
        <p className="mt-4 text-xs text-surface-400 dark:text-surface-500">Format: JPG, PNG, WEBP (Maks. 5MB)</p>
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
    </div>
  );
}
