import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminPagination from '@/Components/admin/AdminPagination.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';
import { TrendingUp, DollarSign, Package, Filter } from 'lucide-react';

export default function ProfitabilityReport({ results, filters = {}, categories = [], globalTotals = {}, adminCurrencyContext = {} }) {
  const { t } = useI18n();
  const { formatNumber, formatCurrency } = useLocaleFormat();
  const { displayCurrency, formatPriceFromUsd } = useConfiguredCurrencyRates();
  const formatActiveAmount = (value) => formatPriceFromUsd(Number(value || 0), displayCurrency);
  const formatServerAmount = (code, value) => formatCurrency(Number(value || 0), code);

  const [localFilters, setLocalFilters] = useState({
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
    category_id: filters.category_id || '',
    group_by: filters.group_by || 'product',
  });

  const submitFilters = () => {
    router.get(route('admin.reports.profitability'), {
      ...localFilters,
    }, { preserveScroll: true, replace: true });
  };

  const activeFilters = Object.values(filters || {}).filter((value) => value !== null && value !== undefined && value !== '').length;

  const getMarginColor = (margin) => {
    if (margin >= 30) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
    if (margin >= 15) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
    return 'text-rose-600 bg-rose-50 dark:bg-rose-900/20';
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.reports.profitability.page_title', 'Reporte de Rentabilidad')} />
      <AdminIndexShell
        title={t('admin.reports.profitability.hero_title', 'Analiza la rentabilidad de tu negocio')}
        description={t('admin.reports.profitability.hero_description', 'Visualiza el margen bruto por producto y categoría para identificar oportunidades de mejora.')}
        stats={[
          { 
            label: t('admin.reports.profitability.stats.total_revenue', 'Ingresos Totales'), 
            value: globalTotals.total_revenue_admin_totals?.[displayCurrency] !== undefined
              ? formatServerAmount(displayCurrency, globalTotals.total_revenue_admin_totals[displayCurrency])
              : formatActiveAmount(globalTotals.total_revenue || 0),
            icon: DollarSign,
            iconColor: 'text-emerald-600',
            iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
          },
          { 
            label: t('admin.reports.profitability.stats.total_cost', 'Costo Total'), 
            value: globalTotals.total_cost_admin_totals?.[displayCurrency] !== undefined
              ? formatServerAmount(displayCurrency, globalTotals.total_cost_admin_totals[displayCurrency])
              : formatActiveAmount(globalTotals.total_cost || 0),
            icon: Package,
            iconColor: 'text-amber-600',
            iconBg: 'bg-amber-50 dark:bg-amber-900/20',
          },
          { 
            label: t('admin.reports.profitability.stats.gross_profit', 'Margen Bruto'), 
            value: globalTotals.gross_profit_admin_totals?.[displayCurrency] !== undefined
              ? formatServerAmount(displayCurrency, globalTotals.gross_profit_admin_totals[displayCurrency])
              : formatActiveAmount(globalTotals.gross_profit || 0),
            icon: TrendingUp,
            iconColor: 'text-blue-600',
            iconBg: 'bg-blue-50 dark:bg-blue-900/20',
          },
          { 
            label: t('admin.reports.profitability.stats.margin_percent', 'Margen %'), 
            value: formatNumber(globalTotals.margin_percent || 0, { maximumFractionDigits: 1 }) + '%',
          },
        ]}
        contextTitle={t('admin.reports.profitability.context_title', 'Rentabilidad')}
        contextDescription={t('admin.reports.profitability.context_description', 'Análisis de margen bruto por producto y categoría.')}
        contextItems={[
          { label: t('admin.reports.profitability.context_items.group_by', 'Agrupar por'), value: localFilters.group_by === 'category' ? t('admin.reports.profitability.context_items.category', 'Categoría') : t('admin.reports.profitability.context_items.product', 'Producto') },
          { label: t('admin.reports.profitability.context_items.period', 'Período'), value: `${filters.date_from} - ${filters.date_to}` },
          { label: t('admin.reports.profitability.context_items.results', 'Resultados'), value: results.length },
        ]}
        filters={
          <div className="space-y-4 text-sm">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.profitability.filters.date_from', 'Desde')}</label>
                  <input
                    type="date"
                    className="w-full border border-border rounded px-2 py-1 bg-background"
                    value={localFilters.date_from}
                    onChange={(e) => setLocalFilters((f) => ({ ...f, date_from: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.profitability.filters.date_to', 'Hasta')}</label>
                  <input
                    type="date"
                    className="w-full border border-border rounded px-2 py-1 bg-background"
                    value={localFilters.date_to}
                    onChange={(e) => setLocalFilters((f) => ({ ...f, date_to: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.profitability.filters.category', 'Categoría')}</label>
                  <select
                    className="w-full border border-border rounded px-2 py-1 bg-background"
                    value={localFilters.category_id}
                    onChange={(e) => setLocalFilters((f) => ({ ...f, category_id: e.target.value }))}
                  >
                    <option value="">{t('admin.reports.profitability.filters.all_categories', 'Todas')}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.profitability.filters.group_by', 'Agrupar por')}</label>
                  <select
                    className="w-full border border-border rounded px-2 py-1 bg-background"
                    value={localFilters.group_by}
                    onChange={(e) => setLocalFilters((f) => ({ ...f, group_by: e.target.value }))}
                  >
                    <option value="product">{t('admin.reports.profitability.filters.group_product', 'Producto')}</option>
                    <option value="category">{t('admin.reports.profitability.filters.group_category', 'Categoría')}</option>
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
                      category_id: '',
                      group_by: 'product',
                    });
                    router.get(route('admin.reports.profitability'), {}, { replace: true });
                  }}
                >
                  {t('admin.reports.profitability.actions.clear_filters', 'Limpiar')}
                </button>
                <button
                  type="button"
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                  onClick={submitFilters}
                >
                  {t('admin.reports.profitability.actions.apply', 'Aplicar')}
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
                  {localFilters.group_by === 'category' ? (
                    <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.profitability.table.category', 'Categoría')}</th>
                  ) : (
                    <>
                      <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.profitability.table.product', 'Producto')}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.profitability.table.sku', 'SKU')}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.profitability.table.category', 'Categoría')}</th>
                    </>
                  )}
                  <th className="px-3 py-2 text-right font-semibold">{t('admin.reports.profitability.table.quantity', 'Cantidad')}</th>
                  <th className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.profitability.table.revenue', 'Ingresos')} ${displayCurrency}`}</th>
                  <th className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.profitability.table.cost', 'Costo')} ${displayCurrency}`}</th>
                  <th className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.profitability.table.profit', 'Margen Bruto')} ${displayCurrency}`}</th>
                  <th className="px-3 py-2 text-right font-semibold">{t('admin.reports.profitability.table.margin_percent', 'Margen %')}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item) => (
                  <tr key={item.id || item.category_id} className="border-b border-border hover:bg-muted/40">
                    {localFilters.group_by === 'category' ? (
                      <td className="px-3 py-2 text-xs font-medium">{item.category?.name || t('admin.reports.profitability.values.uncategorized', 'Sin categoría')}</td>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-xs font-medium">{item.name}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground font-mono">{item.sku || '—'}</td>
                        <td className="px-3 py-2 text-xs">{item.category?.name || t('admin.reports.profitability.values.uncategorized', 'Sin categoría')}</td>
                      </>
                    )}
                    <td className="px-3 py-2 text-xs text-right">{formatNumber(item.total_quantity, { maximumFractionDigits: 0 })}</td>
                    <td className="px-3 py-2 text-xs text-right">
                      {item.total_revenue_admin_totals?.[displayCurrency] !== undefined
                        ? formatServerAmount(displayCurrency, item.total_revenue_admin_totals[displayCurrency])
                        : formatActiveAmount(item.total_revenue)}
                    </td>
                    <td className="px-3 py-2 text-xs text-right">
                      {item.total_cost_admin_totals?.[displayCurrency] !== undefined
                        ? formatServerAmount(displayCurrency, item.total_cost_admin_totals[displayCurrency])
                        : formatActiveAmount(item.total_cost)}
                    </td>
                    <td className="px-3 py-2 text-xs text-right font-semibold">
                      {item.gross_profit_admin_totals?.[displayCurrency] !== undefined
                        ? formatServerAmount(displayCurrency, item.gross_profit_admin_totals[displayCurrency])
                        : formatActiveAmount(item.gross_profit)}
                    </td>
                    <td className="px-3 py-2 text-xs text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getMarginColor(item.margin_percent)}`}>
                        {formatNumber(item.margin_percent, { maximumFractionDigits: 1 })}%
                      </span>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={localFilters.group_by === 'category' ? 5 : 7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                      {t('admin.reports.profitability.empty', 'No hay datos para el período seleccionado.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AdminIndexShell>
    </AuthenticatedLayout>
  );
}
