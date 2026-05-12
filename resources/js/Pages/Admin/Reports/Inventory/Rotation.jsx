import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminPagination from '@/Components/admin/AdminPagination.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';

export default function InventoryRotation({ products, filters = {}, metrics, warehouses = [] }) {
  const { t } = useI18n();
  const { formatDateTime, formatNumber } = useLocaleFormat();
  const [localFilters, setLocalFilters] = useState({
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
    warehouse_id: filters.warehouse_id || '',
    search: filters.search || '',
    only_slow: Boolean(filters.only_slow || false),
  });

  const page = products.current_page ?? products?.meta?.current_page ?? 1;
  const totalPages = products.last_page ?? products?.meta?.last_page ?? 1;
  const activeFilters = Object.values(filters || {}).filter((value) => value !== null && value !== undefined && value !== '').length;

  const submitFilters = () => {
    router.get(route('admin.reports.inventory.rotation'), {
      ...localFilters,
      only_slow: localFilters.only_slow ? 1 : 0,
      page: 1,
    }, { preserveScroll: true, replace: true });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.reports.inventory.rotation'), {
      ...filters,
      page: nextPage,
    }, { preserveScroll: true, replace: true });
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.reports.inventory.rotation.page_title', 'Rotación de productos')} />
      <AdminIndexShell
        title={t('admin.reports.inventory.rotation.hero_title', 'Evalúa rotación de productos con un tablero más legible')}
        description={t('admin.reports.inventory.rotation.hero_description', 'La vista integra período, filtros, navegación de reportes y tabla de días estimados de inventario para priorizar productos lentos o sin ventas.')}
        stats={[
          { label: t('admin.reports.inventory.rotation.stats.period_days', 'Días período'), value: metrics.period_days },
          { label: t('admin.reports.inventory.rotation.stats.page_products', 'Productos página'), value: metrics.total_products },
          { label: t('admin.reports.inventory.rotation.stats.average_days', 'Promedio días'), value: formatNumber(metrics.avg_days_inventory || 0, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) },
          { label: t('admin.reports.inventory.rotation.stats.without_sales', 'Sin ventas'), value: metrics.products_without_sales },
        ]}
        contextTitle={t('admin.reports.inventory.rotation.context_title', 'Rotación de productos')}
        contextDescription={t('admin.reports.inventory.rotation.context_description', 'Úsalo para detectar baja rotación, productos sin salida y cobertura estimada del stock actual por artículo.')}
        contextItems={[
          { label: t('admin.reports.inventory.rotation.context_items.active_filters', 'Filtros activos'), value: activeFilters },
          { label: t('admin.reports.inventory.rotation.context_items.page', 'Página'), value: `${page}/${totalPages}` },
          { label: t('admin.reports.inventory.rotation.context_items.view', 'Vista'), value: t('admin.reports.inventory.rotation.context_items.view_value', 'Rotación') },
        ]}
        filters={
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              <button type="button" onClick={() => router.get(route('admin.reports.inventory.index'), {}, { replace: true })} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">{t('admin.reports.inventory.tabs.global', 'Valorización global')}</button>
              <button type="button" onClick={() => router.get(route('admin.reports.inventory.by_warehouse'), {}, { replace: true })} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">{t('admin.reports.inventory.tabs.by_warehouse', 'Por producto y bodega')}</button>
              <button type="button" onClick={() => router.get(route('admin.reports.inventory.kardex'), {}, { replace: true })} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">{t('admin.reports.inventory.tabs.kardex', 'Kardex de inventario')}</button>
              <button type="button" className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white">{t('admin.reports.inventory.tabs.rotation', 'Rotación de productos')}</button>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.inventory.filters.date_from', 'Desde')}</label>
              <input
                type="date"
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.date_from}
                onChange={(e) => setLocalFilters((f) => ({ ...f, date_from: e.target.value }))}
              />
              {!filters.date_from && filters.computed_date_from && (
                <p className="text-[11px] text-muted-foreground mt-1">{t('admin.reports.inventory.rotation.filters.default_from', 'Por defecto: últimos 30 días desde')} {filters.computed_date_from}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.inventory.filters.date_to', 'Hasta')}</label>
              <input
                type="date"
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.date_to}
                onChange={(e) => setLocalFilters((f) => ({ ...f, date_to: e.target.value }))}
              />
              {!filters.date_to && filters.computed_date_to && (
                <p className="text-[11px] text-muted-foreground mt-1">{t('admin.reports.inventory.rotation.filters.default_to', 'Por defecto')}: {filters.computed_date_to}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.inventory.rotation.filters.sales_warehouse', 'Sucursal (para ventas)')}</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.warehouse_id}
                onChange={(e) => setLocalFilters((f) => ({ ...f, warehouse_id: e.target.value }))}
              >
                <option value="">{t('admin.reports.inventory.filters.all_female', 'Todas')}</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.code ? `(${w.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.inventory.by_warehouse.filters.search_product', 'Buscar producto')}</label>
              <input
                type="text"
                className="w-full border border-border rounded px-2 py-1 bg-background"
                placeholder={t('admin.reports.inventory.filters.search_placeholder', 'Nombre, SKU o código de barras')}
                value={localFilters.search}
                onChange={(e) => setLocalFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="inline-flex items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                className="rounded border-border text-primary focus:ring-primary"
                checked={localFilters.only_slow}
                onChange={(e) => setLocalFilters((f) => ({ ...f, only_slow: e.target.checked }))}
              />
              <span>{t('admin.reports.inventory.rotation.filters.only_slow', 'Mostrar solo productos de baja rotación (≥ 90 días o sin ventas con stock).')}</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                onClick={() => {
                  setLocalFilters({
                    date_from: '',
                    date_to: '',
                    warehouse_id: '',
                    search: '',
                    only_slow: false,
                  });
                  router.get(route('admin.reports.inventory.rotation'), {}, { replace: true });
                }}
              >
                {t('admin.reports.inventory.actions.clear_filters', 'Limpiar filtros')}
              </button>
              <button
                type="button"
                className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                onClick={submitFilters}
              >
                {t('admin.reports.inventory.actions.apply_filters', 'Aplicar filtros')}
              </button>
            </div>
          </div>
        </div>
          </div>
        }
      >
        <div className="space-y-4 p-6">

        {/* Tabla de rotación */}
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.inventory.rotation.table.product', 'Producto')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.inventory.rotation.table.sku_barcode', 'SKU / Código')}</th>
                <th className="px-3 py-2 text-right font-semibold">{t('admin.reports.inventory.rotation.table.current_stock', 'Stock actual')}</th>
                <th className="px-3 py-2 text-right font-semibold">{t('admin.reports.inventory.rotation.table.units_sold', 'Unidades vendidas período')}</th>
                <th className="px-3 py-2 text-right font-semibold">{t('admin.reports.inventory.rotation.table.avg_daily_sales', 'Promedio diario venta')}</th>
                <th className="px-3 py-2 text-right font-semibold">{t('admin.reports.inventory.rotation.table.days_inventory', 'Días inventario estimados')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.inventory.rotation.table.last_sale', 'Última venta')}</th>
              </tr>
            </thead>
            <tbody>
              {products.data.map((p) => {
                const stock = Number(p.stock ?? 0);
                const unitsSold = Number(p.units_sold ?? 0);
                const daysInv = p.days_of_inventory !== null && p.days_of_inventory !== undefined
                  ? Number(p.days_of_inventory)
                  : null;
                const avgDaily = metrics.period_days > 0 ? (unitsSold / metrics.period_days) : 0;

                return (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/40">
                    <td className="px-3 py-2 text-xs">{p.name}</td>
                    <td className="px-3 py-2 text-xs">{p.sku || p.barcode || t('admin.reports.inventory.rotation.values.empty_dash', '—')}</td>
                    <td className="px-3 py-2 text-xs text-right">{formatNumber(stock, { maximumFractionDigits: 0 })}</td>
                    <td className="px-3 py-2 text-xs text-right">{formatNumber(unitsSold, { maximumFractionDigits: 0 })}</td>
                    <td className="px-3 py-2 text-xs text-right">{formatNumber(avgDaily, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 text-xs text-right">
                      {daysInv !== null ? formatNumber(daysInv, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : (stock > 0 ? t('admin.reports.inventory.rotation.states.no_sales', 'Sin ventas') : t('admin.reports.inventory.rotation.values.empty_dash', '—'))}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {p.last_sale_at ? formatDateTime(p.last_sale_at) : t('admin.reports.inventory.rotation.states.no_sales_in_period', 'Sin ventas en período')}
                    </td>
                  </tr>
                );
              })}
              {products.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t('admin.reports.inventory.rotation.empty', 'No hay productos para los filtros seleccionados.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      </AdminIndexShell>
    </AuthenticatedLayout>
  );
}
