import React, { useState } from 'react'
import Modal from '@/Components/Modal'
import { router } from '@inertiajs/react'

export default function BulkImportModal({ isOpen, onClose, warehouses = [] }) {
  const [file, setFile] = useState(null)
  const [warehouse, setWarehouse] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const availableWarehouses = (warehouses && warehouses.length > 0) ? warehouses : (window.page?.props?.warehouses ?? [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!file) return
    setSubmitting(true)
    const fd = new FormData()
    fd.append('file', file)
    if (warehouse) fd.append('warehouse_id', warehouse)
    router.post(route('admin.products.import'), fd, {
      forceFormData: true,
      onSuccess: () => { setSubmitting(false); onClose(); },
      onError: () => setSubmitting(false),
    })
  }

  if (!isOpen) return null

  return (
    <Modal show={isOpen} onClose={onClose} maxWidth="lg">
      <div className="p-6 space-y-4">
        <h3 className="text-xl font-bold">Importación masiva de productos</h3>
        <p className="text-sm text-muted-foreground">Sube un archivo Excel (.xlsx/.xls/.csv) con columnas: <strong>name, sku, price_usd, stock, description, image_url</strong>. Si incluyes <em>image_url</em> se intentará descargar la imagen y asignarla como primaria.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Archivo</label>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Sucursal (opcional)</label>
            <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="border border-border rounded px-3 py-2 bg-background">
              <option value="">Sin sucursal</option>
              {availableWarehouses.map((w) => <option key={w.id} value={w.id}>{w.name} {w.code ? `(${w.code})` : ''}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-primary-foreground rounded">{submitting ? 'Importando...' : 'Importar'}</button>
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
