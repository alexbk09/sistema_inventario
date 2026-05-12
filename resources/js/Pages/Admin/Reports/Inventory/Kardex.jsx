import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminPagination from '@/Components/admin/AdminPagination.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';

export default function InventoryKardex({ movements, filters = {}, product, products = [], warehouses = [], adminCurrencyContext = {} }) {
  const { t } = useI18n();
  const { formatDateTime, formatNumber, formatCurrency } = useLocaleFormat();
  const { displayCurrency, formatPriceFromUsd } = useConfiguredCurrencyRates();
  const formatActiveAmount = (value) => formatPriceFromUsd(Number(value || 0), displayCurrency);
  const formatServerAmount = (code, value) => formatCurrency(Number(value || 0), code);
  const translateMovementType = (type) => t(`admin.products.inventory.types.${type}`, type ?? t('admin.reports.inventory.kardex.values.empty_dash', '—'));
  const [localFilters, setLocalFilters] = useState({
    product_id: filters.product_id || '',
    warehouse_id: filters.warehouse_id || '',
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
  });

  const page = movements.current_page ?? movements?.meta?.current_page ?? 1;
  const totalPages = movements.last_page ?? movements?.meta?.last_page ?? 1;
  const activeFilters = Object.values(filters || {}).filter((value) => value !== null && value !== undefined && value !== '').length;

  const submitFilters = () => {
    router.get(route('admin.reports.inventory.kardex'), {
      ...localFilters,
      page: 1,
    }, { preserveScroll: true, replace: true });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.reports.inventory.kardex'), {
      ...filters,
      page: nextPage,
    }, { preserveScroll: true, replace: true });
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.reports.inventory.kardex.page_title', 'Kardex de inventario')} />
      <AdminIndexShell
        title={t('admin.reports.inventory.kardex.hero_title', 'Lee el kardex con un flujo más claro para auditoría de movimientos')}
        description={t('admin.reports.inventory.kardex.hero_description', 'La vista combina navegación de reportes, filtros por producto y bodega, resumen del artículo y tabla de movimientos en una estructura más usable.')}
        stats={[
          { label: t('admin.reports.inventory.kardex.stats.visible_movements', 'Movimientos visibles'), value: movements.data.length },
          { label: t('admin.reports.inventory.kardex.stats.page', 'Página'), value: `${page}/${totalPages}` },
          { label: t('admin.reports.inventory.kardex.stats.filters', 'Filtros'), value: activeFilters },
          { label: t('admin.reports.inventory.kardex.stats.product', 'Producto'), value: product?.name || t('admin.reports.inventory.kardex.stats.unselected', 'Sin seleccionar') },
        ]}
        contextTitle={t('admin.reports.inventory.kardex.context_title', 'Kardex de inventario')}
        contextDescription={t('admin.reports.inventory.kardex.context_description', 'Úsalo para auditar entradas, salidas y referencias por producto con mejor legibilidad sobre fechas, costos y notas.')}
        contextItems={[
          { label: t('admin.reports.inventory.kardex.context_items.view', 'Vista'), value: t('admin.reports.inventory.kardex.context_items.view_value', 'Kardex') },
          { label: t('admin.reports.inventory.kardex.context_items.warehouse', 'Bodega'), value: localFilters.warehouse_id || t('admin.reports.inventory.filters.all_female', 'Todas') },
          { label: t('admin.reports.inventory.kardex.context_items.product', 'Producto'), value: product?.sku || t('admin.reports.inventory.kardex.context_items.pending', 'Pendiente') },
        ]}
        filters={
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              <button type="button" onClick={() => router.get(route('admin.reports.inventory.index'), {}, { replace: true })} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">{t('admin.reports.inventory.tabs.global', 'Valorización global')}</button>
              <button type="button" onClick={() => router.get(route('admin.reports.inventory.by_warehouse'), {}, { replace: true })} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">{t('admin.reports.inventory.tabs.by_warehouse', 'Por producto y bodega')}</button>
              <button type="button" className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white">{t('admin.reports.inventory.tabs.kardex', 'Kardex de inventario')}</button>
              <button type="button" onClick={() => router.get(route('admin.reports.inventory.rotation'), {}, { replace: true })} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">{t('admin.reports.inventory.tabs.rotation', 'Rotación de productos')}</button>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.inventory.kardex.filters.product', 'Producto')}</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.product_id}
                onChange={(e) => setLocalFilters((f) => ({ ...f, product_id: e.target.value }))}
              >
                <option value="">{t('admin.reports.inventory.kardex.filters.select_product', 'Selecciona un producto')}</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.sku ? `(${p.sku})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.inventory.filters.warehouse', 'Sucursal/Bodega')}</label>
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
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.inventory.filters.date_from', 'Desde')}</label>
              <input
                type="date"
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.date_from}
                onChange={(e) => setLocalFilters((f) => ({ ...f, date_from: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.inventory.filters.date_to', 'Hasta')}</label>
              <input
                type="date"
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.date_to}
                onChange={(e) => setLocalFilters((f) => ({ ...f, date_to: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
              onClick={() => {
                setLocalFilters({
                  product_id: '',
                  warehouse_id: '',
                  date_from: '',
                  date_to: '',
                });
                router.get(route('admin.reports.inventory.kardex'), {}, { replace: true });
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
        }
      >
        <div className="space-y-4 p-6">

        {/* Resumen del producto */}
        {product && (
          <div className="rounded-lg border border-border bg-white p-4 text-sm flex flex-wrap gap-4 items-center">
            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1">{t('admin.reports.inventory.kardex.summary.product', 'Producto')}</div>
              <div className="font-semibold">{product.name}</div>
              <div className="text-xs text-muted-foreground">{t('admin.reports.inventory.kardex.summary.sku', 'SKU')}: {product.sku || t('admin.reports.inventory.kardex.values.empty_dash', '—')} / {t('admin.reports.inventory.kardex.summary.barcode', 'Código')}: {product.barcode || t('admin.reports.inventory.kardex.values.empty_dash', '—')}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1">{t('admin.reports.inventory.kardex.summary.current_stock', 'Stock actual')}</div>
              <div className="text-xl font-semibold">{formatNumber(product.stock ?? 0, { maximumFractionDigits: 0 })}</div>
            </div>
          </div>
        )}

        {/* Tabla de movimientos */}
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.inventory.kardex.table.date', 'Fecha')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.inventory.kardex.table.type', 'Tipo')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.inventory.kardex.table.branch', 'Sucursal')}</th>
                <th className="px-3 py-2 text-right font-semibold">{t('admin.reports.inventory.kardex.table.quantity', 'Cantidad')}</th>
                <th className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.inventory.kardex.table.unit_value', 'Costo/Precio')} ${displayCurrency}`}</th>
                <th className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.inventory.kardex.table.total_value', 'Total')} ${displayCurrency}`}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.inventory.kardex.table.reference', 'Referencia')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.inventory.kardex.table.notes', 'Notas')}</th>
              </tr>
            </thead>
            <tbody>
              {movements.data.map((mov) => (
                <tr key={mov.id} className="border-b border-border hover:bg-muted/40">
                  <td className="px-3 py-2 text-xs">{formatDateTime(mov.created_at)}</td>
                  <td className="px-3 py-2 text-xs">{mov.movement_type?.name || translateMovementType(mov.type)}</td>
                  <td className="px-3 py-2 text-xs">{mov.warehouse?.name || mov.warehouse?.code || t('admin.reports.inventory.kardex.values.empty_dash', '—')}</td>
                  <td className="px-3 py-2 text-xs text-right">{formatNumber(mov.quantity ?? 0, { maximumFractionDigits: 0 })}</td>
                  <td className="px-3 py-2 text-xs text-right">{mov.unit_price_admin_totals?.[displayCurrency] !== undefined ? formatServerAmount(displayCurrency, mov.unit_price_admin_totals[displayCurrency]) : formatActiveAmount(mov.unit_price_usd ?? mov.cost_usd ?? 0)}</td>
                  <td className="px-3 py-2 text-xs text-right">{mov.total_value_admin_totals?.[displayCurrency] !== undefined ? formatServerAmount(displayCurrency, mov.total_value_admin_totals[displayCurrency]) : formatActiveAmount(mov.total_value_usd ?? 0)}</td>
                  <td className="px-3 py-2 text-xs">{mov.reference || t('admin.reports.inventory.kardex.values.empty_dash', '—')}</td>
                  <td className="px-3 py-2 text-xs">{mov.notes || t('admin.reports.inventory.kardex.values.empty_dash', '—')}</td>
                </tr>
              ))}
              {movements.data.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t('admin.reports.inventory.kardex.empty', 'No hay movimientos para los filtros seleccionados.')}
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
