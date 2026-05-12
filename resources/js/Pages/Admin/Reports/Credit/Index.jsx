import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminPagination from '@/Components/admin/AdminPagination.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';

export default function CreditReportIndex({ accounts, filters = {}, metrics, customers = [], statuses = [], adminCurrencyContext }) {
  const { t } = useI18n();
  const { formatNumber } = useLocaleFormat();
  const adminCurrencyCodes = Array.isArray(adminCurrencyContext?.codes) ? adminCurrencyContext.codes : [];
  const formatMoney = (value) => new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
  const [localFilters, setLocalFilters] = useState({
    customer_id: filters.customer_id || '',
    status: filters.status || '',
    search: filters.search || '',
    overdue_only: !!filters.overdue_only,
  });

  const page = accounts.current_page ?? accounts?.meta?.current_page ?? 1;
  const totalPages = accounts.last_page ?? accounts?.meta?.last_page ?? 1;
  const activeFilters = Object.values(filters || {}).filter((value) => value !== null && value !== undefined && value !== '' && value !== false).length;
  const translateAccountStatus = (value) => t(`admin.reports.credit.statuses.${value}`, value);

  const submitFilters = () => {
    router.get(route('admin.reports.credits.index'), {
      ...localFilters,
      overdue_only: localFilters.overdue_only ? 1 : '',
      page: 1,
    }, { preserveScroll: true, replace: true });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.reports.credits.index'), {
      ...filters,
      page: nextPage,
    }, { preserveScroll: true, replace: true });
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.reports.credit.index.page_title', 'Reporte de créditos por cliente')} />
      <AdminIndexShell
        title={t('admin.reports.credit.index.hero_title', 'Consulta crédito por cliente con mejor foco en riesgo y saldo')}
        description={t('admin.reports.credit.index.hero_description', 'La vista combina navegación entre reportes de crédito, métricas, filtros y acciones de consulta en una interfaz más consistente con el backoffice.')}
        stats={[
          { label: t('admin.reports.credit.index.stats.accounts', 'Cuentas'), value: metrics.total_accounts },
          { label: t('admin.reports.credit.index.stats.page_accounts', 'Cuentas página'), value: metrics.page_accounts },
          ...adminCurrencyCodes.map((code) => ({ label: `${t('admin.reports.credit.index.stats.balance_usd', 'Saldo')} ${code}`, value: formatMoney(metrics.total_balance_admin_totals?.[code] ?? 0) })),
          { label: t('admin.reports.credit.index.stats.overdue', 'Atrasos'), value: metrics.overdue_accounts },
        ]}
        contextTitle={t('admin.reports.credit.index.context_title', 'Crédito por cliente')}
        contextDescription={t('admin.reports.credit.index.context_description', 'Úsalo para controlar límites, saldos y cuentas con atraso sin sacrificar la lectura rápida del listado principal.')}
        contextItems={[
          { label: t('admin.reports.credit.index.context_items.active_filters', 'Filtros activos'), value: activeFilters },
          { label: t('admin.reports.credit.index.context_items.page', 'Página'), value: `${page}/${totalPages}` },
          { label: t('admin.reports.credit.index.context_items.view', 'Vista'), value: t('admin.reports.credit.tabs.summary', 'Resumen por cliente') },
        ]}
        filters={
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              <button type="button" className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white">{t('admin.reports.credit.tabs.summary', 'Resumen por cliente')}</button>
              <button type="button" onClick={() => router.get(route('admin.reports.credits.movements'), {}, { replace: true })} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">{t('admin.reports.credit.tabs.movements', 'Movimientos y pagos')}</button>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.credit.index.filters.account_status', 'Estado de la cuenta')}</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.status}
                onChange={(e) => setLocalFilters((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">{t('admin.reports.credit.filters.all_male', 'Todos')}</option>
                {statuses.map((s) => (
                  <option key={s.value} value={s.value}>{translateAccountStatus(s.value)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.credit.index.filters.search', 'Buscar por nombre/email')}</label>
              <input
                type="text"
                className="w-full border border-border rounded px-2 py-1 bg-background"
                placeholder={t('admin.reports.credit.index.filters.search_placeholder', 'Nombre o correo del cliente')}
                value={localFilters.search}
                onChange={(e) => setLocalFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-xs text-foreground">
                <input
                  type="checkbox"
                  className="rounded border-border text-primary focus:ring-primary"
                  checked={localFilters.overdue_only}
                  onChange={(e) => setLocalFilters((f) => ({ ...f, overdue_only: e.target.checked }))}
                />
                <span>{t('admin.reports.credit.index.filters.overdue_only', 'Solo cuentas con cargos vencidos.')}</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
              onClick={() => {
                setLocalFilters({ customer_id: '', status: '', search: '', overdue_only: false });
                router.get(route('admin.reports.credits.index'), {}, { replace: true });
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

        {/* Tabla de cuentas de crédito */}
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.credit.index.table.customer', 'Cliente')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.credit.index.table.email', 'Email')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.credit.index.table.status', 'Estado')}</th>
                {adminCurrencyCodes.map((code) => (
                  <th key={`limit-${code}`} className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.credit.index.table.limit_usd', 'Límite')} ${code}`}</th>
                ))}
                {adminCurrencyCodes.map((code) => (
                  <th key={`balance-${code}`} className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.credit.index.table.balance_usd', 'Saldo')} ${code}`}</th>
                ))}
                {adminCurrencyCodes.map((code) => (
                  <th key={`available-${code}`} className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.credit.index.table.available_usd', 'Disponible')} ${code}`}</th>
                ))}
                <th className="px-3 py-2 text-right font-semibold">{t('admin.reports.credit.index.table.overdue_charges', 'Cargos vencidos')}</th>
                <th className="px-3 py-2 text-right font-semibold">{t('admin.reports.credit.index.table.actions', 'Acciones')}</th>
              </tr>
            </thead>
            <tbody>
              {accounts.data.map((acc) => {
                const overdueCount = Number(acc.overdue_charges_count ?? 0);

                return (
                  <tr key={acc.id} className="border-b border-border hover:bg-muted/40">
                    <td className="px-3 py-2 text-xs">{acc.customer?.name ?? t('admin.reports.credit.states.not_available', 'N/A')}</td>
                    <td className="px-3 py-2 text-xs">{acc.customer?.email ?? t('admin.reports.credit.values.empty_dash', '—')}</td>
                    <td className="px-3 py-2 text-xs capitalize">{translateAccountStatus(acc.status)}</td>
                    {adminCurrencyCodes.map((code) => (
                      <td key={`limit-${acc.id}-${code}`} className="px-3 py-2 text-xs text-right">{formatMoney(acc.credit_limit_admin_totals?.[code] ?? 0)}</td>
                    ))}
                    {adminCurrencyCodes.map((code) => (
                      <td key={`balance-${acc.id}-${code}`} className="px-3 py-2 text-xs text-right">{formatMoney(acc.balance_admin_totals?.[code] ?? 0)}</td>
                    ))}
                    {adminCurrencyCodes.map((code) => (
                      <td key={`available-${acc.id}-${code}`} className="px-3 py-2 text-xs text-right">{formatMoney(acc.available_admin_totals?.[code] ?? 0)}</td>
                    ))}
                    <td className="px-3 py-2 text-xs text-right">{formatNumber(overdueCount, { maximumFractionDigits: 0 })}</td>
                    <td className="px-3 py-2 text-xs text-right">
                      <Link
                        href={route('admin.credits.show', acc.id)}
                        className="inline-flex items-center px-2 py-1 rounded border border-border text-xs hover:bg-muted"
                      >
                        {t('admin.reports.credit.index.table.view_account', 'Ver cuenta')}
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {accounts.data.length === 0 && (
                <tr>
                  <td colSpan={6 + (adminCurrencyCodes.length * 3)} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t('admin.reports.credit.index.empty', 'No hay cuentas de crédito para los filtros seleccionados.')}
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
