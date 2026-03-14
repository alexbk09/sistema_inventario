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
  const [payments, setPayments] = useState(() => (
    (invoice.payments || []).map((p) => ({
      id: p.id,
      method: p.method,
      amount_usd: p.amount_usd,
      amount_bs: p.amount_bs,
      reference: p.reference ?? '',
      bank: p.bank ?? '',
      notes: p.notes ?? '',
    }))
  ))
    const [cancellationReason, setCancellationReason] = useState(invoice.cancellation_reason || '')
    const [adjustments, setAdjustments] = useState(() => (
      (invoice.adjustments || []).map((a) => ({
        id: a.id,
        type: a.type,
        amount_usd: a.amount_usd,
        description: a.description ?? '',
      }))
    ))

  useEffect(() => {
    setStatus(invoice.status)
    setItems((invoice.items || []).map((item) => ({
      id: item.id,
      name: item.product?.name ?? 'Producto',
      quantity: item.quantity,
      price: item.price_usd,
      total: item.subtotal_usd,
    })))
    setPayments((invoice.payments || []).map((p) => ({
      id: p.id,
      method: p.method,
      amount_usd: p.amount_usd,
      amount_bs: p.amount_bs,
      reference: p.reference ?? '',
      bank: p.bank ?? '',
      notes: p.notes ?? '',
    })))
      setInternalNotes(invoice.internal_notes || '')
      setPublicNotes(invoice.public_notes || '')
      setCancellationReason(invoice.cancellation_reason || '')
      setAdjustments((invoice.adjustments || []).map((a) => ({
        id: a.id,
        type: a.type,
        amount_usd: a.amount_usd,
        description: a.description ?? '',
      })))
  }, [invoice])

  const currentStatus = statusLabels[status] || {
    label: status,
    color: 'bg-muted text-foreground',
  }

  const contact = invoice.contact || {}
  const customer = invoice.customer || {}

  const [internalNotes, setInternalNotes] = useState(invoice.internal_notes || '')
  const [publicNotes, setPublicNotes] = useState(invoice.public_notes || '')

  const itemsSubtotal = items.reduce((sum, it) => sum + (it.total || 0), 0)
  const paymentsTotalUsd = payments.reduce((sum, p) => sum + (Number(p.amount_usd) || 0), 0)
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

        {/* Notas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-1">Notas internas</p>
            <textarea
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition min-h-[70px]"
              placeholder="Solo visibles dentro del panel, no para el cliente."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              disabled={!isEditable}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-1">Notas para el cliente</p>
            <textarea
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition min-h-[70px]"
              placeholder="Mensaje que aparecerá en la factura o comprobante."
              value={publicNotes}
              onChange={(e) => setPublicNotes(e.target.value)}
              disabled={!isEditable}
            />
          </div>
        </div>

        {/* Anulación y notas de crédito/débito */}
        <div className="space-y-4">
          {status === 'cancelled' && (
            <div>
              <p className="text-xs text-red-700 font-semibold mb-1">Motivo de anulación</p>
              <textarea
                className="w-full px-3 py-2 bg-background border border-red-300 rounded-lg text-sm text-foreground focus:outline-none focus:border-red-500 transition min-h-[60px]"
                placeholder="Describe brevemente por qué se cancela esta factura."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                disabled={!isEditable}
              />
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-700 font-semibold mb-1">Notas de crédito / débito</p>
                <p className="text-sm text-muted-foreground">Ajustes vinculados a esta factura (no modifican el total actual).</p>
              </div>
              {isEditable && (
                <button
                  type="button"
                  onClick={() => setAdjustments((prev) => ([
                    ...prev,
                    { type: 'credit', amount_usd: '', description: '' },
                  ]))}
                  className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Añadir ajuste
                </button>
              )}
            </div>

            {adjustments.length === 0 ? (
              <p className="text-sm text-blue-700">No hay notas de crédito/débito registradas.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {adjustments.map((a, idx) => (
                  <div
                    key={a.id ?? idx}
                    className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center bg-white/70 border border-blue-100 rounded p-2 text-xs"
                  >
                    <select
                      className="md:col-span-1 border border-border rounded px-2 py-1 bg-background"
                      value={a.type}
                      disabled={!isEditable}
                      onChange={(e) => {
                        const value = e.target.value
                        setAdjustments((prev) => prev.map((adj, i) => i === idx ? { ...adj, type: value } : adj))
                      }}
                    >
                      <option value="credit">Nota de crédito</option>
                      <option value="debit">Nota de débito</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Monto USD"
                      className="md:col-span-1 border border-border rounded px-2 py-1 bg-background"
                      disabled={!isEditable}
                      value={a.amount_usd}
                      onChange={(e) => {
                        const value = e.target.value
                        setAdjustments((prev) => prev.map((adj, i) => i === idx ? { ...adj, amount_usd: value } : adj))
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Descripción"
                      className="md:col-span-2 border border-border rounded px-2 py-1 bg-background"
                      disabled={!isEditable}
                      value={a.description}
                      onChange={(e) => {
                        const value = e.target.value
                        setAdjustments((prev) => prev.map((adj, i) => i === idx ? { ...adj, description: value } : adj))
                      }}
                    />
                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => setAdjustments((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-600 md:col-span-1 md:justify-self-end"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pagos */}
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-700 font-semibold mb-1">PAGOS REGISTRADOS</p>
              <p className="text-sm text-muted-foreground">Permite registrar múltiples formas de pago y referencias.</p>
            </div>
            {isEditable && (
              <button
                type="button"
                onClick={() => setPayments((prev) => [...prev, { method: 'efectivo', amount_usd: '', amount_bs: '', reference: '', bank: '', notes: '' }])}
                className="px-3 py-1.5 text-xs rounded bg-orange-600 text-white hover:bg-orange-700"
              >
                Añadir pago
              </button>
            )}
          </div>

          {payments.length === 0 ? (
            <p className="text-sm text-orange-700">No hay pagos registrados.</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {payments.map((p, idx) => (
                <div key={p.id ?? idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center bg-white/60 border border-orange-100 rounded p-2 text-xs">
                  <select
                    className="md:col-span-1 border border-border rounded px-2 py-1 bg-background"
                    value={p.method}
                    disabled={!isEditable}
                    onChange={(e) => {
                      const value = e.target.value
                      setPayments((prev) => prev.map((pay, i) => i === idx ? { ...pay, method: value } : pay))
                    }}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="zelle">Zelle</option>
                    <option value="otro">Otro</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Monto USD"
                    className="md:col-span-1 border border-border rounded px-2 py-1 bg-background"
                    disabled={!isEditable}
                    value={p.amount_usd}
                    onChange={(e) => {
                      const value = e.target.value
                      setPayments((prev) => prev.map((pay, i) => i === idx ? { ...pay, amount_usd: value } : pay))
                    }}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Monto Bs"
                    className="md:col-span-1 border border-border rounded px-2 py-1 bg-background"
                    disabled={!isEditable}
                    value={p.amount_bs}
                    onChange={(e) => {
                      const value = e.target.value
                      setPayments((prev) => prev.map((pay, i) => i === idx ? { ...pay, amount_bs: value } : pay))
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Banco / Cuenta"
                    className="md:col-span-1 border border-border rounded px-2 py-1 bg-background"
                    disabled={!isEditable}
                    value={p.bank}
                    onChange={(e) => {
                      const value = e.target.value
                      setPayments((prev) => prev.map((pay, i) => i === idx ? { ...pay, bank: value } : pay))
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Referencia"
                    className="md:col-span-1 border border-border rounded px-2 py-1 bg-background"
                    disabled={!isEditable}
                    value={p.reference}
                    onChange={(e) => {
                      const value = e.target.value
                      setPayments((prev) => prev.map((pay, i) => i === idx ? { ...pay, reference: value } : pay))
                    }}
                  />
                  <div className="md:col-span-1 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Notas"
                      className="flex-1 border border-border rounded px-2 py-1 bg-background"
                      disabled={!isEditable}
                      value={p.notes}
                      onChange={(e) => {
                        const value = e.target.value
                        setPayments((prev) => prev.map((pay, i) => i === idx ? { ...pay, notes: value } : pay))
                      }}
                    />
                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => setPayments((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {payments.length > 0 && (
            <div className="flex justify-between text-xs text-orange-800 pt-1 border-t border-orange-200 mt-2">
              <span>Total pagos USD:</span>
              <span>{paymentsTotalUsd.toFixed(2)}</span>
            </div>
          )}
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
                  internal_notes: internalNotes,
                  public_notes: publicNotes,
                  cancellation_reason: cancellationReason,
                  items: items.map((it) => ({ id: it.id, quantity: it.quantity })),
                  payments: payments.map((p) => ({
                    method: p.method,
                    amount_usd: Number(p.amount_usd) || 0,
                    amount_bs: Number(p.amount_bs) || 0,
                    reference: p.reference || null,
                    bank: p.bank || null,
                    notes: p.notes || null,
                  })),
                  adjustments: adjustments.map((a) => ({
                    type: a.type,
                    amount_usd: Number(a.amount_usd) || 0,
                    description: a.description || null,
                  })),
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
