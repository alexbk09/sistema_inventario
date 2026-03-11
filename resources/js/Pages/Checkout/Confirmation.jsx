import React from 'react'
import GuestLayout from '@/Layouts/GuestLayout.jsx'
import { router, usePage } from '@inertiajs/react'

export default function Confirmation() {
  const { props } = usePage()
  const message = props.message || 'Tu pedido fue registrado. ¡Gracias!'
  const invoiceNumber = props.flash?.invoice_number

  return (
    <GuestLayout>
      <main className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg p-8 text-center max-w-md">
            <h1 className="text-3xl font-bold text-foreground mb-4">Confirmación</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            {invoiceNumber && (
              <p className="text-foreground mb-6">Número de factura: <strong>{invoiceNumber}</strong></p>
            )}
            <button
              onClick={() => router.visit('/')}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </main>
    </GuestLayout>
  )
}
