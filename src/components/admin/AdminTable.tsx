'use client';

import { useState, ReactNode } from 'react';
import { Plus, Edit2, Trash2, Eye, Search, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import Pagination from '@/components/ui/Pagination';
import PageSizeSelect from '@/components/ui/PageSizeSelect';
import EmptyState from '@/components/ui/EmptyState';
import { useLocale } from '@/contexts/LocaleContext';
import type { SortState } from '@/hooks/useTableControls';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  /** Kolom dapat diklik untuk sortir server-side. */
  sortable?: boolean;
  /** Kunci yang dikirim sebagai sortBy (default = key). */
  sortKey?: string;
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
  sort?: SortState | null;
  onSort?: (key: string) => void;
  limit?: number;
  onLimitChange?: (size: number) => void;
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
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
  addLabel,
  sort = null,
  onSort,
  limit,
  onLimitChange,
}: AdminTableProps<T>) {
  const { t } = useLocale();
  const searchPh = searchPlaceholder ?? t('admin.search.default');
  const emptyT = emptyTitle ?? t('common.empty');
  const emptyD = emptyDescription ?? '';
  const addL = addLabel ?? t('common.add');
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(search.trim());
  };

  const showActions = !!(onEdit || onDelete || onView);
  const showFooter = (total ?? data.length) > 0;

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
              placeholder={searchPh}
              leftIcon={<Search className="h-4 w-4" />}
              aria-label={searchPh}
            />
          </form>
        ) : (
          <div />
        )}
        {onAdd && (
          <Button onClick={onAdd} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            {addL}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900">
              {columns.map((col) => {
                const sortId = col.sortKey ?? col.key;
                const active = sort?.key === sortId;
                const ariaSort = !col.sortable || !onSort ? undefined : !active ? 'none' : sort.dir === 'asc' ? 'ascending' : 'descending';
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={ariaSort as 'none' | 'ascending' | 'descending' | undefined}
                    className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400"
                  >
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.sortKey ?? col.key)}
                        title={active ? (sort.dir === 'asc' ? t('table.sortAsc') : t('table.sortDesc')) : t('table.sortNone')}
                        aria-label={`${col.label}: ${active ? (sort.dir === 'asc' ? t('table.sortAsc') : t('table.sortDesc')) : t('table.sortNone')}`}
                        className="group inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-surface-900 dark:hover:text-surface-100"
                      >
                        <span>{col.label}</span>
                        <span
                          className={cn(
                            'transition-all duration-150',
                            active ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                          )}
                        >
                          {!active || sort === null ? (
                            <ChevronsUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : sort.dir === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                        </span>
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
              {showActions && (
                <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-surface-600 dark:text-surface-400">
                  {t('admin.table.action')}
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
                  {showActions && (
                    <td className="px-4 py-3">
                      <Skeleton width="4rem" height="1rem" />
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (showActions ? 1 : 0)} className="px-4 py-4">
                  <EmptyState
                    title={emptyT}
                    description={emptyD}
                    action={onAdd ? { label: addL, onClick: onAdd } : undefined}
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
                  {showActions && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onView && (
                          <button
                            onClick={() => onView(item)}
                            aria-label={t('common.detail')}
                            title={t('common.detail')}
                            className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            aria-label={t('common.edit')}
                            title={t('common.edit')}
                            className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item)}
                            aria-label={t('common.delete')}
                            title={t('common.delete')}
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

      {showFooter && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {t('admin.table.pageInfo', { total: total ?? data.length, page: currentPage, pages: totalPages })}
            </p>
            {onLimitChange && limit !== undefined && (
              <PageSizeSelect value={limit} onChange={onLimitChange} />
            )}
          </div>
          {totalPages > 1 && onPageChange && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
          )}
        </div>
      )}
    </div>
  );
}
