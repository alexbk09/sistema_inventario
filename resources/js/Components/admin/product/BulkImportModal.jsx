import React, { useState } from 'react'
import Modal from '@/Components/Modal'
import { router } from '@inertiajs/react'
import { useI18n } from '@/Hooks/useI18n';

export default function BulkImportModal({ isOpen, onClose, warehouses = [] }) {
  const { t } = useI18n();
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
        <h3 className="text-xl font-bold">{t('admin.products.bulk_import.title', 'Importación masiva de productos')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('admin.products.bulk_import.description', 'Sube un archivo Excel (.xlsx/.xls/.csv) con columnas:')} <strong>{t('admin.products.bulk_import.columns', 'name, sku, price_usd, stock, description, image_url')}</strong>. {t('admin.products.bulk_import.description_suffix', 'Si incluyes image_url se intentará descargar la imagen y asignarla como primaria.')}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t('admin.products.bulk_import.file', 'Archivo')}</label>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t('admin.products.bulk_import.branch_optional', 'Sucursal (opcional)')}</label>
            <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="border border-border rounded px-3 py-2 bg-background">
              <option value="">{t('admin.products.bulk_import.without_branch', 'Sin sucursal')}</option>
              {availableWarehouses.map((w) => <option key={w.id} value={w.id}>{w.name} {w.code ? `(${w.code})` : ''}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-primary-foreground rounded">{submitting ? t('admin.products.bulk_import.importing', 'Importando...') : t('admin.products.bulk_import.import', 'Importar')}</button>
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">{t('admin.products.bulk_import.cancel', 'Cancelar')}</button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
