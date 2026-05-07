import { useEffect, useState } from 'react'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { CreditCard, ShieldCheck } from 'lucide-react'

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#0f172a',
      '::placeholder': {
        color: '#94a3b8',
      },
    },
    invalid: {
      color: '#dc2626',
    },
  },
}

function StripeCardForm({
  approved,
  billingDetails,
  clientSecret,
  disabled,
  onError,
  onPaymentApproved,
  onPrepareIntent,
  preparing,
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)

  const handleConfirmPayment = async () => {
    if (!stripe || !elements || !clientSecret || submitting || approved) {
      return
    }

    const card = elements.getElement(CardElement)
    if (!card) {
      onError?.('No fue posible inicializar el formulario de tarjeta.')
      return
    }

    setSubmitting(true)

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card,
        billing_details: {
          name: billingDetails?.name || undefined,
          email: billingDetails?.email || undefined,
          phone: billingDetails?.phone || undefined,
          address: {
            line1: billingDetails?.address || undefined,
            city: billingDetails?.city || undefined,
            postal_code: billingDetails?.postalCode || undefined,
          },
        },
      },
    })

    setSubmitting(false)

    if (error) {
      onError?.(error.message || 'Stripe no pudo procesar el pago.')
      return
    }

    if (paymentIntent?.status !== 'succeeded') {
      onError?.('Stripe no confirmo el pago como exitoso.')
      return
    }

    onPaymentApproved?.(paymentIntent)
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-3 text-sm ${approved ? 'border-emerald-300 bg-white text-emerald-900' : 'border-sky-200 bg-white/80 text-slate-900'}`}>
        {approved
          ? 'Pago con tarjeta confirmado y verificado en Stripe.'
          : 'Prepara el intento, introduce la tarjeta y confirma el cobro seguro.'}
      </div>

      {!clientSecret ? (
        <button
          type="button"
          onClick={onPrepareIntent}
          disabled={disabled || preparing}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          <ShieldCheck className="h-4 w-4" />
          {preparing ? 'Preparando formulario seguro...' : 'Preparar pago con tarjeta'}
        </button>
      ) : (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CreditCard className="h-4 w-4" />
            Tarjeta protegida por Stripe
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <CardElement options={cardElementOptions} />
          </div>
          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={disabled || approved || submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4" />
            {approved ? 'Pago confirmado' : submitting ? 'Confirmando tarjeta...' : 'Confirmar pago con tarjeta'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function StripePaymentPanel(props) {
  const { publishableKey } = props
  const [stripePromise, setStripePromise] = useState(null)

  useEffect(() => {
    let active = true

    if (!publishableKey) {
      setStripePromise(null)
      return () => {
        active = false
      }
    }

    loadStripe(publishableKey).then((stripe) => {
      if (active) {
        setStripePromise(Promise.resolve(stripe))
      }
    })

    return () => {
      active = false
    }
  }, [publishableKey])

  if (!publishableKey) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Stripe esta habilitado, pero falta la Publishable Key en configuración para mostrar el formulario de tarjeta.
      </div>
    )
  }

  if (!stripePromise) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Cargando formulario seguro de Stripe...
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <StripeCardForm {...props} />
    </Elements>
  )
}