import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';

export default function Index({ transfers }) {
  const { data } = transfers;
  const page = transfers.current_page ?? transfers?.meta?.current_page ?? 1;
  const totalPages = transfers.last_page ?? transfers?.meta?.last_page ?? 1;

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.transfers.index'), { page: nextPage }, { preserveScroll: true, replace: true });
  };

  const handleView = (item) => {
    router.get(route('admin.transfers.show', item.id));
  };

  const columns = [
    { key: 'number', label: 'Número', width: '20%' },
    { key: 'fromWarehouse', label: 'Origen', width: '25%', render: (_v, row) => row.from_warehouse?.name ?? row.fromWarehouse?.name ?? 'N/A' },
    { key: 'toWarehouse', label: 'Destino', width: '25%', render: (_v, row) => row.to_warehouse?.name ?? row.toWarehouse?.name ?? 'N/A' },
    { key: 'status', label: 'Estado', width: '15%' },
  ];

  return (
    <AuthenticatedLayout>
      <Head title="Transferencias" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Transferencias de Stock</h1>
            <p className="text-muted-foreground">Registra movimientos de inventario entre sucursales.</p>
          </div>
          <button
            type="button"
            onClick={() => router.get(route('admin.transfers.create'))}
            className="px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition"
          >
            Nueva transferencia
          </button>
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
