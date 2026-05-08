import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import AdminFilters from '@/Components/admin/provider/AdminTableFilterProviders.jsx';
import SupplierModal from '@/Components/admin/provider/SuplimerModal.jsx';
import ConfirmDialog from '@/Components/common/ConfirmDialog.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import toast from 'react-hot-toast';
import { useI18n } from '@/Hooks/useI18n';

export default function Index({ providers, filters }) {
  const { t } = useI18n();
  const { data } = providers;
  const page = providers.current_page ?? providers?.meta?.current_page ?? 1;
  const totalPages = providers.last_page ?? providers?.meta?.last_page ?? 1;
  const [search, setSearch] = useState(filters?.search ?? '');
  const [debounced, setDebounced] = useState(search);
  const isFirst = useRef(true);

  // Debounce de búsqueda
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Disparar búsqueda cuando cambia el término (debounced)
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    router.get(
      route('admin.providers.index'),
      { search: debounced, page: 1 },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  }, [debounced]);

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.providers.index'), { page: nextPage, search: debounced }, { preserveScroll: true, replace: true });
  };

  const handleEdit = (item) => {
    setEditingSupplier(item);
    setIsModalOpen(true);
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const handleDelete = (item) => {
    setConfirmItem(item);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!confirmItem) return;
    setConfirmBusy(true);
    const loadingId = `loading-delete-${confirmItem.id}`;
    toast.loading(t('admin.providers.notifications.deleting', 'Eliminando proveedor...'), { id: loadingId, position: 'top-center' });
    router.delete(route('admin.providers.destroy', confirmItem.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(t('admin.providers.notifications.deleted', 'Proveedor eliminado correctamente'), { id: loadingId, position: 'top-center' });
        setConfirmOpen(false);
        setConfirmItem(null);
      },
      onError: () => {
        toast.error(t('admin.providers.notifications.delete_error', 'No se pudo eliminar el proveedor'), { id: loadingId, position: 'top-center' });
      },
      onFinish: () => {
        setConfirmBusy(false);
        setTimeout(() => toast.dismiss(loadingId), 800);
      },
    });
  };

  const handleAddNew = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const handleSave = (payload) => {
    const data = {
      name: payload.name,
      contact_name: payload.contact_name,
      phone: payload.phone,
      email: payload.email,
      address: payload.address,
    };
    if (payload.id) {
      const loadingId = `update-supplier-${payload.id}`;
      toast.loading(t('admin.providers.notifications.updating', 'Actualizando proveedor...'), { id: loadingId, position: 'top-center' });
      router.put(route('admin.providers.update', payload.id), data, {
        preserveScroll: true,
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingSupplier(null);
          toast.success(t('admin.providers.notifications.updated', 'Proveedor actualizado correctamente'), { id: loadingId, position: 'top-center' });
        },
        onError: () => {
          toast.error(t('admin.providers.notifications.update_error', 'No se pudo actualizar el proveedor'), { id: loadingId, position: 'top-center' });
        },
        onFinish: () => {
          setTimeout(() => toast.dismiss(loadingId), 800);
        },
      });
    } else {
      const loadingId = 'create-supplier';
      toast.loading(t('admin.providers.notifications.creating', 'Creando proveedor...'), { id: loadingId, position: 'top-center' });
      router.post(route('admin.providers.store'), data, {
        preserveScroll: true,
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingSupplier(null);
          toast.success(t('admin.providers.notifications.created', 'Proveedor creado correctamente'), { id: loadingId, position: 'top-center' });
        },
        onError: () => {
          toast.error(t('admin.providers.notifications.create_error', 'No se pudo crear el proveedor'), { id: loadingId, position: 'top-center' });
        },
        onFinish: () => {
          setTimeout(() => toast.dismiss(loadingId), 800);
        },
      });
    }
  };

  const columns = [
    {
      key: 'name',
      label: t('admin.providers.index.table.company', 'Empresa'),
      width: '25%',
    },
    {
      key: 'contact_name',
      label: t('admin.providers.index.table.contact', 'Encargado'),
      width: '20%',
    },
    {
      key: 'email',
      label: t('admin.providers.index.table.email', 'Email'),
      width: '25%',
      render: (value) => (
        <a href={`mailto:${value}`} className="text-accent hover:underline">
          {value}
        </a>
      ),
    },
    {
      key: 'phone',
      label: t('admin.providers.index.table.phone', 'Teléfono'),
      width: '20%',
      render: (value) => value || t('admin.providers.values.empty', '-'),
    },
    {
      key: 'address',
      label: t('admin.providers.index.table.address', 'Dirección'),
      width: '10%',
      render: (value) => (
        <p className="truncate" title={value}>
          {value || t('admin.providers.values.empty', '-')}
        </p>
      ),
    },
  ];

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.providers.index.page_title', 'Proveedores')} />
      <AdminIndexShell
        title={t('admin.providers.index.hero_title', 'Ordena proveedores con mejor contexto operativo y menos fricción')}
        description={t('admin.providers.index.hero_description', 'La vista reúne búsqueda, alta rápida, edición y limpieza del padrón de proveedores en un mismo flujo consistente con el resto del panel.')}
        stats={[
          { label: t('admin.providers.index.stats.visible', 'Proveedores visibles'), value: data.length },
          { label: t('admin.providers.index.stats.page', 'Página'), value: `${page}/${totalPages}` },
          { label: t('admin.providers.index.stats.search', 'Búsqueda'), value: debounced ? t('admin.providers.values.active_female', 'Activa') : t('admin.providers.values.general', 'General') },
        ]}
        contextTitle={t('admin.providers.index.context_title', 'Proveedores')}
        contextDescription={t('admin.providers.index.context_description', 'Gestiona contactos comerciales, datos de empresa y mantenimiento del catálogo de abastecimiento desde una sola pantalla.')}
        contextItems={[
          { label: t('admin.providers.index.context_items.visible_results', 'Resultados visibles'), value: data.length },
          { label: t('admin.providers.index.context_items.filter', 'Filtro'), value: debounced || t('admin.providers.values.no_filter', 'Sin filtro') },
          { label: t('admin.providers.index.context_items.modal', 'Modal'), value: isModalOpen ? t('admin.providers.values.open', 'Abierto') : t('admin.providers.values.available', 'Disponible') },
        ]}
        primaryAction={
          <button
            type="button"
            onClick={handleAddNew}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {t('admin.providers.index.actions.new', 'Nuevo proveedor')}
          </button>
        }
        filters={
          <AdminFilters
            searchPlaceholder={t('admin.providers.index.filters.search_placeholder', 'Buscar por empresa, encargado o email...')}
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
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </AdminIndexShell>
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSupplier(null);
        }}
        onSave={handleSave}
        editingSupplier={editingSupplier}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        title={t('admin.providers.confirm.title', 'Confirmar eliminación')}
        message={confirmItem ? `${t('admin.providers.confirm.message_prefix', '¿Eliminar al proveedor')} "${confirmItem.name}"?` : ''}
        confirmText={t('admin.providers.confirm.confirm', 'Eliminar')}
        cancelText={t('admin.providers.confirm.cancel', 'Cancelar')}
        onConfirm={confirmDelete}
        onCancel={() => { if (!confirmBusy) { setConfirmOpen(false); setConfirmItem(null); } }}
        busy={confirmBusy}
      />
    </AuthenticatedLayout>
  );
}
