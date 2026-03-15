import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toISOString().slice(0, 10);
};

const isExpired = (layaway) => {
    if (!layaway.expires_at) return false;
    const now = new Date();
    const exp = new Date(layaway.expires_at);
    if (Number.isNaN(exp.getTime())) return false;
    return exp < now && ['active', 'pending'].includes(layaway.status);
};

export default function LayawayReportIndex({ layaways, filters = {}, metrics, customers = [], statuses = [] }) {
    const [localFilters, setLocalFilters] = useState({
        customer_id: filters.customer_id || '',
        status: filters.status || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        only_expired: !!filters.only_expired,
    });

    const page = layaways.current_page ?? layaways?.meta?.current_page ?? 1;
    const totalPages = layaways.last_page ?? layaways?.meta?.last_page ?? 1;

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
            <Head title="Reporte de apartados" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-1">Reporte de apartados activos y vencidos</h1>
                        <p className="text-muted-foreground text-sm">
                            Resumen de apartados por cliente, con detalle de estados, montos totales y saldo pendiente.
                        </p>
                    </div>
                </div>

                {/* Métricas rápidas */}
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="rounded-lg border border-border bg-white p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">Apartados (página)</div>
                        <div className="text-2xl font-semibold">{metrics.page_layaways}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">Activos</div>
                        <div className="text-2xl font-semibold">{metrics.status_counts?.active ?? 0}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">Pendientes</div>
                        <div className="text-2xl font-semibold">{metrics.status_counts?.pending ?? 0}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">Completados</div>
                        <div className="text-2xl font-semibold">{metrics.status_counts?.completed ?? 0}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">Cancelados</div>
                        <div className="text-2xl font-semibold">{metrics.status_counts?.cancelled ?? 0}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">Vencidos</div>
                        <div className="text-2xl font-semibold">{metrics.status_counts?.expired ?? 0}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">Total USD (página)</div>
                        <div className="text-2xl font-semibold">{Number(metrics.total_usd || 0).toFixed(2)}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">Pendiente USD (página)</div>
                        <div className="text-2xl font-semibold">{Number(metrics.pending_usd || 0).toFixed(2)}</div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="rounded-lg border border-border bg-white p-4 space-y-3 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Cliente</label>
                            <select
                                className="w-full border border-border rounded px-2 py-1 bg-background"
                                value={localFilters.customer_id}
                                onChange={(e) => setLocalFilters((f) => ({ ...f, customer_id: e.target.value }))}
                            >
                                <option value="">Todos</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.email ? `(${c.email})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Estado</label>
                            <select
                                className="w-full border border-border rounded px-2 py-1 bg-background"
                                value={localFilters.status}
                                onChange={(e) => setLocalFilters((f) => ({ ...f, status: e.target.value }))}
                            >
                                <option value="">Todos</option>
                                {statuses.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Desde</label>
                            <input
                                type="date"
                                className="w-full border border-border rounded px-2 py-1 bg-background"
                                value={localFilters.date_from}
                                onChange={(e) => setLocalFilters((f) => ({ ...f, date_from: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Hasta</label>
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
                                <span>Solo apartados vencidos</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
                            onClick={() => {
                                setLocalFilters({ customer_id: '', status: '', date_from: '', date_to: '', only_expired: false });
                                router.get(route('admin.reports.layaways.index'), {}, { replace: true });
                            }}
                        >
                            Limpiar filtros
                        </button>
                        <button
                            type="button"
                            className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={submitFilters}
                        >
                            Aplicar filtros
                        </button>
                    </div>
                </div>

                {/* Tabla de apartados */}
                <div className="overflow-x-auto rounded-lg border border-border bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-muted border-b border-border">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold"># Apartado</th>
                                <th className="px-3 py-2 text-left font-semibold">Cliente</th>
                                <th className="px-3 py-2 text-left font-semibold">Creado</th>
                                <th className="px-3 py-2 text-left font-semibold">Vence</th>
                                <th className="px-3 py-2 text-left font-semibold">Estado</th>
                                <th className="px-3 py-2 text-right font-semibold">Total USD</th>
                                <th className="px-3 py-2 text-right font-semibold">Pagado USD</th>
                                <th className="px-3 py-2 text-right font-semibold">Pendiente USD</th>
                                <th className="px-3 py-2 text-right font-semibold">Acciones</th>
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
                                                {expired ? 'Vencido' : l.status_label || l.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-xs text-right">{Number(l.total_usd || 0).toFixed(2)}</td>
                                        <td className="px-3 py-2 text-xs text-right">{Number(l.paid_usd || 0).toFixed(2)}</td>
                                        <td className="px-3 py-2 text-xs text-right font-semibold">{pendingUsd.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-xs text-right">
                                            <Link
                                                href={route('admin.layaways.show', l.id)}
                                                className="inline-flex items-center px-2 py-1 rounded border border-border text-xs hover:bg-muted"
                                            >
                                                Ver apartado
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {layaways.data.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-3 py-6 text-center text-sm text-muted-foreground">
                                        No se encontraron apartados para los filtros seleccionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                    <div>
                        Página {page} de {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page <= 1}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <button
                            type="button"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page >= totalPages}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
