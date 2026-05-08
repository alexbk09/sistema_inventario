import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import AdminFilters from '@/Components/common/AdminFilters.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import CategoryModal from '@/Components/admin/category/CategoryModal.jsx';
import ConfirmDialog from '@/Components/common/ConfirmDialog.jsx';
import toast from 'react-hot-toast';
import { useI18n } from '@/Hooks/useI18n';

export default function Index({ categories, filters }) {
  const { t } = useI18n();
  const { data } = categories;
  const page = categories.current_page ?? categories?.meta?.current_page ?? 1;
  const totalPages = categories.last_page ?? categories?.meta?.last_page ?? 1;
  const [search, setSearch] = useState(filters?.search ?? '');
  const [debounced, setDebounced] = useState(search);
  const isFirst = useRef(true);

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { if (isFirst.current) { isFirst.current = false; return; } router.get(route('admin.categories.index'), { search: debounced, page: 1 }, { preserveScroll: true, preserveState: true, replace: true }); }, [debounced]);

  const handlePageChange = (nextPage) => { if (nextPage < 1 || nextPage > totalPages) return; router.get(route('admin.categories.index'), { page: nextPage, search: debounced }, { preserveScroll: true, replace: true }); };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const handleEdit = (item) => { setEditingCategory(item); setIsModalOpen(true); };
  const handleAddNew = () => { setEditingCategory(null); setIsModalOpen(true); };
  const handleDelete = (item) => { setConfirmItem(item); setConfirmOpen(true); };

  const confirmDelete = () => {
    if (!confirmItem) return;
    setConfirmBusy(true);
    const loadingId = `loading-delete-category-${confirmItem.id}`;
    toast.loading(t('admin.categories.notifications.deleting', 'Eliminando categoría...'), { id: loadingId, position: 'top-center' });
    router.delete(route('admin.categories.destroy', confirmItem.id), {
      preserveScroll: true,
      onSuccess: () => { toast.success(t('admin.categories.notifications.deleted', 'Categoría eliminada'), { id: loadingId, position: 'top-center' }); setConfirmOpen(false); setConfirmItem(null); },
      onError: () => { toast.error(t('admin.categories.notifications.delete_error', 'No se pudo eliminar'), { id: loadingId, position: 'top-center' }); },
      onFinish: () => { setConfirmBusy(false); setTimeout(() => toast.dismiss(loadingId), 800); },
    });
  };

  const handleSave = (payload) => {
    const req = { name: payload.name, slug: payload.slug, description: payload.description };
    if (payload.id) {
      const loadingId = `update-category-${payload.id}`;
      toast.loading(t('admin.categories.notifications.updating', 'Actualizando categoría...'), { id: loadingId, position: 'top-center' });
      router.put(route('admin.categories.update', payload.id), req, {
        preserveScroll: true,
        onSuccess: () => { setIsModalOpen(false); setEditingCategory(null); toast.success(t('admin.categories.notifications.updated', 'Categoría actualizada'), { id: loadingId, position: 'top-center' }); },
        onError: () => { toast.error(t('admin.categories.notifications.update_error', 'No se pudo actualizar'), { id: loadingId, position: 'top-center' }); },
        onFinish: () => { setTimeout(() => toast.dismiss(loadingId), 800); },
      });
    } else {
      const loadingId = 'create-category';
      toast.loading(t('admin.categories.notifications.creating', 'Creando categoría...'), { id: loadingId, position: 'top-center' });
      router.post(route('admin.categories.store'), req, {
        preserveScroll: true,
        onSuccess: () => { setIsModalOpen(false); setEditingCategory(null); toast.success(t('admin.categories.notifications.created', 'Categoría creada'), { id: loadingId, position: 'top-center' }); },
        onError: () => { toast.error(t('admin.categories.notifications.create_error', 'No se pudo crear'), { id: loadingId, position: 'top-center' }); },
        onFinish: () => { setTimeout(() => toast.dismiss(loadingId), 800); },
      });
    }
  };

  const columns = [
    { key: 'name', label: t('admin.categories.index.table.name', 'Nombre'), width: '40%' },
    { key: 'slug', label: t('admin.categories.index.table.slug', 'Slug'), width: '30%' },
    { key: 'description', label: t('admin.categories.index.table.description', 'Descripción'), width: '30%', render: (v) => (<p className="truncate" title={v}>{v || t('admin.categories.values.empty', '-')}</p>) },
  ];

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.categories.index.page_title', 'Categorías')} />
      <AdminIndexShell
        title={t('admin.categories.index.hero_title', 'Ordena categorías con un flujo visual más claro para catálogo')}
        description={t('admin.categories.index.hero_description', 'La vista concentra búsqueda, alta rápida y mantenimiento de categorías dentro del mismo sistema de listados del backoffice.')}
        stats={[
          { label: t('admin.categories.index.stats.visible', 'Categorías visibles'), value: data.length },
          { label: t('admin.categories.index.stats.page', 'Página'), value: `${page}/${totalPages}` },
          { label: t('admin.categories.index.stats.search', 'Búsqueda'), value: debounced ? t('admin.categories.values.active_female', 'Activa') : t('admin.categories.values.general', 'General') },
        ]}
        contextTitle={t('admin.categories.index.context_title', 'Categorías')}
        contextDescription={t('admin.categories.index.context_description', 'Mantén limpio el árbol comercial del catálogo sin separar la tabla principal de las acciones frecuentes.')}
        contextItems={[
          { label: t('admin.categories.index.context_items.visible_results', 'Resultados visibles'), value: data.length },
          { label: t('admin.categories.index.context_items.filter', 'Filtro'), value: debounced || t('admin.categories.values.no_filter', 'Sin filtro') },
          { label: t('admin.categories.index.context_items.modal', 'Modal'), value: isModalOpen ? t('admin.categories.values.open', 'Abierto') : t('admin.categories.values.available', 'Disponible') },
        ]}
        primaryAction={
          <button
            type="button"
            onClick={handleAddNew}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {t('admin.categories.index.actions.new', 'Nueva categoría')}
          </button>
        }
        filters={<AdminFilters searchPlaceholder={t('admin.categories.index.filters.search_placeholder', 'Buscar por nombre o slug')} searchValue={search} onSearchChange={setSearch} />}
      >
        <AdminTable columns={columns} data={data} page={page} totalPages={totalPages} onPageChange={handlePageChange} onEdit={handleEdit} onDelete={handleDelete} />
      </AdminIndexShell>

      <CategoryModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCategory(null); }} onSave={handleSave} editingCategory={editingCategory} />

      <ConfirmDialog isOpen={confirmOpen} title={t('admin.categories.confirm.title', 'Confirmar eliminación')} message={confirmItem ? `${t('admin.categories.confirm.message_prefix', '¿Eliminar la categoría')} "${confirmItem.name}"?` : ''} confirmText={t('admin.categories.confirm.confirm', 'Eliminar')} cancelText={t('admin.categories.confirm.cancel', 'Cancelar')} onConfirm={confirmDelete} onCancel={() => { if (!confirmBusy) { setConfirmOpen(false); setConfirmItem(null); } }} busy={confirmBusy} />
    </AuthenticatedLayout>
  );
}
