import { Filter, X } from 'lucide-react'
import { useState } from 'react'


const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'price-asc', label: 'Precio: Menor a Mayor' },
  { value: 'price-desc', label: 'Precio: Mayor a Menor' },
  { value: 'newest', label: 'Más Recientes' },
  { value: 'best-sellers', label: 'Más Vendidos' },
]

export default function ProductFilters({
  onFilterChange,
  onReset,
  categories = [],
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [priceRange, setPriceRange] = useState([0, 5000])
  const [sortBy, setSortBy] = useState('relevance')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [tags, setTags] = useState([])

  const handleCategoryToggle = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  const handleFilterChange = () => {
    onFilterChange({
      search,
      categories: selectedCategories,
      priceRange,
      sortBy,
      inStockOnly,
      tags,
    })
  }

  const handleReset = () => {
    setSearch('')
    setSelectedCategories([])
    setPriceRange([0, 5000])
    setSortBy('relevance')
    setInStockOnly(false)
    setTags([])
    onReset?.()
  }

  const isFiltered =
    Boolean(search) ||
    selectedCategories.length > 0 ||
    priceRange[0] > 0 ||
    inStockOnly ||
    (tags && tags.length > 0)

  return (
    <>
      {/* Toggle Button (Mobile) */}
      <div className="md:hidden mb-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </div>
          {isFiltered && (
            <span className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full">
              Activos
            </span>
          )}
        </button>
      </div>

      {/* Filters Container */}
      <div
        className={`${
          isOpen ? 'block' : 'hidden'
        } md:block md:col-span-1 bg-card border border-border rounded-lg p-6 h-fit sticky top-20`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </h2>
          {isFiltered && (
            <button
              onClick={handleReset}
              className="text-xs text-accent hover:text-accent-foreground transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Busca un producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={handleFilterChange}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              Categorías
            </label>
            <div className="space-y-2">
              {categories.map((category) => (
                <label
                  key={category.id ?? category}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.name ?? category)}
                    onChange={() => {
                      handleCategoryToggle(category.name ?? category)
                    }}
                    onBlur={handleFilterChange}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition">
                    {category.name ?? category}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              Rango de Precio
            </label>
            <div className="space-y-3">
              <input
                type="range"
                min="0"
                max="5000"
                value={priceRange[1]}
                onChange={(e) => {
                  const newRange = [priceRange[0], Number(e.target.value)]
                  setPriceRange(newRange)
                }}
                onBlur={handleFilterChange}
                className="w-full accent-primary"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">$0</span>
                <span className="font-semibold text-primary">
                  ${priceRange[1].toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          </div>

          {/* Disponibilidad */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Disponibilidad
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked)
                  // Aplicar filtros inmediatamente para mejor UX
                  setTimeout(handleFilterChange, 0)
                }}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition">
                Solo productos con stock disponible
              </span>
            </label>
          </div>

          {/* Etiquetas */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Etiquetas
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={tags.includes('featured')}
                  onChange={() => {
                    setTags((prev) =>
                      prev.includes('featured')
                        ? prev.filter((t) => t !== 'featured')
                        : [...prev, 'featured']
                    )
                    setTimeout(handleFilterChange, 0)
                  }}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition">
                  Destacados
                </span>
              </label>
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
              }}
              onBlur={handleFilterChange}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          {isFiltered && (
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 text-sm font-semibold text-accent border-2 border-accent rounded-lg hover:bg-accent hover:text-accent-foreground transition"
            >
              Limpiar Filtros
            </button>
          )}
        </div>

        {/* Close Button (Mobile) */}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden w-full mt-6 px-4 py-2 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted/80 transition"
        >
          Aplicar Filtros
        </button>
      </div>
    </>
  )
}
