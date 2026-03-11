import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import AdminFilters from '@/Components/common/AdminFilters.jsx';

export default function Index({ customers, filters, identificationTypes = [] }) {
  const { data } = customers;
  const page = customers.current_page ?? customers?.meta?.current_page ?? 1;
  const totalPages = customers.last_page ?? customers?.meta?.last_page ?? 1;
  const [search, setSearch] = useState(filters?.search ?? '');
  const [debounced, setDebounced] = useState(search);
  const isFirst = useRef(true);
  const [showModal, setShowModal] = useState(false);

  const { data: form, setData, post, processing, reset } = useForm({
    identification_type_id: identificationTypes?.[0]?.id ?? '',
    identification: '',
    name: '',
    email: '',
    phone: '',
    address: '',
  });

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
      route('admin.customers.index'),
      { search: debounced, page: 1 },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  }, [debounced]);

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.customers.index'), { page: nextPage, search: debounced }, { preserveScroll: true, replace: true });
  };

  const handleView = (item) => {
    router.get(route('admin.customers.show', item.id));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    post(route('admin.customers.store'), {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        setShowModal(false);
      },
    });
  };

  const columns = [
    {
      key: 'name',
      label: 'Nombre',
      width: '20%',
    },
    {
      key: 'email',
      label: 'Email',
      width: '20%',
      render: (value) => (
        <a href={`mailto:${value}`} className="text-accent hover:underline">
          {value}
        </a>
      ),
    },
    {
      key: 'phone',
      label: 'Teléfono',
      width: '15%',
    },
    {
      key: 'address',
      label: 'Dirección',
      width: '25%',
      render: (value) => (
        <p className="truncate" title={value}>
          {value || '-'}
        </p>
      ),
    },
    {
      key: 'loyalty_points',
      label: 'Puntos',
      width: '10%',
    },
    {
      key: 'invoices_count',
      label: 'Compras',
      width: '10%',
    },
  ];

  return (
    <AuthenticatedLayout>
      <Head title="Clientes" />
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Clientes</h1>
            <p className="text-muted-foreground">Gestiona y consulta la información de tus clientes y su actividad de compras.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition"
          >
            Nuevo cliente
          </button>
        </div>

        <AdminFilters
          searchPlaceholder="Buscar por nombre, email, teléfono o dirección..."
          searchValue={search}
          onSearchChange={setSearch}
        />

        <AdminTable
          columns={columns}
          data={data}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onView={handleView}
        />

        {showModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-lg mx-4">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">Nuevo cliente</h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Cerrar
                </button>
              </div>
              <form onSubmit={handleCreate} className="px-5 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Tipo ID</label>
                    <select
                      value={form.identification_type_id}
                      onChange={(e) => setData('identification_type_id', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                      required
                    >
                      {identificationTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.code} - {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Identificación</label>
                    <input
                      type="text"
                      value={form.identification}
                      onChange={(e) => setData('identification', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Nombre</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setData('name', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setData('email', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                      placeholder="Opcional"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setData('phone', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Dirección</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setData('address', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                      placeholder="Opcional"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border mt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                  >
                    {processing ? 'Guardando...' : 'Guardar cliente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
