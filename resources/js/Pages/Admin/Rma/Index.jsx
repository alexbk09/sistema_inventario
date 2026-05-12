import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import AdminFilters from '@/Components/common/AdminFilters.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';

export default function Index({ rmas, filters, adminCurrencyContext = {} }) {
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
  const { data } = rmas;
  const page = rmas.current_page ?? rmas?.meta?.current_page ?? 1;
  const totalPages = rmas.last_page ?? rmas?.meta?.last_page ?? 1;
  const [search, setSearch] = useState(filters?.search ?? '');
  const [status, setStatus] = useState(filters?.status ?? '');
  const [debounced, setDebounced] = useState(search);
  const isFirst = useRef(true);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    router.get(
      route('admin.rmas.index'),
      { search: debounced, status, page: 1 },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  }, [debounced, status]);

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(
      route('admin.rmas.index'),
      { page: nextPage, search: debounced, status },
      { preserveScroll: true, replace: true }
    );
  };

  const handleView = (item) => {
    router.get(route('admin.rmas.show', item.id));
  };

  const statusLabels = {
    pending: t('admin.rmas.statuses.pending', 'Pendiente'),
    approved: t('admin.rmas.statuses.approved', 'Aprobada'),
    rejected: t('admin.rmas.statuses.rejected', 'Rechazada'),
    completed: t('admin.rmas.statuses.completed', 'Completada'),
  };

  const columns = [
    {
      key: 'number',
      label: t('admin.rmas.index.table.number', 'Número'),
      width: '20%',
    },
    {
      key: 'invoice',
      label: t('admin.rmas.index.table.invoice', 'Factura'),
      width: '20%',
      render: (_value, row) => row.invoice?.number ?? t('admin.rmas.values.not_available', 'N/A'),
    },
    {
      key: 'customer',
      label: t('admin.rmas.index.table.customer', 'Cliente'),
      width: '25%',
      render: (_value, row) => row.customer?.name ?? t('admin.rmas.values.not_available', 'N/A'),
    },
    {
      key: 'status',
      label: t('admin.rmas.index.table.status', 'Estado'),
      width: '15%',
      render: (value) => statusLabels[value] ?? value,
    },
    ...currencyColumns.map((code) => ({
      key: `total_${code}`,
      label: `${t('admin.rmas.index.table.total_usd', 'Total')} ${code}`,
      width: '20%',
      render: (_v, row) => row.document_totals?.[code] !== undefined
        ? formatServerAmount(code, row.document_totals[code])
        : formatActiveAmount(row.total_usd, code),
    })),
  ];

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.rmas.index.page_title', 'Devoluciones')} />
      <AdminIndexShell
        title={t('admin.rmas.index.hero_title', 'Administra devoluciones y garantías con mejor lectura de caso')}
        description={t('admin.rmas.index.hero_description', 'La vista concentra búsqueda, filtro por estado y acceso a nuevos RMA en una sola estructura consistente con el resto del backoffice.')}
        stats={[
          { label: t('admin.rmas.index.stats.visible', 'RMA visibles'), value: data.length },
          { label: t('admin.rmas.index.stats.page', 'Página'), value: `${page}/${totalPages}` },
          { label: t('admin.rmas.index.stats.status', 'Estado'), value: statusLabels[status] ?? t('admin.rmas.values.all', 'Todos') },
        ]}
        contextTitle={t('admin.rmas.index.context_title', 'Devoluciones y garantías')}
        contextDescription={t('admin.rmas.index.context_description', 'Consulta casos por factura, cliente y estado sin perder la acción de registrar una nueva devolución.')}
        contextItems={[
          { label: t('admin.rmas.index.context_items.search', 'Filtro de búsqueda'), value: debounced || t('admin.rmas.values.general', 'General') },
          { label: t('admin.rmas.index.context_items.status', 'Filtro de estado'), value: statusLabels[status] ?? t('admin.rmas.values.all', 'Todos') },
          { label: t('admin.rmas.index.context_items.creation', 'Alta'), value: t('admin.rmas.index.actions.new', 'Nueva devolución') },
        ]}
        primaryAction={
          <button
            type="button"
            onClick={() => router.get(route('admin.rmas.create'))}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {t('admin.rmas.index.actions.new', 'Nueva devolución')}
          </button>
        }
        filters={
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
            <AdminFilters
              searchPlaceholder={t('admin.rmas.index.filters.search_placeholder', 'Buscar por número, factura o cliente...')}
              searchValue={search}
              onSearchChange={setSearch}
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.rmas.index.filters.status', 'Estado')}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900"
              >
                <option value="">{t('admin.rmas.values.all', 'Todos')}</option>
                <option value="pending">{statusLabels.pending}</option>
                <option value="approved">{statusLabels.approved}</option>
                <option value="rejected">{statusLabels.rejected}</option>
                <option value="completed">{statusLabels.completed}</option>
              </select>
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
