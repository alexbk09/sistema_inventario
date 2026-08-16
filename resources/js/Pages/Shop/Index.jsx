import GuestLayout from '@/Layouts/GuestLayout.jsx';
import ProductCard from '@/Components/ProductCard.jsx'
import ProductFilters from '@/Components/shop/ProductFilters.jsx'
import ShoppingCart from '@/Components/shop/ShoppingCart.jsx'
import QuickView from '@/Components/shop/QuickView.jsx'
import ProductCompare from '@/Components/shop/ProductCompare.jsx'
import Breadcrumb from '@/Components/shop/Breadcrumb.jsx'
import { useState, useMemo } from 'react'
import { ShoppingBag, ChevronLeft, ChevronRight, Scale } from 'lucide-react'
import { useCart } from '@/Hooks/useCart'
import { useI18n } from '@/Hooks/useI18n'
import { router } from '@inertiajs/react'
import { useEffect } from 'react'

const ensureArray = (value) => {
  if (Array.isArray(value)) {
    return value
  }

  if (value && typeof value === 'object') {
    return Object.values(value)
  }

  return []
}

export default function ShopIndex({ products = {}, categories = [], filters = {}, canLogin }) {
  const { t } = useI18n()
  const [localFilters, setLocalFilters] = useState({
    categories: [],
    priceRange: [0, 5000],
    search: filters.search || '',
    sortBy: filters.sort || 'latest',
    inStockOnly: filters.in_stock === 'true' || filters.in_stock === true,
    tags: [],
  })
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const [compareProducts, setCompareProducts] = useState([])
  const [isCompareOpen, setIsCompareOpen] = useState(false)
  const { itemCount } = useCart()
  const [productList, setProductList] = useState(() => ensureArray(products.data))
  const [page, setPage] = useState(products.current_page || 1)
  const [lastPage, setLastPage] = useState(products.last_page || 1)
  const [loadingMore, setLoadingMore] = useState(false)
  const safeCategories = ensureArray(categories)

  // Sincronizar filtros del servidor con estado local
  useEffect(() => {
    setLocalFilters({
      categories: filters.category ? [filters.category] : [],
      priceRange: [
        filters.min_price ? parseFloat(filters.min_price) : 0,
        filters.max_price ? parseFloat(filters.max_price) : 5000
      ],
      search: filters.search || '',
      sortBy: filters.sort || 'latest',
      inStockOnly: filters.in_stock === 'true' || filters.in_stock === true,
      tags: [],
    })
  }, [filters])

  // Filtrar y ordenar productos (solo sobre los cargados)
  const filteredProducts = useMemo(() => {
    let result = [...productList]

    // Filtro por búsqueda (nombre, descripción, SKU, código de barras)
    if (localFilters.search) {
      const term = localFilters.search.toLowerCase()
      result = result.filter((p) => {
        const name = p.name?.toLowerCase() ?? ''
        const desc = p.description?.toLowerCase() ?? ''
        const sku = p.sku?.toLowerCase() ?? ''
        const barcode = String(p.barcode ?? '').toLowerCase()
        return (
          name.includes(term) ||
          desc.includes(term) ||
          sku.includes(term) ||
          barcode.includes(term)
        )
      })
    }

    // Filtro por categorías
    if (localFilters.categories.length > 0) {
      result = result.filter((p) => {
        const productCategories = (p.categories || []).map((c) => (typeof c === 'string' ? c : c.name))
        return localFilters.categories.some((c) => productCategories.includes(c))
      })
    }

    // Filtro por rango de precio
    result = result.filter(
      (p) => p.price >= localFilters.priceRange[0] && p.price <= localFilters.priceRange[1]
    )

    // Filtro por disponibilidad (solo con stock)
    if (localFilters.inStockOnly) {
      result = result.filter((p) => (p.stock ?? 0) > 0)
    }

    // Filtro por etiquetas simples (por ahora: destacados)
    if (localFilters.tags && localFilters.tags.length > 0) {
      if (localFilters.tags.includes('featured')) {
        result = result.filter((p) => !!p.is_featured)
      }
    }

    // Ordenamiento
    switch (localFilters.sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'newest':
        result.sort((a, b) => {
          const da = a.created_at ? new Date(a.created_at) : new Date(0)
          const db = b.created_at ? new Date(b.created_at) : new Date(0)
          return db - da
        })
        break
      case 'best-sellers':
        result.sort((a, b) => (b.sold_quantity ?? 0) - (a.sold_quantity ?? 0))
        break
      default:
        // relevance (sin cambios)
        break
    }

    return result
  }, [localFilters, productList])

  // Aplicar filtros con navegación URL
  const applyFilters = (newFilters) => {
    const urlParams = new URLSearchParams()
    
    if (newFilters.search) urlParams.set('search', newFilters.search)
    if (newFilters.categories.length > 0) urlParams.set('category', newFilters.categories[0])
    if (newFilters.priceRange[0] > 0) urlParams.set('min_price', newFilters.priceRange[0])
    if (newFilters.priceRange[1] < 5000) urlParams.set('max_price', newFilters.priceRange[1])
    if (newFilters.inStockOnly) urlParams.set('in_stock', 'true')
    if (newFilters.sortBy !== 'latest') urlParams.set('sort', newFilters.sortBy)
    
    urlParams.set('page', 1)
    
    router.get(route('shop.index') + '?' + urlParams.toString(), {}, {
      preserveScroll: false,
      preserveState: false,
    })
  }

  // Abrir QuickView
  const handleQuickView = (product) => {
    setQuickViewProduct(product)
    setIsQuickViewOpen(true)
  }

  // Agregar producto a comparación
  const handleAddToCompare = (product) => {
    if (compareProducts.find(p => p.id === product.id)) {
      // Ya está en comparación, removerlo
      setCompareProducts(prev => prev.filter(p => p.id !== product.id))
    } else if (compareProducts.length < 3) {
      // Agregar si hay menos de 3
      setCompareProducts(prev => [...prev, product])
    }
  }

  // Abrir modal de comparación
  const handleOpenCompare = () => {
    if (compareProducts.length > 0) {
      setIsCompareOpen(true)
    }
  }

  // Cargar más productos (siguiente página)
  const handleLoadMore = () => {
    if (page >= lastPage) return
    setLoadingMore(true)
    router.get(route('shop.index'), { page: page + 1 }, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: (pageData) => {
        // Concatenar productos
        setProductList((prev) => [...ensureArray(prev), ...ensureArray(pageData.props.products?.data)])
        setPage(pageData.props.products.current_page || page + 1)
        setLastPage(pageData.props.products.last_page || lastPage)
        setLoadingMore(false)
      },
      onError: () => setLoadingMore(false)
    })
  }

  // Paginador clásico
  const renderPaginator = () => {
    if (lastPage <= 1) return null
    const pages = []
    for (let i = 1; i <= lastPage; i++) {
      pages.push(i)
    }
    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition disabled:opacity-50 flex items-center"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => handlePageChange(p)}
            className={`px-3 py-2 rounded-lg border font-semibold transition-all duration-150 ${
              p === page
                ? 'bg-primary text-primary-foreground border-primary shadow'
                : 'bg-background text-foreground border-border hover:bg-muted'
            }`}
            disabled={p === page}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= lastPage}
          className="px-3 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition disabled:opacity-50 flex items-center"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // Cambiar de página
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > lastPage || newPage === page) return
    setLoadingMore(true)
    router.get(route('shop.index'), { page: newPage }, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: (pageData) => {
        setProductList(ensureArray(pageData.props.products?.data))
        setPage(pageData.props.products.current_page || newPage)
        setLastPage(pageData.props.products.last_page || lastPage)
        setLoadingMore(false)
      },
      onError: () => setLoadingMore(false)
    })
  }

  return (
    <GuestLayout>
        <main className="flex flex-col min-h-screen bg-background">

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Breadcrumb items={[{ label: t('shop.title', 'Tienda') }]} />
          {/* Header */}
          <div className="mb-8 mt-2 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {t('shop.title', 'Tienda')}
              </h1>
              <p className="text-muted-foreground">
                {t('shop.results', `${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''}`, { count: filteredProducts.length })}
              </p>
            </div>
            {compareProducts.length > 0 && (
              <button
                onClick={handleOpenCompare}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Scale className="w-5 h-5" />
                {t('shop.compare_button', 'Comparar')} ({compareProducts.length}/3)
              </button>
            )}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Filtros */}
            <ProductFilters
              onFilterChange={applyFilters}
              onReset={() =>
                applyFilters({
                  categories: [],
                  priceRange: [0, 5000],
                  search: '',
                  sortBy: 'latest',
                  inStockOnly: false,
                  tags: [],
                })
              }
              categories={safeCategories}
              initialFilters={localFilters}
            />

            {/* Productos */}
            <div className="md:col-span-3">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {t('shop.empty_title', 'No se encontraron productos')}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t('shop.empty_description', 'Intenta ajustar los filtros o la búsqueda')}
                  </p>
                  <button
                    onClick={() =>
                      applyFilters({
                        categories: [],
                        priceRange: [0, 5000],
                        search: '',
                        sortBy: 'latest',
                        inStockOnly: false,
                        tags: [],
                      })
                    }
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                  >
                    {t('shop.clear_filters', 'Limpiar Filtros')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddedToCart={() => setIsCartOpen(true)}
                        onQuickView={() => handleQuickView(product)}
                        onCompare={() => handleAddToCompare(product)}
                        isComparing={compareProducts.some(p => p.id === product.id)}
                      />
                    ))}
                  </div>
                  {renderPaginator()}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shopping Cart Sidebar */}
      <ShoppingCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Quick View Modal */}
      <QuickView
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        onAddToCart={() => setIsCartOpen(true)}
      />

      {/* Product Compare Modal */}
      <ProductCompare
        products={compareProducts}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
      />

    </main>
    </GuestLayout>
  );
}
