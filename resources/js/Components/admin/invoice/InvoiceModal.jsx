import React, { useEffect, useState } from 'react'
import Modal from '@/Components/Modal'
import { router } from '@inertiajs/react'
import { Download, Printer } from 'lucide-react'
import toast from 'react-hot-toast'

const statusLabels = {
  pending: { label: 'Pendiente', color: 'bg-yellow-50 text-yellow-700' },
  paid: { label: 'Pagado', color: 'bg-green-50 text-green-700' },
  shipped: { label: 'Enviado', color: 'bg-blue-50 text-blue-700' },
  delivered: { label: 'Entregado', color: 'bg-teal-50 text-teal-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-50 text-red-700' },
}

export default function InvoiceModal({
  isOpen,
  onClose,
  invoice,
}) {
  if (!isOpen || !invoice) return null

  const isEditable = invoice.status === 'pending'

  const [status, setStatus] = useState(invoice.status)
  const [items, setItems] = useState(() => (
    (invoice.items || []).map((item) => ({
      id: item.id,
      name: item.product?.name ?? 'Producto',
      quantity: item.quantity,
      price: item.price_usd,
      total: item.subtotal_usd,
    }))
  ))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setStatus(invoice.status)
    setItems((invoice.items || []).map((item) => ({
      id: item.id,
      name: item.product?.name ?? 'Producto',
      quantity: item.quantity,
      price: item.price_usd,
      total: item.subtotal_usd,
    })))
  }, [invoice])

  const currentStatus = statusLabels[status] || {
    label: status,
    color: 'bg-muted text-foreground',
  }

  const contact = invoice.contact || {}
  const customer = invoice.customer || {}

  const itemsSubtotal = items.reduce((sum, it) => sum + (it.total || 0), 0)
  const shippingCost = 200.0
  const total = typeof invoice.total_usd === 'number' ? invoice.total_usd : itemsSubtotal + shippingCost
  const tax = total - itemsSubtotal - shippingCost

  const totalBs = typeof invoice.total_bs === 'number' ? invoice.total_bs : Math.round(total * 57);

  return (
    <Modal
      show={isOpen}
      onClose={onClose}
      maxWidth="xl"
    >
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-foreground">{invoice.number}</h3>
            <p className="text-muted-foreground">
              Emitida el {contact.payment_date ? new Date(contact.payment_date).toLocaleDateString('es-ES') : 'N/A'}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition">
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition">
              <Download className="w-4 h-4" />
              Descargar
            </button>
          </div>
        </div>

        {/* Estado */}
        <div>
          {isEditable ? (
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded text-sm font-medium ${currentStatus.color}`}>
                {currentStatus.label}
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border border-border rounded px-2 py-1 text-xs bg-background text-foreground"
              >
                <option value="pending">Pendiente</option>
                <option value="paid">Pagada / Confirmada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
          ) : (
            <span className={`px-3 py-1 rounded text-sm font-medium ${currentStatus.color}`}>
              {currentStatus.label}
            </span>
          )}
        </div>

        {/* Información del Cliente */}
        <div className="grid grid-cols-2 gap-6 bg-muted p-4 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-1">CLIENTE</p>
            <p className="text-foreground font-semibold">{contact.full_name ?? customer.name ?? 'N/A'}</p>
            <p className="text-sm text-muted-foreground">{contact.email}</p>
            <p className="text-sm text-muted-foreground">{contact.phone}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-1">DIRECCIÓN DE ENVÍO</p>
            <p className="text-foreground">{contact.address}</p>
            <p className="text-sm text-muted-foreground">{contact.city}, {contact.zip_code}</p>
          </div>
        </div>

        {/* Información de Pago */}
        <div className="grid grid-cols-2 gap-6 bg-orange-100 p-4 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-1">MÉTODO DE PAGO</p>
            <p className="text-foreground font-semibold capitalize">
              {contact.payment_method === 'transferencia' && 'Transferencia Bancaria'}
              {contact.payment_method === 'pago-movil' && 'Pago Móvil'}
              {contact.payment_method === 'otro' && 'Otro Método'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-1">DATOS BANCARIOS</p>
            <p className="text-sm text-foreground">Banco: {contact.bank}</p>
            <p className="text-sm text-foreground">Origen: {contact.origin_bank}</p>
            <p className="text-sm text-foreground">Ref: {contact.reference}</p>
          </div>
        </div>

        {/* Productos */}
        <div>
          <h4 className="text-lg font-bold text-foreground mb-3">Productos</h4>
          <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-lg border border-border">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Producto</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">Cantidad</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold">Precio</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm text-foreground">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-center">
                      {isEditable ? (
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => {
                            const value = Math.max(1, Number(e.target.value) || 1)
                            setItems((prev) => prev.map((it) => (
                              it.id === item.id
                                ? { ...it, quantity: value, total: value * it.price }
                                : it
                            )))
                          }}
                          className="w-16 border border-border rounded px-2 py-1 text-xs text-center bg-background"
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">${item.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground text-right">
                      ${item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales */}
        <div className="grid grid-cols-2 gap-6">
          <div />
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>${itemsSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Envío:</span>
              <span>${shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Impuestos (15%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground">
              <span>Total USD:</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
            <div className="bg-accent/10 border border-accent rounded p-2 flex justify-between font-bold text-accent mt-2">
              <span>Total Bs.:</span>
              <span>Bs.{Number(totalBs).toLocaleString('es-VE')}</span>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4 border-t border-border">
          {isEditable && (
            <button
              onClick={() => {
                if (!invoice || saving) return
                setSaving(true)
                const payload = {
                  status,
                  items: items.map((it) => ({ id: it.id, quantity: it.quantity })),
                }
                const loadingId = `update-invoice-${invoice.id}`
                toast.loading('Actualizando factura...', { id: loadingId, position: 'top-center' })
                router.put(route('admin.invoices.update', invoice.id), payload, {
                  preserveScroll: true,
                  onSuccess: () => {
                    toast.success('Factura actualizada', { id: loadingId, position: 'top-center' })
                    onClose()
                  },
                  onError: () => {
                    toast.error('No se pudo actualizar la factura', { id: loadingId, position: 'top-center' })
                  },
                  onFinish: () => {
                    setSaving(false)
                    setTimeout(() => toast.dismiss(loadingId), 800)
                  },
                })
              }}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  )
}
