import React from "react"

import { Search, Plus } from 'lucide-react'

export default function AdminFilters({
  searchPlaceholder = 'Buscar...',
  searchValue = '',
  onSearchChange = () => {},
  onAddNew,
  addButtonLabel = 'Nuevo',
  children,
}) {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
          />
        </div>

        {/* Botón Nuevo */}
        {onAddNew && (
          <button
            onClick={onAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            {addButtonLabel}
          </button>
        )}
      </div>

      {/* Filtros adicionales */}
      {children}
    </div>
  )
}
