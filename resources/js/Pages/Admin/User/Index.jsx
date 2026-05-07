import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import AdminFilters from '@/Components/common/AdminFilters.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';

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
      <AdminIndexShell
        title="Supervisa usuarios con un flujo más claro para consulta y control"
        description="La pantalla concentra búsqueda, lectura rápida de roles y navegación hacia el detalle del usuario sin perder foco sobre el listado principal."
        stats={[
          { label: 'Usuarios visibles', value: data.length },
          { label: 'Página', value: `${page}/${totalPages}` },
          { label: 'Búsqueda', value: debounced ? 'Activa' : 'General' },
        ]}
        contextTitle="Usuarios"
        contextDescription="Consulta usuarios del sistema, su correo principal y los roles asignados dentro del mismo patrón visual del backoffice."
        contextItems={[
          { label: 'Resultados visibles', value: data.length },
          { label: 'Filtro', value: debounced || 'Sin filtro' },
          { label: 'Acción', value: 'Detalle directo' },
        ]}
        filters={
          <AdminFilters
            searchPlaceholder="Buscar por nombre o email..."
            searchValue={search}
            onSearchChange={setSearch}
          />
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
