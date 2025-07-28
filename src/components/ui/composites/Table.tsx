'use client';

import React, { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ArrowUpDown, Search, Filter } from 'lucide-react';

const tableVariants = cva(
  'w-full border-collapse rounded-lg overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-gray-800 border border-gray-700',
        bordered: 'bg-gray-800 border-2 border-gray-600',
        minimal: 'bg-transparent'
      },
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
);

const cellVariants = cva(
  'px-3 py-3 text-left transition-colors',
  {
    variants: {
      variant: {
        header: 'bg-gray-700 text-gray-100 font-semibold border-b border-gray-600',
        body: 'bg-gray-800 text-gray-200 border-b border-gray-700/50 hover:bg-gray-750',
        minimal: 'bg-transparent text-gray-200 border-b border-gray-700/30'
      },
      align: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right'
      },
      size: {
        sm: 'px-2 py-2 text-xs',
        md: 'px-3 py-3 text-sm',
        lg: 'px-4 py-4 text-base'
      }
    },
    defaultVariants: {
      variant: 'body',
      align: 'left',
      size: 'md'
    }
  }
);

interface TableColumn<T = Record<string, unknown>> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  mobileHidden?: boolean;
}

interface TableProps<T = Record<string, unknown>> extends VariantProps<typeof tableVariants> {
  columns: TableColumn<T>[];
  data: T[];
  className?: string;
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  mobileScrollable?: boolean;
  onRowClick?: (row: T, index: number) => void;
}

export const Table = <T extends Record<string, unknown>>({
  columns,
  data,
  className,
  variant,
  size,
  sortable = false,
  searchable = false,
  filterable = false,
  loading = false,
  emptyMessage = 'No data available',
  mobileScrollable = true,
  onRowClick,
  ...props
}: TableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const handleSort = (key: string) => {
    if (!sortable) return;
    
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    let sortedData = [...data];

    // Apply search
    if (searchTerm) {
      sortedData = sortedData.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        sortedData = sortedData.filter(row =>
          String(row[key]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig) {
      sortedData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortedData;
  };

  const sortedData = getSortedData();

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
  };

  if (loading) {
    return <TableSkeleton columns={columns} rows={5} />;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      {(searchable || filterable) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {searchable && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
          
          {filterable && (
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 hover:bg-gray-600 transition-colors">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table Container */}
      <div className={cn(
        'overflow-hidden rounded-lg border border-gray-700',
        mobileScrollable && 'overflow-x-auto'
      )}>
        <table
          className={cn(tableVariants({ variant, size }), className)}
          {...props}
        >
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    cellVariants({ 
                      variant: 'header', 
                      align: column.align,
                      size 
                    }),
                    column.mobileHidden && 'hidden sm:table-cell',
                    (sortable && column.sortable !== false) && 'cursor-pointer select-none hover:bg-gray-600',
                    column.width && `w-[${column.width}]`
                  )}
                  style={{ width: column.width }}
                  onClick={() => (sortable && column.sortable !== false) && handleSort(column.key)}
                >
                  <div className="flex items-center justify-between">
                    <span>{column.header}</span>
                    {(sortable && column.sortable !== false) && (
                      <span className="ml-2">
                        {getSortIcon(column.key)}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={cn(cellVariants({ variant: 'body', align: 'center', size }))}
                >
                  <div className="py-8 text-gray-400">
                    {emptyMessage}
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr
                  key={index}
                  className={cn(
                    'group',
                    onRowClick && 'cursor-pointer hover:bg-gray-750'
                  )}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        cellVariants({ 
                          variant: variant === 'minimal' ? 'minimal' : 'body',
                          align: column.align,
                          size 
                        }),
                        column.mobileHidden && 'hidden sm:table-cell'
                      )}
                    >
                      {column.render 
                        ? column.render(row[column.key], row)
                        : String(row[column.key] || '')
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (Alternative) */}
      <div className="sm:hidden space-y-3">
        {sortedData.map((row, index) => (
          <div
            key={index}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            onClick={() => onRowClick?.(row, index)}
          >
            {columns
              .filter(col => !col.mobileHidden)
              .map((column) => (
                <div key={column.key} className="flex justify-between py-1">
                  <span className="text-gray-400 text-sm font-medium">
                    {column.header}:
                  </span>
                  <span className="text-gray-100 text-sm">
                    {column.render 
                      ? column.render(row[column.key], row)
                      : String(row[column.key] || '')
                    }
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const TableSkeleton: React.FC<{ columns: TableColumn<unknown>[]; rows: number }> = ({ 
  columns, 
  rows 
}) => (
  <div className="overflow-hidden rounded-lg border border-gray-700">
    <table className="w-full">
      <thead>
        <tr className="bg-gray-700">
          {columns.map((column) => (
            <th
              key={column.key}
              className="px-3 py-3 text-left"
            >
              <div className="h-4 bg-gray-600 rounded animate-pulse" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex} className="border-b border-gray-700">
            {columns.map((column) => (
              <td key={column.key} className="px-3 py-3">
                <div className="h-4 bg-gray-700 rounded animate-pulse" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const TableDemo: React.FC = () => {
  const sampleData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', bookings: 12 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Pending', bookings: 8 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Inactive', bookings: 3 },
    { id: 4, name: 'Alice Wilson', email: 'alice@example.com', status: 'Active', bookings: 15 },
  ];

  const columns: TableColumn[] = [
    { 
      key: 'name', 
      header: 'Customer Name',
      sortable: true 
    },
    { 
      key: 'email', 
      header: 'Email',
      mobileHidden: true 
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (value) => (
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          {
            'bg-green-900 text-green-100': value === 'Active',
            'bg-yellow-900 text-yellow-100': value === 'Pending',
            'bg-red-900 text-red-100': value === 'Inactive'
          }
        )}>
          {String(value)}
        </span>
      )
    },
    { 
      key: 'bookings', 
      header: 'Bookings',
      align: 'right' as const,
      sortable: true 
    }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-100">Responsive Table</h3>
      
      <Table
        columns={columns}
        data={sampleData}
        sortable
        searchable
        filterable
        onRowClick={(row) => console.log('Clicked:', row)}
      />
    </div>
  );
};