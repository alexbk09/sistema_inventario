import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminPagination from '@/Components/admin/AdminPagination.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';

export default function CreditMovementsReport({ movements, filters = {}, metrics, customers = [], accounts = [], types = [], statuses = [], adminCurrencyContext }) {
  const { t } = useI18n();
  const { formatDateTime } = useLocaleFormat();
  const adminCurrencyCodes = Array.isArray(adminCurrencyContext?.codes) ? adminCurrencyContext.codes : [];
  const formatMoney = (value) => new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
  const [localFilters, setLocalFilters] = useState({
    customer_id: filters.customer_id || '',
    account_id: filters.account_id || '',
    type: filters.type || '',
    status: filters.status || '',
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
  });

  const page = movements.current_page ?? movements?.meta?.current_page ?? 1;
  const totalPages = movements.last_page ?? movements?.meta?.last_page ?? 1;
  const activeFilters = Object.values(filters || {}).filter((value) => value !== null && value !== undefined && value !== '').length;
  const translateMovementType = (value) => t(`admin.reports.credit.movement_types.${value}`, value);
  const translateMovementStatus = (value) => t(`admin.reports.credit.movement_statuses.${value}`, value);
  const translateDocumentType = (value) => t(`admin.invoices.document_types.${value}`, value ?? t('admin.reports.credit.values.empty_dash', '—'));

  const submitFilters = () => {
    router.get(route('admin.reports.credits.movements'), {
      ...localFilters,
      page: 1,
    }, { preserveScroll: true, replace: true });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.reports.credits.movements'), {
      ...filters,
      page: nextPage,
    }, { preserveScroll: true, replace: true });
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.reports.credit.movements.page_title', 'Historial de créditos y pagos')} />
      <AdminIndexShell
        title={t('admin.reports.credit.movements.hero_title', 'Revisa movimientos de crédito y pagos con una lectura más operativa')}
        description={t('admin.reports.credit.movements.hero_description', 'La vista centraliza filtros por cliente, cuenta, tipo y fechas para auditar cargos y pagos dentro del mismo sistema visual del panel.')}
        stats={[
          { label: t('admin.reports.credit.movements.stats.movements', 'Movimientos'), value: metrics.total_movements },
          { label: t('admin.reports.credit.movements.stats.page_movements', 'Movimientos página'), value: metrics.page_movements },
          ...adminCurrencyCodes.map((code) => ({ label: `${t('admin.reports.credit.movements.stats.charges_usd', 'Cargos')} ${code}`, value: formatMoney(metrics.total_charges_admin_totals?.[code] ?? 0) })),
          ...adminCurrencyCodes.map((code) => ({ label: `${t('admin.reports.credit.movements.stats.payments_usd', 'Pagos')} ${code}`, value: formatMoney(metrics.total_payments_admin_totals?.[code] ?? 0) })),
        ]}
        contextTitle={t('admin.reports.credit.movements.context_title', 'Movimientos y pagos')}
        contextDescription={t('admin.reports.credit.movements.context_description', 'Úsalo para seguir cargos, pagos y facturas asociadas dentro del historial completo de crédito.')}
        contextItems={[
          { label: t('admin.reports.credit.movements.context_items.active_filters', 'Filtros activos'), value: activeFilters },
          { label: t('admin.reports.credit.movements.context_items.page', 'Página'), value: `${page}/${totalPages}` },
          { label: t('admin.reports.credit.movements.context_items.view', 'Vista'), value: t('admin.reports.credit.tabs.movements_only', 'Movimientos') },
        ]}
        filters={
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              <button type="button" onClick={() => router.get(route('admin.reports.credits.index'), {}, { replace: true })} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">{t('admin.reports.credit.tabs.summary', 'Resumen por cliente')}</button>
              <button type="button" className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white">{t('admin.reports.credit.tabs.movements', 'Movimientos y pagos')}</button>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.credit.filters.customer', 'Cliente')}</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.customer_id}
                onChange={(e) => setLocalFilters((f) => ({ ...f, customer_id: e.target.value }))}
              >
                <option value="">{t('admin.reports.credit.filters.all_male', 'Todos')}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.email ? `(${c.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.credit.movements.filters.account', 'Cuenta de crédito')}</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.account_id}
                onChange={(e) => setLocalFilters((f) => ({ ...f, account_id: e.target.value }))}
              >
                <option value="">{t('admin.reports.credit.filters.all_female', 'Todas')}</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    #{a.id} - {a.customer?.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.credit.movements.filters.type', 'Tipo de movimiento')}</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.type}
                onChange={(e) => setLocalFilters((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="">{t('admin.reports.credit.filters.all_male', 'Todos')}</option>
                {types.map((typeItem) => (
                  <option key={typeItem.value} value={typeItem.value}>{translateMovementType(typeItem.value)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.credit.movements.filters.status', 'Estado')}</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.status}
                onChange={(e) => setLocalFilters((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">{t('admin.reports.credit.filters.all_male', 'Todos')}</option>
                {statuses.map((s) => (
                  <option key={s.value} value={s.value}>{translateMovementStatus(s.value)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.credit.filters.date_from', 'Desde')}</label>
              <input
                type="date"
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.date_from}
                onChange={(e) => setLocalFilters((f) => ({ ...f, date_from: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.credit.filters.date_to', 'Hasta')}</label>
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
                  customer_id: '',
                  account_id: '',
                  type: '',
                  status: '',
                  date_from: '',
                  date_to: '',
                });
                router.get(route('admin.reports.credits.movements'), {}, { replace: true });
              }}
            >
              {t('admin.reports.credit.actions.clear_filters', 'Limpiar filtros')}
            </button>
            <button
              type="button"
              className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
              onClick={submitFilters}
            >
              {t('admin.reports.credit.actions.apply_filters', 'Aplicar filtros')}
            </button>
          </div>
        </div>
          </div>
        }
      >
        <div className="space-y-4 p-6">

        {/* Tabla de movimientos */}
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.credit.movements.table.date', 'Fecha')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.credit.movements.table.customer', 'Cliente')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.credit.movements.table.account', 'Cuenta')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.credit.movements.table.type', 'Tipo')}</th>
                <th className="px-3 py-2 text-right font-semibold">{t('admin.reports.credit.movements.table.amount_usd', 'Monto origen')}</th>
                {adminCurrencyCodes.map((code) => (
                  <th key={code} className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.credit.movements.table.amount_usd', 'Monto')} ${code}`}</th>
                ))}
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.credit.movements.table.invoice', 'Factura asociada')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.credit.movements.table.status', 'Estado')}</th>
              </tr>
            </thead>
            <tbody>
              {movements.data.map((mov) => {
                const typeLabel = translateMovementType(mov.type === 'charge' ? 'charge' : 'payment');
                const statusLabel = translateMovementStatus(mov.paid_at ? 'paid' : 'pending');
                return (
                  <tr key={mov.id} className="border-b border-border hover:bg-muted/40">
                    <td className="px-3 py-2 text-xs">{formatDateTime(mov.created_at)}</td>
                    <td className="px-3 py-2 text-xs">{mov.account?.customer?.name ?? t('admin.reports.credit.states.not_available', 'N/A')}</td>
                    <td className="px-3 py-2 text-xs">#{mov.credit_account_id}</td>
                    <td className="px-3 py-2 text-xs">{typeLabel}</td>
                    <td className="px-3 py-2 text-xs text-right">{`${mov.display_currency_code ?? 'USD'} ${formatMoney(mov.display_original_amount ?? 0)}`}</td>
                    {adminCurrencyCodes.map((code) => (
                      <td key={`${mov.id}-${code}`} className="px-3 py-2 text-xs text-right">{formatMoney(mov.admin_totals?.[code] ?? 0)}</td>
                    ))}
                    <td className="px-3 py-2 text-xs">
                      {mov.invoice ? (
                        <>
                          {mov.invoice.number} ({translateDocumentType(mov.invoice.document_type)})
                        </>
                      ) : t('admin.reports.credit.values.empty_dash', '—')}
                    </td>
                    <td className="px-3 py-2 text-xs">{statusLabel}</td>
                  </tr>
                );
              })}
              {movements.data.length === 0 && (
                <tr>
                  <td colSpan={6 + adminCurrencyCodes.length} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t('admin.reports.credit.movements.empty', 'No hay movimientos para los filtros seleccionados.')}
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
