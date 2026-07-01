'use client'

import { motion, useReducedMotion } from 'framer-motion'
import * as React from 'react'

import { cn } from '@/lib/utils/cn'
import { Skeleton } from '@/components/ui/Skeleton'

export interface Column<T> {
  key: string
  header: string
  width?: string
  render: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[] | undefined
  isLoading?: boolean
  skeletonRows?: number
  emptyMessage?: string
  keyExtractor: (row: T) => string | number
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  skeletonRows = 6,
  emptyMessage = 'Aucune donnée',
  keyExtractor,
  className,
}: DataTableProps<T>) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-surface-white shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-cream/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-full max-w-[160px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !data || data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <p className="text-sm text-text-subtle">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <motion.tr
                  key={keyExtractor(row)}
                  initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut', delay: reduce ? 0 : i * 0.03 }}
                  className="transition-colors hover:bg-surface-cream/60"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5 text-text-body">
                      {col.render(row)}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
