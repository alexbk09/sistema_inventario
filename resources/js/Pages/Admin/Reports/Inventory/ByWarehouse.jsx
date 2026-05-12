import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminPagination from '@/Components/admin/AdminPagination.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';

export default function InventoryByWarehouse({ rows, filters = {}, warehouses = [], valuation, adminCurrencyContext = {} }) {
  const { t } = useI18n();
  const { formatNumber, formatCurrency } = useLocaleFormat();
  const { displayCurrency, formatPriceFromUsd } = useConfiguredCurrencyRates();
  const formatActiveAmount = (value) => formatPriceFromUsd(Number(value || 0), displayCurrency);
  const visibleCurrencyCodes = Array.isArray(adminCurrencyContext?.codes) && adminCurrencyContext.codes.length > 0
    ? adminCurrencyContext.codes
    : [displayCurrency];
  const formatServerAmount = (code, value) => formatCurrency(Number(value || 0), code);
  const [localFilters, setLocalFilters] = useState({
    warehouse_id: filters.warehouse_id || '',
    search: filters.search || '',
  });

  const page = rows.current_page ?? rows?.meta?.current_page ?? 1;
  const totalPages = rows.last_page ?? rows?.meta?.last_page ?? 1;
  const activeFilters = Object.values(filters || {}).filter((value) => value !== null && value !== undefined && value !== '').length;

  const submitFilters = () => {
    router.get(route('admin.reports.inventory.by_warehouse'), {
      ...localFilters,
      page: 1,
    }, { preserveScroll: true, replace: true });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.reports.inventory.by_warehouse'), {
      ...filters,
      page: nextPage,
    }, { preserveScroll: true, replace: true });
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.reports.inventory.by_warehouse.page_title', 'Inventario por bodega')} />
      <AdminIndexShell
        title={t('admin.reports.inventory.by_warehouse.hero_title', 'Observa inventario por bodega con más contexto de operación')}
        description={t('admin.reports.inventory.by_warehouse.hero_description', 'La vista muestra stock, valor costo y valor venta por sede y producto dentro del mismo marco visual de reportes administrativos.')}
        stats={[
          { label: t('admin.reports.inventory.by_warehouse.stats.units', 'Unidades página'), value: formatNumber(valuation.total_units || 0, { maximumFractionDigits: 0 }) },
          {
            label: `${t('admin.reports.inventory.by_warehouse.stats.cost_usd', 'Costo')} ${displayCurrency}`,
            value: valuation.total_cost_admin_totals?.[displayCurrency] !== undefined
              ? formatServerAmount(displayCurrency, valuation.total_cost_admin_totals[displayCurrency])
              : formatActiveAmount(valuation.total_cost_usd || 0),
          },
          {
            label: `${t('admin.reports.inventory.by_warehouse.stats.price_usd', 'Venta')} ${displayCurrency}`,
            value: valuation.total_price_admin_totals?.[displayCurrency] !== undefined
              ? formatServerAmount(displayCurrency, valuation.total_price_admin_totals[displayCurrency])
              : formatActiveAmount(valuation.total_price_usd || 0),
          },
          { label: t('admin.reports.inventory.by_warehouse.stats.filters', 'Filtros'), value: activeFilters },
        ]}
        contextTitle={t('admin.reports.inventory.by_warehouse.context_title', 'Inventario por bodega')}
        contextDescription={t('admin.reports.inventory.by_warehouse.context_description', 'Úsalo para comparar stock y valorización entre sucursales sin salir del ecosistema de reportes de inventario.')}
        contextItems={[
          { label: t('admin.reports.inventory.by_warehouse.context_items.view', 'Vista'), value: t('admin.reports.inventory.by_warehouse.context_items.view_value', 'Producto y bodega') },
          { label: t('admin.reports.inventory.by_warehouse.context_items.page', 'Página'), value: `${page}/${totalPages}` },
          { label: t('admin.reports.inventory.by_warehouse.context_items.visible_rows', 'Filas visibles'), value: rows.data.length },
        ]}
        filters={
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              <button type="button" onClick={() => router.get(route('admin.reports.inventory.index'), {}, { replace: true })} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">{t('admin.reports.inventory.tabs.global', 'Valorización global')}</button>
              <button type="button" className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white">{t('admin.reports.inventory.tabs.by_warehouse', 'Por producto y bodega')}</button>
              <button type="button" onClick={() => router.get(route('admin.reports.inventory.kardex'), {}, { replace: true })} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">{t('admin.reports.inventory.tabs.kardex', 'Kardex de inventario')}</button>
              <button type="button" onClick={() => router.get(route('admin.reports.inventory.rotation'), {}, { replace: true })} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">{t('admin.reports.inventory.tabs.rotation', 'Rotación de productos')}</button>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
              onClick={() => {
                setLocalFilters({ warehouse_id: '', search: '' });
                router.get(route('admin.reports.inventory.by_warehouse'), {}, { replace: true });
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

        {/* Tabla de inventario por bodega */}
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.inventory.by_warehouse.table.branch', 'Sucursal')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.inventory.by_warehouse.table.product', 'Producto')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.inventory.by_warehouse.table.sku_barcode', 'SKU / Código')}</th>
                <th className="px-3 py-2 text-right font-semibold">{t('admin.reports.inventory.by_warehouse.table.stock_units', 'Stock unidades')}</th>
                <th className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.inventory.by_warehouse.table.avg_cost', 'Costo prom.')} ${displayCurrency}`}</th>
                <th className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.inventory.by_warehouse.table.price', 'Precio')} ${displayCurrency}`}</th>
                {visibleCurrencyCodes.map((code) => (
                  <th key={`cost-${code}`} className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.inventory.by_warehouse.table.cost_value', 'Valor costo')} ${code}`}</th>
                ))}
                {visibleCurrencyCodes.map((code) => (
                  <th key={`sales-${code}`} className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.inventory.by_warehouse.table.sales_value', 'Valor venta')} ${code}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.data.map((row) => {
                return (
                  <tr key={`${row.product_id}-${row.warehouse_id}`} className="border-b border-border hover:bg-muted/40">
                    <td className="px-3 py-2 text-xs">{row.warehouse?.name || row.warehouse?.code || t('admin.reports.inventory.by_warehouse.values.empty_dash', '—')}</td>
                    <td className="px-3 py-2 text-xs">{row.product?.name || t('admin.reports.inventory.by_warehouse.table.deleted_product', 'Producto eliminado')}</td>
                    <td className="px-3 py-2 text-xs">{row.product?.sku || row.product?.barcode || t('admin.reports.inventory.by_warehouse.values.empty_dash', '—')}</td>
                    <td className="px-3 py-2 text-xs text-right">{formatNumber(row.stock_units ?? 0, { maximumFractionDigits: 0 })}</td>
                    <td className="px-3 py-2 text-xs text-right">
                      {row.average_cost_admin_totals?.[displayCurrency] !== undefined
                        ? formatServerAmount(displayCurrency, row.average_cost_admin_totals[displayCurrency])
                        : formatActiveAmount(row.product?.average_cost_usd || 0)}
                    </td>
                    <td className="px-3 py-2 text-xs text-right">
                      {row.price_admin_totals?.[displayCurrency] !== undefined
                        ? formatServerAmount(displayCurrency, row.price_admin_totals[displayCurrency])
                        : formatActiveAmount(row.product?.price_usd || 0)}
                    </td>
                    {visibleCurrencyCodes.map((code) => (
                      <td key={`${row.product_id}-${row.warehouse_id}-cost-${code}`} className="px-3 py-2 text-xs text-right">
                        {row.value_cost_admin_totals?.[code] !== undefined
                          ? formatServerAmount(code, row.value_cost_admin_totals[code])
                          : formatActiveAmount((row.stock_units || 0) * (row.product?.average_cost_usd || 0))}
                      </td>
                    ))}
                    {visibleCurrencyCodes.map((code) => (
                      <td key={`${row.product_id}-${row.warehouse_id}-sales-${code}`} className="px-3 py-2 text-xs text-right">
                        {row.value_price_admin_totals?.[code] !== undefined
                          ? formatServerAmount(code, row.value_price_admin_totals[code])
                          : formatActiveAmount((row.stock_units || 0) * (row.product?.price_usd || 0))}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {rows.data.length === 0 && (
                <tr>
                  <td colSpan={6 + (visibleCurrencyCodes.length * 2)} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t('admin.reports.inventory.by_warehouse.empty', 'No hay registros para los filtros seleccionados.')}
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
