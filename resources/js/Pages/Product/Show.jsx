import GuestLayout from '@/Layouts/GuestLayout.jsx'
import { Head, Link, usePage } from '@inertiajs/react'
import { useCart } from '@/Hooks/useCart'
import { useEffect, useState } from 'react'
import { ShoppingCart, ArrowLeft, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates'
import { useI18n } from '@/Hooks/useI18n'

export default function ProductShow({ product, related = [], rate }) {
  const { addToCart } = useCart()
  const page = usePage()
  const settings = page.props?.settings || {}
  const pageRate = rate ?? page.props?.rate ?? null
  const { displayCurrency, baseCurrency, comparisonCurrency, formatPriceFromUsd, hasRateForCurrency } = useConfiguredCurrencyRates()
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [zoomState, setZoomState] = useState({ active: false, x: 50, y: 50 })
  const [touchStartX, setTouchStartX] = useState(null)
  const selectedImage = images[selectedImageIndex] ?? images[0] ?? null

  useEffect(() => {
    setSelectedImageIndex(0)
    setZoomState({ active: false, x: 50, y: 50 })
  }, [product?.id])

  const priceUsd = Number(product.price ?? product.price_usd ?? 0)
  const effectiveRate = pageRate ?? settings.currency?.bs_rate ?? 0

  const renderPrice = (amountUsd) => {
    const comparisonPrice = comparisonCurrency && comparisonCurrency !== displayCurrency && hasRateForCurrency(comparisonCurrency)
      ? formatPriceFromUsd(amountUsd, comparisonCurrency)
      : (displayCurrency !== baseCurrency ? formatPriceFromUsd(amountUsd, baseCurrency) : null)

    return (
      <>
        <p className="text-3xl font-bold text-primary mb-1">
          {formatPriceFromUsd(amountUsd, displayCurrency)}
        </p>
        {comparisonPrice && (
          <p className="text-sm text-muted-foreground">
            {comparisonPrice}
          </p>
        )}
      </>
    )
  }

  const handleAddToCart = () => {
    if ((product.stock ?? 0) <= 0) return
    addToCart({
      id: String(product.id),
      name: product.name,
      price: priceUsd,
      image: selectedImage?.url ?? images[0]?.url ?? product.image ?? '',
      category: product.category ?? (Array.isArray(product.categories) ? (product.categories[0]?.name ?? product.categories[0]) : undefined),
    })
  }

  const handleMainImageMouseMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * 100
    const y = ((event.clientY - bounds.top) / bounds.height) * 100

    setZoomState({ active: true, x, y })
  }

  const handleSelectImage = (index) => {
    setSelectedImageIndex(index)
    setZoomState({ active: false, x: 50, y: 50 })
  }

  const goToPreviousImage = () => {
    if (images.length <= 1) return

    setSelectedImageIndex((currentIndex) => (currentIndex === 0 ? images.length - 1 : currentIndex - 1))
    setZoomState({ active: false, x: 50, y: 50 })
  }

  const goToNextImage = () => {
    if (images.length <= 1) return

    setSelectedImageIndex((currentIndex) => (currentIndex === images.length - 1 ? 0 : currentIndex + 1))
    setZoomState({ active: false, x: 50, y: 50 })
  }

  const handleTouchStart = (event) => {
    setTouchStartX(event.touches[0]?.clientX ?? null)
  }

  const handleTouchEnd = (event) => {
    if (touchStartX === null || images.length <= 1) {
      setTouchStartX(null)
      return
    }

    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX
    const deltaX = touchStartX - touchEndX

    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        goToNextImage()
      } else {
        goToPreviousImage()
      }
    }

    setTouchStartX(null)
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
                <div
                  className="group relative w-full aspect-square bg-muted rounded-lg overflow-hidden mb-4"
                  onMouseMove={handleMainImageMouseMove}
                  onMouseEnter={() => setZoomState((current) => ({ ...current, active: true }))}
                  onMouseLeave={() => setZoomState({ active: false, x: 50, y: 50 })}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {selectedImage ? (
                    <img
                      src={selectedImage.url}
                      alt={t('product.image_alt', 'Imagen de :name', { name: product.name })}
                      className="h-full w-full object-cover transition duration-200 ease-out"
                      style={{
                        transform: zoomState.active ? 'scale(2)' : 'scale(1)',
                        transformOrigin: `${zoomState.x}% ${zoomState.y}%`,
                        cursor: zoomState.active ? 'zoom-in' : 'default',
                      }}
                    />
                  ) : (
                    <img
                      src="/placeholder.svg"
                      alt={t('product.image_alt', 'Imagen de :name', { name: product.name })}
                      className="object-cover w-full h-full"
                    />
                  )}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goToPreviousImage}
                        className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/70 text-white shadow-sm transition hover:bg-slate-950"
                        aria-label={t('product.previous_image', 'Imagen anterior')}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={goToNextImage}
                        className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/70 text-white shadow-sm transition hover:bg-slate-950"
                        aria-label={t('product.next_image', 'Imagen siguiente')}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950/60 px-3 py-1 text-xs text-white">
                        <span>{selectedImageIndex + 1}</span>
                        <span>/</span>
                        <span>{images.length}</span>
                      </div>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((img, index) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => handleSelectImage(index)}
                        className={`aspect-square overflow-hidden rounded border transition ${selectedImageIndex === index ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/60'}`}
                      >
                        <img
                          src={img.url}
                          alt={t('product.image_alt', 'Imagen de :name', { name: product.name })}
                          className="h-full w-full object-cover"
                        />
                      </button>
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
                    <p className="text-xs text-muted-foreground">{t('product.sku_label', 'SKU')}: {product.sku}</p>
                  )}
                  {product.barcode && (
                    <p className="text-xs text-muted-foreground">{t('product.barcode_label', 'Código')}: {product.barcode}</p>
                  )}
                </div>

                <div>{renderPrice(priceUsd)}</div>

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
                    (() => {
                      const relatedUsd = Number(rel.price ?? rel.price_usd ?? 0)
                      const relatedComparisonPrice = comparisonCurrency && comparisonCurrency !== displayCurrency && hasRateForCurrency(comparisonCurrency)
                        ? formatPriceFromUsd(relatedUsd, comparisonCurrency)
                        : (displayCurrency !== baseCurrency ? formatPriceFromUsd(relatedUsd, baseCurrency) : null)

                      return (
                    <Link
                      key={rel.id}
                      href={route('product.show', rel.id)}
                      className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary hover:shadow-md transition block"
                    >
                      <div className="w-full aspect-video bg-muted overflow-hidden">
                        <img
                          src={rel.image || '/placeholder.svg'}
                          alt={t('product.image_alt', 'Imagen de :name', { name: rel.name })}
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
                        <div className="mt-1">
                          <p className="text-sm font-bold text-primary">
                            {formatPriceFromUsd(relatedUsd, displayCurrency)}
                          </p>
                          {relatedComparisonPrice && (
                            <p className="text-xs text-muted-foreground">
                              {relatedComparisonPrice}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                      )
                    })()
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
