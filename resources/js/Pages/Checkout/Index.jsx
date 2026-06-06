'use client'

import React, { useEffect, useState } from "react"
import axios from 'axios'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { toast } from 'react-hot-toast'
import GuestLayout from '@/Layouts/GuestLayout.jsx'
import StripePaymentPanel from '@/Components/checkout/StripePaymentPanel.jsx'
import { useCart } from '@/Hooks/useCart'
import { router, usePage } from '@inertiajs/react'
import {
  Building2,
  ChevronRight,
  CreditCard,
  Landmark,
  Lock,
  ShieldCheck,
  ShoppingCart as ShoppingCartIcon,
  Wallet,
} from 'lucide-react'
import ProductCartItem from '@/Components/shop/ProductCartItem'
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates'
import { useI18n } from '@/Hooks/useI18n'
import { useLocaleFormat } from '@/Hooks/useLocaleFormat'

const PAYMENT_ICONS = {
  manual: Landmark,
  paypal: Wallet,
  stripe: CreditCard,
}

const isEnabledValue = (value) => value === true || value === 1 || value === '1' || value === 'true'

export default function CheckoutPage() {
  const { cart, clearCart, itemCount, updateQuantity, updatePrice, addToCart } = useCart()
  const { props } = usePage();
  const customer = props.customer;
  const payments = props.payments || {};
  const checkoutCurrencies = Array.isArray(props.checkoutCurrencies) ? props.checkoutCurrencies : [];
  const defaultCheckoutCurrency = props.defaultCheckoutCurrency || checkoutCurrencies[0]?.code || 'USD';
  const paypalConfig = payments?.methods?.paypal || null;
  const stripeConfig = payments?.methods?.stripe || null;
  const paymentMethods = Object.entries(payments?.methods || {})
    .filter(([, method]) => isEnabledValue(method?.enabled))
    .map(([key, method]) => ({ key, ...method }));
  const bankAccounts = Array.isArray(payments?.bank_accounts)
    ? payments.bank_accounts.filter((account) => isEnabledValue(account?.enabled))
    : [];
  const originBanks = Array.isArray(payments?.origin_banks)
    ? payments.origin_banks.filter((bank) => isEnabledValue(bank?.enabled))
    : [];
  const defaultPaymentMethod = paymentMethods[0]?.key || 'manual';
  const [formData, setFormData] = useState(() => ({
    fullName: customer?.fullName || '',
    identification_type_id: customer?.identification_type_id || '',
    identification: customer?.identification || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    postal_code: customer?.postal_code || '',
    paymentMethod: defaultPaymentMethod,
    checkoutCurrency: defaultCheckoutCurrency,
    bank: '',
    originBank: '',
    reference: '',
    date: '',
    coupon_code: '',
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
    paypalOrderId: '',
    paypalCaptureId: '',
    stripePaymentIntentId: '',
  }))
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [paypalState, setPaypalState] = useState({
    orderID: '',
    captureID: '',
    approved: false,
  })
  const [stripeState, setStripeState] = useState({
    clientSecret: '',
    paymentIntentId: '',
    approved: false,
    preparing: false,
  })
  const [recommendations, setRecommendations] = useState([])
  const [loadingRecs, setLoadingRecs] = useState(false)
  const { displayCurrency, baseCurrency, comparisonCurrency, ratesByCode, formatPriceFromUsd, hasRateForCurrency } = useConfiguredCurrencyRates()
  const { t } = useI18n()
  const { formatNumber } = useLocaleFormat()
  const rateBs = Number(ratesByCode.VES ?? 0) || null

  const shippingCost = 0
  const taxRate = 0.15
  const selectedPaymentMethod = paymentMethods.find((method) => method.key === formData.paymentMethod) || paymentMethods[0] || null
  const selectedCheckoutCurrency = checkoutCurrencies.find((currency) => currency.code === formData.checkoutCurrency) || checkoutCurrencies[0] || { code: defaultCheckoutCurrency }
  const checkoutCurrency = formData.checkoutCurrency || displayCurrency
  const subtotal = cart.total
  const paymentFeeRate = Number(selectedPaymentMethod?.fee_percent || 0) / 100
  const tax = Math.round(subtotal * taxRate)
  const paymentFee = Math.round(subtotal * paymentFeeRate)
  const total = subtotal + tax + shippingCost + paymentFee
  const formatAmount = (value, options = {}) => formatNumber(value || 0, { minimumFractionDigits: 2, maximumFractionDigits: 2, ...options })
  const formatDisplayCurrency = (value, currency = displayCurrency) => formatPriceFromUsd(value || 0, currency)
  const formatCheckoutCurrency = (value) => formatPriceFromUsd(value || 0, checkoutCurrency)

  useEffect(() => {
    if (paymentMethods.length === 0) {
      return
    }

    if (!paymentMethods.some((method) => method.key === formData.paymentMethod)) {
      setFormData((prev) => ({ ...prev, paymentMethod: paymentMethods[0].key }))
    }
  }, [formData.paymentMethod, paymentMethods])

  useEffect(() => {
    const allowedCurrencies = checkoutCurrencies.map((currency) => currency.code)
    if (allowedCurrencies.length === 0) {
      return
    }

    if (!allowedCurrencies.includes(formData.checkoutCurrency)) {
      setFormData((prev) => ({ ...prev, checkoutCurrency: allowedCurrencies[0] }))
    }
  }, [checkoutCurrencies, formData.checkoutCurrency])

  useEffect(() => {
    if (formData.paymentMethod !== 'manual') {
      return
    }

    const updates = {}
    if (!formData.bank && bankAccounts[0]?.bank_name) {
      updates.bank = bankAccounts[0].bank_name
    }
    if (!formData.originBank && originBanks[0]?.name) {
      updates.originBank = originBanks[0].name
    }

    if (Object.keys(updates).length > 0) {
      setFormData((prev) => ({ ...prev, ...updates }))
    }
  }, [bankAccounts, formData.bank, formData.originBank, formData.paymentMethod, originBanks])

  useEffect(() => {
    if (formData.paymentMethod !== 'paypal') {
      return
    }

    setPaypalState({ orderID: '', captureID: '', approved: false })
    setFormData((prev) => ({
      ...prev,
      paypalOrderId: '',
      paypalCaptureId: '',
      reference: '',
    }))
  }, [formData.coupon_code, formData.paymentMethod, itemCount, total])

  useEffect(() => {
    if (formData.paymentMethod !== 'stripe') {
      return
    }

    setStripeState({ clientSecret: '', paymentIntentId: '', approved: false, preparing: false })
    setFormData((prev) => ({
      ...prev,
      stripePaymentIntentId: '',
      reference: '',
    }))
  }, [formData.coupon_code, formData.paymentMethod, itemCount, total])

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

  const getCheckoutItemsPayload = () => cart.items.map((it) => ({
    product_id: it.id,
    quantity: it.quantity,
  }))

  const validateCheckout = (paymentMethod = formData.paymentMethod, options = {}) => {
    const { skipGatewayConfirmation = false } = options

    if (!formData.fullName || !formData.email || !formData.address || !formData.identification_type_id || !formData.identification) {
      const msg = t('checkout.error_required', 'Por favor completa todos los campos requeridos')
      setError(msg)
      toast.error(msg)
      return false
    }

    if (cart.items.length === 0) {
      const msg = t('checkout.error_empty_cart', 'Tu carrito está vacío')
      setError(msg)
      toast.error(msg)
      return false
    }

    if (paymentMethod === 'manual' && (!formData.bank || !formData.originBank || !formData.reference || !formData.date)) {
      const msg = t('checkout.error_manual_payment_data', 'Completa los datos de la transferencia antes de confirmar.')
      setError(msg)
      toast.error(msg)
      return false
    }

    if (paymentMethod === 'paypal' && !skipGatewayConfirmation && !paypalState.approved) {
      const msg = t('checkout.error_paypal_pending', 'Primero debes completar el pago con PayPal.')
      setError(msg)
      toast.error(msg)
      return false
    }

    if (paymentMethod === 'stripe' && !skipGatewayConfirmation && !stripeState.approved) {
      const msg = t('checkout.error_stripe_pending', 'Primero debes completar el pago con Stripe.')
      setError(msg)
      toast.error(msg)
      return false
    }

    return true
  }

  const handlePaymentMethodSelect = (methodKey) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: methodKey,
      bank: methodKey === 'manual' ? prev.bank : '',
      originBank: methodKey === 'manual' ? prev.originBank : '',
      reference: methodKey === 'manual' ? prev.reference : '',
      date: methodKey === 'manual' ? prev.date : '',
      paypalOrderId: methodKey === 'paypal' ? prev.paypalOrderId : '',
      paypalCaptureId: methodKey === 'paypal' ? prev.paypalCaptureId : '',
      stripePaymentIntentId: methodKey === 'stripe' ? prev.stripePaymentIntentId : '',
    }))

    if (methodKey !== 'paypal') {
      setPaypalState({ orderID: '', captureID: '', approved: false })
    }

    if (methodKey !== 'stripe') {
      setStripeState({ clientSecret: '', paymentIntentId: '', approved: false, preparing: false })
    }
  }

  const createPayPalOrder = async () => {
    setError('')

    if (!validateCheckout('paypal', { skipGatewayConfirmation: true })) {
      throw new Error(t('checkout.error_incomplete_form', 'Formulario incompleto'))
    }

    const response = await axios.post('/checkout/paypal/order', {
      paymentMethod: 'paypal',
      checkoutCurrency: formData.checkoutCurrency,
      coupon_code: formData.coupon_code,
      items: getCheckoutItemsPayload(),
    })

    const orderID = response?.data?.orderID

    if (!orderID) {
      throw new Error(t('checkout.error_paypal_invalid_order', 'PayPal no devolvió una orden válida.'))
    }

    setPaypalState({ orderID, captureID: '', approved: false })
    return orderID
  }

  const capturePayPalOrder = async (data) => {
    const response = await axios.post('/checkout/paypal/capture', {
      paymentMethod: 'paypal',
      orderID: data.orderID,
    })

    const captureID = response?.data?.captureID

    if (!captureID) {
      throw new Error(t('checkout.error_paypal_invalid_capture', 'PayPal no devolvió una captura válida.'))
    }

    setPaypalState({ orderID: data.orderID, captureID, approved: true })
    setFormData((prev) => ({
      ...prev,
      paypalOrderId: data.orderID,
      paypalCaptureId: captureID,
      reference: captureID,
    }))
    toast.success(t('checkout.paypal_success', 'Pago PayPal confirmado. Ahora puedes registrar el pedido.'))
  }

  const prepareStripePaymentIntent = async () => {
    setError('')

    if (!validateCheckout('stripe', { skipGatewayConfirmation: true })) {
      throw new Error(t('checkout.error_incomplete_form', 'Formulario incompleto'))
    }

    setStripeState((prev) => ({ ...prev, preparing: true }))

    try {
      const response = await axios.post('/checkout/stripe/intent', {
        paymentMethod: 'stripe',
        checkoutCurrency: formData.checkoutCurrency,
        coupon_code: formData.coupon_code,
        items: getCheckoutItemsPayload(),
      })

      const clientSecret = response?.data?.clientSecret
      const paymentIntentId = response?.data?.paymentIntentId

      if (!clientSecret || !paymentIntentId) {
        throw new Error(t('checkout.error_stripe_invalid_intent', 'Stripe no devolvio un intento de pago valido.'))
      }

      setStripeState({
        clientSecret,
        paymentIntentId,
        approved: false,
        preparing: false,
      })
    } catch (err) {
      setStripeState({ clientSecret: '', paymentIntentId: '', approved: false, preparing: false })
      throw err
    }
  }

  const handleStripeApproved = async (paymentIntent) => {
    const paymentIntentId = paymentIntent?.id || stripeState.paymentIntentId

    const response = await axios.post('/checkout/stripe/verify', {
      paymentMethod: 'stripe',
      paymentIntentId,
    })

    if (response?.data?.status !== 'succeeded') {
      throw new Error(t('checkout.error_stripe_not_confirmed', 'Stripe no confirmo el pago como exitoso.'))
    }

    setStripeState((prev) => ({
      ...prev,
      paymentIntentId,
      approved: true,
      preparing: false,
    }))
    setFormData((prev) => ({
      ...prev,
      stripePaymentIntentId: paymentIntentId,
      reference: paymentIntentId,
    }))
    toast.success(t('checkout.stripe_success', 'Pago con Stripe confirmado. Ahora puedes registrar el pedido.'))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateCheckout()) {
      return
    }

    setIsProcessing(true)

    try {
      const payload = {
        ...formData,
        rateBs,
        items: getCheckoutItemsPayload(),
      }

      await router.post('/checkout', payload, {
        preserveScroll: true,
        onError: (errors) => {
          const firstKey = Object.keys(errors || {})[0]
          const msg = errors?.[firstKey] || t('checkout.error_processing', 'Error al procesar el pago. Intenta nuevamente.');
          setError(msg)
          toast.error(msg)
        },
        onSuccess: () => {
          clearCart()
          toast.success(t('checkout.success', '¡Compra realizada con éxito!'))
          router.visit('/confirmacion')
        },
        onFinish: () => setIsProcessing(false),
      })
    } catch (err) {
      const msg = t('checkout.error_processing', 'Error al procesar el pago. Intenta nuevamente.');
      setError(msg)
      toast.error(msg)
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
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_35%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(255,255,255,1))] text-foreground">

      <div className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {t('checkout.breadcrumb_cart', 'Carrito')}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-primary">
              {t('checkout.breadcrumb_checkout', 'Checkout')}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10 xl:py-10">
        <section className="mb-6 overflow-hidden rounded-[28px] border border-sky-100 bg-slate-950 px-5 py-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)] sm:px-8 lg:mb-8 lg:px-10 lg:py-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('checkout.hero_badge', 'Compra protegida')}
              </div>
              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                {t('checkout.hero_title', 'Finaliza tu pedido sin friccion y con instrucciones de pago claras.')}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                {t('checkout.hero_description', 'Selecciona tu metodo de pago, revisa las cuentas habilitadas y confirma tu compra desde una experiencia optimizada para movil y escritorio.')}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{t('checkout.hero_products', 'Productos')}</p>
                <p className="mt-2 text-2xl font-bold text-white">{itemCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{t('checkout.hero_methods', 'Metodos activos')}</p>
                <p className="mt-2 text-2xl font-bold text-white">{paymentMethods.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{t('checkout.hero_total', 'Total')}</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {formatCheckoutCurrency(total)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.82fr)] xl:gap-8">
            {/* Formulario */}
            <div>
              <div className="rounded-[28px] border border-border/70 bg-card/95 p-5 shadow-sm sm:p-6 lg:p-8">
                <h2 className="mb-6 text-2xl font-bold text-foreground">
                  {t('checkout.shipping_info_title', 'Información de Envío')}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Nombre Completo */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      {t('checkout.full_name_label', 'Nombre Completo *')}
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        {t('checkout.identification_type_label', 'Tipo ID *')}
                      </label>
                      <select
                        name="identification_type_id"
                        value={formData.identification_type_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                        required
                      >
                        <option value="">{t('checkout.select_option', 'Selecciona')}</option>
                        <option value="1">J</option>
                        <option value="2">N</option>
                        <option value="3">E</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        {t('checkout.identification_label', 'Identificación *')}
                      </label>
                      <input
                        type="text"
                        name="identification"
                        value={formData.identification}
                        onChange={handleInputChange}
                        placeholder={t('checkout.identification_placeholder', 'Ej: 12345678')}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      {t('checkout.email_label', 'Email *')}
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
                      {t('checkout.phone_label', 'Teléfono')}
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
                      {t('checkout.address_label', 'Dirección *')}
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        {t('checkout.city_label', 'Ciudad')}
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground transition focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        {t('checkout.postal_code_label', 'Código Postal')}
                      </label>
                      <input
                        type="text"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground transition focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Separador */}
                  <div className="mt-8 border-t border-border pt-8">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-bold text-foreground">
                          {t('checkout.payment_method_title', 'Método de Pago')}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t('checkout.payment_method_help', 'Elige una opcion disponible y sigue las instrucciones antes de confirmar.')}
                        </p>
                      </div>
                      <div className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {paymentMethods.length} {t('checkout.active_methods_count', paymentMethods.length === 1 ? 'activo' : 'activos')}
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {paymentMethods.map((method) => {
                        const Icon = PAYMENT_ICONS[method.key] || CreditCard
                        const active = formData.paymentMethod === method.key

                        return (
                          <button
                            key={method.key}
                            type="button"
                            onClick={() => handlePaymentMethodSelect(method.key)}
                            className={`group rounded-2xl border p-4 text-left transition ${active ? 'border-sky-500 bg-sky-50 shadow-[0_18px_50px_rgba(14,165,233,0.14)]' : 'border-border bg-background hover:border-sky-200 hover:bg-slate-50'}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${active ? 'bg-sky-600 text-white' : 'bg-slate-900 text-white'}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${active ? 'bg-sky-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                                {method.key === 'manual' ? t('checkout.payment_badge_manual', 'Manual') : t('checkout.payment_badge_gateway', 'Gateway')}
                              </div>
                            </div>
                            <h4 className="mt-4 text-base font-semibold text-foreground">{method.label}</h4>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">{method.description}</p>
                            {!!Number(method.fee_percent || 0) && (
                              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                                {t('checkout.payment_fee_badge', 'Recargo')} {formatNumber(Number(method.fee_percent), { maximumFractionDigits: 2 })}%
                              </p>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {checkoutCurrencies.length > 0 && (
                      <div className="mt-5 rounded-[24px] border border-border bg-background p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{t('checkout.charge_currency_title', 'Moneda de cobro')}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{t('checkout.charge_currency_help', 'La pasarela y el pedido se procesarán usando esta moneda si está habilitada en configuración.')}</p>
                          </div>
                          <select
                            name="checkoutCurrency"
                            value={formData.checkoutCurrency}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground transition focus:border-primary focus:outline-none sm:max-w-[220px]"
                          >
                            {checkoutCurrencies.map((currency) => (
                              <option key={currency.code} value={currency.code}>
                                {currency.code} - {currency.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {selectedPaymentMethod && (
                      <div className="mt-5 rounded-[24px] border border-border bg-slate-50/85 p-4 sm:p-5">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                            {(() => {
                              const Icon = PAYMENT_ICONS[selectedPaymentMethod.key] || CreditCard
                              return <Icon className="h-5 w-5" />
                            })()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{selectedPaymentMethod.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {formData.paymentMethod === 'paypal' && paypalConfig?.client_id
                                ? t('checkout.paypal_ready_description', 'PayPal está configurado y listo para usar.')
                                : selectedPaymentMethod.instructions || selectedPaymentMethod.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.paymentMethod === 'manual' ? (
                      <>
                        <div className="mt-6">
                          <div className="mb-3 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            <label className="text-sm font-semibold text-foreground">
                              {t('checkout.bank_accounts_title', 'Cuentas bancarias disponibles')}
                            </label>
                          </div>

                          {bankAccounts.length === 0 ? (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                              {t('checkout.bank_accounts_empty', 'Todavia no hay cuentas bancarias configuradas. Contacta a soporte o selecciona otro metodo disponible.')}
                            </div>
                          ) : (
                            <div className="grid gap-3 lg:grid-cols-2">
                              {bankAccounts.map((account) => {
                                const selected = formData.bank === account.bank_name

                                return (
                                  <button
                                    key={`${account.bank_name}-${account.account_number}`}
                                    type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, bank: account.bank_name }))}
                                    className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-primary bg-primary/5 shadow-[0_18px_40px_rgba(2,132,199,0.12)]' : 'border-border bg-background hover:border-primary/40'}`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="text-base font-semibold text-foreground">{account.bank_name}</p>
                                        <p className="text-sm text-muted-foreground">{account.account_type || t('checkout.bank_account_fallback_type', 'Cuenta bancaria')}</p>
                                      </div>
                                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                        {selected ? t('checkout.bank_account_selected', 'Activa') : t('checkout.bank_account_available', 'Disponible')}
                                      </span>
                                    </div>
                                    <div className="mt-4 space-y-1 text-sm text-slate-600">
                                      <p><span className="font-semibold text-foreground">{t('checkout.bank_account_holder', 'Titular:')}</span> {account.account_name}</p>
                                      <p><span className="font-semibold text-foreground">{t('checkout.bank_account_number', 'Numero:')}</span> {account.account_number}</p>
                                      {account.identification && (
                                        <p><span className="font-semibold text-foreground">{t('checkout.bank_account_identification', 'RIF/ID:')}</span> {account.identification}</p>
                                      )}
                                      {account.phone && (
                                        <p><span className="font-semibold text-foreground">{t('checkout.bank_account_phone', 'Telefono:')}</span> {account.phone}</p>
                                      )}
                                      {account.email && (
                                        <p className="break-all"><span className="font-semibold text-foreground">{t('checkout.bank_account_email', 'Email:')}</span> {account.email}</p>
                                      )}
                                    </div>
                                    {account.notes && (
                                      <p className="mt-3 rounded-xl bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
                                        {account.notes}
                                      </p>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-foreground">
                              {t('checkout.receiver_bank_label', 'Banco receptor *')}
                            </label>
                            {bankAccounts.length > 0 ? (
                              <select
                                name="bank"
                                value={formData.bank}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground transition focus:border-primary focus:outline-none"
                                required
                              >
                                <option value="">{t('checkout.receiver_bank_placeholder_select', 'Selecciona una cuenta bancaria')}</option>
                                {bankAccounts.map((account) => (
                                  <option
                                    key={`${account.bank_name}-${account.account_number}`}
                                    value={account.bank_name}
                                  >
                                    {account.bank_name} · {account.account_number} {account.account_name ? `(${account.account_name})` : ''}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                name="bank"
                                value={formData.bank}
                                onChange={handleInputChange}
                                placeholder={t('checkout.receiver_bank_placeholder', 'Ej: Banesco')}
                                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground transition focus:border-primary focus:outline-none"
                                required
                              />
                            )}
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-foreground">
                              {t('checkout.origin_bank_label', 'Banco de origen *')}
                            </label>
                            {originBanks.length > 0 ? (
                              <select
                                name="originBank"
                                value={formData.originBank}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground transition focus:border-primary focus:outline-none"
                                required
                              >
                                <option value="">{t('checkout.origin_bank_placeholder_select', 'Selecciona tu banco de origen')}</option>
                                {originBanks.map((bank) => (
                                  <option key={bank.name} value={bank.name}>{bank.name}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                name="originBank"
                                value={formData.originBank}
                                onChange={handleInputChange}
                                placeholder={t('checkout.origin_bank_placeholder_text', 'Desde donde hiciste el pago')}
                                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground transition focus:border-primary focus:outline-none"
                                required
                              />
                            )}
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-foreground">
                              {t('checkout.reference_label', 'Referencia *')}
                            </label>
                            <input
                              type="text"
                              name="reference"
                              value={formData.reference}
                              onChange={handleInputChange}
                              placeholder={t('checkout.reference_placeholder', 'Numero de referencia')}
                              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground transition focus:border-primary focus:outline-none"
                              required
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-foreground">
                              {t('checkout.payment_date_label', 'Fecha del pago *')}
                            </label>
                            <input
                              type="date"
                              name="date"
                              value={formData.date}
                              onChange={handleInputChange}
                              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground transition focus:border-primary focus:outline-none"
                              required
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
                        <div className="flex items-start gap-3">
                          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                            <ShieldCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-base font-semibold text-emerald-950">{t('checkout.gateway_ready_title', 'Pasarela lista para activacion')}</h4>
                            <p className="mt-1 text-sm leading-6 text-emerald-900/80">
                              {t('checkout.gateway_ready_description', 'Este metodo fue habilitado desde configuracion. El cliente puede seleccionarlo y el pedido quedara registrado con esta preferencia de pago.')}
                            </p>
                            {selectedPaymentMethod?.instructions && !(formData.paymentMethod === 'paypal' && paypalConfig?.client_id) && (
                              <p className="mt-3 rounded-2xl bg-white/70 p-3 text-sm text-emerald-950">
                                {selectedPaymentMethod.instructions}
                              </p>
                            )}
                            {formData.paymentMethod === 'paypal' && (paypalConfig?.client_id ? (
                              <div className="mt-4 space-y-4">
                                <div className="rounded-2xl border p-3 text-sm border-emerald-200 bg-white/70 text-emerald-950">
                                  {t('checkout.paypal_ready_message', 'PayPal está configurado. Completa el pago con PayPal y luego registra el pedido.')}
                                </div>
                                <div className={`rounded-2xl border p-3 text-sm ${paypalState.approved ? 'border-emerald-300 bg-white text-emerald-900' : 'border-emerald-200 bg-white/70 text-emerald-950'}`}>
                                  {paypalState.approved
                                    ? t('checkout.paypal_capture_confirmed', 'Pago confirmado con captura :id.').replace(':id', paypalState.captureID)
                                    : t('checkout.paypal_complete_then_submit', 'Completa el pago con PayPal y luego registra el pedido.')}
                                </div>
                                <PayPalScriptProvider options={{
                                  'client-id': paypalConfig.client_id,
                                  currency: formData.checkoutCurrency,
                                  intent: 'capture',
                                  components: 'buttons',
                                }}>
                                  <PayPalButtons
                                    style={{ layout: 'vertical', shape: 'rect', label: 'paypal' }}
                                    disabled={isProcessing || paypalState.approved}
                                    forceReRender={[total, formData.coupon_code, paypalState.approved, formData.checkoutCurrency]}
                                    createOrder={async () => {
                                      try {
                                        return await createPayPalOrder()
                                      } catch (err) {
                                        const msg = err?.response?.data?.message || err?.message || t('checkout.error_paypal_start', 'No se pudo iniciar PayPal.')
                                        setError(msg)
                                        toast.error(msg)
                                        throw err
                                      }
                                    }}
                                    onApprove={async (data) => {
                                      try {
                                        await capturePayPalOrder(data)
                                      } catch (err) {
                                        const msg = err?.response?.data?.message || err?.message || t('checkout.error_paypal_confirm', 'No se pudo confirmar el pago PayPal.')
                                        setError(msg)
                                        toast.error(msg)
                                        throw err
                                      }
                                    }}
                                    onError={(err) => {
                                      const msg = err?.message || t('checkout.error_paypal_process', 'PayPal no pudo procesar el pago.')
                                      setError(msg)
                                      toast.error(msg)
                                    }}
                                  />
                                </PayPalScriptProvider>
                              </div>
                            ) : (
                              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                {t('checkout.paypal_missing_client_id', 'PayPal está habilitado, pero falta el Client ID en configuración para mostrar el botón real.')}
                              </div>
                            ))}
                            {formData.paymentMethod === 'stripe' && (
                              <div className="mt-4 space-y-4">
                                <StripePaymentPanel
                                  approved={stripeState.approved}
                                  billingDetails={{
                                    address: formData.address,
                                    city: formData.city,
                                    email: formData.email,
                                    name: formData.fullName,
                                    phone: formData.phone,
                                    postalCode: formData.postal_code,
                                  }}
                                  clientSecret={stripeState.clientSecret}
                                  disabled={isProcessing}
                                  onError={(message) => {
                                    setError(message)
                                    toast.error(message)
                                  }}
                                  onPaymentApproved={async (paymentIntent) => {
                                    try {
                                      await handleStripeApproved(paymentIntent)
                                    } catch (err) {
                                      const msg = err?.response?.data?.message || err?.message || t('checkout.error_stripe_verify', 'No se pudo verificar el pago con Stripe.')
                                      setError(msg)
                                      toast.error(msg)
                                    }
                                  }}
                                  onPrepareIntent={async () => {
                                    try {
                                      await prepareStripePaymentIntent()
                                    } catch (err) {
                                      const msg = err?.response?.data?.message || err?.message || t('checkout.error_stripe_prepare', 'No se pudo preparar el pago con Stripe.')
                                      setError(msg)
                                      toast.error(msg)
                                    }
                                  }}
                                  preparing={stripeState.preparing}
                                  publishableKey={stripeConfig?.publishable_key}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-6">
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        {t('checkout.coupon_label', 'Cupón de descuento')}
                      </label>
                      <input
                        type="text"
                        name="coupon_code"
                        value={formData.coupon_code}
                        onChange={handleInputChange}
                        placeholder={t('checkout.coupon_placeholder', 'Ingresa tu código de cupón')}
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground uppercase transition focus:border-primary focus:outline-none"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
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
                    disabled={isProcessing || paymentMethods.length === 0 || (formData.paymentMethod === 'paypal' && !paypalState.approved) || (formData.paymentMethod === 'stripe' && !stripeState.approved)}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Lock className="w-5 h-5" />
                    {isProcessing
                      ? t('checkout.processing', 'Procesando...')
                      : formData.paymentMethod === 'paypal' && !paypalState.approved
                        ? t('checkout.paypal_complete_before_submit', 'Completa primero el pago con PayPal')
                        : formData.paymentMethod === 'stripe' && !stripeState.approved
                          ? t('checkout.stripe_complete_before_submit', 'Completa primero el pago con Stripe')
                      : `${t('checkout.pay_button_prefix', 'Pagar')} ${formatCheckoutCurrency(total)}`}
                  </button>
                </form>
              </div>
            </div>

            {/* Resumen de Orden */}
            <div>
              <div className="sticky top-20 h-fit overflow-hidden rounded-[28px] border border-border/70 bg-card/95 p-5 shadow-sm sm:p-6">
                <h2 className="mb-6 text-xl font-bold text-foreground">
                  {t('checkout.summary_title', 'Resumen')}
                </h2>

                {/* Items */}
                <div className="mb-6 space-y-4 border-b border-border pb-6">
                  {cart.items.map((item) => (
                    <ProductCartItem
                      key={item.id}
                      item={item}
                      t={t}
                      onRemove={(id) => updateQuantity(id, 0)}
                      onQuantityChange={(id, q) => updateQuantity(id, q)}
                      onPriceChange={(id, price) => updatePrice(id, price)}
                    />
                  ))}
                </div>

                {/* Totales */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4 text-sm">
                    <span className="min-w-0 text-muted-foreground">
                      {t('checkout.summary_subtotal', 'Subtotal:')}
                    </span>
                    <span className="shrink-0 text-right text-foreground">
                      {formatCheckoutCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4 text-sm">
                    <span className="min-w-0 text-muted-foreground">
                      {t('checkout.summary_shipping', 'Envío:')}
                    </span>
                    <span className="shrink-0 text-right text-foreground">
                      {formatCheckoutCurrency(shippingCost)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4 text-sm">
                    <span className="min-w-0 text-muted-foreground">
                      {t('checkout.summary_payment_fee', 'Recargo por método de pago:')}
                    </span>
                    <span className="shrink-0 text-right text-foreground">
                      {formatCheckoutCurrency(paymentFee)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4 text-sm">
                    <span className="min-w-0 text-muted-foreground">
                      {t('checkout.summary_tax', 'Impuestos (15%):')}
                    </span>
                    <span className="shrink-0 text-right text-foreground">
                      {formatCheckoutCurrency(tax)}
                    </span>
                  </div>
                  <div className="mb-4 flex items-start justify-between gap-4 border-t border-border pt-3">
                    <span className="font-bold text-foreground">
                      {`${t('checkout.summary_total_usd', 'Total')}: ${selectedCheckoutCurrency.code}`}
                    </span>
                    <span className="text-right text-2xl font-bold text-primary">
                      {formatCheckoutCurrency(total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-sky-200 bg-sky-50 p-4">
                    <span className="font-bold text-foreground">
                      {t('checkout.summary_charge_currency', 'Moneda de cobro:')}
                    </span>
                    <span className="text-right text-lg font-bold text-sky-700">
                      {selectedCheckoutCurrency.code}
                    </span>
                  </div>
                  {comparisonCurrency && comparisonCurrency !== displayCurrency && hasRateForCurrency(comparisonCurrency) && (
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-accent bg-accent/10 p-4">
                      <span className="font-bold text-foreground">
                        {`Total ${comparisonCurrency}:`}
                      </span>
                      <span className="text-right text-2xl font-bold text-accent">
                        {formatDisplayCurrency(total, comparisonCurrency)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Recomendaciones */}
                <div className="mt-6 border-t border-border pt-4">
                  <h3 className="mb-3 text-lg font-semibold text-foreground">
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
                          className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3"
                        >
                          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
                            <img
                              src={rec.image || '/placeholder.svg'}
                              alt={rec.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground line-clamp-1">
                              {rec.name}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {rec.category}
                            </p>
                            <p className="text-sm font-bold text-primary">
                              {formatDisplayCurrency(Number(rec.price ?? 0))}
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

    </main>
    </GuestLayout>
  )
}
