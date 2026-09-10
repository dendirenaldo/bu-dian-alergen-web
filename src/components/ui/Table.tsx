import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TableProps extends HTMLAttributes<HTMLTableElement> {}

export default function Table({ className, children, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
      <table
        className={cn('w-full text-sm text-left', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {}

Table.Header = function TableHeader({ className, children, ...props }: TableHeaderProps) {
  return (
    <thead
      className={cn('bg-surface-50 dark:bg-surface-800/50', className)}
      {...props}
    >
      {children}
    </thead>
  );
};

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {}

Table.Body = function TableBody({ className, children, ...props }: TableBodyProps) {
  return (
    <tbody
      className={cn('divide-y divide-surface-200 dark:divide-surface-800', className)}
      {...props}
    >
      {children}
    </tbody>
  );
};

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {}

Table.Row = function TableRow({ className, children, ...props }: TableRowProps) {
  return (
    <tr
      className={cn('hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors', className)}
      {...props}
    >
      {children}
    </tr>
  );
};

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {}

Table.Head = function TableHead({ className, children, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-xs font-medium text-surface-500 uppercase tracking-wider',
        'dark:text-surface-400',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
};

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {}

Table.Cell = function TableCell({ className, children, ...props }: TableCellProps) {
  return (
    <td
      className={cn('px-4 py-3 text-surface-900 dark:text-surface-100', className)}
      {...props}
    >
      {children}
    </td>
  );
};
