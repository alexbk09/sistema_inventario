import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import PageHeader from '@/Components/admin/PageHeader.jsx';
import StatsCard from '@/Components/admin/StatsCard.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';
import { Users, Star, TrendingUp, DollarSign, Plus, Search, X, Crown, Sparkles, AlertTriangle } from 'lucide-react';

const SCORE_TIER = {
  excellent: { label: 'Excelente', bar: 'bg-emerald-500', text: 'text-emerald-600' },
  good:      { label: 'Bueno',     bar: 'bg-blue-500',    text: 'text-blue-600' },
  average:   { label: 'Regular',   bar: 'bg-amber-500',   text: 'text-amber-600' },
  low:       { label: 'Bajo',      bar: 'bg-red-500',     text: 'text-red-600' },
};

const SEGMENT_CONFIG = {
  vip:     { label: 'VIP',       color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', icon: Crown },
  new:     { label: 'Nuevo',     color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Sparkles },
  at_risk: { label: 'En riesgo', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertTriangle },
}

export default function Index({ customers, filters, adminCurrencyContext = {}, identificationTypes = [], summary = {} }) {
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
  const [segment, setSegment] = useState(filters?.segment ?? '');
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
      { search: debounced, segment, page: 1 },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  }, [debounced, segment]);

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
      width: '24%',
      render: (value, row) => {
        const seg = row?.segment ? SEGMENT_CONFIG[row.segment] : null
        const SegIcon = seg?.icon
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{value?.charAt(0)?.toUpperCase() ?? '?'}</span>
            </div>
            <div className="min-w-0">
              <span className="font-medium text-foreground text-sm block truncate">{value}</span>
              {seg && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${seg.color}`}>
                  <SegIcon className="w-2.5 h-2.5" />
                  {seg.label}
                </span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'email',
      label: t('admin.customers.index.table.email', 'Email'),
      width: '20%',
      render: (value) => value ? (
        <a href={`mailto:${value}`} className="text-sm text-primary hover:underline">{value}</a>
      ) : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      key: 'phone',
      label: t('admin.customers.index.table.phone', 'Teléfono'),
      width: '12%',
      render: (v) => v || <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      key: 'loyalty_points',
      label: t('admin.customers.index.table.points', 'Puntos'),
      width: '10%',
      render: (v) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          {v ?? 0}
        </span>
      ),
    },
    {
      key: 'invoices_count',
      label: t('admin.customers.index.table.purchases', 'Compras'),
      width: '10%',
      render: (v) => (
        <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold">
          {v ?? 0}
        </span>
      ),
    },
    {
      key: 'score',
      label: t('admin.customers.index.table.score', 'Score'),
      width: '12%',
      render: (v, row) => {
        const score = Number(v ?? 0)
        const tier = SCORE_TIER[row?.score_tier] ?? SCORE_TIER.low
        return (
          <div className="flex items-center gap-2" title={`${tier.label} · ${score}/100`}>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[40px]">
              <div className={`h-full rounded-full ${tier.bar}`} style={{ width: `${score}%` }} />
            </div>
            <span className={`text-xs font-semibold ${tier.text}`}>{score}</span>
          </div>
        )
      },
    },
    ...currencyColumns.map((code) => ({
      key: `spent_${code}`,
      label: `${t('admin.customers.index.table.total_spent', 'Gastado')} ${code}`,
      width: '13%',
      render: (value, row) => (
        <span className="font-semibold text-sm text-foreground">
          {row?.admin_total_spent?.[code] !== undefined
            ? formatServerAmount(code, row.admin_total_spent[code])
            : formatActiveAmount(row?.invoices_total_usd ?? 0, code)}
        </span>
      ),
    })),
  ];

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.customers.index.page_title', 'Clientes')} />

      <PageHeader
        title={t('admin.customers.index.page_title', 'Clientes')}
        description={t('admin.customers.index.context_description', 'Administra cartera de clientes, actividad de compras y puntos de fidelidad.')}
        icon={Users}
        breadcrumbs={[
          { label: 'Dashboard', href: route('dashboard') },
          { label: t('admin.customers.index.page_title', 'Clientes') },
        ]}
        actions={
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('admin.customers.index.actions.new', 'Nuevo cliente')}
          </button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatsCard
          label={t('admin.customers.index.stats.records', 'Total clientes')}
          value={summary?.total ?? data.length}
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          sparkColor="#3B82F6"
        />
        <StatsCard
          label={t('admin.customers.index.stats.with_purchases', 'Con compras')}
          value={summary?.with_invoices ?? 0}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          sparkColor="#10B981"
        />
        <StatsCard
          label={t('admin.customers.index.stats.loyalty', 'Con puntos')}
          value={summary?.with_points ?? 0}
          icon={Star}
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          sparkColor="#F59E0B"
        />
        <StatsCard
          label={`${t('admin.customers.index.stats.revenue', 'Ventas totales')} ${displayCurrency}`}
          value={summary?.revenue_display ?? '—'}
          icon={DollarSign}
          iconColor="text-violet-600"
          iconBg="bg-violet-50 dark:bg-violet-900/20"
          sparkColor="#7C3AED"
        />
      </div>

      {/* Segment chips */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-medium text-muted-foreground mr-1">Segmento:</span>
        {[{ value: '', label: 'Todos' },
          { value: 'vip', label: `👑 VIP`, count: summary?.vip_count, color: segment === 'vip' ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 hover:bg-violet-100' },
          { value: 'new', label: `✨ Nuevos`, count: summary?.new_count, color: segment === 'new' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-100' },
          { value: 'at_risk', label: `⚠️ En riesgo`, count: summary?.at_risk_count, color: segment === 'at_risk' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-100' },
        ].map((chip) => (
          <button
            key={chip.value}
            onClick={() => setSegment(chip.value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
              chip.value === '' 
                ? (segment === '' ? 'bg-foreground text-background border-foreground' : 'bg-muted text-muted-foreground border-border hover:bg-muted/80')
                : `${chip.color} border-transparent`
            }`}
          >
            {chip.label}
            {chip.count !== undefined && (
              <span className="opacity-70 font-normal">({chip.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Table section */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Search toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.customers.index.filters.search_placeholder', 'Buscar por nombre, email o teléfono...')}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-ring focus:outline-none"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {data.length} {t('admin.customers.values.results', 'resultados')}
          </span>
        </div>

        <div className="p-4">
          <AdminTable
            columns={columns}
            data={data}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onView={handleView}
          />
        </div>
      </div>

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
