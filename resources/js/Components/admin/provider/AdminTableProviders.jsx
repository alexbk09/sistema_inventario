import React from "react"

import { ChevronLeft, ChevronRight, Edit, Trash2, Eye } from 'lucide-react'
import AdminPagination from '@/Components/admin/AdminPagination.jsx'
import { useI18n } from '@/Hooks/useI18n'

export default function AdminTable({
  columns = [],
  data = [],
  page = 1,
  totalPages = 1,
  onPageChange = () => {},
  onEdit,
  onDelete,
  onView,
  loading = false,
}) {
  const { t } = useI18n()

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="bg-muted border-b border-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-left text-sm font-semibold text-foreground"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete || onView) && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                  {t('admin.providers.index.table.actions', 'Acciones')}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete || onView ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground">
                  {t('admin.providers.index.states.loading', 'Cargando...')}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete || onView ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground">
                  {t('admin.providers.index.states.empty', 'No hay registros')}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="border-b border-border hover:bg-muted/50 transition">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3 text-sm text-foreground">
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key] || '-')}
                    </td>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {onView && (
                          <button
                            onClick={() => onView(row)}
                            className="p-1 hover:bg-muted rounded transition text-foreground"
                            title={t('admin.providers.index.actions.view', 'Ver')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="p-1 hover:bg-muted rounded transition text-accent"
                            title={t('admin.providers.index.actions.edit', 'Editar')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="p-1 hover:bg-destructive/10 rounded transition text-destructive"
                            title={t('admin.providers.index.actions.delete', 'Eliminar')}
                          >
                            <Trash2 className="w-4 h-4" />
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

      <AdminPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  )
}
