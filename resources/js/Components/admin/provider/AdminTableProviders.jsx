import React from "react"

import { ChevronLeft, ChevronRight, Edit, Trash2, Eye } from 'lucide-react'

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
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete || onView ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground">
                  Cargando...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete || onView ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground">
                  No hay registros
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
                            title="Ver"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="p-1 hover:bg-muted rounded transition text-accent"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="p-1 hover:bg-destructive/10 rounded transition text-destructive"
                            title="Eliminar"
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

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="p-2 hover:bg-muted rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="p-2 hover:bg-muted rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
