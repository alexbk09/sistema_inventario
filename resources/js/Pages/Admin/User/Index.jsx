import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import AdminFilters from '@/Components/common/AdminFilters.jsx';

export default function Index({ users, filters }) {
  const { data } = users;
  const page = users.current_page ?? users?.meta?.current_page ?? 1;
  const totalPages = users.last_page ?? users?.meta?.last_page ?? 1;
  const [search, setSearch] = useState(filters?.search ?? '');
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
      route('admin.users.index'),
      { search: debounced, page: 1 },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  }, [debounced]);

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.users.index'), { page: nextPage, search: debounced }, { preserveScroll: true, replace: true });
  };

  const handleView = (item) => {
    router.get(route('admin.users.show', item.id));
  };

  const columns = [
    {
      key: 'name',
      label: 'Nombre',
      width: '30%',
    },
    {
      key: 'email',
      label: 'Email',
      width: '35%',
      render: (value) => (
        <a href={`mailto:${value}`} className="text-accent hover:underline">
          {value}
        </a>
      ),
    },
    {
      key: 'roles',
      label: 'Roles',
      width: '35%',
      render: (_value, row) => (
        <div className="flex flex-wrap gap-1">
          {(row.roles || []).map((r) => (
            <span key={r.id} className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground border border-border">
              {r.name}
            </span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <AuthenticatedLayout>
      <Head title="Usuarios" />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Usuarios</h1>
          <p className="text-muted-foreground">Consulta la información básica de los usuarios del sistema.</p>
        </div>

        <AdminFilters
          searchPlaceholder="Buscar por nombre o email..."
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
      </div>
    </AuthenticatedLayout>
  );
}
