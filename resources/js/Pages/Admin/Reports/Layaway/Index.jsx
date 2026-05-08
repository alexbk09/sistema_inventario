import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminPagination from '@/Components/admin/AdminPagination.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';

const isExpired = (layaway) => {
    if (!layaway.expires_at) return false;
    const now = new Date();
    const exp = new Date(layaway.expires_at);
    if (Number.isNaN(exp.getTime())) return false;
    return exp < now && ['active', 'pending'].includes(layaway.status);
};

export default function LayawayReportIndex({ layaways, filters = {}, metrics, customers = [], statuses = [] }) {
    const { t } = useI18n();
    const { formatDate, formatNumber } = useLocaleFormat();
    const { displayCurrency, formatPriceFromUsd } = useConfiguredCurrencyRates();
    const formatActiveAmount = (value) => formatPriceFromUsd(Number(value || 0), displayCurrency);
    const [localFilters, setLocalFilters] = useState({
        customer_id: filters.customer_id || '',
        status: filters.status || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        only_expired: !!filters.only_expired,
    });

    const page = layaways.current_page ?? layaways?.meta?.current_page ?? 1;
    const totalPages = layaways.last_page ?? layaways?.meta?.last_page ?? 1;
    const activeFilters = Object.values(filters || {}).filter((value) => value !== null && value !== undefined && value !== '' && value !== false).length;
    const translateStatus = (value) => t(`admin.reports.layaway.statuses.${value}`, value);

    const submitFilters = () => {
        router.get(route('admin.reports.layaways.index'), {
            ...localFilters,
            only_expired: localFilters.only_expired ? 1 : '',
            page: 1,
        }, { preserveScroll: true, replace: true });
    };

    const handlePageChange = (nextPage) => {
        if (nextPage < 1 || nextPage > totalPages) return;
        router.get(route('admin.reports.layaways.index'), {
            ...filters,
            page: nextPage,
        }, { preserveScroll: true, replace: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title={t('admin.reports.layaway.page_title', 'Reporte de apartados')} />
            <AdminIndexShell
                title={t('admin.reports.layaway.hero_title', 'Controla apartados activos y vencidos con un reporte más claro')}
                description={t('admin.reports.layaway.hero_description', 'La vista agrupa métricas, filtros por cliente y fechas, y seguimiento de saldo pendiente dentro del mismo sistema visual del backoffice.')}
                stats={[
                    { label: t('admin.reports.layaway.stats.page_layaways', 'Apartados página'), value: metrics.page_layaways },
                    { label: t('admin.reports.layaway.stats.active', 'Activos'), value: metrics.status_counts?.active ?? 0 },
                    { label: `${t('admin.reports.layaway.stats.pending_usd', 'Pendiente')} ${displayCurrency}`, value: formatActiveAmount(metrics.pending_usd || 0) },
                    { label: t('admin.reports.layaway.stats.filters', 'Filtros'), value: activeFilters },
                ]}
                contextTitle={t('admin.reports.layaway.context_title', 'Reporte de apartados')}
                contextDescription={t('admin.reports.layaway.context_description', 'Úsalo para monitorear reservas activas, vencidas y saldo pendiente con mejor separación entre filtros y resultados.')}
                contextItems={[
                    { label: t('admin.reports.layaway.context_items.page', 'Página'), value: `${page}/${totalPages}` },
                    { label: t('admin.reports.layaway.context_items.view', 'Vista'), value: t('admin.reports.layaway.context_items.view_value', 'Activos y vencidos') },
                    { label: t('admin.reports.layaway.context_items.results', 'Resultados'), value: layaways.data.length },
                ]}
                filters={
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 space-y-3 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.layaway.filters.customer', 'Cliente')}</label>
                                <select
                                    className="w-full border border-border rounded px-2 py-1 bg-background"
                                    value={localFilters.customer_id}
                                    onChange={(e) => setLocalFilters((f) => ({ ...f, customer_id: e.target.value }))}
                                >
                                    <option value="">{t('admin.reports.layaway.filters.all_male', 'Todos')}</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} {c.email ? `(${c.email})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.layaway.filters.status', 'Estado')}</label>
                                <select
                                    className="w-full border border-border rounded px-2 py-1 bg-background"
                                    value={localFilters.status}
                                    onChange={(e) => setLocalFilters((f) => ({ ...f, status: e.target.value }))}
                                >
                                    <option value="">{t('admin.reports.layaway.filters.all_male', 'Todos')}</option>
                                    {statuses.map((s) => (
                                        <option key={s.value} value={s.value}>{translateStatus(s.value)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.layaway.filters.date_from', 'Desde')}</label>
                                <input
                                    type="date"
                                    className="w-full border border-border rounded px-2 py-1 bg-background"
                                    value={localFilters.date_from}
                                    onChange={(e) => setLocalFilters((f) => ({ ...f, date_from: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.layaway.filters.date_to', 'Hasta')}</label>
                                <input
                                    type="date"
                                    className="w-full border border-border rounded px-2 py-1 bg-background"
                                    value={localFilters.date_to}
                                    onChange={(e) => setLocalFilters((f) => ({ ...f, date_to: e.target.value }))}
                                />
                            </div>
                            <div className="flex items-end">
                                <label className="inline-flex items-center gap-2 text-xs text-foreground">
                                    <input
                                        type="checkbox"
                                        className="rounded border-border text-primary focus:ring-primary"
                                        checked={localFilters.only_expired}
                                        onChange={(e) => setLocalFilters((f) => ({ ...f, only_expired: e.target.checked }))}
                                    />
                                    <span>{t('admin.reports.layaway.filters.only_expired', 'Solo apartados vencidos')}</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                type="button"
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                onClick={() => {
                                    setLocalFilters({ customer_id: '', status: '', date_from: '', date_to: '', only_expired: false });
                                    router.get(route('admin.reports.layaways.index'), {}, { replace: true });
                                }}
                            >
                                {t('admin.reports.layaway.actions.clear_filters', 'Limpiar filtros')}
                            </button>
                            <button
                                type="button"
                                className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                onClick={submitFilters}
                            >
                                {t('admin.reports.layaway.actions.apply_filters', 'Aplicar filtros')}
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="space-y-4 p-6">

                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="rounded-lg border border-border bg-white p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">{t('admin.reports.layaway.cards.page_layaways', 'Apartados (página)')}</div>
                        <div className="text-2xl font-semibold">{metrics.page_layaways}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">{t('admin.reports.layaway.cards.active', 'Activos')}</div>
                        <div className="text-2xl font-semibold">{metrics.status_counts?.active ?? 0}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">{t('admin.reports.layaway.cards.pending', 'Pendientes')}</div>
                        <div className="text-2xl font-semibold">{metrics.status_counts?.pending ?? 0}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">{t('admin.reports.layaway.cards.completed', 'Completados')}</div>
                        <div className="text-2xl font-semibold">{metrics.status_counts?.completed ?? 0}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">{t('admin.reports.layaway.cards.cancelled', 'Cancelados')}</div>
                        <div className="text-2xl font-semibold">{metrics.status_counts?.cancelled ?? 0}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">{t('admin.reports.layaway.cards.expired', 'Vencidos')}</div>
                        <div className="text-2xl font-semibold">{metrics.status_counts?.expired ?? 0}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">{`${t('admin.reports.layaway.cards.total_usd', 'Total (página)')} ${displayCurrency}`}</div>
                        <div className="text-2xl font-semibold">{formatActiveAmount(metrics.total_usd || 0)}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">{`${t('admin.reports.layaway.cards.pending_usd', 'Pendiente (página)')} ${displayCurrency}`}</div>
                        <div className="text-2xl font-semibold">{formatActiveAmount(metrics.pending_usd || 0)}</div>
                    </div>
                </div>

                {/* Tabla de apartados */}
                <div className="overflow-x-auto rounded-lg border border-border bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-muted border-b border-border">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.layaway.table.number', '# Apartado')}</th>
                                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.layaway.table.customer', 'Cliente')}</th>
                                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.layaway.table.created_at', 'Creado')}</th>
                                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.layaway.table.expires_at', 'Vence')}</th>
                                <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.layaway.table.status', 'Estado')}</th>
                                <th className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.layaway.table.total_usd', 'Total')} ${displayCurrency}`}</th>
                                <th className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.layaway.table.paid_usd', 'Pagado')} ${displayCurrency}`}</th>
                                <th className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.layaway.table.pending_usd', 'Pendiente')} ${displayCurrency}`}</th>
                                <th className="px-3 py-2 text-right font-semibold">{t('admin.reports.layaway.table.actions', 'Acciones')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {layaways.data.map((l) => {
                                const pendingUsd = Math.max((l.total_usd || 0) - (l.paid_usd || 0), 0);
                                const expired = isExpired(l);

                                return (
                                    <tr
                                        key={l.id}
                                        className={`border-b border-border hover:bg-muted/40 ${expired ? 'bg-red-50' : ''}`}
                                    >
                                        <td className="px-3 py-2 text-xs">{l.number}</td>
                                        <td className="px-3 py-2 text-xs">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{l.customer?.name}</span>
                                                <span className="text-[11px] text-muted-foreground">{l.customer?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-xs">{formatDate(l.created_at)}</td>
                                        <td className="px-3 py-2 text-xs">{formatDate(l.expires_at)}</td>
                                        <td className="px-3 py-2 text-xs">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                                    expired
                                                        ? 'bg-red-100 text-red-800'
                                                        : l.status === 'completed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : l.status === 'cancelled'
                                                        ? 'bg-gray-100 text-gray-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}
                                            >
                                                {expired ? t('admin.reports.layaway.statuses.expired', 'Vencido') : translateStatus(l.status)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-xs text-right">{formatActiveAmount(l.total_usd || 0)}</td>
                                        <td className="px-3 py-2 text-xs text-right">{formatActiveAmount(l.paid_usd || 0)}</td>
                                        <td className="px-3 py-2 text-xs text-right font-semibold">{formatActiveAmount(pendingUsd)}</td>
                                        <td className="px-3 py-2 text-xs text-right">
                                            <Link
                                                href={route('admin.layaways.show', l.id)}
                                                className="inline-flex items-center px-2 py-1 rounded border border-border text-xs hover:bg-muted"
                                            >
                                                {t('admin.reports.layaway.table.view_layaway', 'Ver apartado')}
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {layaways.data.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-3 py-6 text-center text-sm text-muted-foreground">
                                        {t('admin.reports.layaway.empty', 'No se encontraron apartados para los filtros seleccionados.')}
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
