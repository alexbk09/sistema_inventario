import React, { useEffect, useState } from 'react'
import Modal from '@/Components/Modal'
import { router } from '@inertiajs/react'
import { Download, Printer, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useI18n } from '@/Hooks/useI18n'
import { useLocaleFormat } from '@/Hooks/useLocaleFormat'
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates'

function formatGatewayDate(value, formatter, fallback) {
  if (!value) return 'N/A'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return fallback

  return formatter(parsed)
}

function prettyGatewayPayload(payload) {
  if (!payload) return ''

  try {
    return JSON.stringify(payload, null, 2)
  } catch {
    return ''
  }
}

export default function InvoiceModal({
  isOpen,
  onClose,
  invoice,
}) {
  if (!isOpen || !invoice) return null

  const { t } = useI18n()
  const { formatDate, formatDateTime, formatNumber, formatCurrency } = useLocaleFormat()
  const { displayCurrency, comparisonCurrency, formatPriceFromUsd, hasRateForCurrency, baseCurrency, ratesByCode } = useConfiguredCurrencyRates()
  const availableCurrencies = Object.keys(ratesByCode || {})
  const secondaryCurrency = comparisonCurrency && comparisonCurrency !== displayCurrency && hasRateForCurrency(comparisonCurrency)
    ? comparisonCurrency
    : null
  const formatDisplayCurrency = (value, currency = displayCurrency) => formatPriceFromUsd(Number(value || 0), currency)
  const formatAmountInCurrency = (value, currency = displayCurrency) => formatCurrency(Number(value || 0), currency)

  const toBaseAmount = (value, currency = displayCurrency) => {
    const numericValue = Number(value || 0)
    if (currency === baseCurrency) {
      return numericValue
    }

    const rate = Number(ratesByCode?.[currency] ?? 0)
    if (!rate) {
      return numericValue
    }

    return numericValue / rate
  }

  const fallbackText = t('admin.invoices.modal.not_available', 'N/A')
  const statusLabels = {
    pending: { label: t('admin.invoices.statuses.pending', 'Pendiente'), color: 'bg-yellow-50 text-yellow-700' },
    paid: { label: t('admin.invoices.statuses.paid', 'Pagado'), color: 'bg-green-50 text-green-700' },
    shipped: { label: t('admin.invoices.statuses.shipped', 'Enviado'), color: 'bg-blue-50 text-blue-700' },
    delivered: { label: t('admin.invoices.statuses.delivered', 'Entregado'), color: 'bg-teal-50 text-teal-700' },
    cancelled: { label: t('admin.invoices.statuses.cancelled', 'Cancelado'), color: 'bg-red-50 text-red-700' },
  }

  const isEditable = invoice.status === 'pending'

  const [status, setStatus] = useState(invoice.status)
  const [items, setItems] = useState(() => (
    (invoice.items || []).map((item) => ({
      id: item.id,
      name: item.product?.name ?? t('admin.invoices.modal.product_fallback', 'Producto'),
      quantity: item.quantity,
      price: item.price_usd,
      total: item.subtotal_usd,
      document_totals: item.monetary_breakdown_json?.totals ?? null,
    }))
  ))
  const [saving, setSaving] = useState(false)
  const [payments, setPayments] = useState(() => (
    (invoice.payments || []).map((p) => ({
      id: p.id,
      method: p.method,
      amount_usd: p.amount_original ?? p.amount_usd,
      amount_bs: p.amount_bs,
      currency_code: p.payment_currency_code ?? 'USD',
      reference: p.reference ?? '',
      bank: p.bank ?? p.bank_name ?? p.bank_account ?? '',
      notes: p.notes ?? '',
      payer: p.payer ?? p.paid_by ?? p.created_by ?? (p.user && p.user.name) ?? '',
    }))
  ))
  const [cancellationReason, setCancellationReason] = useState(invoice.cancellation_reason || '')
  const [adjustments, setAdjustments] = useState(() => (
    (invoice.adjustments || []).map((a) => ({
      id: a.id,
      type: a.type,
      amount_usd: a.amount_original ?? a.amount_usd,
      currency_code: a.currency_code ?? 'USD',
      description: a.description ?? '',
    }))
  ))
  const [internalNotes, setInternalNotes] = useState(invoice.internal_notes || '')
  const [publicNotes, setPublicNotes] = useState(invoice.public_notes || '')

  useEffect(() => {
    setStatus(invoice.status)
    setItems((invoice.items || []).map((item) => ({
      id: item.id,
      name: item.product?.name ?? t('admin.invoices.modal.product_fallback', 'Producto'),
      quantity: item.quantity,
      price: item.price_usd,
      total: item.subtotal_usd,
      document_totals: item.monetary_breakdown_json?.totals ?? null,
    })))
    setPayments((invoice.payments || []).map((p) => ({
      id: p.id,
      method: p.method,
      amount_usd: p.amount_original ?? p.amount_usd,
      amount_bs: p.amount_bs,
      currency_code: p.payment_currency_code ?? 'USD',
      reference: p.reference ?? '',
      bank: p.bank ?? p.bank_name ?? p.bank_account ?? '',
      notes: p.notes ?? '',
      payer: p.payer ?? p.paid_by ?? p.created_by ?? (p.user && p.user.name) ?? '',
    })))
      setInternalNotes(invoice.internal_notes || '')
      setPublicNotes(invoice.public_notes || '')
      setCancellationReason(invoice.cancellation_reason || '')
      setAdjustments((invoice.adjustments || []).map((a) => ({
        id: a.id,
        type: a.type,
        amount_usd: a.amount_original ?? a.amount_usd,
        currency_code: a.currency_code ?? 'USD',
        description: a.description ?? '',
      })))
  }, [invoice])

  const currentStatus = statusLabels[status] || {
    label: status,
    color: 'bg-muted text-foreground',
  }

  const contact = invoice.contact || {}
  const customer = invoice.customer || {}
  const gatewayTransactions = Array.isArray(invoice.gateway_transactions)
    ? invoice.gateway_transactions
    : (Array.isArray(invoice.gatewayTransactions) ? invoice.gatewayTransactions : [])
  const itemsSubtotal = items.reduce((sum, it) => sum + (it.total || 0), 0)
  const paymentsTotalUsd = payments.reduce((sum, p) => sum + toBaseAmount(p.amount_usd, p.currency_code || displayCurrency), 0)
  const invoiceDocumentTotals = invoice.document_totals ?? invoice.monetary_totals_json?.totals ?? null
  const hasDocumentSummary = Boolean(
    invoiceDocumentTotals
    && items.every((item) => item.document_totals && typeof item.document_totals === 'object')
  )
  const itemsDocumentSubtotalByCurrency = items.reduce((carry, item) => {
    if (!item.document_totals || typeof item.document_totals !== 'object') {
      return carry
    }

    Object.entries(item.document_totals).forEach(([currency, amount]) => {
      carry[currency] = (carry[currency] ?? 0) + Number(amount || 0)
    })

    return carry
  }, {})
  const total = typeof invoice.total_usd === 'number' ? invoice.total_usd : itemsSubtotal
  const tax = Math.max(0, total - itemsSubtotal)
  const getSummaryAmount = (type, currency = displayCurrency) => {
    if (hasDocumentSummary) {
      if (type === 'subtotal') {
        return formatAmountInCurrency(itemsDocumentSubtotalByCurrency[currency] ?? 0, currency)
      }

      if (type === 'shipping') {
        return formatAmountInCurrency(0, currency)
      }

      if (type === 'tax') {
        const totalAmount = Number(invoiceDocumentTotals?.[currency] ?? 0)
        const subtotalAmount = Number(itemsDocumentSubtotalByCurrency[currency] ?? 0)

        return formatAmountInCurrency(Math.max(0, totalAmount - subtotalAmount), currency)
      }

      if (type === 'total') {
        return formatAmountInCurrency(invoiceDocumentTotals?.[currency] ?? 0, currency)
      }
    }

    if (type === 'subtotal') {
      return formatDisplayCurrency(itemsSubtotal, currency)
    }

    if (type === 'shipping') {
      return formatDisplayCurrency(0, currency)
    }

    if (type === 'tax') {
      return formatDisplayCurrency(tax, currency)
    }

    return formatDisplayCurrency(total, currency)
  }
  const getDocumentAmount = (totals, fallback, currency = displayCurrency) => totals?.[currency] !== undefined
    ? formatAmountInCurrency(totals[currency], currency)
    : formatDisplayCurrency(fallback, currency)

  const whatsappUrl = (() => {
    const phone = contact.phone || '';
    if (!phone) return null;
    const digits = phone.replace(/[^0-9]/g, '');
    if (!digits) return null;
    const text = encodeURIComponent(t('admin.invoices.modal.whatsapp_message', 'Hola, tengo una consulta sobre la factura :number', { number: invoice.number }));
    return `https://wa.me/${digits}?text=${text}`;
  })();

  return (
    <Modal
      show={isOpen}
      onClose={onClose}
      maxWidth="2xl"
    >
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-foreground">{invoice.number}</h3>
            <p className="text-muted-foreground">
              {t('admin.invoices.modal.issued_on', 'Emitida el')} {contact.payment_date ? formatDate(contact.payment_date) : fallbackText}
            </p>
          </div>
          <div className="flex gap-2">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                {t('admin.invoices.modal.customer_whatsapp', 'WhatsApp cliente')}
              </a>
            )}
            <button className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition">
              <Printer className="w-4 h-4" />
              {t('admin.invoices.modal.print', 'Imprimir')}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition">
              <Download className="w-4 h-4" />
              {t('admin.invoices.modal.download', 'Descargar')}
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
                <option value="pending">{t('admin.invoices.statuses.pending', 'Pendiente')}</option>
                <option value="paid">{t('admin.invoices.modal.status_options.paid_confirmed', 'Pagada / Confirmada')}</option>
                <option value="cancelled">{t('admin.invoices.modal.status_options.cancelled', 'Cancelada')}</option>
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
            <p className="text-xs text-muted-foreground font-semibold mb-1">{t('admin.invoices.modal.customer_label', 'CLIENTE')}</p>
            <p className="text-foreground font-semibold">{contact.full_name ?? customer.name ?? fallbackText}</p>
            <p className="text-sm text-muted-foreground">{contact.email}</p>
            <p className="text-sm text-muted-foreground">{contact.phone}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-1">{t('admin.invoices.modal.shipping_label', 'DIRECCIÓN DE ENVÍO')}</p>
            <p className="text-foreground">{contact.address}</p>
            <p className="text-sm text-muted-foreground">{contact.city}, {contact.zip_code}</p>
          </div>
        </div>

        {/* Notas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-1">{t('admin.invoices.modal.internal_notes', 'Notas internas')}</p>
            <textarea
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition min-h-[70px]"
              placeholder={t('admin.invoices.modal.internal_notes_placeholder', 'Solo visibles dentro del panel, no para el cliente.')}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              disabled={!isEditable}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-1">{t('admin.invoices.modal.public_notes', 'Notas para el cliente')}</p>
            <textarea
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition min-h-[70px]"
              placeholder={t('admin.invoices.modal.public_notes_placeholder', 'Mensaje que aparecerá en la factura o comprobante.')}
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
              <p className="text-xs text-red-700 font-semibold mb-1">{t('admin.invoices.modal.cancellation_reason', 'Motivo de anulación')}</p>
              <textarea
                className="w-full px-3 py-2 bg-background border border-red-300 rounded-lg text-sm text-foreground focus:outline-none focus:border-red-500 transition min-h-[60px]"
                placeholder={t('admin.invoices.modal.cancellation_reason_placeholder', 'Describe brevemente por qué se cancela esta factura.')}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                disabled={!isEditable}
              />
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-700 font-semibold mb-1">{t('admin.invoices.modal.adjustments_title', 'Notas de crédito / débito')}</p>
                <p className="text-sm text-muted-foreground">{t('admin.invoices.modal.adjustments_description', 'Ajustes vinculados a esta factura (no modifican el total actual).')}</p>
              </div>
              {isEditable && (
                <button
                  type="button"
                  onClick={() => setAdjustments((prev) => ([
                    ...prev,
                    { type: 'credit', amount_usd: '', currency_code: displayCurrency, description: '' },
                  ]))}
                  className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                    {t('admin.invoices.modal.add_adjustment', 'Añadir ajuste')}
                </button>
              )}
            </div>

            {adjustments.length === 0 ? (
                <p className="text-sm text-blue-700">{t('admin.invoices.modal.no_adjustments', 'No hay notas de crédito/débito registradas.')}</p>
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
                      <option value="credit">{t('admin.invoices.modal.adjustment_types.credit', 'Nota de crédito')}</option>
                      <option value="debit">{t('admin.invoices.modal.adjustment_types.debit', 'Nota de débito')}</option>
                    </select>
                    <select
                      className="md:col-span-1 border border-border rounded px-2 py-1 bg-background"
                      value={a.currency_code || 'USD'}
                      disabled={!isEditable}
                      onChange={(e) => {
                        const value = e.target.value
                        setAdjustments((prev) => prev.map((adj, i) => i === idx ? { ...adj, currency_code: value } : adj))
                      }}
                    >
                      {availableCurrencies.map((currency) => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={`${t('admin.invoices.modal.amount_usd', 'Monto')} ${a.currency_code || displayCurrency}`}
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
                      placeholder={t('admin.invoices.modal.description', 'Descripción')}
                      className="md:col-span-1 border border-border rounded px-2 py-1 bg-background"
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
              <p className="text-xs text-orange-700 font-semibold mb-1">{t('admin.invoices.modal.payments_title', 'PAGOS REGISTRADOS')}</p>
              <p className="text-sm text-muted-foreground">{t('admin.invoices.modal.payments_description', 'Permite registrar múltiples formas de pago y referencias.')}</p>
            </div>
            {isEditable && (
              <button
                type="button"
                onClick={() => setPayments((prev) => [...prev, { method: 'efectivo', amount_usd: '', amount_bs: '', currency_code: displayCurrency, reference: '', bank: '', notes: '', payer: '' }])}
                className="px-3 py-1.5 text-xs rounded bg-orange-600 text-white hover:bg-orange-700"
              >
                {t('admin.invoices.modal.add_payment', 'Añadir pago')}
              </button>
            )}
          </div>

          {payments.length === 0 ? (
            <p className="text-sm text-orange-700">{t('admin.invoices.modal.no_payments', 'No hay pagos registrados.')}</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {payments.map((p, idx) => (
                <div key={p.id ?? idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white/60 border border-orange-100 rounded p-3 text-xs">
                  <div className="flex flex-col">
                    <label className="text-[11px] text-muted-foreground mb-1">{t('admin.invoices.modal.field.method', 'Método')}</label>
                    <select
                      className="border border-border rounded px-2 py-2 bg-background w-full"
                      value={p.method}
                      disabled={!isEditable}
                      onChange={(e) => {
                        const value = e.target.value
                        setPayments((prev) => prev.map((pay, i) => i === idx ? { ...pay, method: value } : pay))
                      }}
                    >
                      <option value="efectivo">{t('admin.invoices.create.payment_methods.cash', 'Efectivo')}</option>
                      <option value="tarjeta">{t('admin.invoices.create.payment_methods.card', 'Tarjeta')}</option>
                      <option value="transferencia">{t('admin.invoices.create.payment_methods.transfer', 'Transferencia')}</option>
                      <option value="zelle">{t('admin.invoices.create.payment_methods.zelle', 'Zelle')}</option>
                      <option value="otro">{t('admin.invoices.create.payment_methods.other', 'Otro')}</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[11px] text-muted-foreground mb-1">{t('admin.invoices.modal.field.currency', 'Moneda')}</label>
                    <select
                      className="border border-border rounded px-2 py-2 bg-background w-full"
                      value={p.currency_code || 'USD'}
                      disabled={!isEditable}
                      onChange={(e) => {
                        const value = e.target.value
                        setPayments((prev) => prev.map((pay, i) => i === idx ? { ...pay, currency_code: value } : pay))
                      }}
                    >
                      {availableCurrencies.map((currency) => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[11px] text-muted-foreground mb-1">{t('admin.invoices.modal.field.amount', 'Monto')}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={`${t('admin.invoices.modal.amount_usd', 'Monto')} ${p.currency_code || displayCurrency}`}
                      className="border border-border rounded px-2 py-2 bg-background w-full"
                      disabled={!isEditable}
                      value={p.amount_usd}
                      onChange={(e) => {
                        const value = e.target.value
                        setPayments((prev) => prev.map((pay, i) => i === idx ? { ...pay, amount_usd: value } : pay))
                      }}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[11px] text-muted-foreground mb-1">{secondaryCurrency ? `${t('admin.invoices.modal.amount_bs', 'Referencia')} ${secondaryCurrency}` : t('admin.invoices.modal.amount_bs', 'Referencia')}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="border border-border rounded px-2 py-2 bg-background w-full"
                      disabled={!isEditable}
                      value={p.amount_bs}
                      onChange={(e) => {
                        const value = e.target.value
                        setPayments((prev) => prev.map((pay, i) => i === idx ? { ...pay, amount_bs: value } : pay))
                      }}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[11px] text-muted-foreground mb-1">{t('admin.invoices.modal.bank_account', 'Banco / Cuenta')}</label>
                    <input
                      type="text"
                      placeholder={t('admin.invoices.modal.bank_account', 'Banco / Cuenta')}
                      className="border border-border rounded px-2 py-2 bg-background w-full"
                      disabled={!isEditable}
                      value={p.bank}
                      onChange={(e) => {
                        const value = e.target.value
                        setPayments((prev) => prev.map((pay, i) => i === idx ? { ...pay, bank: value } : pay))
                      }}
                    />
                  </div>

                  <div className="flex flex-col md:col-span-3">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[11px] text-muted-foreground mb-1">{t('admin.invoices.modal.paid_by', 'Pagado por')}</label>
                        <input
                          type="text"
                          placeholder={t('admin.invoices.modal.paid_by', 'Nombre')}
                          className="border border-border rounded px-2 py-2 bg-background w-full"
                          disabled={!isEditable}
                          value={p.payer}
                          onChange={(e) => {
                            const value = e.target.value
                            setPayments((prev) => prev.map((pay, i) => i === idx ? { ...pay, payer: value } : pay))
                          }}
                        />
                      </div>

                      <div className="w-48">
                        <label className="text-[11px] text-muted-foreground mb-1">{t('admin.invoices.modal.notes', 'Notas')}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={t('admin.invoices.modal.notes', 'Notas')}
                            className="flex-1 border border-border rounded px-2 py-2 bg-background w-full"
                            disabled={!isEditable}
                            value={p.notes}
                            onChange={(e) => {
                              const value = e.target.value
                              setPayments((prev) => prev.map((pay, i) => i === idx ? { ...pay, notes: value } : pay))
                            }}
                          />
                        </div>
                      </div>

                      {isEditable && (
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => setPayments((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-600 self-end"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {payments.length > 0 && (
            <div className="flex justify-between text-xs text-orange-800 pt-1 border-t border-orange-200 mt-2">
              <span>{`${t('admin.invoices.modal.total_payments_usd', 'Total pagos')}: ${displayCurrency}`}</span>
              <span>{formatDisplayCurrency(paymentsTotalUsd)}</span>
            </div>
          )}
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg space-y-3">
          <div>
            <p className="text-xs text-emerald-700 font-semibold mb-1">{t('admin.invoices.modal.gateway_audit_title', 'AUDITORIA DE PASARELA')}</p>
            <p className="text-sm text-muted-foreground">{t('admin.invoices.modal.gateway_audit_description', 'Registro verificado de respuestas del gateway asociado a esta factura.')}</p>
          </div>

          {gatewayTransactions.length === 0 ? (
            <p className="text-sm text-emerald-800">{t('admin.invoices.modal.no_gateway_transactions', 'No hay transacciones de pasarela asociadas.')}</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {gatewayTransactions.map((transaction, index) => {
                const payload = prettyGatewayPayload(transaction.payload)

                return (
                  <div
                    key={transaction.id ?? `${transaction.provider}-${transaction.external_capture_id ?? index}`}
                    className="rounded-lg border border-emerald-100 bg-white/80 p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {(transaction.provider || 'gateway').toUpperCase()} / {transaction.event_type || t('admin.invoices.modal.gateway_event_fallback', 'evento')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('admin.invoices.modal.method', 'Método')}: {transaction.payment_method || fallbackText}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                        {transaction.status || fallbackText}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-xs text-slate-700 md:grid-cols-2">
                      <p><span className="font-semibold text-foreground">{t('admin.invoices.modal.order_id', 'Order ID')}:</span> {transaction.external_order_id || fallbackText}</p>
                      <p><span className="font-semibold text-foreground">{t('admin.invoices.modal.capture_id', 'Capture ID')}:</span> {transaction.external_capture_id || fallbackText}</p>
                      <p><span className="font-semibold text-foreground">{t('admin.invoices.modal.transaction_id', 'Transaction ID')}:</span> {transaction.external_transaction_id || fallbackText}</p>
                      <p><span className="font-semibold text-foreground">{t('admin.invoices.modal.amount', 'Monto')}:</span> {transaction.currency || fallbackText} {formatNumber(transaction.amount || 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p><span className="font-semibold text-foreground">{t('admin.invoices.modal.verified', 'Verificado')}:</span> {formatGatewayDate(transaction.verified_at, formatDateTime, fallbackText)}</p>
                      <p><span className="font-semibold text-foreground">{t('admin.invoices.modal.linked_invoice', 'Asociado a factura')}:</span> {formatGatewayDate(transaction.consumed_at, formatDateTime, fallbackText)}</p>
                    </div>

                    {payload && (
                      <details className="rounded-lg border border-emerald-100 bg-emerald-50/70">
                        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-emerald-800">
                          {t('admin.invoices.modal.view_gateway_payload', 'Ver payload del gateway')}
                        </summary>
                        <pre className="max-h-64 overflow-auto border-t border-emerald-100 px-3 py-3 text-[11px] leading-5 text-slate-700 whitespace-pre-wrap break-words">
                          {payload}
                        </pre>
                      </details>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Productos */}
        <div>
          <h4 className="text-lg font-bold text-foreground mb-3">{t('admin.invoices.modal.products_title', 'Productos')}</h4>
          <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-lg border border-border">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">{t('admin.invoices.modal.table.product', 'Producto')}</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">{t('admin.invoices.modal.table.quantity', 'Cantidad')}</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold">{t('admin.invoices.modal.table.price', 'Precio')}</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold">{t('admin.invoices.modal.table.total', 'Total')}</th>
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
                                ? { ...it, quantity: value, total: value * it.price, document_totals: null }
                                : it
                            )))
                          }}
                          className="w-16 border border-border rounded px-2 py-1 text-xs text-center bg-background"
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">{formatDisplayCurrency(item.price)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground text-right">
                      {getDocumentAmount(item.document_totals, item.total)}
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
              <span className="text-muted-foreground">{t('admin.invoices.modal.totals.subtotal', 'Subtotal:')}</span>
              <span>{getSummaryAmount('subtotal')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('admin.invoices.modal.totals.shipping', 'Envío:')}</span>
              <span>{getSummaryAmount('shipping')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('admin.invoices.modal.totals.taxes', 'Impuestos (15%):')}</span>
              <span>{getSummaryAmount('tax')}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground">
              <span>{`${t('admin.invoices.modal.totals.total_usd', 'Total')}: ${displayCurrency}`}</span>
              <span className="text-primary">{getSummaryAmount('total')}</span>
            </div>
            <div className="bg-accent/10 border border-accent rounded p-2 flex justify-between font-bold text-accent mt-2">
              <span>{comparisonCurrency ? `${t('admin.invoices.modal.totals.total_bs', 'Referencia')}: ${comparisonCurrency}` : t('admin.invoices.modal.totals.total_bs', 'Referencia')}</span>
              <span>{comparisonCurrency ? getSummaryAmount('total', comparisonCurrency) : t('admin.common.table.values.empty_dash', '—')}</span>
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
                    currency_code: p.currency_code || 'USD',
                    amount_bs: Number(p.amount_bs) || 0,
                    reference: p.reference || null,
                    bank: p.bank || null,
                    notes: p.notes || null,
                    payer: p.payer || null,
                  })),
                  adjustments: adjustments.map((a) => ({
                    type: a.type,
                    amount_usd: Number(a.amount_usd) || 0,
                    currency_code: a.currency_code || 'USD',
                    description: a.description || null,
                  })),
                }
                const loadingId = `update-invoice-${invoice.id}`
                toast.loading(t('admin.invoices.modal.toasts.updating', 'Actualizando factura...'), { id: loadingId, position: 'top-center' })
                router.put(route('admin.invoices.update', invoice.id), payload, {
                  preserveScroll: true,
                  onSuccess: () => {
                    toast.success(t('admin.invoices.modal.toasts.updated', 'Factura actualizada'), { id: loadingId, position: 'top-center' })
                    onClose()
                  },
                  onError: () => {
                    toast.error(t('admin.invoices.modal.toasts.update_failed', 'No se pudo actualizar la factura'), { id: loadingId, position: 'top-center' })
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
              {saving ? t('admin.invoices.modal.actions.saving', 'Guardando...') : t('admin.invoices.modal.actions.save_changes', 'Guardar cambios')}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition"
          >
            {t('admin.invoices.modal.actions.close', 'Cerrar')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
