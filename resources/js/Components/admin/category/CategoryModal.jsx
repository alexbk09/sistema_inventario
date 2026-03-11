import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function CategoryModal({ isOpen, onClose, onSave, editingCategory }) {
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' })

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name ?? '',
        slug: editingCategory.slug ?? '',
        description: editingCategory.description ?? '',
      })
    } else {
      setFormData({ name: '', slug: '', description: '' })
    }
  }, [editingCategory, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Nombre y slug son requeridos', { position: 'top-center' })
      return
    }
    onSave({ ...formData, id: editingCategory?.id })
    onClose()
  }

  return isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-lg">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
          <button onClick={onClose} className="px-2 py-1 text-muted-foreground hover:text-foreground">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Nombre *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 bg-background border border-border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Slug *</label>
            <input type="text" name="slug" value={formData.slug} onChange={handleChange} className="w-full px-4 py-2 bg-background border border-border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Descripción</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full px-4 py-2 bg-background border border-border rounded-lg resize-none" rows={3} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-lg">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg">{editingCategory ? 'Actualizar' : 'Crear'}</button>
          </div>
        </form>
      </div>
    </div>
  ) : null
}
