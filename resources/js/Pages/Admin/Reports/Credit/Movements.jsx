import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

export default function CreditMovementsReport({ movements, filters = {}, metrics, customers = [], accounts = [], types = [], statuses = [] }) {
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
      <Head title="Historial de créditos y pagos" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Historial de movimientos de crédito y pagos</h1>
            <p className="text-muted-foreground text-sm">
              Listado detallado de cargos y pagos asociados a cuentas de crédito, filtrables por cliente, cuenta y fechas.
            </p>
          </div>
        </div>

        {/* Navegación entre reportes de crédito */}
        <div className="flex gap-2 border-b border-border pb-2">
          <button
            type="button"
            onClick={() => router.get(route('admin.reports.credits.index'), {}, { replace: true })}
            className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
          >
            Resumen por cliente
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground"
          >
            Movimientos y pagos
          </button>
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Movimientos (total)</div>
            <div className="text-2xl font-semibold">{metrics.total_movements}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Movimientos (página)</div>
            <div className="text-2xl font-semibold">{metrics.page_movements}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Cargos USD (página)</div>
            <div className="text-2xl font-semibold">{Number(metrics.total_charges_usd || 0).toFixed(2)}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Pagos USD (página)</div>
            <div className="text-2xl font-semibold">{Number(metrics.total_payments_usd || 0).toFixed(2)}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="rounded-lg border border-border bg-white p-4 space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              <label className="block text-xs font-medium text-muted-foreground mb-1">Cuenta de crédito</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.account_id}
                onChange={(e) => setLocalFilters((f) => ({ ...f, account_id: e.target.value }))}
              >
                <option value="">Todas</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    #{a.id} - {a.customer?.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo de movimiento</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.type}
                onChange={(e) => setLocalFilters((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="">Todos</option>
                {types.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
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

        {/* Tabla de movimientos */}
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Fecha</th>
                <th className="px-3 py-2 text-left font-semibold">Cliente</th>
                <th className="px-3 py-2 text-left font-semibold">Cuenta</th>
                <th className="px-3 py-2 text-left font-semibold">Tipo</th>
                <th className="px-3 py-2 text-right font-semibold">Monto USD</th>
                <th className="px-3 py-2 text-left font-semibold">Factura asociada</th>
                <th className="px-3 py-2 text-left font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {movements.data.map((mov) => {
                const amount = Number(mov.amount_usd ?? 0);
                const typeLabel = mov.type === 'charge' ? 'Cargo' : 'Pago';
                const statusLabel = mov.paid_at ? 'Pagado' : 'Pendiente';
                return (
                  <tr key={mov.id} className="border-b border-border hover:bg-muted/40">
                    <td className="px-3 py-2 text-xs">{new Date(mov.created_at).toLocaleString('es-ES')}</td>
                    <td className="px-3 py-2 text-xs">{mov.account?.customer?.name ?? 'N/A'}</td>
                    <td className="px-3 py-2 text-xs">#{mov.credit_account_id}</td>
                    <td className="px-3 py-2 text-xs">{typeLabel}</td>
                    <td className="px-3 py-2 text-xs text-right">{amount.toFixed(2)}</td>
                    <td className="px-3 py-2 text-xs">
                      {mov.invoice ? (
                        <>
                          {mov.invoice.number} ({mov.invoice.document_type})
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs">{statusLabel}</td>
                  </tr>
                );
              })}
              {movements.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No hay movimientos para los filtros seleccionados.
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
