import { Link } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { useI18n } from '@/Hooks/useI18n'

function FeaturedProductCard({ product }) {
  const [imageIndex, setImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.image
      ? [{ id: 'single', url: product.image }]
      : []

  const currentImage = images[imageIndex] ?? images[0]

  useEffect(() => {
    setImageIndex(0)
  }, [product.id])

  useEffect(() => {
    if (images.length <= 1 || isHovered) return

    const interval = setInterval(() => {
      setImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }, 4000)

    return () => clearInterval(interval)
  }, [images.length, isHovered])

  return (
    <div
      className="bg-card rounded-lg overflow-hidden hover:shadow-lg transition group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full h-40 bg-muted overflow-hidden">
        {currentImage ? (
          <img
            src={currentImage.url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            loading="lazy"
          />
        ) : (
          <img
            src="/placeholder.svg"
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            loading="lazy"
          />
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
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-2 text-sm">
          {product.name}
        </h3>

        <div className="flex flex-col gap-1 mb-3">
          <p className="text-primary font-bold">USD ${Number(product.price).toFixed(2)}</p>
          <p className="text-muted-foreground text-xs">
            BS {Number(product.price_bs ?? product.priceBs ?? 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function FeaturedProducts({ products = [] }) {
  const { t } = useI18n()
  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-foreground">
          {t('home.featured.title', 'Productos destacados')}
        </h2>
        <Link
          href={route('shop.index')}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium"
        >
          {t('home.featured.cta', 'Ir a la tienda')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <FeaturedProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
