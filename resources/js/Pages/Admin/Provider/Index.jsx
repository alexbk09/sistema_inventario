import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import AdminFilters from '@/Components/admin/provider/AdminTableFilterProviders.jsx';
import SupplierModal from '@/Components/admin/provider/SuplimerModal.jsx';
import ConfirmDialog from '@/Components/common/ConfirmDialog.jsx';
import toast from 'react-hot-toast';

export default function Index({ providers, filters }) {
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
    toast.loading('Eliminando proveedor...', { id: loadingId, position: 'top-center' });
    router.delete(route('admin.providers.destroy', confirmItem.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Proveedor eliminado correctamente', { id: loadingId, position: 'top-center' });
        setConfirmOpen(false);
        setConfirmItem(null);
      },
      onError: () => {
        toast.error('No se pudo eliminar el proveedor', { id: loadingId, position: 'top-center' });
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
      toast.loading('Actualizando proveedor...', { id: loadingId, position: 'top-center' });
      router.put(route('admin.providers.update', payload.id), data, {
        preserveScroll: true,
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingSupplier(null);
          toast.success('Proveedor actualizado correctamente', { id: loadingId, position: 'top-center' });
        },
        onError: () => {
          toast.error('No se pudo actualizar el proveedor', { id: loadingId, position: 'top-center' });
        },
        onFinish: () => {
          setTimeout(() => toast.dismiss(loadingId), 800);
        },
      });
    } else {
      const loadingId = 'create-supplier';
      toast.loading('Creando proveedor...', { id: loadingId, position: 'top-center' });
      router.post(route('admin.providers.store'), data, {
        preserveScroll: true,
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingSupplier(null);
          toast.success('Proveedor creado correctamente', { id: loadingId, position: 'top-center' });
        },
        onError: () => {
          toast.error('No se pudo crear el proveedor', { id: loadingId, position: 'top-center' });
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
      label: 'Empresa',
      width: '25%',
    },
    {
      key: 'contact_name',
      label: 'Encargado',
      width: '20%',
    },
    {
      key: 'email',
      label: 'Email',
      width: '25%',
      render: (value) => (
        <a href={`mailto:${value}`} className="text-accent hover:underline">
          {value}
        </a>
      ),
    },
    {
      key: 'phone',
      label: 'Teléfono',
      width: '20%',
      render: (value) => value || '-',
    },
    {
      key: 'address',
      label: 'Dirección',
      width: '10%',
      render: (value) => (
        <p className="truncate" title={value}>
          {value || '-'}
        </p>
      ),
    },
  ];

  return (
    <AuthenticatedLayout>
      <Head title="Proveedores" />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Proveedores</h1>
          <p className="text-muted-foreground">Gestiona los proveedores de la tienda</p>
        </div>
        {/* <Link href={route('admin.providers.create')} className="px-3 py-2 bg-indigo-600 text-white rounded">Nuevo</Link> */}

        <AdminFilters
          searchPlaceholder="Buscar por empresa, encargado o email..."
          searchValue={search}
          onSearchChange={setSearch}
          onAddNew={handleAddNew}
          addButtonLabel="Nuevo Proveedor"
        />

        <AdminTable
          columns={columns}
          data={data}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/*         {data.map((p) => (
          <div key={p.id} className="border rounded p-3">
            <div className="font-semibold">{p.name}</div>
            <div className="text-sm text-gray-600">{p.email} · {p.phone}</div>
            <div className="mt-2 flex gap-2">
              <Link href={route('admin.providers.edit', p.id)} className="px-2 py-1 border rounded">Editar</Link>
              <Link as="button" method="delete" href={route('admin.providers.destroy', p.id)} className="px-2 py-1 border rounded text-red-600">Eliminar</Link>
            </div>
          </div>
        ))} */}
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
        title="Confirmar eliminación"
        message={confirmItem ? `¿Eliminar al proveedor "${confirmItem.name}"?` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => { if (!confirmBusy) { setConfirmOpen(false); setConfirmItem(null); } }}
        busy={confirmBusy}
      />
    </AuthenticatedLayout>
  );
}
