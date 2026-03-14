import GuestLayout from '@/Layouts/GuestLayout.jsx'
import { Head, Link, usePage } from '@inertiajs/react'
import { useCart } from '@/Hooks/useCart'
import { ShoppingCart, ArrowLeft, Star } from 'lucide-react'
import { useDisplayCurrency } from '@/Hooks/useDisplayCurrency'
import { useI18n } from '@/Hooks/useI18n'

export default function ProductShow({ product, related = [], rate }) {
  const { addToCart } = useCart()
  const page = usePage()
  const settings = page.props?.settings || {}
  const pageRate = rate ?? page.props?.rate ?? null
  const { displayCurrency, baseCurrency, secondaryCurrency } = useDisplayCurrency()
  const { t } = useI18n()

  if (!product) {
    return (
      <GuestLayout>
        <main className="flex flex-col min-h-screen bg-background">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-4">
                {t('product.not_found_title', 'Producto no encontrado')}
              </h1>
              <Link
                href={route('shop.index')}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                {t('product.back_to_shop', 'Volver a la tienda')}
              </Link>
            </div>
          </div>
        </main>
      </GuestLayout>
    )
  }

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.image
      ? [{ id: 'single', url: product.image }]
      : []

  const priceUsd = Number(product.price ?? product.price_usd ?? 0)
  const effectiveRate = pageRate ?? settings.currency?.bs_rate ?? 0
  const priceBs = Number(
    product.price_bs ?? (priceUsd * (effectiveRate || 0))
  )

  const handleAddToCart = () => {
    if ((product.stock ?? 0) <= 0) return
    addToCart({
      id: String(product.id),
      name: product.name,
      price: priceUsd,
      image: images[0]?.url ?? product.image ?? '',
      category: product.category ?? (Array.isArray(product.categories) ? (product.categories[0]?.name ?? product.categories[0]) : undefined),
    })
  }

  return (
    <GuestLayout>
      <Head title={product.name} />
      <main className="flex flex-col min-h-screen bg-background">
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-4 flex items-center justify-between">
              <Link
                href={route('shop.index')}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="w-4 h-4" /> {t('product.back_to_shop', 'Volver a la tienda')}
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Galería */}
              <div>
                <div className="w-full aspect-square bg-muted rounded-lg overflow-hidden mb-4">
                  {images[0] ? (
                    <img
                      src={images[0].url}
                      alt={product.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <img
                      src="/placeholder.svg"
                      alt={product.name}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((img) => (
                      <div key={img.id} className="aspect-square rounded border border-border overflow-hidden">
                        <img
                          src={img.url}
                          alt={product.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detalle */}
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs text-accent font-semibold uppercase mb-1 tracking-wide">
                    {product.category ?? (Array.isArray(product.categories) ? (product.categories[0]?.name ?? product.categories[0]) : '')}
                  </p>
                  <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating ?? 5)
                              ? 'fill-accent text-accent'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ({product.reviews ?? 0})
                    </span>
                  </div>
                  {product.sku && (
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                  )}
                  {product.barcode && (
                    <p className="text-xs text-muted-foreground">Código: {product.barcode}</p>
                  )}
                </div>

                <div>
                  {displayCurrency === (secondaryCurrency || 'VES') ? (
                    <>
                      <p className="text-3xl font-bold text-primary mb-1">
                        {secondaryCurrency || 'Bs.'}{' '}
                        {priceBs.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {baseCurrency || 'USD'} ${priceUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-primary mb-1">
                        {baseCurrency || 'USD'} ${priceUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {secondaryCurrency || 'Bs.'}{' '}
                        {priceBs.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </>
                  )}
                </div>

                {product.description && (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">
                      {t('product.description', 'Descripción')}
                    </h2>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2 mt-4">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={(product.stock ?? 0) <= 0}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {(product.stock ?? 0) <= 0
                      ? t('product.out_of_stock', 'Sin stock')
                      : t('product.add_to_cart', 'Agregar al carrito')}
                  </button>
                  {typeof product.stock !== 'undefined' && (
                    <p className="text-xs text-muted-foreground">
                      {t('product.stock_label', `Stock disponible: ${product.stock}`, {
                        count: product.stock,
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Relacionados */}
            {related.length > 0 && (
              <section className="mt-12">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  {t('product.related_title', 'Productos relacionados')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {related.map((rel) => (
                    <Link
                      key={rel.id}
                      href={route('product.show', rel.id)}
                      className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary hover:shadow-md transition block"
                    >
                      <div className="w-full aspect-video bg-muted overflow-hidden">
                        <img
                          src={rel.image || '/placeholder.svg'}
                          alt={rel.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="p-3 flex flex-col gap-1">
                        <p className="text-xs text-accent font-semibold uppercase">
                          {rel.category}
                        </p>
                        <p className="text-sm font-semibold text-foreground line-clamp-2">
                          {rel.name}
                        </p>
                        <p className="text-sm font-bold text-primary mt-1">
                          ${Number(rel.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </GuestLayout>
  )
}
