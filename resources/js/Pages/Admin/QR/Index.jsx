import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx'

export default function Index({ invoices = [], products = [], qr = {} }) {
  return (
    <AuthenticatedLayout>
      <Head title="QRs" />
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Códigos QR</h1>
          <p className="text-muted-foreground">
            Vista rápida para generar y descargar códigos QR de facturas, productos y contacto.
          </p>
        </div>

        <section className="bg-card border border-border rounded-lg p-4 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Facturas recientes</h2>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay facturas recientes.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4">Número</th>
                    <th className="py-2 pr-4">Estado</th>
                    <th className="py-2 pr-4">QR</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-4 font-medium">{invoice.number}</td>
                      <td className="py-2 pr-4 text-muted-foreground capitalize">{invoice.status}</td>
                      <td className="py-2 pr-4">
                        <a
                          href={route('qr.invoice', invoice.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2"
                        >
                          <img
                            src={route('qr.invoice', invoice.id)}
                            alt={`QR factura ${invoice.number}`}
                            className="w-16 h-16 bg-white border border-border rounded"
                          />
                          <span className="text-xs text-muted-foreground underline">
                            Abrir / descargar PNG
                          </span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-card border border-border rounded-lg p-4 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Productos recientes</h2>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay productos recientes.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4">Nombre</th>
                    <th className="py-2 pr-4">SKU</th>
                    <th className="py-2 pr-4">Código de barras</th>
                    <th className="py-2 pr-4">QR</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-4 font-medium">{product.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{product.sku || '-'}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{product.barcode || '-'}</td>
                      <td className="py-2 pr-4">
                        <a
                          href={route('qr.product', product.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2"
                        >
                          <img
                            src={route('qr.product', product.id)}
                            alt={`QR producto ${product.name}`}
                            className="w-16 h-16 bg-white border border-border rounded"
                          />
                          <span className="text-xs text-muted-foreground underline">
                            Abrir / descargar PNG
                          </span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-card border border-border rounded-lg p-4 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Contacto / WhatsApp</h2>
          <p className="text-sm text-muted-foreground">
            Este QR apunta a la URL configurada en 
            <span className="font-medium"> Configuración → QR y enlaces rápidos</span>.
          </p>
          <div className="flex items-center gap-6 flex-wrap">
            <img
              src={route('qr.whatsapp')}
              alt="QR contacto WhatsApp"
              className="w-32 h-32 bg-white border border-border rounded"
            />
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground break-all">
                <span className="font-medium text-foreground">URL configurada:</span>{' '}
                {qr.whatsapp_contact_url || 'No configurada, se usará el WhatsApp general o el home.'}
              </p>
              <a
                href={route('qr.whatsapp')}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs text-muted-foreground underline"
              >
                Abrir / descargar PNG
              </a>
            </div>
          </div>
        </section>
      </div>
    </AuthenticatedLayout>
  )
}
