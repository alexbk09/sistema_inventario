import { useCart } from '@/Hooks/useCart'
import { usePage, router } from '@inertiajs/react'
import { Star, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
export default function ProductCard({
  product,
  onAddedToCart,
}) {
  const { addToCart } = useCart()
  const user = usePage().props?.auth?.user
  const [isAdding, setIsAdding] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const pageRate = usePage().props?.rate ?? null
  const [imageIndex, setImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const primaryImageUrl = Array.isArray(product.images) && product.images.length > 0
    ? product.images[0]?.url
    : (product.image ?? '')

  const handleAddToCart = async () => {
    if (product.stock <= 0) return

    setIsAdding(true)
    try {
      console.log('[v0] Agregando producto al carrito:', {
        id: String(product.id),
        name: product.name,
        price: Number(product.price ?? product.price_usd ?? 0),
      })
      addToCart({
        id: String(product.id),
        name: product.name,
        price: Number(product.price ?? product.price_usd ?? 0),
        image: primaryImageUrl,
        category: product.category ?? (Array.isArray(product.categories) ? (product.categories[0]?.name ?? product.categories[0]) : undefined),
      })

      // Si el usuario está autenticado, sincroniza también con el backend
      if (user) {
        try {
          router.post(route('cart.add'), { product_id: product.id, quantity: 1 }, { preserveScroll: true })
        } catch (e) {
          console.warn('No se pudo sincronizar el carrito en servidor:', e)
        }
      }
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 2000)
      onAddedToCart?.()
    } finally {
      setIsAdding(false)
    }
  }
  console.log('Renderizando ProductCard, rate:', pageRate ?? window?.BS_RATE)
  const isOutOfStock = product.stock <= 0
  const priceUsd = Number(product.price ?? product.price_usd ?? 0)
  const priceBs = Number(
    product.price_bs ?? (priceUsd * ((pageRate ?? window?.BS_RATE ?? 0)))
  )

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : primaryImageUrl
      ? [{ id: 'single', url: primaryImageUrl }]
      : []

  const currentImage = images[imageIndex] ?? images[0]

  useEffect(() => {
    if (images.length <= 1 || isHovered) return

    const interval = setInterval(() => {
      setImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }, 4000)

    return () => clearInterval(interval)
  }, [images.length, isHovered])

  return (
    <div
      className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary hover:shadow-lg transition-all duration-300 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative w-full h-48 bg-muted overflow-hidden">
        {currentImage ? (
          <img
            src={currentImage.url}
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <img
            src="/placeholder.svg"
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
          />
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 hover:bg-black/60"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 hover:bg-black/60"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((img, index) => (
              <button
                key={img.id ?? index}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setImageIndex(index)
                }}
                className={`w-2 h-2 rounded-full border border-white transition-all ${
                  index === imageIndex ? 'bg-white scale-110' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Sin Stock</span>
          </div>
        )}
        {product.stock > 0 && (
          <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-semibold text-white">
            {product.stock} disponibles
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col h-full">
        {/* Category */}
        <p className="text-xs text-accent font-semibold uppercase mb-1 tracking-wide">
          {product.category ?? (Array.isArray(product.categories) ? (product.categories[0]?.name ?? product.categories[0]) : '')}
        </p>

        {/* Name */}
        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating)
                    ? 'fill-accent text-accent'
                    : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            ({product.reviews})
          </span>
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-muted-foreground">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div>
          <p className="text-2xl font-bold text-primary">
            USD ${priceUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">
            BS {priceBs.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Button */}
        <button
          onClick={handleAddToCart}
          disabled={isAdding || isOutOfStock}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 border border-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-primary ${
            isOutOfStock
              ? 'bg-muted text-foreground cursor-not-allowed opacity-100'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          {isAdding ? 'Agregando...' : 'Agregar al Carrito'}
        </button>

        {/* Notification */}
        {showNotification && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700 text-center animate-fade-in">
            ✓ Agregado al carrito
          </div>
        )}
      </div>
    </div>
  )
}
