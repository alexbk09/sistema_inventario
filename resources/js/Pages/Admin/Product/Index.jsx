import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import AdminFilters from '@/Components/common/AdminFilters.jsx';
import ProductModal from '@/Components/admin/product/ProductModal.jsx';
import BulkImportModal from '@/Components/admin/product/BulkImportModal.jsx';
import ConfirmDialog from '@/Components/common/ConfirmDialog.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import toast from 'react-hot-toast';

export default function Index({ products, filters, summary, warehouses = [] }) {
  const { data } = products;
  const page = products.current_page ?? products?.meta?.current_page ?? 1;
  const totalPages = products.last_page ?? products?.meta?.last_page ?? 1;
  const [search, setSearch] = useState(filters?.search ?? '');
  const [debounced, setDebounced] = useState(search);
  const isFirst = useRef(true);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    router.get(route('admin.products.index'), { search: debounced, page: 1 }, { preserveScroll: true, preserveState: true, replace: true });
  }, [debounced]);

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.products.index'), { page: nextPage, search: debounced }, { preserveScroll: true, replace: true });
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const handleEdit = (item) => { setEditingProduct(item); setIsModalOpen(true); };
  const handleAddNew = () => { setEditingProduct(null); setIsModalOpen(true); };
  const handleDelete = (item) => { setConfirmItem(item); setConfirmOpen(true); };

  const confirmDelete = () => {
    if (!confirmItem) return;
    setConfirmBusy(true);
    const loadingId = `loading-delete-product-${confirmItem.id}`;
    toast.loading('Eliminando producto...', { id: loadingId, position: 'top-center' });
    router.delete(route('admin.products.destroy', confirmItem.id), {
      preserveScroll: true,
      onSuccess: () => { toast.success('Producto eliminado', { id: loadingId, position: 'top-center' }); setConfirmOpen(false); setConfirmItem(null); },
      onError: () => { toast.error('No se pudo eliminar', { id: loadingId, position: 'top-center' }); },
      onFinish: () => { setConfirmBusy(false); setTimeout(() => toast.dismiss(loadingId), 800); },
    });
  };

  const handleSave = (payload) => {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('sku', payload.sku);
    if (payload.barcode) {
      formData.append('barcode', payload.barcode);
    }
    formData.append('price_usd', Number(payload.price_usd));
    formData.append('stock', Number(payload.stock));
    if (payload.min_stock !== undefined && payload.min_stock !== null && payload.min_stock !== '') {
      formData.append('min_stock', Number(payload.min_stock));
    }
    if (payload.description) {
      formData.append('description', payload.description);
    }
    formData.append('is_featured', payload.is_featured ? '1' : '0');

    if (Array.isArray(payload.images)) {
      payload.images.forEach((file, index) => {
        formData.append('images[' + index + ']', file);
      });
    }
    if (payload.id) {
      formData.append('_method', 'put');
      const loadingId = `update-product-${payload.id}`;
      toast.loading('Actualizando producto...', { id: loadingId, position: 'top-center' });
      router.post(route('admin.products.update', payload.id), formData, {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: () => { setIsModalOpen(false); setEditingProduct(null); toast.success('Producto actualizado', { id: loadingId, position: 'top-center' }); },
        onError: () => { toast.error('No se pudo actualizar', { id: loadingId, position: 'top-center' }); },
        onFinish: () => { setTimeout(() => toast.dismiss(loadingId), 800); },
      });
    } else {
      const loadingId = 'create-product';
      toast.loading('Creando producto...', { id: loadingId, position: 'top-center' });
      router.post(route('admin.products.store'), formData, {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: () => { setIsModalOpen(false); setEditingProduct(null); toast.success('Producto creado', { id: loadingId, position: 'top-center' }); },
        onError: () => { toast.error('No se pudo crear', { id: loadingId, position: 'top-center' }); },
        onFinish: () => { setTimeout(() => toast.dismiss(loadingId), 800); },
      });
    }
  };

  const handleInventory = (item) => {
    router.get(route('admin.products.inventory.index', item.id));
  };

  const columns = [
    { key: 'name', label: 'Nombre', width: '25%' },
    { key: 'sku', label: 'SKU', width: '15%' },
    { key: 'price_usd', label: 'USD', width: '15%', render: (v) => Number(v).toFixed(2) },
    { key: 'stock', label: 'Stock', width: '15%', render: (v, row) => {
      const value = Number(v) || 0;
      const effectiveMin = Number(row.effective_min_stock ?? 0);
      let colorClass = 'text-red-600 font-semibold';

      if (effectiveMin > 0 && value < effectiveMin) {
        colorClass = 'text-red-600 font-semibold';
      } else if (value > 30) {
        colorClass = 'text-emerald-600 font-semibold';
      } else if (value > 5) {
        colorClass = 'text-amber-500 font-semibold';
      }

      const isLowByConfig = effectiveMin > 0 && value < effectiveMin;
      const isLowByDefault = effectiveMin === 0 && value > 0 && value <= 5;

      return (
        <span className={colorClass}>
          {value}
          {(isLowByConfig || isLowByDefault) && (
            <span className="ml-1 text-xs font-normal text-red-500">(bajo)</span>
          )}
        </span>
      );
    } },
    { key: 'is_featured', label: 'Destacado', width: '10%', render: (v) => (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${v ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
        {v ? 'Sí' : 'No'}
      </span>
    ) },
    { key: 'description', label: 'Descripción', width: '25%', render: (v) => (<p className="truncate" title={v}>{v || '-'}</p>) },
    { key: 'inventory', label: 'Inventario', width: '15%', render: (v, row) => (
      <button
        onClick={() => handleInventory(row)}
        className="px-3 py-1 text-xs rounded bg-muted hover:bg-muted/70 text-foreground border border-border"
      >
        Ver movimientos
      </button>
    ) },
  ];

  return (
    <AuthenticatedLayout>
      <Head title="Productos" />
      <AdminIndexShell
        title="Gestiona el catálogo con una vista más limpia y consistente"
        description="La pantalla prioriza métricas, acciones y filtros sin romper el foco sobre la tabla principal ni sobre las tareas de inventario del día a día."
        stats={[
          { label: 'Productos', value: Number(summary?.total_products || data.length || 0) },
          { label: 'Inventario USD', value: `$${Number(summary?.total_products_value_usd || 0).toFixed(2)}` },
          { label: 'Salidas 30d', value: Number(summary?.last_30_days_exits || 0) },
        ]}
        contextTitle="Productos"
        contextDescription="Combina consulta, alta rápida, importación y acceso a movimientos de inventario bajo el mismo sistema visual del backoffice."
        contextItems={[
          { label: 'Resultados visibles', value: data.length },
          { label: 'Filtro', value: debounced || 'Sin filtro' },
          { label: 'Entradas acumuladas', value: Number(summary?.total_entries || 0) },
        ]}
        primaryAction={
          <button onClick={handleAddNew} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Nuevo producto</button>
        }
        secondaryActions={
          <button onClick={() => setIsBulkOpen(true)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Importar Excel</button>
        }
        filters={
          <AdminFilters searchPlaceholder="Buscar por nombre, SKU o descripción" searchValue={search} onSearchChange={setSearch} />
        }
      >
        <AdminTable columns={columns} data={data} page={page} totalPages={totalPages} onPageChange={handlePageChange} onEdit={handleEdit} onDelete={handleDelete} />
      </AdminIndexShell>

      <ProductModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingProduct(null); }} onSave={handleSave} editingProduct={editingProduct} />
      <BulkImportModal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} warehouses={warehouses ?? (window.page?.props?.warehouses ?? [])} />

      <ConfirmDialog isOpen={confirmOpen} title="Confirmar eliminación" message={confirmItem ? `¿Eliminar el producto "${confirmItem.name}"?` : ''} confirmText="Eliminar" cancelText="Cancelar" onConfirm={confirmDelete} onCancel={() => { if (!confirmBusy) { setConfirmOpen(false); setConfirmItem(null); } }} busy={confirmBusy} />
    </AuthenticatedLayout>
  );
}
