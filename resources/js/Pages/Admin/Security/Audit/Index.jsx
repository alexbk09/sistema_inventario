import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

export default function AuditIndex({ logs, filters = {}, users = [] }) {
  const applyFilter = (name, value) => {
    const params = {
      ...filters,
      [name]: value || undefined,
      page: undefined,
    };
    router.get(route('admin.audit.index'), params, { replace: true, preserveState: true });
  };

  const onDateChange = (name) => (e) => applyFilter(name, e.target.value);

  return (
    <AuthenticatedLayout>
      <Head title="Auditoría" />
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Registro de auditoría</h1>
          <p className="text-sm text-muted-foreground">Acciones críticas sobre facturas, inventario y autenticación.</p>
        </div>

        <div className="bg-white rounded-lg border border-border p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
            <input
              type="text"
              className="border border-border rounded px-2 py-1 bg-background"
              placeholder="Módulo (ej: invoices, inventory, auth)"
              defaultValue={filters.module || ''}
              onBlur={(e) => applyFilter('module', e.target.value)}
            />
            <input
              type="text"
              className="border border-border rounded px-2 py-1 bg-background"
              placeholder="Acción (ej: invoice_created)"
              defaultValue={filters.action || ''}
              onBlur={(e) => applyFilter('action', e.target.value)}
            />
            <select
              className="border border-border rounded px-2 py-1 bg-background"
              value={filters.user_id || ''}
              onChange={(e) => applyFilter('user_id', e.target.value)}
            >
              <option value="">Todos los usuarios</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="border border-border rounded px-2 py-1 bg-background"
              value={filters.date_from || ''}
              onChange={onDateChange('date_from')}
            />
            <input
              type="date"
              className="border border-border rounded px-2 py-1 bg-background"
              value={filters.date_to || ''}
              onChange={onDateChange('date_to')}
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Fecha</th>
                <th className="px-3 py-2 text-left font-semibold">Usuario</th>
                <th className="px-3 py-2 text-left font-semibold">Módulo</th>
                <th className="px-3 py-2 text-left font-semibold">Acción</th>
                <th className="px-3 py-2 text-left font-semibold">Detalle</th>
                <th className="px-3 py-2 text-left font-semibold">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.data.map((log) => (
                <tr key={log.id} className="border-b border-border hover:bg-muted/40">
                  <td className="px-3 py-2 text-xs">{new Date(log.created_at).toLocaleString('es-ES')}</td>
                  <td className="px-3 py-2 text-xs">{log.user?.name || 'Sistema'}</td>
                  <td className="px-3 py-2 text-xs">{log.module}</td>
                  <td className="px-3 py-2 text-xs">{log.action}</td>
                  <td className="px-3 py-2 text-xs max-w-[260px] truncate" title={JSON.stringify(log.changes || {}, null, 2)}>
                    {log.changes ? JSON.stringify(log.changes) : '-'}
                  </td>
                  <td className="px-3 py-2 text-xs">{log.ip_address || '-'}</td>
                </tr>
              ))}
              {logs.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground text-sm">
                    No hay registros de auditoría para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
          <div>
            Página {logs.current_page ?? logs.meta?.current_page ?? 1} de {logs.last_page ?? logs.meta?.last_page ?? 1}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.get(route('admin.audit.index'), { ...filters, page: (logs.current_page ?? logs.meta?.current_page ?? 1) - 1 })}
              disabled={(logs.current_page ?? logs.meta?.current_page ?? 1) <= 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => router.get(route('admin.audit.index'), { ...filters, page: (logs.current_page ?? logs.meta?.current_page ?? 1) + 1 })}
              disabled={(logs.current_page ?? logs.meta?.current_page ?? 1) >= (logs.last_page ?? logs.meta?.last_page ?? 1)}
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
