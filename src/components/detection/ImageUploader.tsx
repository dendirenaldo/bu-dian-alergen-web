'use client';

import { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  isProcessing: boolean;
}

export default function ImageUploader({ onImageSelect, isProcessing }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      onImageSelect(file);
    },
    [onImageSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const clearPreview = () => {
    setPreview(null);
  };

  if (preview) {
    return (
      <div className="relative">
        <img
          src={preview}
          alt="Preview"
          className="w-full rounded-xl border border-surface-200 object-contain max-h-80 dark:border-surface-700"
        />
        <button
          onClick={clearPreview}
          aria-label="Clear"
          className="absolute right-2 top-2 rounded-lg bg-white/80 p-1.5 text-surface-600 hover:bg-white dark:bg-surface-800/80 dark:text-surface-400 dark:hover:bg-surface-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors',
        isDragging
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
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
        {isDragging ? 'Lepaskan gambar di sini' : 'Drag & drop gambar di sini'}
      </p>
      <p className="mb-4 text-xs text-surface-500 dark:text-surface-400">
        atau
      </p>
      <label>
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          disabled={isProcessing}
        />
        <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
          <ImageIcon className="h-4 w-4" />
          Pilih Gambar
        </span>
      </label>
      <p className="mt-4 text-xs text-surface-400 dark:text-surface-500">
        Format: JPG, PNG, WEBP (Maks. 5MB)
      </p>
    </div>
  );
}
