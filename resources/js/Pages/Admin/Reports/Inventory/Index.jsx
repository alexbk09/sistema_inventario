import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminPagination from '@/Components/admin/AdminPagination.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';

export default function InventoryReportIndex({ products, filters = {}, valuation, categories = [] }) {
  const { t } = useI18n();
  const { formatNumber } = useLocaleFormat();
  const { displayCurrency, formatPriceFromUsd } = useConfiguredCurrencyRates();
  const formatActiveAmount = (value) => formatPriceFromUsd(Number(value || 0), displayCurrency);
  const [localFilters, setLocalFilters] = useState({
    category_id: filters.category_id || '',
    search: filters.search || '',
    low_stock_only: !!filters.low_stock_only,
  });

  const page = products.current_page ?? products?.meta?.current_page ?? 1;
  const totalPages = products.last_page ?? products?.meta?.last_page ?? 1;
  const activeFilters = Object.values(filters || {}).filter((value) => value !== null && value !== undefined && value !== '' && value !== false).length;

  const buildQueryString = () => {
    const clean = {};
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== false) {
        clean[key] = value;
      }
    });
    if (localFilters.low_stock_only) {
      clean.low_stock_only = 1;
    }
    return new URLSearchParams(clean).toString();
  };

  const submitFilters = () => {
    router.get(route('admin.reports.inventory.index'), {
      ...localFilters,
      low_stock_only: localFilters.low_stock_only ? 1 : '',
      page: 1,
    }, { preserveScroll: true, replace: true });
  };

  const handleExportCsv = () => {
    const qs = buildQueryString();
    const base = route('admin.reports.inventory.export');
    window.location.href = qs ? `${base}?${qs}` : base;
  };

  const handleExportExcel = () => {
    const qs = buildQueryString();
    const base = route('admin.reports.inventory.export_excel');
    window.location.href = qs ? `${base}?${qs}` : base;
  };

  const handleExportPdf = () => {
    const qs = buildQueryString();
    const base = route('admin.reports.inventory.export_pdf');
    window.location.href = qs ? `${base}?${qs}` : base;
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.reports.inventory.index'), {
      ...filters,
      page: nextPage,
    }, { preserveScroll: true, replace: true });
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.reports.inventory.index.page_title', 'Reporte de inventario')} />
      <AdminIndexShell
        title={t('admin.reports.inventory.index.hero_title', 'Consulta valorización de inventario con mejor jerarquía visual')}
        description={t('admin.reports.inventory.index.hero_description', 'La vista integra métricas de stock, navegación entre subreportes, exportaciones y filtros sin caer en un layout plano de tabla.')}
        stats={[
          { label: t('admin.reports.inventory.index.stats.units', 'Unidades'), value: formatNumber(valuation.total_units || 0, { maximumFractionDigits: 0 }) },
          { label: `${t('admin.reports.inventory.index.stats.cost_usd', 'Costo')} ${displayCurrency}`, value: formatActiveAmount(valuation.total_cost_usd || 0) },
          { label: `${t('admin.reports.inventory.index.stats.price_usd', 'Venta')} ${displayCurrency}`, value: formatActiveAmount(valuation.total_price_usd || 0) },
          { label: t('admin.reports.inventory.index.stats.filters', 'Filtros'), value: activeFilters },
        ]}
        contextTitle={t('admin.reports.inventory.index.context_title', 'Inventario global')}
        contextDescription={t('admin.reports.inventory.index.context_description', 'Úsalo para revisar valorización por producto, detectar stock bajo y exportar el corte actual del inventario.')}
        contextItems={[
          { label: t('admin.reports.inventory.index.context_items.view', 'Vista'), value: t('admin.reports.inventory.index.context_items.view_value', 'Valorización global') },
          { label: t('admin.reports.inventory.index.context_items.page', 'Página'), value: `${page}/${totalPages}` },
          { label: t('admin.reports.inventory.index.context_items.results', 'Resultados'), value: products.data.length },
        ]}
        primaryAction={<button type="button" onClick={handleExportExcel} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">{t('admin.reports.inventory.actions.excel', 'Excel')}</button>}
        secondaryActions={<><button type="button" onClick={handleExportCsv} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{t('admin.reports.inventory.actions.csv', 'CSV')}</button><button type="button" onClick={handleExportPdf} className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">{t('admin.reports.inventory.actions.pdf', 'PDF')}</button></>}
        filters={
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              <button type="button" className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white">{t('admin.reports.inventory.tabs.global', 'Valorización global')}</button>
              <button type="button" onClick={() => router.get(route('admin.reports.inventory.by_warehouse'), {}, { replace: true })} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">{t('admin.reports.inventory.tabs.by_warehouse', 'Por producto y bodega')}</button>
              <button type="button" onClick={() => router.get(route('admin.reports.inventory.kardex'), {}, { replace: true })} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">{t('admin.reports.inventory.tabs.kardex', 'Kardex de inventario')}</button>
              <button type="button" onClick={() => router.get(route('admin.reports.inventory.rotation'), {}, { replace: true })} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">{t('admin.reports.inventory.tabs.rotation', 'Rotación de productos')}</button>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.inventory.index.filters.category', 'Categoría')}</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.category_id}
                onChange={(e) => setLocalFilters((f) => ({ ...f, category_id: e.target.value }))}
              >
                <option value="">{t('admin.reports.inventory.filters.all_female', 'Todas')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.inventory.index.filters.search', 'Buscar')}</label>
              <input
                type="text"
                placeholder={t('admin.reports.inventory.filters.search_placeholder', 'Nombre, SKU o código de barras')}
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.search}
                onChange={(e) => setLocalFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <input
                  type="checkbox"
                  className="rounded border-border"
                  checked={localFilters.low_stock_only}
                  onChange={(e) => setLocalFilters((f) => ({ ...f, low_stock_only: e.target.checked }))}
                />
                {t('admin.reports.inventory.index.filters.low_stock_only', 'Solo productos con stock bajo/cero')}
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
              onClick={() => {
                setLocalFilters({ category_id: '', search: '', low_stock_only: false });
                router.get(route('admin.reports.inventory.index'), {}, { replace: true });
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

        {/* Tabla de productos */}
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.inventory.index.table.product', 'Producto')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.inventory.index.table.sku', 'SKU')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.inventory.index.table.categories', 'Categorías')}</th>
                <th className="px-3 py-2 text-right font-semibold">{t('admin.reports.inventory.index.table.stock', 'Stock')}</th>
                <th className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.inventory.index.table.avg_cost', 'Costo prom.')} ${displayCurrency}`}</th>
                <th className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.inventory.index.table.price', 'Precio')} ${displayCurrency}`}</th>
                <th className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.inventory.index.table.cost_value', 'Valor costo')} ${displayCurrency}`}</th>
                <th className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.inventory.index.table.sales_value', 'Valor venta')} ${displayCurrency}`}</th>
              </tr>
            </thead>
            <tbody>
              {products.data.map((p) => {
                const categoriesNames = (p.categories || []).map((c) => c.name).join(', ');
                const valueCost = (p.stock || 0) * (p.average_cost_usd || 0);
                const valuePrice = (p.stock || 0) * (p.price_usd || 0);
                return (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/40">
                    <td className="px-3 py-2 text-xs">{p.name}</td>
                    <td className="px-3 py-2 text-xs">{p.sku}</td>
                    <td className="px-3 py-2 text-xs">{categoriesNames || '-'}</td>
                    <td className="px-3 py-2 text-xs text-right">{formatNumber(p.stock || 0, { maximumFractionDigits: 0 })}</td>
                    <td className="px-3 py-2 text-xs text-right">{formatActiveAmount(p.average_cost_usd || 0)}</td>
                    <td className="px-3 py-2 text-xs text-right">{formatActiveAmount(p.price_usd || 0)}</td>
                    <td className="px-3 py-2 text-xs text-right">{formatActiveAmount(valueCost)}</td>
                    <td className="px-3 py-2 text-xs text-right">{formatActiveAmount(valuePrice)}</td>
                  </tr>
                );
              })}
              {products.data.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t('admin.reports.inventory.index.empty', 'No hay productos para los filtros seleccionados.')}
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
