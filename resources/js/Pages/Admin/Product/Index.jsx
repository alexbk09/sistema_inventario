import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import AdminFilters from '@/Components/common/AdminFilters.jsx';
import ProductModal from '@/Components/admin/product/ProductModal.jsx';
import BulkImportModal from '@/Components/admin/product/BulkImportModal.jsx';
import ConfirmDialog from '@/Components/common/ConfirmDialog.jsx';
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Productos</h1>
          <p className="text-muted-foreground">Gestiona los productos</p>
        </div>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Total de productos</p>
              <p className="text-2xl font-bold text-foreground">{Number(summary.total_products || 0)}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Valor total inventario (USD)</p>
              <p className="text-2xl font-bold text-foreground">${Number(summary.total_products_value_usd || 0).toFixed(2)}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Salidas últimos 30 días</p>
              <p className="text-2xl font-bold text-foreground">{Number(summary.last_30_days_exits || 0)}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Entradas acumuladas</p>
              <p className="text-2xl font-bold text-foreground">{Number(summary.total_entries || 0)}</p>
            </div>
          </div>
        )}

        <AdminFilters searchPlaceholder="Buscar por nombre, SKU o descripción" searchValue={search} onSearchChange={setSearch} onAddNew={handleAddNew} addButtonLabel="Nuevo Producto">
          <div>
            <button onClick={() => setIsBulkOpen(true)} className="ml-2 px-3 py-2 border rounded bg-muted hover:bg-muted/80">Importar Excel</button>
          </div>
        </AdminFilters>

        <AdminTable columns={columns} data={data} page={page} totalPages={totalPages} onPageChange={handlePageChange} onEdit={handleEdit} onDelete={handleDelete} />

      </div>

      <ProductModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingProduct(null); }} onSave={handleSave} editingProduct={editingProduct} />
      <BulkImportModal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} warehouses={warehouses ?? (window.page?.props?.warehouses ?? [])} />

      <ConfirmDialog isOpen={confirmOpen} title="Confirmar eliminación" message={confirmItem ? `¿Eliminar el producto "${confirmItem.name}"?` : ''} confirmText="Eliminar" cancelText="Cancelar" onConfirm={confirmDelete} onCancel={() => { if (!confirmBusy) { setConfirmOpen(false); setConfirmItem(null); } }} busy={confirmBusy} />
    </AuthenticatedLayout>
  );
}
