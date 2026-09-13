'use client';

import { useState, ReactNode } from 'react';
import { Plus, Edit2, Trash2, Eye, Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
}

interface AdminTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  total?: number;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (query: string) => void;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onView?: (item: T) => void;
  onDelete?: (item: T) => void;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  addLabel?: string;
}

export default function AdminTable<T extends { id: number }>({
  data,
  columns,
  isLoading = false,
  total,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  onSearch,
  onAdd,
  onEdit,
  onView,
  onDelete,
  searchPlaceholder = 'Cari...',
  emptyTitle = 'Belum ada data',
  emptyDescription = 'Data akan muncul di sini setelah ditambahkan.',
  addLabel = 'Tambah',
}: AdminTableProps<T>) {
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(search.trim());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {onSearch ? (
          <form onSubmit={handleSearch} className="flex-1 sm:max-w-xs">
            <Input
              label=""
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value === '') onSearch('');
              }}
              placeholder={searchPlaceholder}
              leftIcon={<Search className="h-4 w-4" />}
              aria-label={searchPlaceholder}
            />
          </form>
        ) : (
          <div />
        )}
        {onAdd && (
          <Button onClick={onAdd} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            {addLabel}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400"
                >
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete || onView) && (
                <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-surface-600 dark:text-surface-400">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <Skeleton width="6rem" height="1rem" />
                    </td>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <td className="px-4 py-3">
                      <Skeleton width="4rem" height="1rem" />
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete || onView ? 1 : 0)} className="px-4 py-4">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={onAdd ? { label: addLabel, onClick: onAdd } : undefined}
                  />
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/50">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 text-sm text-surface-700 dark:text-surface-300"
                    >
                      {col.render
                        ? col.render(item)
                        : (item as any)[col.key]}
                    </td>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onView && (
                          <button
                            onClick={() => onView(item)}
                            aria-label="Lihat detail"
                            title="Lihat detail"
                            className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            aria-label="Ubah"
                            title="Ubah"
                            className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item)}
                            aria-label="Hapus"
                            title="Hapus"
                            className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {typeof total === 'number' ? `${total} data • ` : ''}Halaman {currentPage} dari {totalPages}
          </p>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}
