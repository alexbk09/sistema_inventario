import GuestLayout from '@/Layouts/GuestLayout.jsx';
import ProductCard from '@/Components/ProductCard.jsx'
import ProductFilters from '@/Components/shop/ProductFilters.jsx'
import ShoppingCart from '@/Components/shop/ShoppingCart.jsx'
import { useState, useMemo } from 'react'
import { ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react'
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

export default function ShopIndex({ products = {}, categories = [], canLogin }) {
  const { t } = useI18n()
  const [filters, setFilters] = useState({
    categories: [],
    priceRange: [0, 5000],
    search: '',
    sortBy: 'relevance',
    inStockOnly: false,
    tags: [],
  })
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { itemCount } = useCart()
  const [productList, setProductList] = useState(() => ensureArray(products.data))
  const [page, setPage] = useState(products.current_page || 1)
  const [lastPage, setLastPage] = useState(products.last_page || 1)
  const [loadingMore, setLoadingMore] = useState(false)
  const safeCategories = ensureArray(categories)

  // Cuando cambian los productos (por navegación o filtros), actualiza el listado
  useEffect(() => {
    setProductList(ensureArray(products.data))
    setPage(products.current_page || 1)
    setLastPage(products.last_page || 1)
  }, [products])

  // Filtrar y ordenar productos (solo sobre los cargados)
  const filteredProducts = useMemo(() => {
    let result = [...productList]

    // Filtro por búsqueda (nombre, descripción, SKU, código de barras)
    if (filters.search) {
      const term = filters.search.toLowerCase()
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
    if (filters.categories.length > 0) {
      result = result.filter((p) => {
        const productCategories = (p.categories || []).map((c) => (typeof c === 'string' ? c : c.name))
        return filters.categories.some((c) => productCategories.includes(c))
      })
    }

    // Filtro por rango de precio
    result = result.filter(
      (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    )

    // Filtro por disponibilidad (solo con stock)
    if (filters.inStockOnly) {
      result = result.filter((p) => (p.stock ?? 0) > 0)
    }

    // Filtro por etiquetas simples (por ahora: destacados)
    if (filters.tags && filters.tags.length > 0) {
      if (filters.tags.includes('featured')) {
        result = result.filter((p) => !!p.is_featured)
      }
    }

    // Ordenamiento
    switch (filters.sortBy) {
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
  }, [filters, productList])

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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {t('shop.title', 'Tienda')}
            </h1>
            <p className="text-muted-foreground">
              {t('shop.results', `${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''}`, { count: filteredProducts.length })}
            </p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Filtros */}
            <ProductFilters
              onFilterChange={setFilters}
              onReset={() =>
                setFilters({
                  categories: [],
                  priceRange: [0, 5000],
                  search: '',
                  sortBy: 'relevance',
                  inStockOnly: false,
                  tags: [],
                })
              }
              categories={safeCategories}
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
                      setFilters({
                        categories: [],
                        priceRange: [0, 5000],
                        search: '',
                        sortBy: 'relevance',
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

    </main>
    </GuestLayout>
  );
}
