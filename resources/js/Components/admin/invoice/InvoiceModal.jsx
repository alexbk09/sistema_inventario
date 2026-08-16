import React, { useEffect, useMemo, useState } from 'react'
import Modal from '@/Components/Modal.jsx'
// Usando funciones nativas de JavaScript para formatear fechas
import { Printer, Download, X, CreditCard, Building2, Calendar, ArrowRightLeft, FileText } from 'lucide-react'
import { useI18n } from '@/Hooks/useI18n'
import { useLocaleFormat } from '@/Hooks/useLocaleFormat'
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates'

const PAYMENT_METHODS = {
  credit_card: 'Tarjeta de Crédito',
  debit_card: 'Tarjeta de Débito',
  paypal: 'PayPal',
  transfer: 'Transferencia Bancaria',
  cash: 'Efectivo',
  zelle: 'Zelle',
  binance: 'Binance Pay',
  pago_movil: 'Pago Móvil',
  other: 'Otro'
}

const PAYMENT_TYPES = {
  local: 'Transferencia Local',
  international: 'Transferencia Internacional',
  same_bank: 'Mismo Banco',
  zelle: 'Zelle',
  paypal: 'PayPal',
  pago_movil: 'Pago Móvil',
  binance: 'Binance Pay',
  cash: 'Efectivo',
  other: 'Otro'
}

