import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

export default function CreditReportIndex({ accounts, filters = {}, metrics, customers = [], statuses = [] }) {
  const [localFilters, setLocalFilters] = useState({
    customer_id: filters.customer_id || '',
    status: filters.status || '',
    search: filters.search || '',
    overdue_only: !!filters.overdue_only,
  });

  const page = accounts.current_page ?? accounts?.meta?.current_page ?? 1;
  const totalPages = accounts.last_page ?? accounts?.meta?.last_page ?? 1;

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
      <Head title="Reporte de créditos por cliente" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Reporte de créditos por cliente</h1>
            <p className="text-muted-foreground text-sm">
              Visualiza el saldo de crédito por cliente, su límite y cuentas con posibles atrasos.
            </p>
          </div>
        </div>

        {/* Navegación entre reportes de crédito */}
        <div className="flex gap-2 border-b border-border pb-2">
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground"
          >
            Resumen por cliente
          </button>
          <button
            type="button"
            onClick={() => router.get(route('admin.reports.credits.movements'), {}, { replace: true })}
            className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
          >
            Movimientos y pagos
          </button>
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Cuentas (total)</div>
            <div className="text-2xl font-semibold">{metrics.total_accounts}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Cuentas en página</div>
            <div className="text-2xl font-semibold">{metrics.page_accounts}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Saldo USD (página)</div>
            <div className="text-2xl font-semibold">{Number(metrics.total_balance_usd || 0).toFixed(2)}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Cuentas con atrasos (página)</div>
            <div className="text-2xl font-semibold">{metrics.overdue_accounts}</div>
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
              <label className="block text-xs font-medium text-muted-foreground mb-1">Estado de la cuenta</label>
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
              <label className="block text-xs font-medium text-muted-foreground mb-1">Buscar por nombre/email</label>
              <input
                type="text"
                className="w-full border border-border rounded px-2 py-1 bg-background"
                placeholder="Nombre o correo del cliente"
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
                <span>Solo cuentas con cargos vencidos.</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
              onClick={() => {
                setLocalFilters({ customer_id: '', status: '', search: '', overdue_only: false });
                router.get(route('admin.reports.credits.index'), {}, { replace: true });
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

        {/* Tabla de cuentas de crédito */}
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Cliente</th>
                <th className="px-3 py-2 text-left font-semibold">Email</th>
                <th className="px-3 py-2 text-left font-semibold">Estado</th>
                <th className="px-3 py-2 text-right font-semibold">Límite USD</th>
                <th className="px-3 py-2 text-right font-semibold">Saldo USD</th>
                <th className="px-3 py-2 text-right font-semibold">Disponible USD</th>
                <th className="px-3 py-2 text-right font-semibold">Cargos vencidos</th>
                <th className="px-3 py-2 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {accounts.data.map((acc) => {
                const limit = Number(acc.credit_limit_usd ?? 0);
                const balance = Number(acc.balance_usd ?? 0);
                const available = limit > 0 ? limit - balance : 0;
                const overdueCount = Number(acc.overdue_charges_count ?? 0);

                return (
                  <tr key={acc.id} className="border-b border-border hover:bg-muted/40">
                    <td className="px-3 py-2 text-xs">{acc.customer?.name ?? 'N/A'}</td>
                    <td className="px-3 py-2 text-xs">{acc.customer?.email ?? '—'}</td>
                    <td className="px-3 py-2 text-xs capitalize">{acc.status}</td>
                    <td className="px-3 py-2 text-xs text-right">{limit.toFixed(2)}</td>
                    <td className="px-3 py-2 text-xs text-right">{balance.toFixed(2)}</td>
                    <td className="px-3 py-2 text-xs text-right">{available.toFixed(2)}</td>
                    <td className="px-3 py-2 text-xs text-right">{overdueCount}</td>
                    <td className="px-3 py-2 text-xs text-right">
                      <Link
                        href={route('admin.credits.show', acc.id)}
                        className="inline-flex items-center px-2 py-1 rounded border border-border text-xs hover:bg-muted"
                      >
                        Ver cuenta
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {accounts.data.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No hay cuentas de crédito para los filtros seleccionados.
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
