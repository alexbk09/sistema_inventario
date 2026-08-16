import React, { useState, useEffect, useRef, useCallback } from 'react'
import { router, usePage } from '@inertiajs/react'
import toast from 'react-hot-toast'
import { useI18n } from '@/Hooks/useI18n'
import { useDisplayCurrency } from '@/Hooks/useDisplayCurrency'
import { 
  Upload, X, Wand2, Tag, ChevronRight, ChevronLeft, 
  Package, DollarSign, Image as ImageIcon, Grid3X3, Check,
  AlertCircle, Plus, Trash2
} from 'lucide-react'

const STEPS = [
  { id: 'basic', title: 'Información Básica', icon: Package, description: 'Nombre, SKU, descripción' },
  { id: 'pricing', title: 'Precios', icon: DollarSign, description: 'Precio USD/BS, costos' },
  { id: 'inventory', title: 'Inventario', icon: Grid3X3, description: 'Stock, mínimos, ubicación' },
  { id: 'images', title: 'Imágenes', icon: ImageIcon, description: 'Fotos del producto' },
  { id: 'categories', title: 'Categorías', icon: Tag, description: 'Categoría y etiquetas' },
  { id: 'review', title: 'Revisión', icon: Check, description: 'Confirmar datos' }
]

export default function ProductWizard({ isOpen, onClose, onSave, editingProduct, categories = [] }) {
  const { t } = useI18n()
  const { displayCurrency } = useDisplayCurrency()
  const { props } = usePage()
  const defaultMinStock = props?.settings?.inventory?.default_min_stock ?? 0

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    price_usd: '',
    cost_usd: '',
    stock: '',
    min_stock: '',
    description: '',
    is_featured: false,
    category_id: '',
    tags: [],
    warehouse_id: '',
    weight: '',
    dimensions: { length: '', width: '', height: '' }
  })
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState({})
  
  // Validación por paso
  const validateStep = useCallback((step) => {
    const newErrors = {}
    
    switch (STEPS[step].id) {
      case 'basic':
        if (!formData.name.trim()) newErrors.name = 'Nombre requerido'
        if (!formData.sku.trim()) newErrors.sku = 'SKU requerido'
        break
      case 'pricing':
        if (!formData.price_usd || parseFloat(formData.price_usd) <= 0) {
          newErrors.price_usd = 'Precio USD requerido y mayor a 0'
        }
        break
      case 'inventory':
        if (!formData.stock || formData.stock < 0) {
          newErrors.stock = 'Stock requerido'
        }
        if (!formData.min_stock || formData.min_stock < 0) {
          newErrors.min_stock = 'Mínimo requerido'
        }
        break
      case 'images':
        // Las imágenes son opcionales
        break
      case 'categories':
        if (!formData.category_id) {
          newErrors.category_id = 'Categoría requerida'
        }
        break
      case 'review':
        // Validación final
        if (!formData.name.trim()) newErrors.name = 'Nombre requerido'
        if (!formData.sku.trim()) newErrors.sku = 'SKU requerido'
        if (!formData.price_usd || parseFloat(formData.price_usd) <= 0) {
          newErrors.price_usd = 'Precio USD requerido'
        }
        if (!formData.category_id) newErrors.category_id = 'Categoría requerida'
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const addFiles = useCallback((files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!valid.length) return
    setImages((prev) => [...prev, ...valid])
    setPreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))])
  }, [])

  const removeNewImage = (idx) => {
    URL.revokeObjectURL(previews[idx])
    setImages((prev) => prev.filter((_, i) => i !== idx))
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const removeExistingImage = (idx) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const generateSku = () => {
    const namePart = formData.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'PROD'
    const catPart = categories.find((c) => String(c.id) === String(formData.category_id))?.name
      ?.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'GEN'
    const rand = Math.floor(1000 + Math.random() * 9000)
    setFormData((prev) => ({ ...prev, sku: `${namePart}-${catPart}-${rand}` }))
  }

  const addTag = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const newTag = e.target.value.trim()
      if (!formData.tags.includes(newTag)) {
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag] }))
      }
      e.target.value = ''
    }
  }

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({ 
      ...prev, 
      tags: prev.tags.filter(tag => tag !== tagToRemove) 
    }))
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const goToStep = (step) => {
    if (validateStep(currentStep)) {
      setCurrentStep(step)
    }
  }

  const handleSubmit = () => {
    if (validateStep(STEPS.length - 1)) {
      onSave({ 
        ...formData, 
        id: editingProduct?.id, 
        images,
        existingImages: existingImages.map(img => img.id)
      })
      onClose()
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.startsWith('dimension_')) {
      const dimension = name.replace('dimension_', '')
      setFormData((prev) => ({
        ...prev,
        dimensions: { ...prev.dimensions, [dimension]: value }
      }))
    } else {
      setFormData((prev) => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }))
    }
  }

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)
  const onDrop = (e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }

  useEffect(() => {
    previews.forEach((url) => URL.revokeObjectURL(url))
    if (editingProduct) {
      setFormData({
        name: editingProduct.name ?? '',
        sku: editingProduct.sku ?? '',
        barcode: editingProduct.barcode ?? '',
        price_usd: editingProduct.price_usd ?? '',
        cost_usd: editingProduct.cost_usd ?? '',
        stock: editingProduct.stock ?? '',
        min_stock: editingProduct.min_stock ?? '',
        description: editingProduct.description ?? '',
        is_featured: Boolean(editingProduct.is_featured),
        category_id: String(editingProduct.category_id ?? ''),
        tags: editingProduct.tags ?? [],
        warehouse_id: String(editingProduct.warehouse_id ?? ''),
        weight: editingProduct.weight ?? '',
        dimensions: editingProduct.dimensions ?? { length: '', width: '', height: '' }
      })
      setImages([])
      setPreviews([])
      setExistingImages(editingProduct.images ?? [])
      setCurrentStep(0)
    } else {
      setFormData({ 
        name: '', 
        sku: '', 
        barcode: '', 
        price_usd: '', 
        cost_usd: '', 
        stock: '', 
        min_stock: String(defaultMinStock ?? 0), 
        description: '', 
        is_featured: false, 
        category_id: '', 
        tags: [],
        warehouse_id: '',
        weight: '',
        dimensions: { length: '', width: '', height: '' }
      })
      setImages([])
      setPreviews([])
      setExistingImages([])
      setCurrentStep(0)
    }
    setErrors({})
  }, [editingProduct, isOpen, defaultMinStock])

  if (!isOpen) return null

  const CurrentIcon = STEPS[currentStep].icon

  return (
    <div className="fixed inset-0 z-50 overflow-auto flex items-start justify-center py-8">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header con pasos */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <CurrentIcon className="w-8 h-8" />
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress steps */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              const hasError = Object.keys(errors).length > 0 && index === currentStep
              
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(index)}
                  className={`flex-1 flex flex-col items-center p-2 rounded-lg transition-all ${
                    isActive ? 'bg-white/20' : isCompleted ? 'bg-white/10' : 'opacity-60'
                  }`}
                >
                  <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                    isActive ? 'bg-white text-blue-600' : isCompleted ? 'bg-green-500 text-white' : 'bg-white/20'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                    {hasError && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                    )}
                  </div>
                  <div className="mt-1 text-xs font-medium text-center">
                    <div>{step.title}</div>
                    <div className="opacity-80 text-xs">{step.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {currentStep === 0 && (
            <StepBasic
              formData={formData}
              handleChange={handleChange}
              errors={errors}
              generateSku={generateSku}
            />
          )}
          
          {currentStep === 1 && (
            <StepPricing
              formData={formData}
              handleChange={handleChange}
              errors={errors}
              displayCurrency={displayCurrency}
            />
          )}
          
          {currentStep === 2 && (
            <StepInventory
              formData={formData}
              handleChange={handleChange}
              errors={errors}
            />
          )}
          
          {currentStep === 3 && (
            <StepImages
              images={images}
              previews={previews}
              existingImages={existingImages}
              addFiles={addFiles}
              removeNewImage={removeNewImage}
              removeExistingImage={removeExistingImage}
              isDragging={isDragging}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            />
          )}
          
          {currentStep === 4 && (
            <StepCategories
              formData={formData}
              handleChange={handleChange}
              categories={categories}
              addTag={addTag}
              removeTag={removeTag}
              errors={errors}
            />
          )}
          
          {currentStep === 5 && (
            <StepReview
              formData={formData}
              images={images}
              previews={previews}
              existingImages={existingImages}
              categories={categories}
            />
          )}
        </div>

        {/* Footer con navegación */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                currentStep === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              Paso {currentStep + 1} de {STEPS.length}
            </div>

            {currentStep === STEPS.length - 1 ? (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Check className="w-4 h-4" />
                Guardar Producto
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Componentes de cada paso
function StepBasic({ formData, handleChange, errors, generateSku }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre del Producto *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ej: iPhone 15 Pro"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            SKU *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 ${
                errors.sku ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: IPH15-PRO-1234"
            />
            <button
              type="button"
              onClick={generateSku}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Generar SKU automático"
            >
              <Wand2 className="w-4 h-4" />
            </button>
          </div>
          {errors.sku && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.sku}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Código de Barras
        </label>
        <input
          type="text"
          name="barcode"
          value={formData.barcode}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
          placeholder="Ej: 1234567890123"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Descripción
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
          placeholder="Describe el producto..."
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="is_featured"
          id="is_featured"
          checked={formData.is_featured}
          onChange={handleChange}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="is_featured" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
          Producto destacado
        </label>
      </div>
    </div>
  )
}

function StepPricing({ formData, handleChange, errors, displayCurrency }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Precio USD *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              name="price_usd"
              value={formData.price_usd}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 ${
                errors.price_usd ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
          </div>
          {errors.price_usd && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.price_usd}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Costo USD
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              name="cost_usd"
              value={formData.cost_usd}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {formData.price_usd && displayCurrency && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Precio en {displayCurrency.code}: {displayCurrency.symbol}{' '}
            {(parseFloat(formData.price_usd) * displayCurrency.rate).toFixed(2)}
          </p>
        </div>
      )}
    </div>
  )
}

function StepInventory({ formData, handleChange, errors }) {
  const isBelowMin = formData.stock && formData.min_stock && parseInt(formData.stock) < parseInt(formData.min_stock);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Stock Actual *
          </label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 ${
              errors.stock ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0"
          />
          {errors.stock && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.stock}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Punto de Reorden (Stock Mínimo) *
          </label>
          <div className="relative">
            <input
              type="number"
              name="min_stock"
              value={formData.min_stock}
              onChange={handleChange}
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 ${
                errors.min_stock ? 'border-red-500' : isBelowMin ? 'border-amber-500' : 'border-gray-300'
              }`}
              placeholder="0"
            />
            {isBelowMin && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Nivel de stock que activará alerta de reabastecimiento
          </p>
          {errors.min_stock && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.min_stock}
            </p>
          )}
          {formData.stock && formData.min_stock && !errors.min_stock && (
            <p className={`mt-1 text-xs ${isBelowMin ? 'text-amber-600' : 'text-emerald-600'}`}>
              {isBelowMin 
                ? `⚠️ Stock actual (${formData.stock}) está por debajo del mínimo (${formData.min_stock})`
                : `✓ Stock actual (${formData.stock}) está por encima del mínimo (${formData.min_stock})`
              }
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Peso (kg)
          </label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Largo (cm)
          </label>
          <input
            type="number"
            name="dimension_length"
            value={formData.dimensions.length}
            onChange={handleChange}
            step="0.1"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
            placeholder="0.0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ancho (cm)
          </label>
          <input
            type="number"
            name="dimension_width"
            value={formData.dimensions.width}
            onChange={handleChange}
            step="0.1"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
            placeholder="0.0"
          />
        </div>
      </div>
    </div>
  )
}

function StepImages({ 
  images, previews, existingImages, addFiles, removeNewImage, 
  removeExistingImage, isDragging, onDragOver, onDragLeave, onDrop
}) {
  const dropRef = useRef(null)
  const fileInputRef = useRef(null)
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Imágenes del Producto
        </label>
        
        <div
          ref={dropRef}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Arrastra imágenes aquí o haz clic para seleccionar
          </p>
          <p className="text-sm text-gray-500">
            PNG, JPG, GIF hasta 10MB cada una
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => addFiles(e.target.files)}
            className="hidden"
          />
        </div>
      </div>

      {/* Imágenes existentes */}
      {existingImages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Imágenes actuales
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {existingImages.map((img, idx) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.url}
                  alt={`Imagen ${idx + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(idx)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                {idx === 0 && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                    Principal
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nuevas imágenes */}
      {previews.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Nuevas imágenes
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {previews.map((preview, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(idx)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StepCategories({ formData, handleChange, categories, addTag, removeTag, errors }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Categoría *
        </label>
        <select
          name="category_id"
          value={formData.category_id}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 ${
            errors.category_id ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category_id && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.category_id}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Etiquetas
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {formData.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-blue-600 dark:hover:text-blue-300"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Presiona Enter para agregar etiquetas..."
          onKeyDown={addTag}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
        />
      </div>
    </div>
  )
}

function StepReview({ formData, images, previews, existingImages, categories }) {
  const category = categories.find((c) => String(c.id) === String(formData.category_id))
  
  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Por favor revisa toda la información antes de guardar el producto.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Información Básica</h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Nombre:</span> {formData.name}</div>
            <div><span className="font-medium">SKU:</span> {formData.sku}</div>
            <div><span className="font-medium">Código de Barras:</span> {formData.barcode || 'No especificado'}</div>
            <div><span className="font-medium">Categoría:</span> {category?.name || 'No seleccionada'}</div>
            <div><span className="font-medium">Destacado:</span> {formData.is_featured ? 'Sí' : 'No'}</div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Precios e Inventario</h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Precio USD:</span> ${formData.price_usd}</div>
            <div><span className="font-medium">Costo USD:</span> ${formData.cost_usd || 'No especificado'}</div>
            <div><span className="font-medium">Stock:</span> {formData.stock}</div>
            <div><span className="font-medium">Stock Mínimo:</span> {formData.min_stock}</div>
          </div>
        </div>
      </div>

      {formData.description && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Descripción</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
            {formData.description}
          </p>
        </div>
      )}

      {formData.tags.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Etiquetas</h3>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {(images.length > 0 || existingImages.length > 0) && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Imágenes ({images.length + existingImages.length})
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {existingImages.map((img) => (
              <img
                key={img.id}
                src={img.url}
                alt="Imagen existente"
                className="w-full h-20 object-cover rounded"
              />
            ))}
            {previews.map((preview, idx) => (
              <img
                key={idx}
                src={preview}
                alt="Nueva imagen"
                className="w-full h-20 object-cover rounded"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
