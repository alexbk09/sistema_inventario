import React, { useEffect, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import toast from 'react-hot-toast'

export default function ProductModal({ isOpen, onClose, onSave, editingProduct }) {
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
  })
  const [images, setImages] = useState([])
  const [existingImages, setExistingImages] = useState([])

  useEffect(() => {
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
      })
      setImages([])
      setExistingImages(editingProduct.images ?? [])
    } else {
      setFormData({ name: '', sku: '', barcode: '', price_usd: '', stock: '', min_stock: String(defaultMinStock ?? 0), description: '', is_featured: false })
      setImages([])
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
      toast.error('Nombre y SKU son requeridos', { position: 'top-center' })
      return
    }
    onSave({ ...formData, id: editingProduct?.id, images })
    onClose()
  }

  return isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-lg">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          <button onClick={onClose} className="px-2 py-1 text-muted-foreground hover:text-foreground">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Nombre *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 bg-background border border-border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">SKU *</label>
            <input type="text" name="sku" value={formData.sku} onChange={handleChange} className="w-full px-4 py-2 bg-background border border-border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Código de barras (opcional)</label>
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              placeholder="Ej: EAN-13, UPC, código interno"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg"
            />
            {formData.barcode && (
              <div className="mt-2 p-2 border border-dashed border-border rounded-lg bg-muted/40">
                <p className="text-xs text-muted-foreground mb-1">Previsualización de código (texto almacenado, uso futuro):</p>
                <p className="font-mono text-sm tracking-widest text-foreground">{formData.barcode}</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Precio USD *</label>
              <input type="number" step="0.01" name="price_usd" value={formData.price_usd} onChange={handleChange} className="w-full px-4 py-2 bg-background border border-border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Stock *</label>
              <input type="number" name="stock" readOnly value={formData.stock} onChange={handleChange} className="w-full px-4 py-2 bg-background border border-border rounded-lg" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Stock mínimo (alerta)</label>
            <input
              type="number"
              name="min_stock"
              value={formData.min_stock}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg"
              min={0}
            />
            <p className="mt-1 text-xs text-muted-foreground">Si se deja vacío, se usará el valor por defecto de configuración.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Descripción</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full px-4 py-2 bg-background border border-border rounded-lg resize-none" rows={3} />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="is_featured"
              type="checkbox"
              name="is_featured"
              checked={Boolean(formData.is_featured)}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  is_featured: e.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="is_featured" className="text-sm text-foreground">
              Destacado en la tienda (aparece en el home y recomendaciones)
            </label>
          </div>
          {editingProduct && existingImages.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Imágenes actuales</label>
              <div className="grid grid-cols-3 gap-2">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative h-20 rounded-lg overflow-hidden border border-border bg-muted/40">
                    <img
                      src={`/storage/${img.path}`}
                      alt={editingProduct.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        router.delete(route('admin.product-images.destroy', img.id), {
                          preserveScroll: true,
                          onSuccess: () => {
                            setExistingImages((prev) => prev.filter((i) => i.id !== img.id))
                            toast.success('Imagen eliminada', { position: 'top-center' })
                          },
                          onError: () => {
                            toast.error('No se pudo eliminar la imagen', { position: 'top-center' })
                          },
                        })
                      }}
                      className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full px-2 py-0.5 hover:bg-black/80"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Estas son las imágenes que ya tiene el producto. Puedes eliminarlas individualmente.</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Imágenes del producto</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                setImages((prev) => [...prev, ...files])
              }}
              className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {images.map((file, idx) => (
                  <div key={idx} className="relative h-20 rounded-lg overflow-hidden border border-border bg-muted/40 flex items-center justify-center text-[10px] text-center px-1">
                    <span className="line-clamp-3 break-all">{file.name}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">Puedes subir una o varias imágenes. La primera se tomará como principal.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-lg">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg">{editingProduct ? 'Actualizar' : 'Crear'}</button>
          </div>
        </form>
      </div>
    </div>
  ) : null
}
