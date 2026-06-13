import React, { useState } from 'react'
import GuestLayout from '@/Layouts/GuestLayout.jsx'
import { router, usePage } from '@inertiajs/react'
import { useI18n } from '@/Hooks/useI18n'
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates'
import Modal from '@/Components/Modal'
import { CheckCircle, FileText, Home, QrCode, Receipt, X, Package, CreditCard, Calendar, User, MapPin, Phone, Mail } from 'lucide-react'

export default function Confirmation() {
  const { props } = usePage()
  const { t, locale } = useI18n()
  const { formatPriceFromUsd } = useConfiguredCurrencyRates()
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)

  const invoiceNumber = props.invoiceNumber || props.flash?.invoice_number
  const invoiceId = props.invoiceId || props.flash?.invoice_id
  const qrUrl = props.qrUrl || props.flash?.qr_url || null
  const publicUrl = props.publicUrl || props.flash?.public_url || (invoiceId ? `/pedido/${invoiceId}` : null)
  const isPaid = props.isPaid || props.flash?.is_paid || false
  const invoice = props.invoice || props.flash?.invoice || null
  const rate = props.rate || props.flash?.rate || null

  // Determinar mensaje basado en estado de pago
  const getMessage = () => {
    if (isPaid) {
      return t('confirmation.paid_message', '¡Gracias por tu compra! Tu pago ha sido procesado correctamente.')
    }
    return t('confirmation.pending_message', 'Tu pedido ha sido registrado. Por favor, realiza el pago para completar tu compra.')
  }

  // Map locale to BCP 47 format for Intl.NumberFormat
  const localeMap = {
    es: 'es-VE',
    en: 'en-US',
    pt: 'pt-BR',
    fr: 'fr-FR',
    it: 'it-IT',
  }
  const currentLocale = localeMap[locale] || locale || 'es-VE'

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat(currentLocale, {
      style: 'currency',
      currency: currency,
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString(currentLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: { text: t('customer_invoice_modal.status_pending', 'Pendiente'), color: 'bg-amber-100 text-amber-700' },
      paid: { text: t('customer_invoice_modal.status_paid_label', 'Pagado'), color: 'bg-emerald-100 text-emerald-700' },
      shipped: { text: t('customer_invoice_modal.status_shipped', 'Enviado'), color: 'bg-blue-100 text-blue-700' },
      delivered: { text: t('customer_invoice_modal.status_delivered', 'Entregado'), color: 'bg-teal-100 text-teal-700' },
      cancelled: { text: t('customer_invoice_modal.status_cancelled', 'Cancelado'), color: 'bg-red-100 text-red-700' },
    }
    return labels[status] || { text: status, color: 'bg-slate-100 text-slate-700' }
  }

  const getPaymentMethodLabel = (method) => {
    const methods = {
      paypal: t('payment_methods.paypal', 'PayPal'),
      stripe: t('payment_methods.stripe', 'Credit/Debit Card'),
      manual: t('payment_methods.manual', 'Transfer/Cash'),
      zelle: t('payment_methods.zelle', 'Zelle'),
      efectivo: t('payment_methods.cash', 'Cash'),
      tarjeta: t('payment_methods.card', 'Card'),
      transferencia: t('payment_methods.transfer', 'Transfer'),
      cash: t('payment_methods.cash', 'Cash'),
      card: t('payment_methods.card', 'Card'),
      transfer: t('payment_methods.transfer', 'Transfer'),
    }
    return methods[method] || method
  }

  // Helper to format dual currency amounts
  const formatDualCurrency = (amount, currency) => {
    if (!amount) return formatCurrency(0, 'USD')
    
    // If the currency is USD, show only USD
    if (currency === 'USD') {
      return formatCurrency(amount, 'USD')
    }
    
    // If the currency is VES and we have a rate, show both
    if ((currency === 'VES' || currency === 'BS') && rate && rate > 0) {
      const usdAmount = amount / rate
      return (
        <span>
          <span className="font-semibold">{formatCurrency(amount, currency)}</span>
          <span className="text-xs text-slate-500 ml-1">({formatCurrency(usdAmount, 'USD')})</span>
        </span>
      )
    }
    
    return formatCurrency(amount, currency)
  }

  return (
    <GuestLayout>
      <main className="flex flex-col min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),_transparent_35%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(255,255,255,1))]">
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl">
            {/* Header de éxito */}
            <div className="rounded-[28px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 text-center shadow-sm mb-6">
              <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-emerald-900 sm:text-3xl">
                {isPaid
                  ? t('confirmation.paid_title', '¡Pago completado con éxito!')
                  : t('confirmation.pending_title', '¡Pedido registrado correctamente!')}
              </h1>
              <p className="mt-2 text-emerald-700">
                {getMessage()}
              </p>
            </div>

            {/* Tarjeta de factura */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {t('confirmation.invoice_details', 'Detalles de la factura')}
                  </h2>
                  {invoiceNumber && (
                    <p className="text-sm text-slate-500">
                      {t('confirmation.invoice_number_label', 'Número:')} <strong className="text-slate-900">{invoiceNumber}</strong>
                    </p>
                  )}
                </div>
                {isPaid && (
                  <span className="ml-auto rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {t('confirmation.status_paid', 'PAGADO')}
                  </span>
                )}
              </div>

              {/* Resumen de totales si hay datos de factura */}
              {invoice && (
                <div className="space-y-3 border-t border-slate-100 pt-4 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t('confirmation.subtotal', 'Subtotal:')}</span>
                    <span className="font-medium text-slate-900">{formatDualCurrency(invoice.subtotal, invoice.currency_code)}</span>
                  </div>
                  {invoice.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{t('confirmation.tax', 'Impuestos:')}</span>
                      <span className="font-medium text-slate-900">{formatDualCurrency(invoice.tax, invoice.currency_code)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold border-t border-slate-100 pt-3">
                    <span className="text-slate-900">{t('confirmation.total', 'Total:')}</span>
                    <span className="text-emerald-600">{formatDualCurrency(invoice.total, invoice.currency_code)}</span>
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="grid gap-3 sm:grid-cols-2">
                {invoice && (
                  <button
                    onClick={() => setIsInvoiceModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <FileText className="h-4 w-4" />
                    {t('confirmation.view_invoice', 'Ver factura completa')}
                  </button>
                )}
                <button
                  onClick={() => router.visit('/')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Home className="h-4 w-4" />
                  {t('confirmation.back_home', 'Volver al inicio')}
                </button>
              </div>
            </div>

            {/* QR de seguimiento */}
            {qrUrl && (
              <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <QrCode className="h-5 w-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-900">
                    {t('confirmation.track_order', 'Seguimiento de pedido')}
                  </h3>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={qrUrl}
                    alt={t('confirmation.qr_alt', 'QR de seguimiento de pedido')}
                    className="w-32 h-32 border border-slate-200 rounded-xl bg-white"
                  />
                  <p className="text-xs text-slate-500 max-w-xs">
                    {t('confirmation.qr_help', 'Escanea este código QR para ver el estado de tu pedido en cualquier momento.')}
                  </p>
                </div>
              </div>
            )}

            {/* Información de contacto */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                {t('confirmation.contact_help', '¿Necesitas ayuda? Contáctanos con tu número de factura.')}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Factura Simplificado para Cliente */}
      <Modal show={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} maxWidth="2xl">
        {invoice && (
          <div className="p-6 space-y-6">
            {/* Header del modal */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{invoice.number}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(invoice.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusLabel(invoice.status).color}`}>
                  {getStatusLabel(invoice.status).text}
                </span>
                <button
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Información del cliente */}
            {invoice.customer && (
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('customer_invoice_modal.customer_info', 'Información del cliente')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">{t('customer_invoice_modal.customer_name', 'Nombre')}</p>
                    <p className="font-medium text-slate-900">{invoice.customer.name || 'N/A'}</p>
                  </div>
                  {invoice.customer.email && (
                    <div>
                      <p className="text-slate-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {t('customer_invoice_modal.customer_email', 'Email')}
                      </p>
                      <p className="font-medium text-slate-900">{invoice.customer.email}</p>
                    </div>
                  )}
                  {invoice.customer.phone && (
                    <div>
                      <p className="text-slate-500 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {t('customer_invoice_modal.customer_phone', 'Teléfono')}
                      </p>
                      <p className="font-medium text-slate-900">{invoice.customer.phone}</p>
                    </div>
                  )}
                  {(invoice.customer.address || invoice.customer.city) && (
                    <div>
                      <p className="text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {t('customer_invoice_modal.customer_address', 'Dirección')}
                      </p>
                      <p className="font-medium text-slate-900">
                        {invoice.customer.address}{invoice.customer.city ? `, ${invoice.customer.city}` : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Productos */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t('customer_invoice_modal.products_title', 'Productos')}
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">{t('customer_invoice_modal.product_name', 'Producto')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">{t('customer_invoice_modal.quantity', 'Cant.')}</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">{t('customer_invoice_modal.price', 'Precio')}</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">{t('customer_invoice_modal.total', 'Total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 text-sm text-slate-900">{item.name}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">{formatDualCurrency(item.price, invoice.currency_code)}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">{formatDualCurrency(item.total, invoice.currency_code)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{t('customer_invoice_modal.subtotal', 'Subtotal:')}</span>
                <span className="font-medium text-slate-900">{formatDualCurrency(invoice.subtotal, invoice.currency_code)}</span>
              </div>
              {invoice.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{t('customer_invoice_modal.tax', 'Impuestos:')}</span>
                  <span className="font-medium text-slate-900">{formatDualCurrency(invoice.tax, invoice.currency_code)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold border-t border-slate-200 pt-2">
                <span className="text-slate-900">{t('customer_invoice_modal.total', 'Total:')}</span>
                <span className="text-emerald-600">{formatDualCurrency(invoice.total, invoice.currency_code)}</span>
              </div>
            </div>

            {/* Pagos */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {t('customer_invoice_modal.payments_title', 'Pagos realizados')}
                </h4>
                <div className="space-y-2">
                  {invoice.payments.map((payment, idx) => (
                    <div key={idx} className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-emerald-900">{getPaymentMethodLabel(payment.method)}</p>
                          {payment.reference && (
                            <p className="text-sm text-emerald-700">{t('customer_invoice_modal.payment_ref', 'Ref:')} {payment.reference}</p>
                                  )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-emerald-900">{formatDualCurrency(payment.amount, payment.currency || invoice.currency_code)}</p>
                          <p className="text-xs text-emerald-600">{formatDate(payment.date)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón cerrar */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition"
              >
                {t('confirmation.close_modal', 'Cerrar')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </GuestLayout>
  )
}
