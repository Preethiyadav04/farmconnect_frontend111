import React from 'react';
import Loading from './Loading';
import EmptyState from './EmptyState';

/**
 * Reusable responsive DataTable component.
 */
export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records to display.',
  keyField = 'id',
  className = '',
}) => {
  if (loading) {
    return (
      <div className="py-12 bg-white rounded-2xl border border-slate-200/80">
        <Loading text="Loading records..." fullPage={false} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className={`px-4 sm:px-6 py-3.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {data.map((row, rowIdx) => (
              <tr key={row[keyField] || rowIdx} className="hover:bg-slate-50/70 transition-colors">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`px-4 sm:px-6 py-3.5 ${col.cellClassName || ''}`}>
                    {typeof col.render === 'function' ? col.render(row, rowIdx) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
