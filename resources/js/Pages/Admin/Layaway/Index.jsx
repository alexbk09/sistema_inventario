import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';

export default function Index({ layaways, filters = {} }) {
  const { data } = layaways;
  const page = layaways.current_page ?? layaways?.meta?.current_page ?? 1;
  const totalPages = layaways.last_page ?? layaways?.meta?.last_page ?? 1;

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.layaways.index'), { ...filters, page: nextPage }, { preserveScroll: true, replace: true });
  };

  const handleView = (item) => {
    router.get(route('admin.layaways.show', item.id));
  };

  const columns = [
    { key: 'number', label: 'Número', width: '18%' },
    { key: 'customer', label: 'Cliente', width: '28%', render: (_v, row) => row.customer?.name ?? 'N/A' },
    { key: 'status', label: 'Estado', width: '14%' },
    { key: 'total_usd', label: 'Total USD', width: '14%', render: (v) => `$${Number(v ?? 0).toFixed(2)}` },
    { key: 'paid_usd', label: 'Pagado USD', width: '14%', render: (v) => `$${Number(v ?? 0).toFixed(2)}` },
  ];

  const handleFilterChange = (status) => {
    router.get(route('admin.layaways.index'), { status }, { preserveScroll: true, replace: true });
  };

  return (
    <AuthenticatedLayout>
      <Head title="Apartados" />
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Apartados</h1>
            <p className="text-muted-foreground text-sm">Administra compras separadas con pagos parciales.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filters.status ?? ''}
              onChange={(e) => handleFilterChange(e.target.value || undefined)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="completed">Completados</option>
              <option value="cancelled">Cancelados</option>
              <option value="expired">Vencidos</option>
            </select>
            <button
              type="button"
              onClick={() => router.get(route('admin.layaways.create'))}
              className="px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition"
            >
              Nuevo apartado
            </button>
          </div>
        </div>

        <AdminTable
          columns={columns}
          data={data}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onView={handleView}
        />
      </div>
    </AuthenticatedLayout>
  );
}
