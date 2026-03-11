import React from "react"
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export default function SupplierModal({
  isOpen,
  onClose,
  onSave,
  editingSupplier,
}) {
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
  })

  useEffect(() => {
    if (editingSupplier) {
      setFormData({
        name: editingSupplier.name ?? '',
        contact_name: editingSupplier.contact_name ?? '',
        phone: editingSupplier.phone ?? '',
        email: editingSupplier.email ?? '',
        address: editingSupplier.address ?? '',
      })
    } else {
      setFormData({
        name: '',
        contact_name: '',
        phone: '',
        email: '',
        address: '',
      })
    }
  }, [editingSupplier, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Por favor completa el nombre de la empresa', { position: 'top-center' })
      return
    }
    onSave({
      ...formData,
      id: editingSupplier?.id,
    })
    onClose()
  }

  return isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-lg">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
          <button onClick={onClose} className="px-2 py-1 text-muted-foreground hover:text-foreground">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4  p-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Nombre de la Empresa *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
            placeholder="Ej: Iluminación Global S.A."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Nombre del Encargado
          </label>
          <input
            type="text"
            name="contact_name"
            value={formData.contact_name}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
            placeholder="Ej: Carlos Martínez"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
              placeholder="+58 212-1234567"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
              placeholder="contacto@empresa.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Dirección
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition resize-none"
            placeholder="Dirección del proveedor..."
            rows={4}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium"
          >
            {editingSupplier ? 'Actualizar' : 'Crear'}
          </button>
        </div>
        </form>
      </div>
    </div>
  ) : null
}
