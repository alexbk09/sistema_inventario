import React, { memo } from "react"
import { Edit, Trash2, Eye } from 'lucide-react'
import AdminPagination from '@/Components/admin/AdminPagination.jsx'
import EmptyState from '@/Components/admin/EmptyState.jsx'
import TableSkeleton from '@/Components/admin/TableSkeleton.jsx'
import { useI18n } from '@/Hooks/useI18n'

function AdminTable({
  columns = [],
  data = [],
  page = 1,
  totalPages = 1,
  onPageChange = () => {},
  onEdit,
  onDelete,
  onView,
  loading = false,
  emptyTitle,
  emptyDescription,
  emptyPreset = 'default',
}) {
  const { t } = useI18n()
  const colSpan = columns.length + (onEdit || onDelete || onView ? 1 : 0)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        {loading ? (
          <>
            <div className="bg-muted border-b border-border px-4 py-3 flex gap-4">
              {columns.map((col) => (
                <div key={String(col.key)} className="h-4 bg-border/60 rounded" style={{ width: col.width ?? '80px' }} />
              ))}
            </div>
            <TableSkeleton rows={6} cols={columns.length} />
          </>
        ) : data.length === 0 ? (
          <EmptyState
            title={emptyTitle ?? t('admin.common.table.empty', 'Sin registros')}
            description={emptyDescription ?? t('admin.common.table.empty_desc', 'No hay datos que coincidan con tu búsqueda o filtros.')}
            preset={emptyPreset}
            size="md"
          />
        ) : (
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                    style={{ width: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
                {(onEdit || onDelete || onView) && (
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide w-24">
                    {t('admin.common.table.actions', 'Acciones')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <Row
                  key={row.id}
                  row={row}
                  columns={columns}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onView={onView}
                  t={t}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && data.length > 0 && (
        <AdminPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  )
}

  const Row = memo(function Row({ row, columns, onEdit, onDelete, onView, t }) {
    return (
      <tr className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors group">
        {columns.map((col) => (
          <td key={String(col.key)} className="px-4 py-3 text-sm text-foreground">
            {col.render
              ? col.render(row[col.key], row)
              : String(row[col.key] ?? '—')}
          </td>
        ))}
        {(onEdit || onDelete || onView) && (
          <td className="px-4 py-3 text-sm">
            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onView && (
                <button
                  onClick={() => onView(row)}
                  className="p-1.5 hover:bg-primary/10 rounded-md transition text-muted-foreground hover:text-primary"
                  title={t('admin.common.table.view', 'Ver')}
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(row)}
                  className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition text-muted-foreground hover:text-blue-600"
                  title={t('admin.common.table.edit', 'Editar')}
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(row)}
                  className="p-1.5 hover:bg-destructive/10 rounded-md transition text-muted-foreground hover:text-destructive"
                  title={t('admin.common.table.delete', 'Eliminar')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </td>
        )}
      </tr>
    )
  })

  export default memo(AdminTable)
