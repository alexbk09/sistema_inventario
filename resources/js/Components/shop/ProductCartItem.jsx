import React from 'react'
import { Trash2 } from 'lucide-react'

// Componente idéntico a la tarjeta del carrito de compra
export default function ProductCartItem({ item, t, onRemove, onQuantityChange }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-4 transition hover:border-primary/50 sm:flex-row sm:items-start">
      {/* Imagen */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
        <img
          src={item.image || "/placeholder.svg"}
          alt={item.name}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div>
          <h3 className="line-clamp-2 pr-2 text-sm font-semibold text-foreground sm:text-base">
            {item.name}
          </h3>
          <p className="truncate text-xs text-muted-foreground sm:text-sm">{item.category}</p>
        </div>
        <p className="mt-3 text-sm font-bold text-primary sm:text-base">
          ${item.price.toLocaleString('es-AR')}
        </p>
      </div>

      {/* Cantidad y eliminar */}
      <div className="flex items-center justify-between gap-3 sm:min-w-[124px] sm:flex-col sm:items-end">
        <button
          onClick={() => onRemove(item.id)}
          className="rounded-full p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          aria-label={t ? t('cart.remove_aria', 'Eliminar producto') : 'Eliminar producto'}
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
          <button
            onClick={() => onQuantityChange(item.id, Math.max(1, item.quantity - 1))}
            className="rounded-lg px-2 py-1 transition hover:bg-border"
          >
            −
          </button>
          <span className="min-w-8 px-2 py-1 text-center font-semibold">
            {item.quantity}
          </span>
          <button
            onClick={() => onQuantityChange(item.id, item.quantity + 1)}
            className="rounded-lg px-2 py-1 transition hover:bg-border"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
