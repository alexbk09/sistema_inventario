import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';

export default function Index({ warehouses }) {
  const { t } = useI18n();
  const { data, setData, post, processing, reset } = useForm({
    name: '',
    code: '',
    address: '',
    invoice_prefix: '',
    invoice_length: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.warehouses.store'), {
      preserveScroll: true,
      onSuccess: () => reset(),
    });
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.warehouses.page_title', 'Sucursales')} />
      <AdminIndexShell
        title={t('admin.warehouses.hero_title', 'Organiza sucursales y bodegas con mejor contexto operativo')}
        description={t('admin.warehouses.hero_description', 'La pantalla reúne el padrón de sedes y la creación rápida de una nueva ubicación sin romper el flujo del administrador.')}
        stats={[
          { label: t('admin.warehouses.stats.visible', 'Sucursales visibles'), value: warehouses.data.length },
          { label: t('admin.warehouses.stats.form', 'Formulario'), value: processing ? t('admin.warehouses.values.saving', 'Guardando') : t('admin.warehouses.values.available', 'Disponible') },
          { label: t('admin.warehouses.stats.invoice_series', 'Serie factura'), value: t('admin.warehouses.values.configurable', 'Configurable') },
        ]}
        contextTitle={t('admin.warehouses.context_title', 'Sucursales y bodegas')}
        contextDescription={t('admin.warehouses.context_description', 'Centraliza la estructura física del inventario y la numeración de comprobantes por sede dentro del mismo sistema visual.')}
        contextItems={[
          { label: t('admin.warehouses.context_items.records', 'Registros'), value: warehouses.data.length },
          { label: t('admin.warehouses.context_items.quick_create', 'Alta rápida'), value: t('admin.warehouses.values.active_female', 'Activa') },
          { label: t('admin.warehouses.context_items.prefixes', 'Prefijos'), value: t('admin.warehouses.values.by_branch', 'Por sucursal') },
        ]}
        filters={
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.warehouses.cards.list.title', 'Listado')}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('admin.warehouses.cards.list.description', 'Consulta nombre, código y configuración de numeración de cada sede desde una sola tabla.')}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.warehouses.cards.quick_create.title', 'Alta rápida')}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('admin.warehouses.cards.quick_create.description', 'Crea nuevas ubicaciones sin salir de la misma pantalla administrativa.')}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.warehouses.cards.billing.title', 'Facturación')}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('admin.warehouses.cards.billing.description', 'Define prefijos y longitud por sede para mantener series separadas cuando haga falta.')}</p>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">{t('admin.warehouses.sections.list.title', 'Listado de sucursales')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">{t('admin.warehouses.sections.list.table.name', 'Nombre')}</th>
                    <th className="px-3 py-2 text-left">{t('admin.warehouses.sections.list.table.code', 'Código')}</th>
                    <th className="px-3 py-2 text-left">{t('admin.warehouses.sections.list.table.address', 'Dirección')}</th>
                    <th className="px-3 py-2 text-left">{t('admin.warehouses.sections.list.table.invoice_prefix', 'Prefijo factura')}</th>
                    <th className="px-3 py-2 text-left">{t('admin.warehouses.sections.list.table.length', 'Longitud')}</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.data.map((w) => (
                    <tr key={w.id} className="border-t border-border">
                      <td className="px-3 py-2 text-foreground">{w.name}</td>
                      <td className="px-3 py-2 text-foreground">{w.code}</td>
                      <td className="px-3 py-2 text-muted-foreground">{w.address || t('admin.warehouses.values.empty_dash', '—')}</td>
                      <td className="px-3 py-2 text-muted-foreground">{w.invoice_prefix || t('admin.warehouses.values.empty_dash', '—')}</td>
                      <td className="px-3 py-2 text-muted-foreground">{w.invoice_length ?? t('admin.warehouses.values.empty_dash', '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">{t('admin.warehouses.sections.form.title', 'Nueva sucursal')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">{t('admin.warehouses.sections.form.name', 'Nombre')}</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">{t('admin.warehouses.sections.form.code', 'Código')}</label>
                <input
                  type="text"
                  value={data.code}
                  onChange={(e) => setData('code', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">{t('admin.warehouses.sections.form.address', 'Dirección')}</label>
                <textarea
                  value={data.address}
                  onChange={(e) => setData('address', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">{t('admin.warehouses.sections.form.invoice_prefix', 'Prefijo de factura (serie opcional)')}</label>
                <input
                  type="text"
                  value={data.invoice_prefix}
                  onChange={(e) => setData('invoice_prefix', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  placeholder={t('admin.warehouses.sections.form.invoice_prefix_placeholder', 'Ej: CCS- o TDA1-')}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">{t('admin.warehouses.sections.form.invoice_length', 'Longitud de numeración para esta sucursal')}</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={data.invoice_length}
                  onChange={(e) => setData('invoice_length', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  placeholder={t('admin.warehouses.sections.form.invoice_length_placeholder', 'Dejar vacío para usar la global')}
                />
              </div>
              <button
                type="submit"
                disabled={processing}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
              >
                {processing ? t('admin.warehouses.values.saving_button', 'Guardando...') : t('admin.warehouses.actions.create_branch', 'Crear sucursal')}
              </button>
            </form>
          </div>
        </div>
      </AdminIndexShell>
    </AuthenticatedLayout>
  );
}
