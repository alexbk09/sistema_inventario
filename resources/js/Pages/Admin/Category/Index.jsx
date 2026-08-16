import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import PageHeader from '@/Components/admin/PageHeader.jsx';
import StatsCard from '@/Components/admin/StatsCard.jsx';
import CategoryModal from '@/Components/admin/category/CategoryModal.jsx';
import ConfirmDialog from '@/Components/common/ConfirmDialog.jsx';
import toast from 'react-hot-toast';
import { useI18n } from '@/Hooks/useI18n';
import { Tag, Package, FileText, Plus, Search, X } from 'lucide-react';

export default function Index({ categories, filters, summary = {} }) {
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
    {
      key: 'name',
      label: t('admin.categories.index.table.name', 'Nombre'),
      width: '35%',
      render: (value) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center shrink-0">
            <Tag className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <span className="font-medium text-foreground text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: 'slug',
      label: t('admin.categories.index.table.slug', 'Slug'),
      width: '30%',
      render: (v) => (
        <code className="inline-flex items-center px-2 py-0.5 rounded bg-muted text-xs font-mono text-muted-foreground">
          {v}
        </code>
      ),
    },
    {
      key: 'description',
      label: t('admin.categories.index.table.description', 'Descripción'),
      width: '35%',
      render: (v) => (
        <p className="truncate text-sm text-muted-foreground" title={v}>
          {v || <span className="italic text-muted-foreground/50">{t('admin.categories.values.empty', 'Sin descripción')}</span>}
        </p>
      ),
    },
  ];

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.categories.index.page_title', 'Categorías')} />

      <PageHeader
        title={t('admin.categories.index.page_title', 'Categorías')}
        description={t('admin.categories.index.context_description', 'Gestiona el árbol de categorías del catálogo de productos.')}
        icon={Tag}
        breadcrumbs={[
          { label: 'Dashboard', href: route('dashboard') },
          { label: t('admin.categories.index.page_title', 'Categorías') },
        ]}
        actions={
          <button
            type="button"
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('admin.categories.index.actions.new', 'Nueva categoría')}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard
          label={t('admin.categories.index.stats.total', 'Total categorías')}
          value={summary?.total ?? categories?.total ?? data.length}
          icon={Tag}
          iconColor="text-violet-600"
          iconBg="bg-violet-50 dark:bg-violet-900/20"
          sparkColor="#7C3AED"
        />
        <StatsCard
          label={t('admin.categories.index.stats.with_products', 'Con productos')}
          value={summary?.with_products ?? 0}
          icon={Package}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          sparkColor="#3B82F6"
        />
        <StatsCard
          label={t('admin.categories.index.stats.with_description', 'Con descripción')}
          value={summary?.with_description ?? 0}
          icon={FileText}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          sparkColor="#10B981"
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.categories.index.filters.search_placeholder', 'Buscar por nombre o slug...')}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-ring focus:outline-none"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{data.length} {t('admin.categories.values.results', 'resultados')}</span>
        </div>
        <div className="p-4">
          <AdminTable
            columns={columns}
            data={data}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyPreset="products"
            emptyTitle={t('admin.categories.index.empty.title', 'Sin categorías')}
            emptyDescription={t('admin.categories.index.empty.description', 'Crea tu primera categoría para organizar el catálogo.')}
          />
        </div>
      </div>

      <CategoryModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCategory(null); }} onSave={handleSave} editingCategory={editingCategory} />

      <ConfirmDialog isOpen={confirmOpen} title={t('admin.categories.confirm.title', 'Confirmar eliminación')} message={confirmItem ? `${t('admin.categories.confirm.message_prefix', '¿Eliminar la categoría')} "${confirmItem.name}"?` : ''} confirmText={t('admin.categories.confirm.confirm', 'Eliminar')} cancelText={t('admin.categories.confirm.cancel', 'Cancelar')} onConfirm={confirmDelete} onCancel={() => { if (!confirmBusy) { setConfirmOpen(false); setConfirmItem(null); } }} busy={confirmBusy} />
    </AuthenticatedLayout>
  );
}
