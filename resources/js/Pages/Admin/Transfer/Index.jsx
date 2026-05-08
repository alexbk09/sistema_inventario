import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';

export default function Index({ transfers }) {
  const { t } = useI18n();
  const { data } = transfers;
  const page = transfers.current_page ?? transfers?.meta?.current_page ?? 1;
  const totalPages = transfers.last_page ?? transfers?.meta?.last_page ?? 1;

  const statusLabels = {
    draft: t('admin.transfers.statuses.draft', 'Borrador'),
    completed: t('admin.transfers.statuses.completed', 'Completada'),
    cancelled: t('admin.transfers.statuses.cancelled', 'Cancelada'),
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.transfers.index'), { page: nextPage }, { preserveScroll: true, replace: true });
  };

  const handleView = (item) => {
    router.get(route('admin.transfers.show', item.id));
  };

  const columns = [
    { key: 'number', label: t('admin.transfers.index.table.number', 'Número'), width: '20%' },
    { key: 'fromWarehouse', label: t('admin.transfers.index.table.origin', 'Origen'), width: '25%', render: (_v, row) => row.from_warehouse?.name ?? row.fromWarehouse?.name ?? t('admin.transfers.values.not_available', 'N/A') },
    { key: 'toWarehouse', label: t('admin.transfers.index.table.destination', 'Destino'), width: '25%', render: (_v, row) => row.to_warehouse?.name ?? row.toWarehouse?.name ?? t('admin.transfers.values.not_available', 'N/A') },
    { key: 'status', label: t('admin.transfers.index.table.status', 'Estado'), width: '15%', render: (value) => statusLabels[value] ?? value },
  ];

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.transfers.index.page_title', 'Transferencias')} />
      <AdminIndexShell
        title={t('admin.transfers.index.hero_title', 'Supervisa transferencias con un tablero más claro para logística interna')}
        description={t('admin.transfers.index.hero_description', 'La pantalla prioriza el seguimiento entre origen y destino, manteniendo visible la acción de registrar nuevas transferencias.')}
        stats={[
          { label: t('admin.transfers.index.stats.visible', 'Transferencias visibles'), value: data.length },
          { label: t('admin.transfers.index.stats.page', 'Página'), value: `${page}/${totalPages}` },
          { label: t('admin.transfers.index.stats.status', 'Estado'), value: data.length ? t('admin.transfers.values.with_activity', 'Con actividad') : t('admin.transfers.values.no_records', 'Sin registros') },
        ]}
        contextTitle={t('admin.transfers.index.context_title', 'Transferencias')}
        contextDescription={t('admin.transfers.index.context_description', 'Consulta el historial entre sucursales y entra al detalle de cada movimiento sin salir del flujo principal.')}
        contextItems={[
          { label: t('admin.transfers.index.context_items.visible_results', 'Resultados visibles'), value: data.length },
          { label: t('admin.transfers.index.context_items.consultation', 'Consulta'), value: t('admin.transfers.index.context_values.direct_detail', 'Detalle directo') },
          { label: t('admin.transfers.index.context_items.creation', 'Alta'), value: t('admin.transfers.index.context_values.immediate_access', 'Acceso inmediato') },
        ]}
        primaryAction={
          <button
            type="button"
            onClick={() => router.get(route('admin.transfers.create'))}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {t('admin.transfers.index.actions.new', 'Nueva transferencia')}
          </button>
        }
        filters={
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.transfers.index.cards.origin.title', 'Origen')}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('admin.transfers.index.cards.origin.description', 'Revisa qué bodega despacha cada movimiento y abre su detalle con un clic.')}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.transfers.index.cards.destination.title', 'Destino')}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('admin.transfers.index.cards.destination.description', 'Mantén visible el punto de recepción para validar la ruta operativa entre sedes.')}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.transfers.index.cards.status.title', 'Estado')}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('admin.transfers.index.cards.status.description', 'Sigue el progreso del traslado sin entrar a una pantalla plana de solo tabla.')}</p>
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
