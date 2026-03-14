import React from 'react'
import GuestLayout from '@/Layouts/GuestLayout.jsx'
import { router, usePage } from '@inertiajs/react'
import { useI18n } from '@/Hooks/useI18n'

export default function Confirmation() {
  const { props } = usePage()
  const { t } = useI18n()
  const message = props.message || t('confirmation.default_message', 'Tu pedido fue registrado. ¡Gracias!')
  const invoiceNumber = props.invoiceNumber || props.flash?.invoice_number
  const qrUrl = props.qrUrl || null

  return (
    <GuestLayout>
      <main className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg p-8 text-center max-w-md space-y-4">
            <h1 className="text-3xl font-bold text-foreground">
              {t('confirmation.title', 'Confirmación')}
            </h1>
            <p className="text-muted-foreground">{message}</p>
            {invoiceNumber && (
              <p className="text-foreground">
                {t('confirmation.invoice_number', 'Número de factura:')}{' '}
                <strong>{invoiceNumber}</strong>
              </p>
            )}
            {qrUrl && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <img
                  src={qrUrl}
                  alt={t('confirmation.qr_alt', 'QR de seguimiento de pedido')}
                  className="w-40 h-40 border border-border rounded-md bg-white"
                />
                <p className="text-xs text-muted-foreground max-w-xs">
                  {t(
                    'confirmation.qr_help',
                    'Escanea este código QR para ver el estado de tu pedido o descargar tu comprobante.'
                  )}
                </p>
              </div>
            )}
            <button
              onClick={() => router.visit('/')}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
            >
              {t('confirmation.back_home', 'Volver al Inicio')}
            </button>
          </div>
        </div>
      </main>
    </GuestLayout>
  )
}
