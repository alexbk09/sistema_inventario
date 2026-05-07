import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';

export default function Index({ invoices = [], products = [], qr = {} }) {
  const hasWhatsAppUrl = Boolean(qr.whatsapp_contact_url);

  return (
    <AuthenticatedLayout>
      <Head title="QRs" />
      <AdminIndexShell
        title="Centraliza códigos QR con una vista más útil para operación diaria"
        description="La pantalla reúne accesos rápidos a facturas, productos y contacto para descargar o validar códigos sin navegar entre módulos dispersos."
        stats={[
          { label: 'Facturas recientes', value: invoices.length },
          { label: 'Productos recientes', value: products.length },
          { label: 'WhatsApp', value: hasWhatsAppUrl ? 'Configurado' : 'Pendiente' },
        ]}
        contextTitle="QR y enlaces rápidos"
        contextDescription="Usa este módulo para abrir, descargar y verificar los códigos más consultados desde ventas, catálogo y contacto."
        contextItems={[
          { label: 'QR facturas', value: invoices.length },
          { label: 'QR productos', value: products.length },
          { label: 'URL contacto', value: hasWhatsAppUrl ? 'Lista' : 'Sin configurar' },
        ]}
        primaryAction={
          <Link
            href={route('admin.settings.index')}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Ajustar QR
          </Link>
        }
        filters={
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Facturas</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Consulta los últimos comprobantes con acceso inmediato a su PNG.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Productos</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Valida códigos del catálogo reciente y descarga sus QR sin salir del módulo.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Contacto</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Comprueba la URL pública de WhatsApp configurada para atención o ventas.</p>
            </div>
          </div>
        }
      >
        <div className="space-y-6 p-6">
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
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

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
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

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
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
      </AdminIndexShell>
    </AuthenticatedLayout>
  );
}
