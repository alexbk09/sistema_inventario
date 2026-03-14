import { useCart } from '@/Hooks/useCart'
import { usePage, router } from '@inertiajs/react'
import { Trash2, X, ShoppingBag, ShoppingCart as ShoppingCartIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import NavLink from '@/Components/NavLink';
import { useDisplayCurrency } from '@/Hooks/useDisplayCurrency'
import { useI18n } from '@/Hooks/useI18n'

export default function ShoppingCart({ isOpen, onClose }) {
  const { cart, removeFromCart, updateQuantity, clearCart, addToCart } = useCart()
  const user = usePage().props?.auth?.user
  const [rateBs, setRateBs] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [isLoadingRecs, setIsLoadingRecs] = useState(false)
  const { displayCurrency, baseCurrency, secondaryCurrency } = useDisplayCurrency()
  const { t } = useI18n()

  // Obtener el promedio (tasa) desde el backend para calcular Total BS
  useEffect(() => {
    if (!isOpen) return
    setRateBs(null)
    fetch('/api/currency/promedio?fuente=oficial', { cache: 'no-store' })
      .then((res) => res.ok ? res.json() : Promise.reject(res))
      .then((data) => {
        const val = typeof data?.promedio === 'number' ? data.promedio : null
        setRateBs(val)
      })
      .catch(() => setRateBs(null))
  }, [isOpen])

  // Recomendaciones para upselling en el carrito
  useEffect(() => {
    if (!isOpen) return

    setRecommendations([])
    setIsLoadingRecs(true)

    fetch('/api/recommendations/cart', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (data && data.ok && Array.isArray(data.items)) {
          setRecommendations(data.items)
        } else {
          setRecommendations([])
        }
      })
      .catch(() => {
        setRecommendations([])
      })
      .finally(() => {
        setIsLoadingRecs(false)
      })
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Carrito */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-lg z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              {t('cart.title', 'Mi Carrito')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition"
            aria-label={t('cart.close_aria', 'Cerrar carrito')}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg mb-2">
                {t('cart.empty_title', 'Tu carrito está vacío')}
              </p>
              <p className="text-muted-foreground text-sm">
                {t('cart.empty_description', 'Agrega productos para comenzar a comprar')}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary transition"
                  >
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
                        onClick={() => {
                          removeFromCart(item.id)
                          if (user) {
                            try {
                              router.post(route('cart.remove'), { product_id: Number(item.id) }, { preserveScroll: true })
                            } catch (e) {
                              console.warn('No se pudo sincronizar eliminar en servidor:', e)
                            }
                          }
                        }}
                        className="text-muted-foreground hover:text-destructive transition"
                        aria-label="Eliminar producto"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      <div className="flex items-center gap-1 bg-muted rounded-lg">
                        <button
                          onClick={() => {
                            const q = Math.max(1, item.quantity - 1)
                            updateQuantity(item.id, q)
                            if (user) {
                              try {
                                router.post(route('cart.update'), { product_id: Number(item.id), quantity: q }, { preserveScroll: true })
                              } catch (e) {
                                console.warn('No se pudo sincronizar cantidad en servidor:', e)
                              }
                            }
                          }}
                          className="px-2 py-1 hover:bg-border transition"
                        >
                          −
                        </button>
                        <span className="px-2 py-1 font-semibold min-w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => {
                            const q = item.quantity + 1
                            updateQuantity(item.id, q)
                            if (user) {
                              try {
                                router.post(route('cart.update'), { product_id: Number(item.id), quantity: q }, { preserveScroll: true })
                              } catch (e) {
                                console.warn('No se pudo sincronizar cantidad en servidor:', e)
                              }
                            }
                          }}
                          className="px-2 py-1 hover:bg-border transition"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recomendaciones */}
              <div className="border-t border-border pt-4">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t('cart.recommendations_title', 'También te puede interesar')}
                </h3>
                {isLoadingRecs ? (
                  <p className="text-sm text-muted-foreground">
                    {t('cart.recommendations_loading', 'Cargando recomendaciones...')}
                  </p>
                ) : recommendations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t('cart.recommendations_empty', 'No hay recomendaciones por ahora.')}
                  </p>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className="min-w-[170px] bg-card border border-border rounded-lg p-3 flex flex-col justify-between"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="w-full h-24 bg-muted rounded-md overflow-hidden mb-1">
                            <img
                              src={rec.image || '/placeholder.svg'}
                              alt={rec.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <p className="text-sm font-semibold text-foreground line-clamp-2">
                            {rec.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {rec.category}
                          </p>
                          <p className="text-sm font-bold text-primary">
                            ${Number(rec.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (rec.stock !== undefined && rec.stock <= 0) return
                            addToCart({
                              id: String(rec.id),
                              name: rec.name,
                              price: Number(rec.price ?? 0),
                              image: rec.image || '',
                              category: rec.category || '',
                            })
                            if (user) {
                              try {
                                router.post(route('cart.add'), { product_id: rec.id, quantity: 1 }, { preserveScroll: true })
                              } catch (e) {
                                console.warn('No se pudo sincronizar el carrito en servidor:', e)
                              }
                            }
                          }}
                          className="mt-3 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
                        >
                          <ShoppingCartIcon className="w-3 h-3" />
                          {t('cart.add_button', 'Agregar')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="border-t border-border p-6 space-y-4">
            {/* Subtotal */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('cart.subtotal', 'Subtotal:')}
                </span>
                {displayCurrency === (secondaryCurrency || 'VES') && rateBs != null ? (
                  <span className="text-foreground">
                    {(secondaryCurrency || 'Bs.') + ' '}
                    {(cart.total * rateBs).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                ) : (
                  <span className="text-foreground">
                    ${cart.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('cart.shipping', 'Envío:')}
                </span>
                <span className="text-foreground">
                  {t('cart.shipping_calculated_at_checkout', 'Cálculo en checkout')}
                </span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="font-bold text-foreground">
                  {t('cart.total', 'Total:')}
                </span>
                {displayCurrency === (secondaryCurrency || 'VES') && rateBs != null ? (
                  <span className="font-bold text-lg text-primary">
                    {(secondaryCurrency || 'Bs.') + ' '}
                    {(cart.total * rateBs).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                ) : (
                  <span className="font-bold text-lg text-primary">
                    ${cart.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="font-bold text-foreground">
                  {t('cart.total_bs', 'Total BS:')}
                </span>
                <span className="font-bold text-lg text-primary">
                  {rateBs != null
                    ? `Bs ${ (cart.total * rateBs).toLocaleString('es-AR', { minimumFractionDigits: 2 }) }`
                    : '…'}
                </span>
              </div>
            </div>

            {/* Botones */}
            <button
              type="button"
              onClick={() => {
                const url =  route('checkout.index')
    
                  window.location.href = url
                
                onClose?.()
              }}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition text-center"
            >
              {t('cart.checkout_button', 'Proceder al Pago')}
            </button>

            <button
              onClick={() => {
                onClose()
                clearCart()
                if (user) {
                  try {
                    router.post(route('cart.clear'), {}, { preserveScroll: true })
                  } catch (e) {
                    console.warn('No se pudo vaciar carrito en servidor:', e)
                  }
                }
              }}
              className="w-full text-muted-foreground hover:text-foreground transition font-semibold"
            >
              {t('cart.clear_button', 'Vaciar Carrito')}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
