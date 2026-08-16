import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';
import { Package, AlertTriangle, Clock, DollarSign } from 'lucide-react';

export default function InventoryAgeReport({ products, filters = {}, categories = [], totals = {}, adminCurrencyContext = {} }) {
  const { t } = useI18n();
  const { formatNumber, formatCurrency } = useLocaleFormat();
  const { displayCurrency, formatPriceFromUsd } = useConfiguredCurrencyRates();
  const formatActiveAmount = (value) => formatPriceFromUsd(Number(value || 0), displayCurrency);
  const formatServerAmount = (code, value) => formatCurrency(Number(value || 0), code);

  const [localFilters, setLocalFilters] = useState({
    days_threshold: filters.days_threshold || 90,
    category_id: filters.category_id || '',
  });

  const submitFilters = () => {
    router.get(route('admin.reports.inventory_age'), {
      ...localFilters,
    }, { preserveScroll: true, replace: true });
  };

  const getAgeColor = (days) => {
    if (days >= 180) return 'text-rose-600 bg-rose-50 dark:bg-rose-900/20';
    if (days >= 90) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
    return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
  };

  const getAgeLabel = (days) => {
    if (days >= 180) return t('admin.reports.inventory_age.labels.critical', 'Crítico');
    if (days >= 90) return t('admin.reports.inventory_age.labels.warning', 'Advertencia');
    return t('admin.reports.inventory_age.labels.ok', 'OK');
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.reports.inventory_age.page_title', 'Reporte de Antigüedad de Inventario')} />
      <AdminIndexShell
        title={t('admin.reports.inventory_age.hero_title', 'Identifica inventario obsoleto')}
        description={t('admin.reports.inventory_age.hero_description', 'Descubre productos sin movimiento por X días para optimizar tu inventario.')}
        stats={[
          { 
            label: t('admin.reports.inventory_age.stats.total_products', 'Productos'), 
            value: formatNumber(totals.total_products || 0),
            icon: Package,
            iconColor: 'text-blue-600',
            iconBg: 'bg-blue-50 dark:bg-blue-900/20',
          },
          { 
            label: t('admin.reports.inventory_age.stats.total_stock', 'Stock Total'), 
            value: formatNumber(totals.total_stock || 0),
            icon: Package,
            iconColor: 'text-amber-600',
            iconBg: 'bg-amber-50 dark:bg-amber-900/20',
          },
          { 
            label: t('admin.reports.inventory_age.stats.total_value', 'Valor Inventario'), 
            value: totals.total_value_admin_totals?.[displayCurrency] !== undefined
              ? formatServerAmount(displayCurrency, totals.total_value_admin_totals[displayCurrency])
              : formatActiveAmount(totals.total_value || 0),
            icon: DollarSign,
            iconColor: 'text-emerald-600',
            iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
          },
          { 
            label: t('admin.reports.inventory_age.stats.threshold', 'Umbral días'), 
            value: filters.days_threshold,
            icon: Clock,
            iconColor: 'text-violet-600',
            iconBg: 'bg-violet-50 dark:bg-violet-900/20',
          },
        ]}
        contextTitle={t('admin.reports.inventory_age.context_title', 'Antigüedad de Inventario')}
        contextDescription={t('admin.reports.inventory_age.context_description', 'Productos sin movimiento en los últimos días.')}
        contextItems={[
          { label: t('admin.reports.inventory_age.context_items.threshold', 'Umbral'), value: `${filters.days_threshold} ${t('admin.reports.inventory_age.context_items.days', 'días')}` },
          { label: t('admin.reports.inventory_age.context_items.category', 'Categoría'), value: localFilters.category_id ? categories.find(c => c.id === parseInt(localFilters.category_id))?.name : t('admin.reports.inventory_age.context_items.all', 'Todas') },
          { label: t('admin.reports.inventory_age.context_items.products', 'Productos'), value: products.length },
        ]}
        filters={
          <div className="space-y-4 text-sm">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.inventory_age.filters.days_threshold', 'Días sin movimiento')}</label>
                  <input
                    type="number"
                    className="w-full border border-border rounded px-2 py-1 bg-background"
                    value={localFilters.days_threshold}
                    onChange={(e) => setLocalFilters((f) => ({ ...f, days_threshold: e.target.value }))}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.inventory_age.filters.category', 'Categoría')}</label>
                  <select
                    className="w-full border border-border rounded px-2 py-1 bg-background"
                    value={localFilters.category_id}
                    onChange={(e) => setLocalFilters((f) => ({ ...f, category_id: e.target.value }))}
                  >
                    <option value="">{t('admin.reports.inventory_age.filters.all_categories', 'Todas')}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                  onClick={() => {
                    setLocalFilters({
                      days_threshold: 90,
                      category_id: '',
                    });
                    router.get(route('admin.reports.inventory_age'), {}, { replace: true });
                  }}
                >
                  {t('admin.reports.inventory_age.actions.clear_filters', 'Limpiar')}
                </button>
                <button
                  type="button"
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                  onClick={submitFilters}
                >
                  {t('admin.reports.inventory_age.actions.apply', 'Aplicar')}
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
                  <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.inventory_age.table.product', 'Producto')}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.inventory_age.table.sku', 'SKU')}</th>
                  <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.inventory_age.table.category', 'Categoría')}</th>
                  <th className="px-3 py-2 text-right font-semibold">{t('admin.reports.inventory_age.table.stock', 'Stock')}</th>
                  <th className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.inventory_age.table.value', 'Valor')} ${displayCurrency}`}</th>
                  <th className="px-3 py-2 text-right font-semibold">{t('admin.reports.inventory_age.table.days_since_sale', 'Días sin venta')}</th>
                  <th className="px-3 py-2 text-center font-semibold">{t('admin.reports.inventory_age.table.status', 'Estado')}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-border hover:bg-muted/40">
                    <td className="px-3 py-2 text-xs font-medium">{product.name}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground font-mono">{product.sku || '—'}</td>
                    <td className="px-3 py-2 text-xs">{product.category?.name || t('admin.reports.inventory_age.values.uncategorized', 'Sin categoría')}</td>
                    <td className="px-3 py-2 text-xs text-right">{formatNumber(product.stock, { maximumFractionDigits: 0 })}</td>
                    <td className="px-3 py-2 text-xs text-right">
                      {product.inventory_value_admin_totals?.[displayCurrency] !== undefined
                        ? formatServerAmount(displayCurrency, product.inventory_value_admin_totals[displayCurrency])
                        : formatActiveAmount(product.inventory_value)}
                    </td>
                    <td className="px-3 py-2 text-xs text-right">
                      {product.days_since_sale >= 999 ? (
                        <span className="text-muted-foreground">{t('admin.reports.inventory_age.values.never_sold', 'Nunca vendido')}</span>
                      ) : (
                        formatNumber(product.days_since_sale, { maximumFractionDigits: 0 })
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getAgeColor(product.days_since_sale)}`}>
                        {getAgeLabel(product.days_since_sale)}
                      </span>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                      {t('admin.reports.inventory_age.empty', 'No hay productos sin movimiento en el período seleccionado.')}
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
