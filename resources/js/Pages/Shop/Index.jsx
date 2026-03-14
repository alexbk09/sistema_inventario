import GuestLayout from '@/Layouts/GuestLayout.jsx';
import ProductCard from '@/Components/ProductCard.jsx'
import ProductFilters from '@/Components/shop/ProductFilters.jsx'
import ShoppingCart from '@/Components/shop/ShoppingCart.jsx'
import { useState, useMemo } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/Hooks/useCart'

export default function ShopIndex({ products = [], categories = [], canLogin }) {
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

  // Filtrar y ordenar productos
  const filteredProducts = useMemo(() => {
    let result = [...products]

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
  }, [filters, products])

  return (
    <GuestLayout>
        <main className="flex flex-col min-h-screen bg-background">

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Tienda</h1>
            <p className="text-muted-foreground">
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado
              {filteredProducts.length !== 1 ? 's' : ''}
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
              categories={categories}
            />

            {/* Productos */}
            <div className="md:col-span-3">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    No se encontraron productos
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Intenta ajustar los filtros o la búsqueda
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
                    Limpiar Filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddedToCart={() => setIsCartOpen(true)}
                    />
                  ))}
                </div>
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
