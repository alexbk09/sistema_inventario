import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminPagination from '@/Components/admin/AdminPagination.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';

export default function SalesTopProducts({ items, filters = {}, warehouses = [], adminCurrencyContext = {} }) {
  const { t } = useI18n();
  const { formatNumber, formatCurrency } = useLocaleFormat();
  const { displayCurrency, comparisonCurrency, formatPriceFromUsd, hasRateForCurrency } = useConfiguredCurrencyRates();
  const formatActiveAmount = (value, currency = displayCurrency) => formatPriceFromUsd(Number(value || 0), currency);
  const secondaryCurrency = comparisonCurrency && comparisonCurrency !== displayCurrency && hasRateForCurrency(comparisonCurrency)
    ? comparisonCurrency
    : null;
  const visibleCurrencyCodes = Array.isArray(adminCurrencyContext?.codes) && adminCurrencyContext.codes.length > 0
    ? adminCurrencyContext.codes
    : [displayCurrency, ...(secondaryCurrency ? [secondaryCurrency] : [])].filter(Boolean);
  const currencyColumns = [...new Set(visibleCurrencyCodes)];
  const formatServerAmount = (code, value) => formatCurrency(Number(value || 0), code);
  const [localFilters, setLocalFilters] = useState({
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
    warehouse_id: filters.warehouse_id || '',
    status: filters.status || '',
    document_type: filters.document_type || '',
  });

  const page = items.current_page ?? items?.meta?.current_page ?? 1;
  const perPage = items.per_page ?? items?.meta?.per_page ?? 50;
  const totalPages = items.last_page ?? items?.meta?.last_page ?? 1;
  const activeFilters = Object.values(filters || {}).filter((value) => value !== null && value !== undefined && value !== '').length;

  const statusLabels = {
    pending: t('admin.reports.sales.statuses.pending', 'Pendiente'),
    paid: t('admin.reports.sales.statuses.paid', 'Pagado'),
    shipped: t('admin.reports.sales.statuses.shipped', 'Enviado'),
    delivered: t('admin.reports.sales.statuses.delivered', 'Entregado'),
    cancelled: t('admin.reports.sales.statuses.cancelled', 'Cancelado'),
  };

  const typeLabels = {
    invoice: t('admin.reports.sales.document_types.invoice', 'Factura'),
    delivery_note: t('admin.reports.sales.document_types.delivery_note', 'Nota de entrega'),
    proforma: t('admin.reports.sales.document_types.proforma', 'Proforma'),
  };

  const submitFilters = () => {
    router.get(route('admin.reports.sales.top_products'), {
      ...localFilters,
      page: 1,
    }, { preserveScroll: true, replace: true });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.reports.sales.top_products'), {
      ...filters,
      page: nextPage,
    }, { preserveScroll: true, replace: true });
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.reports.sales.top_products.page_title', 'Ranking de productos')} />
      <AdminIndexShell
        title={t('admin.reports.sales.top_products.hero_title', 'Visualiza el ranking de productos con una lectura más ejecutiva')}
        description={t('admin.reports.sales.top_products.hero_description', 'La vista prioriza navegación entre reportes de ventas, filtros de corte comercial y el top paginado de productos vendidos.')}
        stats={[
          { label: t('admin.reports.sales.top_products.stats.products_on_page', 'Productos en página'), value: items.data.length },
          { label: t('admin.reports.sales.top_products.stats.page', 'Página'), value: `${page}/${totalPages}` },
          { label: t('admin.reports.sales.top_products.stats.active_filters', 'Filtros activos'), value: activeFilters },
        ]}
        contextTitle={t('admin.reports.sales.top_products.context_title', 'Ranking de productos')}
        contextDescription={t('admin.reports.sales.top_products.context_description', 'Úsalo para detectar productos más vendidos por período, sucursal y tipo de documento con el mismo lenguaje visual del backoffice.')}
        contextItems={[
          { label: t('admin.reports.sales.top_products.context_items.view', 'Vista'), value: t('admin.reports.sales.top_products.context_items.view_value', 'Top productos') },
          { label: t('admin.reports.sales.top_products.context_items.records', 'Registros'), value: items.data.length },
          { label: t('admin.reports.sales.top_products.context_items.range', 'Rango'), value: localFilters.date_from || localFilters.date_to ? t('admin.reports.sales.top_products.context_items.custom_range', 'Personalizado') : t('admin.reports.sales.top_products.context_items.general_range', 'General') },
        ]}
        filters={
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              <button type="button" onClick={() => router.get(route('admin.reports.sales.index'), {}, { replace: true })} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">{t('admin.reports.sales.tabs.invoices', 'Reporte de facturas')}</button>
              <button type="button" className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white">{t('admin.reports.sales.tabs.top_products', 'Ranking de productos')}</button>
              <button type="button" onClick={() => router.get(route('admin.reports.sales.by_category'), {}, { replace: true })} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">{t('admin.reports.sales.tabs.by_category', 'Ventas por categoría')}</button>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.sales.filters.date_from', 'Desde')}</label>
              <input
                type="date"
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.date_from}
                onChange={(e) => setLocalFilters((f) => ({ ...f, date_from: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.sales.filters.date_to', 'Hasta')}</label>
              <input
                type="date"
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.date_to}
                onChange={(e) => setLocalFilters((f) => ({ ...f, date_to: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.sales.filters.warehouse', 'Sucursal/Bodega')}</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.warehouse_id}
                onChange={(e) => setLocalFilters((f) => ({ ...f, warehouse_id: e.target.value }))}
              >
                <option value="">{t('admin.reports.sales.filters.all_female', 'Todas')}</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.code ? `(${w.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.sales.top_products.filters.invoice_status', 'Estado de factura')}</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.status}
                onChange={(e) => setLocalFilters((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">{t('admin.reports.sales.filters.all_male', 'Todos')}</option>
                <option value="pending">{statusLabels.pending}</option>
                <option value="paid">{statusLabels.paid}</option>
                <option value="shipped">{statusLabels.shipped}</option>
                <option value="delivered">{statusLabels.delivered}</option>
                <option value="cancelled">{statusLabels.cancelled}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.sales.filters.document_type', 'Tipo de documento')}</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.document_type}
                onChange={(e) => setLocalFilters((f) => ({ ...f, document_type: e.target.value }))}
              >
                <option value="">{t('admin.reports.sales.filters.all_male', 'Todos')}</option>
                <option value="invoice">{typeLabels.invoice}</option>
                <option value="delivery_note">{typeLabels.delivery_note}</option>
                <option value="proforma">{typeLabels.proforma}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
              onClick={() => {
                setLocalFilters({
                  date_from: '',
                  date_to: '',
                  warehouse_id: '',
                  status: '',
                  document_type: '',
                });
                router.get(route('admin.reports.sales.top_products'), {}, { replace: true });
              }}
            >
              {t('admin.reports.sales.actions.clear_filters', 'Limpiar filtros')}
            </button>
            <button
              type="button"
              className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
              onClick={submitFilters}
            >
              {t('admin.reports.sales.actions.apply_filters', 'Aplicar filtros')}
            </button>
          </div>
        </div>
          </div>
        }
      >
        <div className="space-y-4 p-6">

        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">#</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.sales.top_products.table.product', 'Producto')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.sales.top_products.table.sku_barcode', 'SKU / Código')}</th>
                <th className="px-3 py-2 text-right font-semibold">{t('admin.reports.sales.top_products.table.total_quantity', 'Cantidad vendida')}</th>
                {currencyColumns.map((code) => (
                  <th key={code} className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.sales.top_products.table.total_usd', 'Total')} ${code}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.data.map((row, index) => (
                <tr key={row.product_id} className="border-b border-border hover:bg-muted/40">
                  <td className="px-3 py-2 text-xs">
                    {(page - 1) * perPage + index + 1}
                  </td>
                  <td className="px-3 py-2 text-xs">{row.product?.name ?? t('admin.reports.sales.top_products.table.deleted_product', 'Producto eliminado')}</td>
                  <td className="px-3 py-2 text-xs">{row.product?.sku || row.product?.barcode || t('admin.reports.sales.values.empty_dash', '—')}</td>
                  <td className="px-3 py-2 text-xs text-right">{formatNumber(row.total_quantity, { maximumFractionDigits: 0 })}</td>
                  {currencyColumns.map((code) => (
                    <td key={`${row.product_id}-${code}`} className="px-3 py-2 text-xs text-right">
                      {row.document_totals?.[code] !== undefined
                        ? formatServerAmount(code, row.document_totals[code])
                        : formatActiveAmount(row.total_sales_usd, code)}
                    </td>
                  ))}
                </tr>
              ))}
              {items.data.length === 0 && (
                <tr>
                  <td colSpan={4 + currencyColumns.length} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t('admin.reports.sales.top_products.empty', 'No hay ventas para los filtros seleccionados.')}
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
