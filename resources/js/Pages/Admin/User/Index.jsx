import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import AdminFilters from '@/Components/common/AdminFilters.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';

export default function Index({ users, filters }) {
  const { t } = useI18n();
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
      label: t('admin.users.index.table.name', 'Nombre'),
      width: '30%',
    },
    {
      key: 'email',
      label: t('admin.users.index.table.email', 'Email'),
      width: '35%',
      render: (value) => (
        <a href={`mailto:${value}`} className="text-accent hover:underline">
          {value}
        </a>
      ),
    },
    {
      key: 'roles',
      label: t('admin.users.index.table.roles', 'Roles'),
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
      <Head title={t('admin.users.index.page_title', 'Usuarios')} />
      <AdminIndexShell
        title={t('admin.users.index.hero_title', 'Supervisa usuarios con un flujo más claro para consulta y control')}
        description={t('admin.users.index.hero_description', 'La pantalla concentra búsqueda, lectura rápida de roles y navegación hacia el detalle del usuario sin perder foco sobre el listado principal.')}
        stats={[
          { label: t('admin.users.index.stats.visible', 'Usuarios visibles'), value: data.length },
          { label: t('admin.users.index.stats.page', 'Página'), value: `${page}/${totalPages}` },
          { label: t('admin.users.index.stats.search', 'Búsqueda'), value: debounced ? t('admin.users.values.active_female', 'Activa') : t('admin.users.values.general', 'General') },
        ]}
        contextTitle={t('admin.users.index.context_title', 'Usuarios')}
        contextDescription={t('admin.users.index.context_description', 'Consulta usuarios del sistema, su correo principal y los roles asignados dentro del mismo patrón visual del backoffice.')}
        contextItems={[
          { label: t('admin.users.index.context_items.visible_results', 'Resultados visibles'), value: data.length },
          { label: t('admin.users.index.context_items.filter', 'Filtro'), value: debounced || t('admin.users.values.no_filter', 'Sin filtro') },
          { label: t('admin.users.index.context_items.action', 'Acción'), value: t('admin.users.values.direct_detail', 'Detalle directo') },
        ]}
        filters={
          <AdminFilters
            searchPlaceholder={t('admin.users.index.filters.search_placeholder', 'Buscar por nombre o email...')}
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
