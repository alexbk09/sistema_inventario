import React from 'react'
import { Trash2 } from 'lucide-react'

// Componente idéntico a la tarjeta del carrito de compra
export default function ProductCartItem({ item, t, onRemove, onQuantityChange }) {
  return (
    <div className="flex gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary transition">
      {/* Imagen */}
      <div className="relative w-20 h-20 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
        <img
          src={item.image || "/placeholder.svg"}
          alt={item.name}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-foreground line-clamp-2">
            {item.name}
          </h3>
          <p className="text-sm text-muted-foreground">{item.category}</p>
        </div>
        <p className="font-bold text-primary">
          ${item.price.toLocaleString('es-AR')}
        </p>
      </div>

      {/* Cantidad y eliminar */}
      <div className="flex flex-col justify-between items-end">
        <button
          onClick={() => onRemove(item.id)}
          className="text-muted-foreground hover:text-destructive transition"
          aria-label={t ? t('cart.remove_aria', 'Eliminar producto') : 'Eliminar producto'}
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1 bg-muted rounded-lg">
          <button
            onClick={() => onQuantityChange(item.id, Math.max(1, item.quantity - 1))}
            className="px-2 py-1 hover:bg-border transition"
          >
            −
          </button>
          <span className="px-2 py-1 font-semibold min-w-8 text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => onQuantityChange(item.id, item.quantity + 1)}
            className="px-2 py-1 hover:bg-border transition"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
