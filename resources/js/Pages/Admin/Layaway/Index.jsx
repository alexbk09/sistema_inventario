import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';

export default function Index({ layaways, filters = {}, adminCurrencyContext = {} }) {
  const { t } = useI18n();
  const { formatCurrency } = useLocaleFormat();
  const { displayCurrency, comparisonCurrency, formatPriceFromUsd, hasRateForCurrency } = useConfiguredCurrencyRates();
  const secondaryCurrency = comparisonCurrency && comparisonCurrency !== displayCurrency && hasRateForCurrency(comparisonCurrency)
    ? comparisonCurrency
    : null;
  const visibleCurrencyCodes = Array.isArray(adminCurrencyContext?.codes) && adminCurrencyContext.codes.length > 0
    ? adminCurrencyContext.codes
    : [displayCurrency, ...(secondaryCurrency ? [secondaryCurrency] : [])].filter(Boolean);
  const currencyColumns = [...new Set(visibleCurrencyCodes)];
  const formatActiveAmount = (value, currency = displayCurrency) => formatPriceFromUsd(Number(value || 0), currency);
  const formatServerAmount = (code, value) => formatCurrency(Number(value || 0), code);
  const { data } = layaways;
  const page = layaways.current_page ?? layaways?.meta?.current_page ?? 1;
  const totalPages = layaways.last_page ?? layaways?.meta?.last_page ?? 1;

  const statusLabels = {
    active: t('admin.layaways.statuses.active', 'Activo'),
    completed: t('admin.layaways.statuses.completed', 'Completado'),
    cancelled: t('admin.layaways.statuses.cancelled', 'Cancelado'),
    expired: t('admin.layaways.statuses.expired', 'Vencido'),
  };
  const translateStatus = (value) => statusLabels[value] ?? t(`admin.layaways.statuses.${value}`, value ?? t('admin.common.table.values.empty_dash', '—'));

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.layaways.index'), { ...filters, page: nextPage }, { preserveScroll: true, replace: true });
  };

  const handleView = (item) => {
    router.get(route('admin.layaways.show', item.id));
  };

  const columns = [
    { key: 'number', label: t('admin.layaways.index.table.number', 'Número'), width: '18%' },
    { key: 'customer', label: t('admin.layaways.index.table.customer', 'Cliente'), width: '28%', render: (_v, row) => row.customer?.name ?? t('admin.layaways.values.not_available', 'N/A') },
    { key: 'status', label: t('admin.layaways.index.table.status', 'Estado'), width: '14%', render: (value) => translateStatus(value) },
    ...currencyColumns.map((code) => ({
      key: `total_${code}`,
      label: `${t('admin.layaways.index.table.total_usd', 'Total')} ${code}`,
      width: '14%',
      render: (_v, row) => row.document_totals?.[code] !== undefined
        ? formatServerAmount(code, row.document_totals[code])
        : formatActiveAmount(row.total_usd, code),
    })),
    ...currencyColumns.map((code) => ({
      key: `paid_${code}`,
      label: `${t('admin.layaways.index.table.paid_usd', 'Pagado')} ${code}`,
      width: '14%',
      render: (_v, row) => row.paid_admin_totals?.[code] !== undefined
        ? formatServerAmount(code, row.paid_admin_totals[code])
        : formatActiveAmount(row.paid_usd, code),
    })),
  ];

  const handleFilterChange = (status) => {
    router.get(route('admin.layaways.index'), { status }, { preserveScroll: true, replace: true });
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.layaways.index.page_title', 'Apartados')} />
      <AdminIndexShell
        title={t('admin.layaways.index.hero_title', 'Gestiona apartados con mejor visibilidad de estado y cobranza')}
        description={t('admin.layaways.index.hero_description', 'La pantalla reúne filtro de estado, acceso a nuevas reservas y consulta de saldos en un solo patrón operativo del panel administrativo.')}
        stats={[
          { label: t('admin.layaways.index.stats.visible', 'Apartados visibles'), value: data.length },
          { label: t('admin.layaways.index.stats.page', 'Página'), value: `${page}/${totalPages}` },
          { label: t('admin.layaways.index.stats.filtered_status', 'Estado filtrado'), value: filters.status ? translateStatus(filters.status) : t('admin.layaways.values.all', 'Todos') },
        ]}
        contextTitle={t('admin.layaways.index.context_title', 'Apartados')}
        contextDescription={t('admin.layaways.index.context_description', 'Consulta reservas activas, completadas o vencidas sin perder de vista la acción de registrar un nuevo apartado.')}
        contextItems={[
          { label: t('admin.layaways.index.context_items.visible_results', 'Resultados visibles'), value: data.length },
          { label: t('admin.layaways.index.context_items.filter', 'Filtro'), value: filters.status ? translateStatus(filters.status) : t('admin.layaways.values.general', 'General') },
          { label: t('admin.layaways.index.context_items.new_reservation', 'Nueva reserva'), value: t('admin.layaways.values.direct_access', 'Acceso directo') },
        ]}
        primaryAction={
          <button
            type="button"
            onClick={() => router.get(route('admin.layaways.create'))}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {t('admin.layaways.index.actions.new', 'Nuevo apartado')}
          </button>
        }
        filters={
          <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.layaways.index.filters.status_label', 'Estado')}</label>
              <select
                value={filters.status ?? ''}
                onChange={(e) => handleFilterChange(e.target.value || undefined)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900"
              >
                <option value="">{t('admin.layaways.index.filters.all_statuses', 'Todos los estados')}</option>
                <option value="active">{t('admin.layaways.statuses.active_plural', 'Activos')}</option>
                <option value="completed">{t('admin.layaways.statuses.completed_plural', 'Completados')}</option>
                <option value="cancelled">{t('admin.layaways.statuses.cancelled_plural', 'Cancelados')}</option>
                <option value="expired">{t('admin.layaways.statuses.expired_plural', 'Vencidos')}</option>
              </select>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
              {t('admin.layaways.index.filters.help', 'Usa el filtro para separar apartados activos, cerrados o vencidos y mantener la cobranza parcial bajo control.')}
            </div>
          </div>
        }
      >
        <AdminTable
          columns={columns}
          data={data}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onView={handleView}
        />
      </AdminIndexShell>
    </AuthenticatedLayout>
  );
}
