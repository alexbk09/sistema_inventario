import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';

export default function Index({ invoices = [], products = [], qr = {} }) {
  const { t } = useI18n();
  const hasWhatsAppUrl = Boolean(qr.whatsapp_contact_url);

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.qr.page_title', 'QRs')} />
      <AdminIndexShell
        title={t('admin.qr.hero_title', 'Centraliza códigos QR con una vista más útil para operación diaria')}
        description={t('admin.qr.hero_description', 'La pantalla reúne accesos rápidos a facturas, productos y contacto para descargar o validar códigos sin navegar entre módulos dispersos.')}
        stats={[
          { label: t('admin.qr.stats.recent_invoices', 'Facturas recientes'), value: invoices.length },
          { label: t('admin.qr.stats.recent_products', 'Productos recientes'), value: products.length },
          { label: t('admin.qr.stats.whatsapp', 'WhatsApp'), value: hasWhatsAppUrl ? t('admin.qr.values.configured', 'Configurado') : t('admin.qr.values.pending', 'Pendiente') },
        ]}
        contextTitle={t('admin.qr.context_title', 'QR y enlaces rápidos')}
        contextDescription={t('admin.qr.context_description', 'Usa este módulo para abrir, descargar y verificar los códigos más consultados desde ventas, catálogo y contacto.')}
        contextItems={[
          { label: t('admin.qr.context_items.invoice_qr', 'QR facturas'), value: invoices.length },
          { label: t('admin.qr.context_items.product_qr', 'QR productos'), value: products.length },
          { label: t('admin.qr.context_items.contact_url', 'URL contacto'), value: hasWhatsAppUrl ? t('admin.qr.values.ready', 'Lista') : t('admin.qr.values.not_configured', 'Sin configurar') },
        ]}
        primaryAction={
          <Link
            href={route('admin.settings.index')}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {t('admin.qr.actions.adjust_qr', 'Ajustar QR')}
          </Link>
        }
        filters={
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.qr.cards.invoices.title', 'Facturas')}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('admin.qr.cards.invoices.description', 'Consulta los últimos comprobantes con acceso inmediato a su PNG.')}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.qr.cards.products.title', 'Productos')}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('admin.qr.cards.products.description', 'Valida códigos del catálogo reciente y descarga sus QR sin salir del módulo.')}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.qr.cards.contact.title', 'Contacto')}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('admin.qr.cards.contact.description', 'Comprueba la URL pública de WhatsApp configurada para atención o ventas.')}</p>
            </div>
          </div>
        }
      >
        <div className="space-y-6 p-6">
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-foreground">{t('admin.qr.sections.invoices.title', 'Facturas recientes')}</h2>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('admin.qr.sections.invoices.empty', 'No hay facturas recientes.')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4">{t('admin.qr.sections.invoices.table.number', 'Número')}</th>
                    <th className="py-2 pr-4">{t('admin.qr.sections.invoices.table.status', 'Estado')}</th>
                    <th className="py-2 pr-4">{t('admin.qr.sections.invoices.table.qr', 'QR')}</th>
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
                            alt={`${t('admin.qr.alt.invoice', 'QR factura')} ${invoice.number}`}
                            className="w-16 h-16 bg-white border border-border rounded"
                          />
                          <span className="text-xs text-muted-foreground underline">
                            {t('admin.qr.actions.open_download_png', 'Abrir / descargar PNG')}
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
          <h2 className="text-xl font-semibold text-foreground">{t('admin.qr.sections.products.title', 'Productos recientes')}</h2>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('admin.qr.sections.products.empty', 'No hay productos recientes.')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4">{t('admin.qr.sections.products.table.name', 'Nombre')}</th>
                    <th className="py-2 pr-4">{t('admin.qr.sections.products.table.sku', 'SKU')}</th>
                    <th className="py-2 pr-4">{t('admin.qr.sections.products.table.barcode', 'Código de barras')}</th>
                    <th className="py-2 pr-4">{t('admin.qr.sections.products.table.qr', 'QR')}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-4 font-medium">{product.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{product.sku || t('admin.qr.values.empty', '-')}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{product.barcode || t('admin.qr.values.empty', '-')}</td>
                      <td className="py-2 pr-4">
                        <a
                          href={route('qr.product', product.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2"
                        >
                          <img
                            src={route('qr.product', product.id)}
                            alt={`${t('admin.qr.alt.product', 'QR producto')} ${product.name}`}
                            className="w-16 h-16 bg-white border border-border rounded"
                          />
                          <span className="text-xs text-muted-foreground underline">
                            {t('admin.qr.actions.open_download_png', 'Abrir / descargar PNG')}
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
          <h2 className="text-xl font-semibold text-foreground">{t('admin.qr.sections.contact.title', 'Contacto / WhatsApp')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('admin.qr.sections.contact.description_prefix', 'Este QR apunta a la URL configurada en')}
            <span className="font-medium"> {t('admin.qr.sections.contact.description_highlight', 'Configuración → QR y enlaces rápidos')}</span>.
          </p>
          <div className="flex items-center gap-6 flex-wrap">
            <img
              src={route('qr.whatsapp')}
              alt={t('admin.qr.alt.whatsapp', 'QR contacto WhatsApp')}
              className="w-32 h-32 bg-white border border-border rounded"
            />
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground break-all">
                <span className="font-medium text-foreground">{t('admin.qr.sections.contact.configured_url', 'URL configurada')}:</span>{' '}
                {qr.whatsapp_contact_url || t('admin.qr.sections.contact.fallback_url', 'No configurada, se usará el WhatsApp general o el home.')}
              </p>
              <a
                href={route('qr.whatsapp')}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs text-muted-foreground underline"
              >
                {t('admin.qr.actions.open_download_png', 'Abrir / descargar PNG')}
              </a>
            </div>
          </div>
        </section>
        </div>
      </AdminIndexShell>
    </AuthenticatedLayout>
  );
}
