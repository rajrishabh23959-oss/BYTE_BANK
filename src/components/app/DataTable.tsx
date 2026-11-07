import React from 'react';

export interface Column<T = any> {
  key: string;
  header: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  keyExtractor?: (item: T, index: number) => string | number;
  loading?: boolean;
  emptyMessage?: React.ReactNode;
  maxHeight?: string;
  className?: string;
  rowHeightClass?: string;
}

export default function DataTable<T = any>({
  columns,
  data,
  keyExtractor = (_, index) => index,
  loading = false,
  emptyMessage = 'No records found.',
  maxHeight,
  className = '',
  rowHeightClass = 'h-14',
}: DataTableProps<T>) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#E8ECF6] shadow-[0_8px_30px_rgba(27,11,92,0.08)] overflow-hidden ${className}`}
    >
      <div
        className="overflow-x-auto relative"
        style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
      >
        <table className="w-full text-left text-xs text-[#2B2F4A] border-collapse">
          <thead className="bg-[#F6F8FF] text-[#6B7090] border-b border-[#E8ECF6] sticky top-0 z-10 uppercase text-xs tracking-wider font-semibold">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3.5 px-4 font-semibold ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  } ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#EEF1FA] bg-white">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className={rowHeightClass}>
                  {columns.map((col) => (
                    <td key={`col-${col.key}`} className="py-3 px-4">
                      <div className="h-4 bg-[#F0F3FA] rounded-md animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 px-4 text-center text-sm font-medium text-[#6B7090]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={keyExtractor(item, index)}
                  className={`${rowHeightClass} hover:bg-[#F6F8FF] transition-colors`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3 px-4 ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.render ? col.render(item, index) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

