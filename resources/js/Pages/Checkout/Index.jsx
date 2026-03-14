'use client'

import React, { useEffect, useState } from "react"
import GuestLayout from '@/Layouts/GuestLayout.jsx'
import { useCart } from '@/Hooks/useCart'
import { router } from '@inertiajs/react'
import { ChevronRight, Lock, ShoppingCart as ShoppingCartIcon } from 'lucide-react'
import { useDisplayCurrency } from '@/Hooks/useDisplayCurrency'
import { useI18n } from '@/Hooks/useI18n'

export default function CheckoutPage() {
  const { cart, clearCart, itemCount, updateQuantity, updatePrice, addToCart } = useCart()
  const [formData, setFormData] = useState({
    fullName: '',
    identification_type_id: '',
    identification: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    paymentMethod: 'transferencia',
    bank: '',
    originBank: '',
    reference: '',
    date: '',
    coupon_code: '',
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [rateBs, setRateBs] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loadingRecs, setLoadingRecs] = useState(false)
  const { displayCurrency, baseCurrency, secondaryCurrency } = useDisplayCurrency()
  const { t } = useI18n()

  const shippingCost = 200
  const taxRate = 0.15
  const paymentFeeRateMap = {
    'transferencia': 0,
    'pago-movil': 0.02,
    'otro': 0,
  }
  const subtotal = cart.total
  const paymentFeeRate = paymentFeeRateMap[formData.paymentMethod] ?? 0
  const tax = Math.round(subtotal * taxRate)
  const paymentFee = Math.round(subtotal * paymentFeeRate)
  const total = subtotal + tax + shippingCost + paymentFee

  // Obtener tasa BS desde API (como en el carrito)
  useEffect(() => {
    setRateBs(null)
    fetch('/api/currency/promedio?fuente=oficial', { cache: 'no-store' })
      .then((res) => res.ok ? res.json() : Promise.reject(res))
      .then((data) => {
        const val = typeof data?.promedio === 'number' ? data.promedio : null
        setRateBs(val)
      })
      .catch(() => setRateBs(null))
  }, [])

  // Recomendaciones para upselling en checkout
  useEffect(() => {
    setRecommendations([])
    setLoadingRecs(true)

    fetch('/api/recommendations/cart', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (data && data.ok && Array.isArray(data.items)) {
          setRecommendations(data.items)
        } else {
          setRecommendations([])
        }
      })
      .catch(() => {
        setRecommendations([])
      })
      .finally(() => {
        setLoadingRecs(false)
      })
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validaciones básicas
    if (!formData.fullName || !formData.email || !formData.address || !formData.identification_type_id || !formData.identification) {
      setError(t('checkout.error_required', 'Por favor completa todos los campos requeridos'))
      return
    }

    if (cart.items.length === 0) {
      setError(t('checkout.error_empty_cart', 'Tu carrito está vacío'))
      return
    }

    setIsProcessing(true)

    try {
      const payload = {
        ...formData,
        rateBs,
        items: cart.items.map((it) => ({
          product_id: it.id,
          quantity: it.quantity,
        })),
      }

      await router.post('/checkout', payload, {
        preserveScroll: true,
        onError: (errors) => {
          const firstKey = Object.keys(errors || {})[0]
          setError(
            errors?.[firstKey] || t('checkout.error_processing', 'Error al procesar el pago. Intenta nuevamente.')
          )
        },
        onSuccess: () => {
          clearCart()
          router.visit('/confirmacion')
        },
        onFinish: () => setIsProcessing(false),
      })
    } catch (err) {
      setError(t('checkout.error_processing', 'Error al procesar el pago. Intenta nuevamente.'))
      setIsProcessing(false)
    }
  }

  if (cart.items.length === 0) {
    return (
      <GuestLayout>
        <main className="flex flex-col min-h-screen bg-background">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-4">
                {t('checkout.empty_title', 'Carrito Vacío')}
              </h1>
              <p className="text-muted-foreground mb-6">
                {t('checkout.empty_description', 'Tu carrito está vacío. Agrega productos para continuar.')}
              </p>
              <button
                onClick={() => router.visit('/shop')}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                {t('checkout.empty_button', 'Volver a la Tienda')}
              </button>
            </div>
          </div>
        </main>
      </GuestLayout>
    )
  }

  return (
    <GuestLayout>
        <main className="flex flex-col min-h-screen bg-background">

      <div className="flex-1 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <span className="text-muted-foreground">
              {t('checkout.breadcrumb_cart', 'Carrito')}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-primary font-semibold">
              {t('checkout.breadcrumb_checkout', 'Checkout')}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  {t('checkout.shipping_info_title', 'Información de Envío')}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                      {error}
                    </div>
                  )}

                  {/* Nombre Completo */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                      required
                    />
                  </div>

                  {/* Identificación */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Tipo ID *
                      </label>
                      <select
                        name="identification_type_id"
                        value={formData.identification_type_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                        required
                      >
                        <option value="">Selecciona</option>
                        <option value="1">J</option>
                        <option value="2">N</option>
                        <option value="3">E</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Identificación *
                      </label>
                      <input
                        type="text"
                        name="identification"
                        value={formData.identification}
                        onChange={handleInputChange}
                        placeholder="Ej: 12345678"
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                      required
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                    />
                  </div>

                  {/* Dirección */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                      required
                    />
                  </div>

                  {/* Ciudad y Código Postal */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Código Postal
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                      />
                    </div>
                  </div>

                  {/* Separador */}
                  <div className="border-t border-border pt-6 mt-6">
                    <h3 className="text-xl font-bold text-foreground mb-4">
                      {t('checkout.payment_method_title', 'Método de Pago')}
                    </h3>

                    {/* Método de Pago */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        {t('checkout.payment_method_label', 'Selecciona un método de pago *')}
                      </label>
                      <select
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                        required
                      >
                        <option value="transferencia">Transferencia Bancaria</option>
                        <option value="pago-movil">Pago Móvil</option>
                        <option value="otro">Otro Método</option>
                      </select>
                    </div>

                    {/* Banco */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Banco *
                      </label>
                      <input
                        type="text"
                        name="bank"
                        value={formData.bank}
                        onChange={handleInputChange}
                        placeholder="Ej: Banco del Estado, Banesco, etc."
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                        required
                      />
                    </div>

                    {/* Banco de Origen */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Banco de Origen *
                      </label>
                      <input
                        type="text"
                        name="originBank"
                        value={formData.originBank}
                        onChange={handleInputChange}
                        placeholder="Banco desde donde realizas el pago"
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                        required
                      />
                    </div>

                    {/* Referencia y Fecha */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Referencia *
                        </label>
                        <input
                          type="text"
                          name="reference"
                          value={formData.reference}
                          onChange={handleInputChange}
                          placeholder="Número de referencia"
                          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Fecha del Pago *
                        </label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                          required
                        />
                      </div>
                    </div>

                    {/* Cupón de descuento */}
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        {t('checkout.coupon_label', 'Cupón de descuento')}
                      </label>
                      <input
                        type="text"
                        name="coupon_code"
                        value={formData.coupon_code}
                        onChange={handleInputChange}
                        placeholder={t('checkout.coupon_placeholder', 'Ingresa tu código de cupón')}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition uppercase"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t(
                          'checkout.coupon_help',
                          'El descuento se aplicará al confirmar el pedido si el cupón es válido.'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Botón de compra */}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full mt-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Lock className="w-5 h-5" />
                    {isProcessing
                      ? t('checkout.processing', 'Procesando...')
                      : displayCurrency === (secondaryCurrency || 'VES') && rateBs != null
                        ? `${t('checkout.pay_button_prefix', 'Pagar')} ${(secondaryCurrency || 'Bs.')} ${(total * rateBs).toLocaleString('es-AR')}`
                        : `${t('checkout.pay_button_prefix', 'Pagar')} ${baseCurrency || 'USD'} $${total.toLocaleString('es-AR')}`}
                  </button>
                </form>
              </div>
            </div>

            {/* Resumen de Orden */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-lg p-6 sticky top-20 h-fit">
                <h2 className="text-xl font-bold text-foreground mb-6">
                  {t('checkout.summary_title', 'Resumen')}
                </h2>

                {/* Items */}
                <div className="space-y-4 mb-6 border-b border-border pb-6">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{item.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div>{t('checkout.summary_qty_label', 'Qty:')}</div>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, Math.max(1, Number(e.target.value) || 1))}
                            className="w-20 border border-border rounded px-2 py-1 text-xs bg-background"
                          />
                          {typeof item.stock !== 'undefined' && (
                            <div className="text-xs">
                              {t('checkout.summary_stock_label', `Stock: ${item.stock}`)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">
                          {t('checkout.summary_price_label', 'Precio USD')}
                        </div>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.price}
                          onChange={(e) => updatePrice(item.id, Number(e.target.value) || 0)}
                          className="w-32 border border-border rounded px-2 py-1 text-sm bg-background text-right"
                        />
                        <div className="font-semibold mt-1">
                          ${ (item.price * item.quantity).toLocaleString('es-AR') }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totales */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('checkout.summary_subtotal', 'Subtotal:')}
                    </span>
                    {displayCurrency === (secondaryCurrency || 'VES') && rateBs != null ? (
                      <span className="text-foreground">
                        {(secondaryCurrency || 'Bs.') + ' '}
                        {(subtotal * rateBs).toLocaleString('es-AR')}
                      </span>
                    ) : (
                      <span className="text-foreground">
                        ${subtotal.toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('checkout.summary_shipping', 'Envío:')}
                    </span>
                    {displayCurrency === (secondaryCurrency || 'VES') && rateBs != null ? (
                      <span className="text-foreground">
                        {(secondaryCurrency || 'Bs.') + ' '}
                        {(shippingCost * rateBs).toLocaleString('es-AR')}
                      </span>
                    ) : (
                      <span className="text-foreground">
                        ${shippingCost.toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('checkout.summary_payment_fee', 'Recargo por método de pago:')}
                    </span>
                    {displayCurrency === (secondaryCurrency || 'VES') && rateBs != null ? (
                      <span className="text-foreground">
                        {(secondaryCurrency || 'Bs.') + ' '}
                        {(paymentFee * rateBs).toLocaleString('es-AR')}
                      </span>
                    ) : (
                      <span className="text-foreground">
                        ${paymentFee.toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('checkout.summary_tax', 'Impuestos (15%):')}
                    </span>
                    {displayCurrency === (secondaryCurrency || 'VES') && rateBs != null ? (
                      <span className="text-foreground">
                        {(secondaryCurrency || 'Bs.') + ' '}
                        {(tax * rateBs).toLocaleString('es-AR')}
                      </span>
                    ) : (
                      <span className="text-foreground">
                        ${tax.toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between mb-4">
                    <span className="font-bold text-foreground">
                      {t('checkout.summary_total_usd', 'Total USD:')}
                    </span>
                    {displayCurrency === (secondaryCurrency || 'VES') && rateBs != null ? (
                      <span className="text-2xl font-bold text-primary">
                        {(secondaryCurrency || 'Bs.') + ' '}
                        {(total * rateBs).toLocaleString('es-AR')}
                      </span>
                    ) : (
                      <span className="text-2xl font-bold text-primary">
                        ${total.toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                  <div className="bg-accent/10 border border-accent rounded-lg p-3 flex justify-between items-center">
                    <span className="font-bold text-foreground">
                      {t('checkout.summary_total_bs', 'Total Bs.:')}
                    </span>
                    <span className="text-2xl font-bold text-accent">
                      {rateBs != null
                        ? `Bs ${ (total * rateBs).toLocaleString('es-AR', { minimumFractionDigits: 2 }) }`
                        : '…'}
                    </span>
                  </div>
                </div>

                {/* Recomendaciones */}
                <div className="mt-6 border-t border-border pt-4">
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {t('checkout.recommendations_title', 'También te puede interesar')}
                  </h3>
                  {loadingRecs ? (
                    <p className="text-sm text-muted-foreground">
                      {t('checkout.recommendations_loading', 'Cargando recomendaciones...')}
                    </p>
                  ) : recommendations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('checkout.recommendations_empty', 'No hay recomendaciones por ahora.')}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recommendations.map((rec) => (
                        <div
                          key={rec.id}
                          className="flex items-center gap-3 p-2 bg-muted/40 rounded-md"
                        >
                          <div className="w-12 h-12 rounded-md bg-muted overflow-hidden flex-shrink-0">
                            <img
                              src={rec.image || '/placeholder.svg'}
                              alt={rec.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground line-clamp-1">
                              {rec.name}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {rec.category}
                            </p>
                            <p className="text-sm font-bold text-primary">
                              ${Number(rec.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (rec.stock !== undefined && rec.stock <= 0) return
                              addToCart({
                                id: String(rec.id),
                                name: rec.name,
                                price: Number(rec.price ?? 0),
                                image: rec.image || '',
                                category: rec.category || '',
                              })
                            }}
                            className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition whitespace-nowrap"
                          >
                            <ShoppingCartIcon className="w-3 h-3" />
                            {t('cart.add_button', 'Agregar')}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </main>
    </GuestLayout>
  )
}
