import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminPagination from '@/Components/admin/AdminPagination.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';

export default function SalesReportIndex({ invoices, filters = {}, metrics, metricsByCurrency = {}, adminCurrencyContext = {}, warehouses = [], customers = [], paymentMethods = [], sellers = [] }) {
  const { t } = useI18n();
  const { formatDateTime, formatCurrency } = useLocaleFormat();
  const { displayCurrency, comparisonCurrency, formatPriceFromUsd, hasRateForCurrency } = useConfiguredCurrencyRates();
  const secondaryCurrency = comparisonCurrency && comparisonCurrency !== displayCurrency && hasRateForCurrency(comparisonCurrency)
    ? comparisonCurrency
    : null;
  const formatActiveAmount = (value, currency = displayCurrency) => formatPriceFromUsd(Number(value || 0), currency);
  const visibleCurrencyCodes = Array.isArray(adminCurrencyContext?.codes) && adminCurrencyContext.codes.length > 0
    ? adminCurrencyContext.codes
    : [displayCurrency, ...(secondaryCurrency ? [secondaryCurrency] : [])];
  const statsCurrencyCodes = [...new Set(visibleCurrencyCodes.filter(Boolean))];
  const formatServerAmount = (code, value) => formatCurrency(Number(value || 0), code);
  const [localFilters, setLocalFilters] = useState({
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
    warehouse_id: filters.warehouse_id || '',
    customer_id: filters.customer_id || '',
    seller_id: filters.seller_id || '',
    status: filters.status || '',
    document_type: filters.document_type || '',
    payment_method: filters.payment_method || '',
  });

  const page = invoices.current_page ?? invoices?.meta?.current_page ?? 1;
  const totalPages = invoices.last_page ?? invoices?.meta?.last_page ?? 1;

  const submitFilters = () => {
    router.get(route('admin.reports.sales.index'), {
      ...localFilters,
      page: 1,
    }, { preserveScroll: true, replace: true });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.reports.sales.index'), {
      ...filters,
      page: nextPage,
    }, { preserveScroll: true, replace: true });
  };

  const buildQueryString = () => {
    const clean = {};
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        clean[key] = value;
      }
    });
    return new URLSearchParams(clean).toString();
  };

  const handleExport = () => {
    const qs = buildQueryString();
    const base = route('admin.reports.sales.export');
    window.location.href = qs ? `${base}?${qs}` : base;
  };

  const handleExportExcel = () => {
    const qs = buildQueryString();
    const base = route('admin.reports.sales.export_excel');
    window.location.href = qs ? `${base}?${qs}` : base;
  };

  const handleExportPdf = () => {
    const qs = buildQueryString();
    const base = route('admin.reports.sales.export_pdf');
    window.location.href = qs ? `${base}?${qs}` : base;
  };

  const translateDocumentType = (value) => typeLabels[value] ?? t(`admin.reports.sales.document_types.${value}`, value ?? t('admin.reports.sales.values.empty_dash', '—'));
  const translateStatus = (value) => statusLabels[value] ?? t(`admin.reports.sales.statuses.${value}`, value ?? t('admin.reports.sales.values.empty_dash', '—'));

  const typeLabels = {
    invoice: t('admin.reports.sales.document_types.invoice', 'Factura'),
    delivery_note: t('admin.reports.sales.document_types.delivery_note', 'Nota de entrega'),
    proforma: t('admin.reports.sales.document_types.proforma', 'Proforma'),
  };

  const statusLabels = {
    pending: t('admin.reports.sales.statuses.pending', 'Pendiente'),
    paid: t('admin.reports.sales.statuses.paid', 'Pagado'),
    shipped: t('admin.reports.sales.statuses.shipped', 'Enviado'),
    delivered: t('admin.reports.sales.statuses.delivered', 'Entregado'),
    cancelled: t('admin.reports.sales.statuses.cancelled', 'Cancelado'),
  };

  const activeFilters = Object.values(filters || {}).filter((value) => value !== null && value !== undefined && value !== '').length;

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.reports.sales.page_title', 'Reporte de ventas')} />
      <AdminIndexShell
        title={t('admin.reports.sales.hero_title', 'Analiza ventas con un tablero más claro para consulta y exportación')}
        description={t('admin.reports.sales.hero_description', 'La vista reúne métricas, navegación entre reportes, filtros comerciales y exportaciones sin obligar al usuario a recorrer una pantalla plana.')}
        stats={[
          { label: t('admin.reports.sales.stats.invoices', 'Facturas'), value: metrics.total_invoices },
          ...statsCurrencyCodes.map((code) => ({
            label: `${t('admin.reports.sales.stats.total_usd', 'Total')} ${code}`,
            value: metricsByCurrency?.[code] !== undefined
              ? formatServerAmount(code, metricsByCurrency[code])
              : formatActiveAmount(metrics.total_usd || 0, code),
          })),
          {
            label: `${t('admin.reports.sales.stats.avg_ticket', 'Ticket')} ${displayCurrency}`,
            value: metrics.avg_ticket_admin_totals?.[displayCurrency] !== undefined
              ? formatServerAmount(displayCurrency, metrics.avg_ticket_admin_totals[displayCurrency])
              : formatActiveAmount(metrics.avg_ticket_usd || 0),
          },
        ]}
        contextTitle={t('admin.reports.sales.context_title', 'Reporte de ventas')}
        contextDescription={t('admin.reports.sales.context_description', 'Cruza fechas, sucursal, cliente, vendedor y método de pago con acceso inmediato a exportaciones del resultado actual.')}
        contextItems={[
          { label: t('admin.reports.sales.context_items.active_filters', 'Filtros activos'), value: activeFilters },
          { label: t('admin.reports.sales.context_items.page', 'Página'), value: `${page}/${totalPages}` },
          { label: t('admin.reports.sales.context_items.view', 'Vista'), value: t('admin.reports.sales.context_items.invoices_view', 'Facturas') },
        ]}
        primaryAction={
          <button type="button" onClick={handleExportExcel} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">{t('admin.reports.sales.actions.excel', 'Excel')}</button>
        }
        secondaryActions={
          <>
            <button type="button" onClick={handleExport} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{t('admin.reports.sales.actions.csv', 'CSV')}</button>
            <button type="button" onClick={handleExportPdf} className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">{t('admin.reports.sales.actions.pdf', 'PDF')}</button>
          </>
        }
        filters={
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              <button type="button" className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white">{t('admin.reports.sales.tabs.invoices', 'Reporte de facturas')}</button>
              <button type="button" onClick={() => router.get(route('admin.reports.sales.top_products'), {}, { replace: true })} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">{t('admin.reports.sales.tabs.top_products', 'Ranking de productos')}</button>
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
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.sales.filters.customer', 'Cliente')}</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.customer_id}
                onChange={(e) => setLocalFilters((f) => ({ ...f, customer_id: e.target.value }))}
              >
                <option value="">{t('admin.reports.sales.filters.all_male', 'Todos')}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">{t('admin.reports.sales.filters.customer_help', 'Lista limitada a 200 clientes más usados.')}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.sales.filters.status', 'Estado')}</label>
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
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.sales.filters.payment_method', 'Método de pago')}</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.payment_method}
                onChange={(e) => setLocalFilters((f) => ({ ...f, payment_method: e.target.value }))}
              >
                <option value="">{t('admin.reports.sales.filters.all_male', 'Todos')}</option>
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.sales.filters.seller', 'Vendedor')}</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.seller_id}
                onChange={(e) => setLocalFilters((f) => ({ ...f, seller_id: e.target.value }))}
              >
                <option value="">{t('admin.reports.sales.filters.all_male', 'Todos')}</option>
                {sellers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
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
                  date_from: '',
                  date_to: '',
                  warehouse_id: '',
                  customer_id: '',
                  seller_id: '',
                  status: '',
                  document_type: '',
                  payment_method: '',
                });
                router.get(route('admin.reports.sales.index'), {}, { replace: true });
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
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.sales.table.date', 'Fecha')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.sales.table.number', 'Número')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.sales.table.type', 'Tipo')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.sales.table.customer', 'Cliente')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.sales.table.branch', 'Sucursal')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.sales.table.status', 'Estado')}</th>
                {statsCurrencyCodes.map((code) => (
                  <th key={code} className="px-3 py-2 text-right font-semibold">{code}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.data.map((inv) => (
                <tr key={inv.id} className="border-b border-border hover:bg-muted/40">
                  <td className="px-3 py-2 text-xs">{formatDateTime(inv.created_at)}</td>
                  <td className="px-3 py-2 text-xs">{inv.number}</td>
                  <td className="px-3 py-2 text-xs">{translateDocumentType(inv.document_type)}</td>
                  <td className="px-3 py-2 text-xs">{inv.customer?.name ?? t('admin.reports.sales.table.na', 'N/A')}</td>
                  <td className="px-3 py-2 text-xs">{inv.warehouse?.name ?? inv.warehouse?.code ?? t('admin.reports.sales.values.empty_dash', '—')}</td>
                  <td className="px-3 py-2 text-xs">{translateStatus(inv.status)}</td>
                  {statsCurrencyCodes.map((code) => (
                    <td key={`${inv.id}-${code}`} className="px-3 py-2 text-xs text-right">
                      {inv.admin_totals?.[code] !== undefined
                        ? formatServerAmount(code, inv.admin_totals[code])
                        : formatActiveAmount(inv.total_usd, code)}
                    </td>
                  ))}
                </tr>
              ))}
              {invoices.data.length === 0 && (
                <tr>
                  <td colSpan={6 + statsCurrencyCodes.length} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t('admin.reports.sales.empty', 'No hay facturas para los filtros seleccionados.')}
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
