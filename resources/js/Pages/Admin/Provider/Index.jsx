import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import SupplierModal from '@/Components/admin/provider/SuplimerModal.jsx';
import ConfirmDialog from '@/Components/common/ConfirmDialog.jsx';
import PageHeader from '@/Components/admin/PageHeader.jsx';
import StatsCard from '@/Components/admin/StatsCard.jsx';
import toast from 'react-hot-toast';
import { useI18n } from '@/Hooks/useI18n';
import { Truck, Building2, Phone, Mail, Plus, Search, X } from 'lucide-react';

export default function Index({ providers, filters, summary = {} }) {
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
      render: (value) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-medium text-foreground text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: 'contact_name',
      label: t('admin.providers.index.table.contact', 'Encargado'),
      width: '20%',
      render: (v) => v || <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      key: 'email',
      label: t('admin.providers.index.table.email', 'Email'),
      width: '22%',
      render: (value) => value ? (
        <a href={`mailto:${value}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <Mail className="w-3 h-3" />{value}
        </a>
      ) : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      key: 'phone',
      label: t('admin.providers.index.table.phone', 'Teléfono'),
      width: '15%',
      render: (value) => value ? (
        <span className="inline-flex items-center gap-1 text-sm">
          <Phone className="w-3 h-3 text-muted-foreground" />{value}
        </span>
      ) : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      key: 'address',
      label: t('admin.providers.index.table.address', 'Dirección'),
      width: '18%',
      render: (value) => (
        <p className="truncate text-sm text-muted-foreground" title={value}>
          {value || '—'}
        </p>
      ),
    },
  ];

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.providers.index.page_title', 'Proveedores')} />

      <PageHeader
        title={t('admin.providers.index.page_title', 'Proveedores')}
        description={t('admin.providers.index.context_description', 'Gestiona contactos comerciales y catálogo de abastecimiento.')}
        icon={Truck}
        breadcrumbs={[
          { label: 'Dashboard', href: route('dashboard') },
          { label: t('admin.providers.index.page_title', 'Proveedores') },
        ]}
        actions={
          <button
            type="button"
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('admin.providers.index.actions.new', 'Nuevo proveedor')}
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard
          label={t('admin.providers.index.stats.total', 'Total proveedores')}
          value={summary?.total ?? providers?.total ?? data.length}
          icon={Truck}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          sparkColor="#3B82F6"
        />
        <StatsCard
          label={t('admin.providers.index.stats.with_email', 'Con email')}
          value={summary?.with_email ?? 0}
          icon={Mail}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          sparkColor="#10B981"
        />
        <StatsCard
          label={t('admin.providers.index.stats.with_phone', 'Con teléfono')}
          value={summary?.with_phone ?? 0}
          icon={Phone}
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          sparkColor="#F59E0B"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.providers.index.filters.search_placeholder', 'Buscar por empresa, encargado o email...')}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-ring focus:outline-none"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{data.length} {t('admin.providers.values.results', 'resultados')}</span>
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
          />
        </div>
      </div>
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
