import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import AdminFilters from '@/Components/common/AdminFilters.jsx';

const statusLabels = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  completed: 'Completada',
};

export default function Index({ rmas, filters }) {
  const { data } = rmas;
  const page = rmas.current_page ?? rmas?.meta?.current_page ?? 1;
  const totalPages = rmas.last_page ?? rmas?.meta?.last_page ?? 1;
  const [search, setSearch] = useState(filters?.search ?? '');
  const [status, setStatus] = useState(filters?.status ?? '');
  const [debounced, setDebounced] = useState(search);
  const isFirst = useRef(true);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    router.get(
      route('admin.rmas.index'),
      { search: debounced, status, page: 1 },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  }, [debounced, status]);

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(
      route('admin.rmas.index'),
      { page: nextPage, search: debounced, status },
      { preserveScroll: true, replace: true }
    );
  };

  const handleView = (item) => {
    router.get(route('admin.rmas.show', item.id));
  };

  const columns = [
    {
      key: 'number',
      label: 'Número',
      width: '20%',
    },
    {
      key: 'invoice',
      label: 'Factura',
      width: '20%',
      render: (_value, row) => row.invoice?.number ?? 'N/A',
    },
    {
      key: 'customer',
      label: 'Cliente',
      width: '25%',
      render: (_value, row) => row.customer?.name ?? 'N/A',
    },
    {
      key: 'status',
      label: 'Estado',
      width: '15%',
      render: (value) => statusLabels[value] ?? value,
    },
    {
      key: 'total_usd',
      label: 'Total USD',
      width: '20%',
      render: (v) => `$${Number(v).toFixed(2)}`,
    },
  ];

  return (
    <AuthenticatedLayout>
      <Head title="Devoluciones" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Devoluciones y Garantías</h1>
            <p className="text-muted-foreground">Gestiona RMA de productos defectuosos y notas de crédito.</p>
          </div>
          <button
            type="button"
            onClick={() => router.get(route('admin.rmas.create'))}
            className="px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition"
          >
            Nueva devolución
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-4 items-end">
          <AdminFilters
            searchPlaceholder="Buscar por número, factura o cliente..."
            searchValue={search}
            onSearchChange={setSearch}
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
            >
              <option value="">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobada</option>
              <option value="rejected">Rechazada</option>
              <option value="completed">Completada</option>
            </select>
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
