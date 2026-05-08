import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminPagination from '@/Components/admin/AdminPagination.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';

export default function AuditIndex({ logs, filters = {}, users = [] }) {
  const { t } = useI18n();
  const { formatDateTime } = useLocaleFormat();

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
      <Head title={t('admin.security.audit.page_title', 'Auditoria')} />
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('admin.security.audit.title', 'Registro de auditoria')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.security.audit.description', 'Acciones criticas sobre facturas, inventario y autenticacion.')}</p>
        </div>

        <div className="bg-white rounded-lg border border-border p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
            <input
              type="text"
              className="border border-border rounded px-2 py-1 bg-background"
              placeholder={t('admin.security.audit.filters.module_placeholder', 'Modulo (ej: invoices, inventory, auth)')}
              defaultValue={filters.module || ''}
              onBlur={(e) => applyFilter('module', e.target.value)}
            />
            <input
              type="text"
              className="border border-border rounded px-2 py-1 bg-background"
              placeholder={t('admin.security.audit.filters.action_placeholder', 'Accion (ej: invoice_created)')}
              defaultValue={filters.action || ''}
              onBlur={(e) => applyFilter('action', e.target.value)}
            />
            <select
              className="border border-border rounded px-2 py-1 bg-background"
              value={filters.user_id || ''}
              onChange={(e) => applyFilter('user_id', e.target.value)}
            >
              <option value="">{t('admin.security.audit.filters.all_users', 'Todos los usuarios')}</option>
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
                <th className="px-3 py-2 text-left font-semibold">{t('admin.security.audit.table.date', 'Fecha')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.security.audit.table.user', 'Usuario')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.security.audit.table.module', 'Modulo')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.security.audit.table.action', 'Accion')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.security.audit.table.detail', 'Detalle')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.security.audit.table.ip', 'IP')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.data.map((log) => (
                <tr key={log.id} className="border-b border-border hover:bg-muted/40">
                  <td className="px-3 py-2 text-xs">{formatDateTime(log.created_at)}</td>
                  <td className="px-3 py-2 text-xs">{log.user?.name || t('admin.security.audit.values.system', 'Sistema')}</td>
                  <td className="px-3 py-2 text-xs">{log.module}</td>
                  <td className="px-3 py-2 text-xs">{log.action}</td>
                  <td className="px-3 py-2 text-xs max-w-[260px] truncate" title={JSON.stringify(log.changes || {}, null, 2)}>
                    {log.changes ? JSON.stringify(log.changes) : t('admin.security.audit.values.empty', '-')}
                  </td>
                  <td className="px-3 py-2 text-xs">{log.ip_address || t('admin.security.audit.values.empty', '-')}</td>
                </tr>
              ))}
              {logs.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground text-sm">
                    {t('admin.security.audit.empty', 'No hay registros de auditoria para los filtros seleccionados.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={logs.current_page ?? logs.meta?.current_page ?? 1}
          totalPages={logs.last_page ?? logs.meta?.last_page ?? 1}
          onPageChange={(nextPage) => router.get(route('admin.audit.index'), { ...filters, page: nextPage })}
          className="mt-3"
        />
      </div>
    </AuthenticatedLayout>
  );
}