const CURRENCIES = {
  USD: { code: 'USD', name: 'Dólar Americano', symbol: '$', flag: '🇺🇸' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  VES: { code: 'VES', name: 'Bolívar Soberano', symbol: 'Bs.', flag: '🇻🇪' },
  BS: { code: 'BS', name: 'Bolívar Soberano', symbol: 'Bs.', flag: '🇻🇪' },
  COP: { code: 'COP', name: 'Peso Colombiano', symbol: '$', flag: '🇨🇴' },
  MXN: { code: 'MXN', name: 'Peso Mexicano', symbol: '$', flag: '🇲🇽' },
}

function getPaymentMethodName(method) {
  if (!method) return 'No especificado'
  return PAYMENT_METHODS[method] || method
}

function getPaymentTypeName(type) {
  if (!type) return 'No especificado'
  return PAYMENT_TYPES[type] || type
}

function formatCurrency(amount, currencyCode, locale = 'es') {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '-'
  
  const num = Number(amount)
  const currency = CURRENCIES[currencyCode?.toUpperCase()] || { symbol: currencyCode + ' ' }
  
  // Format based on currency
  if (currencyCode?.toUpperCase() === 'VES' || currencyCode?.toUpperCase() === 'BS') {
    return `Bs. ${num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  
  if (currencyCode?.toUpperCase() === 'USD') {
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  
  return `${currency.symbol}${num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateString) {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'
    
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch {
    return '-'
  }
}

export default function InvoiceModal({
  isOpen,
  onClose,
  invoice,
  onStatusChange,
  isEditable = false,
}) {
  const { t } = useI18n()
  const { formatAmountInCurrency, formatDisplayCurrency } = useLocaleFormat()
  const { formatPriceFromUsd } = useConfiguredCurrencyRates()
  const displayCurrency = 'USD'
  const fallbackText = '-'

  const [status, setStatus] = useState(invoice?.status ?? 'pending')
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState('summary') // 'summary' | 'detail'

  useEffect(() => {
    setStatus(invoice?.status ?? 'pending')
  }, [invoice?.status])

  // Enhanced payment data with all fields
  const [payments, setPayments] = useState(() => (
    (invoice?.payments || []).map((p) => ({
      id: p.id,
      method: p.method,
      amount_usd: p.amount_original ?? p.amount_usd,
      amount_bs: p.amount_bs,
      currency_code: p.payment_currency_code ?? 'USD',
      reference: p.reference ?? '',
      bank: p.bank ?? p.bank_name ?? p.bank_account ?? '',
      origin_bank: p.origin_bank ?? '',
      operation_type: p.operation_type ?? '',
      payment_date: p.payment_date ?? p.created_at,
      notes: p.notes ?? '',
      payer: p.payer ?? p.paid_by ?? p.created_by ?? (p.user && p.user.name) ?? '',
      exchange_rate: p.exchange_rate_snapshot ?? p.exchange_rate ?? null,
    }))
  ))

  useEffect(() => {
    setPayments(
      (invoice?.payments || []).map((p) => ({
        id: p.id,
        method: p.method,
        amount_usd: p.amount_original ?? p.amount_usd,
        amount_bs: p.amount_bs,
        currency_code: p.payment_currency_code ?? 'USD',
        reference: p.reference ?? '',
        bank: p.bank ?? p.bank_name ?? p.bank_account ?? '',
        origin_bank: p.origin_bank ?? '',
        operation_type: p.operation_type ?? '',
        payment_date: p.payment_date ?? p.created_at,
        notes: p.notes ?? '',
        payer: p.payer ?? p.paid_by ?? p.created_by ?? (p.user && p.user.name) ?? '',
        exchange_rate: p.exchange_rate_snapshot ?? p.exchange_rate ?? null,
      }))
    )
  }, [invoice?.payments])

  const totalPaidUSD = useMemo(() => payments.reduce((sum, p) => sum + (parseFloat(p.amount_usd) || 0), 0), [payments])
  const totalPaidBS = useMemo(() => payments.reduce((sum, p) => sum + (parseFloat(p.amount_bs) || 0), 0), [payments])

  const totals = useMemo(() => {
    const currency = invoice?.currency_code ?? 'USD'
    const totalUsd = parseFloat(invoice?.total_usd ?? 0)
    const mtJson = invoice?.monetary_totals_json ?? {}

    // Subtotal: suma real de items
    const subtotalFromItems = (invoice?.items ?? []).reduce(
      (sum, i) => sum + parseFloat(i.subtotal_usd ?? (i.price_usd * i.quantity) ?? 0), 0
    )

    // Tax: desde monetary_totals_json (nuevas facturas) o inferido desde diferencia (facturas antiguas)
    const taxFromJson = parseFloat(mtJson?.tax_usd ?? mtJson?.tax ?? -1)
    const subtotal = subtotalFromItems > 0 ? subtotalFromItems : parseFloat(mtJson?.subtotal_usd ?? totalUsd)
    const tax = taxFromJson >= 0
      ? taxFromJson
      : (subtotalFromItems > 0 ? Math.max(0, parseFloat((totalUsd - subtotalFromItems).toFixed(2))) : 0)

    const shipping = parseFloat(invoice?.shipping_usd ?? mtJson?.shipping_usd ?? mtJson?.shipping ?? 0)
    const discount = parseFloat(invoice?.discount_usd ?? mtJson?.discount_usd ?? mtJson?.discount ?? 0)
    // Tasa de cambio
    const exchangeRate = invoice?.exchange_rate_snapshot ?? mtJson?.rates?.VES ?? null
    const exchangeRateDate = mtJson?.captured_at ?? null
    return { currency, subtotal, tax, shipping, discount, total: totalUsd, exchangeRate, exchangeRateDate }
  }, [invoice])

  const paymentTotals = useMemo(() => {
    // Si la factura está pagada, no hay pendiente
    const isPaid = invoice?.status === 'paid' || invoice?.invoiceStatus?.code === 'paid'
    if (isPaid) return { received: totals.total, pending: 0 }
    const received = totalPaidUSD
    const pending = Math.max(0, totals.total - received)
    return { received, pending }
  }, [totalPaidUSD, totals.total, invoice?.status, invoice?.invoiceStatus?.code])

  const contact = useMemo(() => ({
    full_name: invoice?.customer?.name ?? invoice?.contact?.full_name ?? invoice?.contact?.name ?? invoice?.full_name,
    email: invoice?.customer?.email ?? invoice?.contact?.email ?? invoice?.email,
    phone: invoice?.customer?.phone ?? invoice?.contact?.phone ?? invoice?.phone,
    address: invoice?.customer?.address ?? invoice?.contact?.address ?? invoice?.address,
    city: invoice?.customer?.city ?? invoice?.contact?.city ?? invoice?.city,
    zip_code: invoice?.customer?.zip_code ?? invoice?.contact?.zip_code ?? invoice?.zip_code,
    payment_date: invoice?.payment_date,
  }), [invoice])

  const customer = useMemo(() => ({
    name: invoice?.customer?.name ?? invoice?.contact?.full_name ?? invoice?.contact?.name,
    email: invoice?.customer?.email ?? invoice?.contact?.email,
    phone: invoice?.customer?.phone ?? invoice?.contact?.phone,
    address: invoice?.customer?.address ?? invoice?.contact?.address,
    city: invoice?.customer?.city ?? invoice?.contact?.city,
    document: invoice?.customer?.document ?? invoice?.contact?.document ?? invoice?.contact?.dni,
  }), [invoice])

  const currentStatus = useMemo(() => {
    const map = {
      pending: { label: t('admin.invoices.statuses.pending', 'Pendiente'), color: 'bg-yellow-100 text-yellow-800' },
      paid: { label: t('admin.invoices.statuses.paid', 'Pagada'), color: 'bg-green-100 text-green-800' },
      cancelled: { label: t('admin.invoices.statuses.cancelled', 'Cancelada'), color: 'bg-red-100 text-red-800' },
      processing: { label: t('admin.invoices.statuses.processing', 'Procesando'), color: 'bg-blue-100 text-blue-800' },
    }
    return map[status] ?? map.pending
  }, [status, t])

  function formatDocumentAmount(type) {
    const { total, subtotal, tax } = totals
    if (type === 'subtotal') {
      return formatDisplayCurrency(subtotal, displayCurrency)
    }
    if (type === 'tax') {
      return formatDisplayCurrency(tax, displayCurrency)
    }
    if (type === 'shipping') {
      return formatDisplayCurrency(invoice?.shipping_usd ?? 0, displayCurrency)
    }
    return formatDisplayCurrency(total, displayCurrency)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/admin/invoices/${invoice.id}/download-pdf`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      })
      
      if (!response.ok) throw new Error('Error al descargar PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `factura_${invoice.number || invoice.id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Error al descargar el PDF')
    }
  }

  if (!isOpen || !invoice) return null

  return (
    <Modal
      show={isOpen}
      onClose={onClose}
      maxWidth="2xl"
    >
      <div className="space-y-6 p-6">
        {/* Header with Logo */}
        <div className="flex items-start justify-between border-b pb-4">
          <div className="flex items-center gap-4">
            {invoice.company?.logo && (
              <img 
                src={invoice.company.logo} 
                alt="Logo" 
                className="h-16 w-auto object-contain"
              />
            )}
            <div>
              <h3 className="text-2xl font-bold text-foreground">{invoice.number}</h3>
              <p className="text-muted-foreground text-sm">
                {t('admin.invoices.modal.issued_on', 'Emitida el')} {contact.payment_date ? formatDate(contact.payment_date) : fallbackText}
              </p>
              {invoice.company?.name && (
                <p className="font-semibold text-foreground">{invoice.company.name}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition"
            >
              <Printer className="w-4 h-4" />
              {t('admin.invoices.modal.print', 'Imprimir')}
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition"
            >
              <Download className="w-4 h-4" />
              {t('admin.invoices.modal.download_pdf', 'Descargar PDF')}
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="h-5 w-5 text-slate-500" />
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
              {status !== invoice?.status && (
                <button
                  onClick={() => {
                    setSaving(true)
                    onStatusChange?.(status)
                    setTimeout(() => setSaving(false), 500)
                  }}
                  disabled={saving}
                  className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {saving ? t('common.saving', 'Guardando...') : t('common.save', 'Guardar')}
                </button>
              )}
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
            {customer.document && (
              <p className="text-sm text-muted-foreground">{t('admin.invoices.modal.document', 'Documento')}: {customer.document}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-1">{t('admin.invoices.modal.shipping_label', 'DIRECCIÓN / CONTACTO')}</p>
            <p className="text-foreground">{contact.address ?? '-'}</p>
            <p className="text-sm text-muted-foreground">{contact.city}{contact.city && contact.zip_code ? `, ${contact.zip_code}` : contact.zip_code}</p>
          </div>
        </div>

        {/* Productos/Items Section */}
        {invoice?.items && invoice.items.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground border-b pb-2">
              {t('admin.invoices.modal.items_title', 'Productos')}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 font-medium text-muted-foreground">{t('admin.invoices.modal.product', 'Producto')}</th>
                    <th className="text-center p-2 font-medium text-muted-foreground w-20">{t('admin.invoices.modal.qty', 'Cant.')}</th>
                    <th className="text-right p-2 font-medium text-muted-foreground w-28">{t('admin.invoices.modal.price', 'Precio')}</th>
                    <th className="text-right p-2 font-medium text-muted-foreground w-32">{t('admin.invoices.modal.subtotal', 'Subtotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="p-2">
                        <p className="font-medium text-foreground">{item.product?.name || item.name || 'Producto'}</p>
                        {item.product?.sku && (
                          <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
                        )}
                      </td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2 text-right">
                        {item.unit_currency_code === 'VES' || item.unit_currency_code === 'BS' ? (
                          <>
                            <span className="text-green-600 font-medium">
                              {formatCurrency(item.unit_price_original || item.price_usd, 'VES')}
                            </span>
                            {item.price_usd && item.price_usd !== (item.unit_price_original || 0) && (
                              <span className="block text-xs text-muted-foreground">
                                ({formatCurrency(item.price_usd, 'USD')})
                              </span>
                            )}
                          </>
                        ) : (
                          formatCurrency(item.price_usd, 'USD')
                        )}
                      </td>
                      <td className="p-2 text-right font-medium">
                        {item.unit_currency_code === 'VES' || item.unit_currency_code === 'BS' ? (
                          <>
                            <span className="text-green-600">
                              {formatCurrency(item.subtotal_original || item.subtotal_usd, 'VES')}
                            </span>
                            {item.subtotal_usd && item.subtotal_usd !== (item.subtotal_original || 0) && (
                              <span className="block text-xs text-muted-foreground">
                                ({formatCurrency(item.subtotal_usd, 'USD')})
                              </span>
                            )}
                          </>
                        ) : (
                          formatCurrency(item.subtotal_usd, 'USD')
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50 font-medium">
                  <tr>
                    <td colSpan="3" className="p-2 text-right text-muted-foreground">
                      Subtotal (neto):
                    </td>
                    <td className="p-2 text-right">{formatCurrency(totals.subtotal, 'USD')}</td>
                  </tr>
                  <tr className={totals.tax > 0 ? '' : 'opacity-50'}>
                    <td colSpan="3" className="p-2 text-right text-muted-foreground">
                      {t('admin.invoices.modal.tax', 'IVA / Impuestos')}:
                    </td>
                    <td className={`p-2 text-right ${totals.tax > 0 ? 'text-amber-600 font-semibold' : 'text-muted-foreground'}`}>
                      {totals.tax > 0 ? `+ ${formatCurrency(totals.tax, 'USD')}` : formatCurrency(0, 'USD')}
                    </td>
                  </tr>
                  {totals.shipping > 0 && (
                    <tr>
                      <td colSpan="3" className="p-2 text-right text-muted-foreground">{t('admin.invoices.modal.shipping', 'Envío')}:</td>
                      <td className="p-2 text-right">+ {formatCurrency(totals.shipping, 'USD')}</td>
                    </tr>
                  )}
                  {totals.discount > 0 && (
                    <tr>
                      <td colSpan="3" className="p-2 text-right text-green-600">{t('admin.invoices.modal.discount', 'Descuento')}:</td>
                      <td className="p-2 text-right text-green-600">- {formatCurrency(totals.discount, 'USD')}</td>
                    </tr>
                  )}
                  {totals.exchangeRate && totals.exchangeRate > 1 && (
                    <tr>
                      <td colSpan="4" className="p-2">
                        <div className="flex items-center gap-2 text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded px-3 py-2">
                          <ArrowRightLeft className="w-3 h-3 text-amber-600" />
                          <span className="text-amber-700 dark:text-amber-300">
                            Tasa aplicada: <strong>1 USD = Bs. {Number(totals.exchangeRate).toFixed(2)}</strong>
                            {totals.exchangeRateDate && (
                              <span className="ml-2 opacity-70">({new Date(totals.exchangeRateDate).toLocaleDateString()})</span>
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr className="text-base border-t-2 border-border">
                    <td colSpan="3" className="p-2 text-right font-bold">{t('admin.invoices.modal.total', 'Total')}:</td>
                    <td className="p-2 text-right font-bold text-primary">
                      {formatCurrency(invoice.total_usd, 'USD')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Payment Details Section */}
        {payments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {t('admin.invoices.modal.payments_title', 'Detalles de Pagos')}
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('summary')}
                  className={`px-3 py-1 text-sm rounded ${viewMode === 'summary' ? 'bg-primary text-white' : 'bg-muted'}`}
                >
                  Resumen
                </button>
                <button
                  onClick={() => setViewMode('detail')}
                  className={`px-3 py-1 text-sm rounded ${viewMode === 'detail' ? 'bg-primary text-white' : 'bg-muted'}`}
                >
                  Detalle
                </button>
              </div>
            </div>

            {viewMode === 'summary' ? (
              // Summary View
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-foreground">
                          {getPaymentMethodName(payment.method)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Ref: {payment.reference || '-'}
                        </p>
                        {payment.bank && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {payment.bank}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {formatCurrency(payment.amount_usd, 'USD')}
                        </p>
                        {payment.amount_bs > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(payment.amount_bs, 'VES')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Detail View
              <div className="space-y-4">
                {payments.map((payment, index) => (
                  <div key={payment.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start mb-3 pb-2 border-b">
                      <h5 className="font-semibold text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {t('admin.invoices.modal.payment_number', 'Pago')} #{index + 1}
                      </h5>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(payment.payment_date)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Montos */}
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-semibold">{t('admin.invoices.modal.amounts', 'MONTOS')}</p>
                        <div className="flex justify-between">
                          <span className="text-sm">{t('admin.invoices.modal.amount_usd', 'Monto USD')}:</span>
                          <span className="font-medium">{formatCurrency(payment.amount_usd, 'USD')}</span>
                        </div>
                        {payment.amount_bs > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm">{t('admin.invoices.modal.amount_bs', 'Monto BS')}:</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(payment.amount_bs, 'VES')}
                            </span>
                          </div>
                        )}
                        {payment.exchange_rate && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{t('admin.invoices.modal.exchange_rate', 'Tasa')}:</span>
                            <span>Bs. {Number(payment.exchange_rate).toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {/* Información Bancaria */}
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-semibold">{t('admin.invoices.modal.bank_info', 'INFORMACIÓN BANCARIA')}</p>
                        {payment.reference && (
                          <div className="flex justify-between">
                            <span className="text-sm">{t('admin.invoices.modal.reference', 'Referencia')}:</span>
                            <span className="font-medium font-mono bg-slate-100 px-2 py-0.5 rounded">
                              {payment.reference}
                            </span>
                          </div>
                        )}
                        {payment.bank && (
                          <div className="flex justify-between">
                            <span className="text-sm">{t('admin.invoices.modal.destination_bank', 'Banco Destino')}:</span>
                            <span className="text-sm font-medium">{payment.bank}</span>
                          </div>
                        )}
                        {payment.origin_bank && (
                          <div className="flex justify-between">
                            <span className="text-sm">{t('admin.invoices.modal.origin_bank', 'Banco Origen')}:</span>
                            <span className="text-sm">{payment.origin_bank}</span>
                          </div>
                        )}
                        {payment.operation_type && (
                          <div className="flex justify-between">
                            <span className="text-sm">{t('admin.invoices.modal.operation_type', 'Tipo de Operación')}:</span>
                            <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              {getPaymentTypeName(payment.operation_type)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notas adicionales */}
                    {payment.notes && (
                      <div className="mt-3 pt-2 border-t">
                        <p className="text-xs text-muted-foreground font-semibold mb-1">
                          {t('admin.invoices.modal.notes', 'Notas')}
                        </p>
                        <p className="text-sm text-muted-foreground italic">
                          {payment.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Totales de Pago */}
            <div className="bg-primary/10 p-4 rounded-lg mt-4">
              <h5 className="font-semibold text-foreground mb-3">{t('admin.invoices.modal.payment_summary', 'Resumen de Pagos')}</h5>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('admin.invoices.modal.total_invoice', 'Total Factura')}</p>
                  <p className="text-lg font-semibold">{formatCurrency(totals.total, 'USD')}</p>
                  {totals.tax > 0 && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      Incl. IVA: {formatCurrency(totals.tax, 'USD')}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('admin.invoices.modal.total_paid', 'Total Pagado')}</p>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(paymentTotals.received, 'USD')}</p>
                  {totalPaidBS > 0 && (
                    <p className="text-sm text-green-600">{formatCurrency(totalPaidBS, 'VES')}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('admin.invoices.modal.pending', 'Pendiente')}</p>
                  <p className={`text-lg font-semibold ${paymentTotals.pending > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {paymentTotals.pending > 0 ? formatCurrency(paymentTotals.pending, 'USD') : '✓ Pagado'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer de Empresa */}
        {invoice.company && (
          <div className="border-t pt-4 mt-6 text-center text-sm text-muted-foreground">
            <p className="font-semibold">{invoice.company.name}</p>
            {invoice.company.address && <p>{invoice.company.address}</p>}
            {invoice.company.phone && <p>{t('admin.invoices.modal.phone', 'Tel')}: {invoice.company.phone}</p>}
            {invoice.company.email && <p>{invoice.company.email}</p>}
            {invoice.company.tax_id && (
              <p className="mt-1">{t('admin.invoices.modal.tax_id', 'RIF/NIT')}: {invoice.company.tax_id}</p>
            )}
          </div>
        )}

        {/* Botón cerrar */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition"
          >
            {t('confirmation.close_modal', 'Cerrar')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
