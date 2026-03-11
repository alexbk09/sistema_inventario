import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import AdminFilters from '@/Components/common/AdminFilters.jsx';
import CategoryModal from '@/Components/admin/category/CategoryModal.jsx';
import ConfirmDialog from '@/Components/common/ConfirmDialog.jsx';
import toast from 'react-hot-toast';

export default function Index({ categories, filters }) {
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
    toast.loading('Eliminando categoría...', { id: loadingId, position: 'top-center' });
    router.delete(route('admin.categories.destroy', confirmItem.id), {
      preserveScroll: true,
      onSuccess: () => { toast.success('Categoría eliminada', { id: loadingId, position: 'top-center' }); setConfirmOpen(false); setConfirmItem(null); },
      onError: () => { toast.error('No se pudo eliminar', { id: loadingId, position: 'top-center' }); },
      onFinish: () => { setConfirmBusy(false); setTimeout(() => toast.dismiss(loadingId), 800); },
    });
  };

  const handleSave = (payload) => {
    const req = { name: payload.name, slug: payload.slug, description: payload.description };
    if (payload.id) {
      const loadingId = `update-category-${payload.id}`;
      toast.loading('Actualizando categoría...', { id: loadingId, position: 'top-center' });
      router.put(route('admin.categories.update', payload.id), req, {
        preserveScroll: true,
        onSuccess: () => { setIsModalOpen(false); setEditingCategory(null); toast.success('Categoría actualizada', { id: loadingId, position: 'top-center' }); },
        onError: () => { toast.error('No se pudo actualizar', { id: loadingId, position: 'top-center' }); },
        onFinish: () => { setTimeout(() => toast.dismiss(loadingId), 800); },
      });
    } else {
      const loadingId = 'create-category';
      toast.loading('Creando categoría...', { id: loadingId, position: 'top-center' });
      router.post(route('admin.categories.store'), req, {
        preserveScroll: true,
        onSuccess: () => { setIsModalOpen(false); setEditingCategory(null); toast.success('Categoría creada', { id: loadingId, position: 'top-center' }); },
        onError: () => { toast.error('No se pudo crear', { id: loadingId, position: 'top-center' }); },
        onFinish: () => { setTimeout(() => toast.dismiss(loadingId), 800); },
      });
    }
  };

  const columns = [
    { key: 'name', label: 'Nombre', width: '40%' },
    { key: 'slug', label: 'Slug', width: '30%' },
    { key: 'description', label: 'Descripción', width: '30%', render: (v) => (<p className="truncate" title={v}>{v || '-'}</p>) },
  ];

  return (
    <AuthenticatedLayout>
      <Head title="Categorías" />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Categorías</h1>
          <p className="text-muted-foreground">Gestiona las categorías</p>
        </div>

        <AdminFilters searchPlaceholder="Buscar por nombre o slug" searchValue={search} onSearchChange={setSearch} onAddNew={handleAddNew} addButtonLabel="Nueva Categoría" />

        <AdminTable columns={columns} data={data} page={page} totalPages={totalPages} onPageChange={handlePageChange} onEdit={handleEdit} onDelete={handleDelete} />

      </div>

      <CategoryModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCategory(null); }} onSave={handleSave} editingCategory={editingCategory} />

      <ConfirmDialog isOpen={confirmOpen} title="Confirmar eliminación" message={confirmItem ? `¿Eliminar la categoría "${confirmItem.name}"?` : ''} confirmText="Eliminar" cancelText="Cancelar" onConfirm={confirmDelete} onCancel={() => { if (!confirmBusy) { setConfirmOpen(false); setConfirmItem(null); } }} busy={confirmBusy} />
    </AuthenticatedLayout>
  );
}
