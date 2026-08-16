import { Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminPagination from '@/Components/admin/AdminPagination.jsx';
import PageHeader from '@/Components/admin/PageHeader.jsx';
import StatsCard from '@/Components/admin/StatsCard.jsx';
import EmptyState from '@/Components/admin/EmptyState.jsx';
import { useMemo, useState } from 'react';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';
import { Package, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Filter, X, Save } from 'lucide-react';

export default function Inventory({ product, movements, summary, movementTypes, providers = [], warehouses = [], filters = {}, adminCurrencyContext = {} }) {
  const { t } = useI18n();
  const { formatDateTime, formatNumber, formatCurrency } = useLocaleFormat();
  const { displayCurrency, formatPriceFromUsd } = useConfiguredCurrencyRates();
  const formatActiveAmount = (value) => formatPriceFromUsd(Number(value || 0), displayCurrency);
  const formatServerAmount = (code, value) => formatCurrency(Number(value || 0), code);
  const formatMovementSource = (source) => {
    if (!source) {
      return t('admin.products.values.empty', '-');
    }

    const normalizedSource = String(source).toLowerCase();
    const fallbackLabel = normalizedSource
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

    return t(`admin.products.inventory.history.sources.${normalizedSource}`, fallbackLabel);
  };
  const [form, setForm] = useState({
    type: 'entry',
    quantity: 1,
    unit_price_usd: product.price_usd ?? 0,
    movement_type_id: movementTypes?.[0]?.id ?? '',
    provider_id: '',
    warehouse_id: warehouses?.[0]?.id ?? '',
    reference: '',
    notes: '',
  });

  const [providerSearch, setProviderSearch] = useState('');

  // filtros para el historial
  const [filterWarehouse, setFilterWarehouse] = useState(filters.warehouse_id ?? '');
  const [filterType, setFilterType] = useState(filters.type ?? '');
  const [filterDateFrom, setFilterDateFrom] = useState(filters.date_from ?? '');
  const [filterDateTo, setFilterDateTo] = useState(filters.date_to ?? '');

  const filteredProviders = useMemo(() => {
    const term = providerSearch.toLowerCase();
    if (!term) return providers;
    return providers.filter((p) => p.name.toLowerCase().includes(term));
  }, [providers, providerSearch]);

  const submit = (e) => {
    e.preventDefault();
    router.post(route('admin.products.inventory.store', product.id), form, {
      preserveScroll: true,
    });
  };

  const applyFilters = (page = 1) => {
    const params = {
      page,
      warehouse_id: filterWarehouse || undefined,
      type: filterType || undefined,
      date_from: filterDateFrom || undefined,
      date_to: filterDateTo || undefined,
    };
    router.get(route('admin.products.inventory.index', product.id), params, { replace: true, preserveState: true });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'quantity' || name === 'unit_price_usd' ? Number(value) : value }));
  };

  return (
    <AuthenticatedLayout>
      <Head title={`${t('admin.products.inventory.page_title_prefix', 'Inventario')} - ${product.name}`} />
      <div className="space-y-6">

        <PageHeader
          title={product.name}
          description={`${t('admin.products.inventory.cards.product.sku_label', 'SKU')}: ${product.sku} · ${t('admin.products.inventory.cards.product.current_stock', 'Stock actual')}: ${product.stock}`}
          icon={Package}
          breadcrumbs={[
            { label: 'Dashboard', href: route('dashboard') },
            { label: t('admin.products.inventory.page_title_prefix', 'Productos'), href: route('admin.products.index') },
            { label: t('admin.products.inventory.title', 'Inventario') },
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            label={t('admin.products.inventory.cards.product.current_stock', 'Stock actual')}
            value={product.stock}
            icon={Package}
            iconColor="text-blue-600"
            iconBg="bg-blue-50 dark:bg-blue-900/20"
            sparkColor="#3B82F6"
          />
          <StatsCard
            label={t('admin.products.inventory.cards.entries.title', 'Entradas acumuladas')}
            value={summary.entries_quantity ?? 0}
            subvalue={`${displayCurrency} ${summary.entries_total_value_admin_totals?.[displayCurrency] !== undefined ? formatServerAmount(displayCurrency, summary.entries_total_value_admin_totals[displayCurrency]) : formatActiveAmount(summary.entries_total_value_usd)}`}
            icon={TrendingUp}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50 dark:bg-emerald-900/20"
            sparkColor="#10B981"
          />
          <StatsCard
            label={t('admin.products.inventory.cards.exits.title', 'Salidas acumuladas')}
            value={summary.exits_quantity ?? 0}
            subvalue={`${displayCurrency} ${summary.exits_total_value_admin_totals?.[displayCurrency] !== undefined ? formatServerAmount(displayCurrency, summary.exits_total_value_admin_totals[displayCurrency]) : formatActiveAmount(summary.exits_total_value_usd)}`}
            icon={TrendingDown}
            iconColor="text-rose-600"
            iconBg="bg-rose-50 dark:bg-rose-900/20"
            sparkColor="#F43F5E"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <form onSubmit={submit} className="space-y-4 p-4 rounded-lg border border-border bg-background">
            <h2 className="font-semibold text-foreground mb-2">{t('admin.products.inventory.form.title', 'Registrar movimiento')}</h2>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t('admin.products.inventory.form.branch', 'Sucursal')}</label>
              <select
                name="warehouse_id"
                value={form.warehouse_id}
                onChange={handleChange}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t('admin.products.inventory.form.type', 'Tipo')}</label>
              <select name="type" value={form.type} onChange={handleChange} className="w-full border border-border rounded px-3 py-2 text-sm bg-background">
                <option value="entry">{t('admin.products.inventory.types.entry', 'Entrada')}</option>
                <option value="exit">{t('admin.products.inventory.types.exit', 'Salida')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t('admin.products.inventory.form.movement_type', 'Tipo de movimiento')}</label>
              <select name="movement_type_id" value={form.movement_type_id} onChange={handleChange} className="w-full border border-border rounded px-3 py-2 text-sm bg-background">
                {movementTypes.map((mt) => (
                  <option key={mt.id} value={mt.id}>{mt.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t('admin.products.inventory.form.provider_optional', 'Proveedor (opcional)')}</label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder={t('admin.products.inventory.form.search_provider', 'Buscar proveedor...')}
                  value={providerSearch}
                  onChange={(e) => setProviderSearch(e.target.value)}
                  className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
                />
                <select
                  name="provider_id"
                  value={form.provider_id}
                  onChange={handleChange}
                  className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
                >
                  <option value="">{t('admin.products.inventory.form.without_provider', 'Sin proveedor')}</option>
                  {filteredProviders.map((prov) => (
                    <option key={prov.id} value={prov.id}>{prov.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('admin.products.inventory.form.quantity', 'Cantidad')}</label>
                <input type="number" name="quantity" min="1" value={form.quantity} onChange={handleChange} className="w-full border border-border rounded px-3 py-2 text-sm bg-background" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{`${t('admin.products.inventory.form.unit_price_usd', 'Precio unitario')} (${displayCurrency})`}</label>
                <input type="number" name="unit_price_usd" min="0" step="0.01" value={form.unit_price_usd} onChange={handleChange} className="w-full border border-border rounded px-3 py-2 text-sm bg-background" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t('admin.products.inventory.form.reference_optional', 'Referencia (opcional)')}</label>
              <input type="text" name="reference" value={form.reference} onChange={handleChange} className="w-full border border-border rounded px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t('admin.products.inventory.form.reason', 'Motivo del movimiento')}</label>
              <textarea name="notes" rows="3" value={form.notes} onChange={handleChange} className="w-full border border-border rounded px-3 py-2 text-sm bg-background" />
            </div>
            <button type="submit" className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition">
              {t('admin.products.inventory.form.save', 'Guardar movimiento')}
            </button>
          </form>

          <div className="md:col-span-2">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  {t('admin.products.inventory.history.title', 'Historial de movimientos')}
                </h2>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => applyFilters(1)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    <Filter className="w-3 h-3" />{t('admin.products.inventory.history.apply_filters', 'Filtrar')}
                  </button>
                  <button type="button" onClick={() => { setFilterWarehouse(''); setFilterType(''); setFilterDateFrom(''); setFilterDateTo(''); applyFilters(1); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors">
                    <X className="w-3 h-3" />{t('admin.products.inventory.history.clear', 'Limpiar')}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 py-3 border-b border-border bg-muted/30">
                <select value={filterWarehouse} onChange={(e) => setFilterWarehouse(e.target.value)} className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background">
                  <option value="">{t('admin.products.inventory.history.all_branches', 'Todas las sucursales')}</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                </select>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background">
                  <option value="">{t('admin.products.inventory.history.all_types', 'Todos los tipos')}</option>
                  <option value="entry">{t('admin.products.inventory.types.entry', 'Entrada')}</option>
                  <option value="exit">{t('admin.products.inventory.types.exit', 'Salida')}</option>
                </select>
                <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background" />
                <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background" />
              </div>
              {movements.data.length === 0 ? (
                <EmptyState
                  preset="products"
                  title={t('admin.products.inventory.history.empty', 'Sin movimientos')}
                  description={t('admin.products.inventory.history.empty_desc', 'No hay movimientos registrados con los filtros actuales.')}
                  size="sm"
                />
              ) : (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b border-border sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('admin.products.inventory.history.table.date', 'Fecha')}</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('admin.products.inventory.history.table.type', 'Tipo')}</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('admin.products.inventory.history.table.source', 'Origen')}</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('admin.products.inventory.history.table.branch', 'Sucursal')}</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('admin.products.inventory.history.table.quantity', 'Cantidad')}</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">{`P. Unit ${displayCurrency}`}</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">{`Total ${displayCurrency}`}</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('admin.products.inventory.history.table.note', 'Nota')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.data.map((m) => {
                        const isEntry = m.type === 'entry';
                        return (
                          <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                            <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(m.created_at)}</td>
                            <td className="px-3 py-2.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                isEntry
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                              }`}>
                                {isEntry
                                  ? <ArrowUpCircle className="w-3 h-3" />
                                  : <ArrowDownCircle className="w-3 h-3" />}
                                {isEntry ? t('admin.products.inventory.types.entry', 'Entrada') : t('admin.products.inventory.types.exit', 'Salida')}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-xs">{formatMovementSource(m.source)}</td>
                            <td className="px-3 py-2.5 text-xs text-muted-foreground">{m.warehouse ? `${m.warehouse.name} (${m.warehouse.code})` : '—'}</td>
                            <td className="px-3 py-2.5 text-right font-semibold">{m.quantity}</td>
                            <td className="px-3 py-2.5 text-right text-xs">{m.unit_price_admin_totals?.[displayCurrency] !== undefined ? formatServerAmount(displayCurrency, m.unit_price_admin_totals[displayCurrency]) : formatActiveAmount(m.unit_price_usd)}</td>
                            <td className="px-3 py-2.5 text-right text-xs font-medium">{m.total_value_admin_totals?.[displayCurrency] !== undefined ? formatServerAmount(displayCurrency, m.total_value_admin_totals[displayCurrency]) : formatActiveAmount(m.total_value_usd)}</td>
                            <td className="px-3 py-2.5 text-xs text-muted-foreground truncate max-w-[160px]" title={m.notes}>{m.notes || m.reference || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="px-4 py-2 border-t border-border">
                <AdminPagination
                  page={movements.current_page ?? movements.meta?.current_page ?? 1}
                  totalPages={movements.last_page ?? movements.meta?.last_page ?? 1}
                  onPageChange={applyFilters}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
