import React, { useEffect, useState, useRef, useCallback } from 'react'
import { router, usePage } from '@inertiajs/react'
import toast from 'react-hot-toast'
import { useI18n } from '@/Hooks/useI18n';
import { useDisplayCurrency } from '@/Hooks/useDisplayCurrency';
import { Upload, X, Wand2, Tag } from 'lucide-react';

export default function ProductModal({ isOpen, onClose, onSave, editingProduct, categories = [] }) {
  const { t } = useI18n();
  const { displayCurrency } = useDisplayCurrency();
  const { props } = usePage()
  const defaultMinStock = props?.settings?.inventory?.default_min_stock ?? 0

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    price_usd: '',
    stock: '',
    min_stock: '',
    description: '',
    is_featured: false,
    category_id: '',
  })
  const [images, setImages] = useState([])         // File objects
  const [previews, setPreviews] = useState([])      // Object URLs
  const [existingImages, setExistingImages] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const dropRef = useRef(null)
  const fileInputRef = useRef(null)
  const existingImagesRef = useRef(null)

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

  const generateSku = () => {
    const namePart = formData.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'PROD'
    const catPart = categories.find((c) => String(c.id) === String(formData.category_id))?.name
      ?.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'GEN'
    const rand = Math.floor(1000 + Math.random() * 9000)
    setFormData((prev) => ({ ...prev, sku: `${namePart}-${catPart}-${rand}` }))
  }

  useEffect(() => {
    previews.forEach((url) => URL.revokeObjectURL(url))
    if (editingProduct) {
      setFormData({
        name: editingProduct.name ?? '',
        sku: editingProduct.sku ?? '',
        barcode: editingProduct.barcode ?? '',
        price_usd: editingProduct.price_usd ?? '',
        stock: editingProduct.stock ?? '',
        min_stock: editingProduct.min_stock ?? '',
        description: editingProduct.description ?? '',
        is_featured: Boolean(editingProduct.is_featured),
        category_id: String(editingProduct.category_id ?? ''),
      })
      setImages([])
      setPreviews([])
      setExistingImages(editingProduct.images ?? [])
    } else {
      setFormData({ name: '', sku: '', barcode: '', price_usd: '', stock: '', min_stock: String(defaultMinStock ?? 0), description: '', is_featured: false, category_id: '' })
      setImages([])
      setPreviews([])
      setExistingImages([])
    }
  }, [editingProduct, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.sku.trim()) {
      toast.error(t('admin.products.modal.validation.required_name_sku', 'Nombre y SKU son requeridos'), { position: 'top-center' })
      return
    }
    onSave({ ...formData, id: editingProduct?.id, images })
    onClose()
  }

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)
  const onDrop = (e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }

  return isOpen ? (
    <div className="fixed inset-0 z-50 overflow-auto flex items-start justify-center py-8">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{editingProduct ? t('admin.products.modal.edit_title', 'Editar producto') : t('admin.products.modal.create_title', 'Nuevo producto')}</h2>
          <button aria-label={t('admin.common.close', 'Cerrar')} onClick={onClose} className="px-2 py-1 text-muted-foreground hover:text-foreground">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('admin.products.modal.form.name', 'Nombre')} *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-ring focus:outline-none" required />
          </div>

          {/* SKU con auto-generador */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('admin.products.modal.form.sku', 'SKU')} *</label>
            <div className="flex gap-2">
              <input type="text" name="sku" value={formData.sku} onChange={handleChange} className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-ring focus:outline-none font-mono" required />
              <button
                type="button"
                onClick={generateSku}
                title={t('admin.products.modal.form.sku_generate', 'Generar SKU automático')}
                className="px-3 py-2 rounded-lg border border-border bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs font-medium shrink-0"
              >
                <Wand2 className="w-3.5 h-3.5" />
                {t('admin.products.modal.form.sku_generate_btn', 'Auto')}
              </button>
            </div>
          </div>

          {/* Categoría + Código de barras */}
          <div className="grid grid-cols-2 gap-3">
            {categories.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Tag className="w-3 h-3" />{t('admin.products.modal.form.category', 'Categoría')}
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-ring focus:outline-none"
                >
                  <option value="">{t('admin.products.modal.form.category_none', 'Sin categoría')}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={categories.length > 0 ? '' : 'col-span-2'}>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('admin.products.modal.form.barcode_optional', 'Código de barras')}</label>
              <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} placeholder="EAN-13, UPC..." className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-ring focus:outline-none" />
            </div>
          </div>
          {/* Precio + Stock + Min stock */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('admin.products.modal.form.price_usd', 'Precio')} {displayCurrency} *</label>
              <input type="number" step="0.01" name="price_usd" value={formData.price_usd} onChange={handleChange} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-ring focus:outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('admin.products.modal.form.stock', 'Stock inicial')} *</label>
              <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-ring focus:outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('admin.products.modal.form.min_stock', 'Stock mín.')}</label>
              <input type="number" name="min_stock" value={formData.min_stock} onChange={handleChange} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-ring focus:outline-none" min={0} />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('admin.products.modal.form.description', 'Descripción')}</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-ring focus:outline-none resize-none" rows={2} />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border">
            <input
              id="is_featured"
              type="checkbox"
              name="is_featured"
              checked={Boolean(formData.is_featured)}
              onChange={(e) => setFormData((prev) => ({ ...prev, is_featured: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="is_featured" className="text-sm text-foreground cursor-pointer">
              {t('admin.products.modal.form.featured', 'Destacado en la tienda')}
            </label>
          </div>
          {/* Imágenes existentes */}
          {editingProduct && existingImages.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('admin.products.modal.form.current_images', 'Imágenes actuales')}</label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative h-16 w-20 flex-shrink-0 rounded-lg overflow-hidden border border-border bg-muted/40 group">
                    <img src={img.url ?? `/storage/${img.path}`} alt={editingProduct.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        router.delete(route('admin.product-images.destroy', img.id), {
                          preserveScroll: true,
                          onSuccess: () => { setExistingImages((prev) => prev.filter((i) => i.id !== img.id)); toast.success(t('admin.products.modal.notifications.image_deleted', 'Imagen eliminada'), { position: 'top-center' }) },
                          onError: () => toast.error(t('admin.products.modal.notifications.image_delete_error', 'Error al eliminar'), { position: 'top-center' }),
                        })
                      }}
                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Zona de carga de imágenes con drag & drop + preview */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('admin.products.modal.form.product_images', 'Subir imágenes')}</label>
            <div
              ref={dropRef}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-5 cursor-pointer transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60 hover:bg-muted/30'
              }`}
            >
              <Upload className={`w-5 h-5 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-xs text-muted-foreground text-center">
                {t('admin.products.modal.form.drop_images', 'Arrastra imágenes aquí o haz clic para seleccionar')}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            {/* Previews de nuevas imágenes */}
            {previews.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {previews.map((url, idx) => (
                  <div key={idx} className="relative h-16 w-20 flex-shrink-0 rounded-lg overflow-hidden border border-border bg-muted/40 group">
                    <img src={url} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[9px] text-center py-0.5">
                        {t('admin.products.modal.form.main_image', 'Principal')}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeNewImage(idx) }}
                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-lg">{t('admin.products.modal.actions.cancel', 'Cancelar')}</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg">{editingProduct ? t('admin.products.modal.actions.update', 'Actualizar') : t('admin.products.modal.actions.create', 'Crear')}</button>
          </div>
        </form>
      </div>
    </div>
  ) : null
}
