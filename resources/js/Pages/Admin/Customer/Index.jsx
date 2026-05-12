import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import AdminFilters from '@/Components/common/AdminFilters.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';

export default function Index({ customers, filters, adminCurrencyContext = {}, identificationTypes = [] }) {
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
  const { data } = customers;
  const page = customers.current_page ?? customers?.meta?.current_page ?? 1;
  const totalPages = customers.last_page ?? customers?.meta?.last_page ?? 1;
  const [search, setSearch] = useState(filters?.search ?? '');
  const [debounced, setDebounced] = useState(search);
  const isFirst = useRef(true);
  const [showModal, setShowModal] = useState(false);

  const { data: form, setData, post, processing, reset } = useForm({
    identification_type_id: identificationTypes?.[0]?.id ?? '',
    identification: '',
    name: '',
    email: '',
    phone: '',
    address: '',
  });

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
      route('admin.customers.index'),
      { search: debounced, page: 1 },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  }, [debounced]);

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.customers.index'), { page: nextPage, search: debounced }, { preserveScroll: true, replace: true });
  };

  const handleView = (item) => {
    router.get(route('admin.customers.show', item.id));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    post(route('admin.customers.store'), {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        setShowModal(false);
      },
    });
  };

  const columns = [
    {
      key: 'name',
      label: t('admin.customers.index.table.name', 'Nombre'),
      width: '20%',
    },
    {
      key: 'email',
      label: t('admin.customers.index.table.email', 'Email'),
      width: '20%',
      render: (value) => (
        <a href={`mailto:${value}`} className="text-accent hover:underline">
          {value}
        </a>
      ),
    },
    {
      key: 'phone',
      label: t('admin.customers.index.table.phone', 'Teléfono'),
      width: '15%',
    },
    {
      key: 'address',
      label: t('admin.customers.index.table.address', 'Dirección'),
      width: '25%',
      render: (value) => (
        <p className="truncate" title={value}>
          {value || t('admin.customers.values.empty', '-')}
        </p>
      ),
    },
    {
      key: 'loyalty_points',
      label: t('admin.customers.index.table.points', 'Puntos'),
      width: '10%',
    },
    {
      key: 'invoices_count',
      label: t('admin.customers.index.table.purchases', 'Compras'),
      width: '10%',
    },
    ...currencyColumns.map((code) => ({
      key: `spent_${code}`,
      label: `${t('admin.customers.index.table.total_spent', 'Gastado')} ${code}`,
      width: '14%',
      render: (value, row) => row?.admin_total_spent?.[code] !== undefined
        ? formatServerAmount(code, row.admin_total_spent[code])
        : formatActiveAmount(row?.invoices_total_usd ?? 0, code),
    })),
  ];

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.customers.index.page_title', 'Clientes')} />
      <AdminIndexShell
        title={t('admin.customers.index.hero_title', 'Gestiona clientes con una vista más clara y operativa')}
        description={t('admin.customers.index.hero_description', 'La pantalla agrupa búsqueda, captura rápida y consulta en un solo flujo visual, reduciendo el salto entre acciones y listado.')}
        stats={[
          { label: t('admin.customers.index.stats.records', 'Registros'), value: data.length },
          { label: t('admin.customers.index.stats.page', 'Página'), value: `${page}/${totalPages}` },
          { label: t('admin.customers.index.stats.search', 'Búsqueda'), value: debounced ? t('admin.customers.values.active_female', 'Activa') : t('admin.customers.values.general', 'General') },
        ]}
        contextTitle={t('admin.customers.index.context_title', 'Clientes')}
        contextDescription={t('admin.customers.index.context_description', 'Consulta actividad comercial y registra nuevos clientes sin perder el foco de la tabla principal.')}
        contextItems={[
          { label: t('admin.customers.index.context_items.visible_results', 'Resultados visibles'), value: data.length },
          { label: t('admin.customers.index.context_items.filter', 'Filtro'), value: debounced || t('admin.customers.values.no_filter', 'Sin filtro') },
          { label: t('admin.customers.index.context_items.modal', 'Modal'), value: showModal ? t('admin.customers.values.open', 'Abierto') : t('admin.customers.values.available', 'Disponible') },
        ]}
        primaryAction={
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {t('admin.customers.index.actions.new', 'Nuevo cliente')}
          </button>
        }
        filters={
          <AdminFilters
            searchPlaceholder={t('admin.customers.index.filters.search_placeholder', 'Buscar por nombre, email, teléfono o dirección...')}
            searchValue={search}
            onSearchChange={setSearch}
          />
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

      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">{t('admin.customers.modal.create_title', 'Nuevo cliente')}</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t('admin.customers.modal.actions.close', 'Cerrar')}
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-5 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('admin.customers.modal.form.id_type', 'Tipo ID')}</label>
                    <select
                      value={form.identification_type_id}
                      onChange={(e) => setData('identification_type_id', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                      required
                    >
                      {identificationTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.code} - {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('admin.customers.modal.form.identification', 'Identificación')}</label>
                    <input
                      type="text"
                      value={form.identification}
                      onChange={(e) => setData('identification', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('admin.customers.modal.form.name', 'Nombre')}</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setData('name', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('admin.customers.modal.form.email', 'Email')}</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setData('email', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                      placeholder={t('admin.customers.values.optional', 'Opcional')}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('admin.customers.modal.form.phone', 'Teléfono')}</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setData('phone', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                      placeholder={t('admin.customers.values.optional', 'Opcional')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('admin.customers.modal.form.address', 'Dirección')}</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setData('address', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                      placeholder={t('admin.customers.values.optional', 'Opcional')}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border mt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t('admin.customers.modal.actions.cancel', 'Cancelar')}
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                  >
                    {processing ? t('admin.customers.modal.actions.saving', 'Guardando...') : t('admin.customers.modal.actions.submit', 'Guardar cliente')}
                  </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
