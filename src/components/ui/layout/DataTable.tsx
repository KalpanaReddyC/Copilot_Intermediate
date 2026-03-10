'use client';

import { ReactNode } from 'react';

/**
 * Column definition for the DataTable component
 * @template T - The type of data in each row
 */
export interface DataTableColumn<T> {
  /** Unique key for the column */
  key: string;
  /** Display header text */
  header: string;
  /** Function to render cell content */
  render: (item: T, index: number) => ReactNode;
  /** Optional width class (e.g., 'w-48') */
  width?: string;
  /** Optional text alignment class */
  align?: 'left' | 'center' | 'right';
}

/**
 * Props for the DataTable component
 * @template T - The type of data in each row
 */
export interface DataTableProps<T> {
  /** Array of data items to display */
  data: T[];
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Optional function to extract unique key from each row */
  getRowKey?: (item: T, index: number) => string | number;
  /** Optional additional CSS classes for the container */
  className?: string;
  /** Optional message to show when data is empty */
  emptyMessage?: string;
  /** Optional loading state */
  isLoading?: boolean;
}

/**
 * Reusable data table component with consistent styling and dark mode support
 * 
 * @example
 * ```tsx
 * const columns: DataTableColumn<Gallery>[] = [
 *   {
 *     key: 'name',
 *     header: 'Gallery Name',
 *     render: (gallery) => <div className="font-medium">{gallery.name}</div>
 *   },
 *   {
 *     key: 'actions',
 *     header: 'Actions',
 *     align: 'right',
 *     render: (gallery) => <button>Edit</button>
 *   }
 * ];
 * 
 * <DataTable
 *   data={galleries}
 *   columns={columns}
 *   getRowKey={(gallery) => gallery.id}
 * />
 * ```
 */
export function DataTable<T>({
  data,
  columns,
  getRowKey = (_, index) => index,
  className = '',
  emptyMessage = 'No data available',
  isLoading = false,
}: DataTableProps<T>) {
  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  if (isLoading) {
    return (
      <div className={`card-base overflow-hidden ${className}`}>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`card-base overflow-hidden ${className}`}>
        <div className="text-center py-16">
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-base overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`py-3 px-6 font-medium text-slate-700 dark:text-slate-300 ${getAlignmentClass(
                    column.align
                  )} ${column.width || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={getRowKey(item, index)} className="table-row">
                {columns.map((column) => (
                  <td
                    key={`${getRowKey(item, index)}-${column.key}`}
                    className={`py-4 px-6 ${getAlignmentClass(column.align)}`}
                  >
                    {column.render(item, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
