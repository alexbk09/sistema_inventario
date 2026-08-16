import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import ProductGrid from '@/Components/admin/product/ProductGrid.jsx';
import AdminFilters from '@/Components/common/AdminFilters.jsx';
import ProductWizard from '@/Components/admin/product/ProductWizard.jsx';
import BulkImportModal from '@/Components/admin/product/BulkImportModal.jsx';
import ConfirmDialog from '@/Components/common/ConfirmDialog.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import PageHeader from '@/Components/admin/PageHeader.jsx';
import StatsCard from '@/Components/admin/StatsCard.jsx';
import toast from 'react-hot-toast';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';
import { LayoutGrid, List, Plus, Upload, Package, DollarSign, AlertTriangle, TrendingDown, SlidersHorizontal, X, Trash2, CheckSquare, Square, Zap } from 'lucide-react';

export default function Index({ products, filters, summary, warehouses = [], adminCurrencyContext = {}, categories = [] }) {
  const { t } = useI18n();
  const { formatNumber, formatCurrency } = useLocaleFormat();
  const { displayCurrency, formatPriceFromUsd } = useConfiguredCurrencyRates();
  const formatActiveAmount = (value) => formatPriceFromUsd(Number(value || 0), displayCurrency);
  const formatServerAmount = (code, value) => formatCurrency(Number(value || 0), code);
  const { data } = products;
  const page = products.current_page ?? products?.meta?.current_page ?? 1;
  const totalPages = products.last_page ?? products?.meta?.last_page ?? 1;
  const [search, setSearch] = useState(filters?.search ?? '');
  const [debounced, setDebounced] = useState(search);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('products_view') || 'list');
  const [stockFilter, setStockFilter] = useState(filters?.stock_status ?? '');
  const [categoryFilter, setCategoryFilter] = useState(filters?.category_id ?? '');
  const [showFilters, setShowFilters] = useState(false);
  const isFirst = useRef(true);

  const handleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('products_view', mode);
  };

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    router.get(route('admin.products.index'), {
      search: debounced,
      stock_status: stockFilter || undefined,
      category_id: categoryFilter || undefined,
      page: 1,
    }, { preserveScroll: true, preserveState: true, replace: true });
  }, [debounced, stockFilter, categoryFilter]);

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
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const handleEdit = (item) => { setEditingProduct(item); setIsModalOpen(true); };
  const handleAddNew = () => { setEditingProduct(null); setIsModalOpen(true); };
  const handleDelete = (item) => { setConfirmItem(item); setConfirmOpen(true); };

  const confirmDelete = () => {
    if (!confirmItem) return;
    setConfirmBusy(true);
    const loadingId = `loading-delete-product-${confirmItem.id}`;
    toast.loading(t('admin.products.notifications.deleting', 'Eliminando producto...'), { id: loadingId, position: 'top-center' });
    router.delete(route('admin.products.destroy', confirmItem.id), {
      preserveScroll: true,
      onSuccess: () => { toast.success(t('admin.products.notifications.deleted', 'Producto eliminado'), { id: loadingId, position: 'top-center' }); setConfirmOpen(false); setConfirmItem(null); },
      onError: () => { toast.error(t('admin.products.notifications.delete_error', 'No se pudo eliminar'), { id: loadingId, position: 'top-center' }); },
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
    if (payload.cost_usd) {
      formData.append('cost_usd', Number(payload.cost_usd));
    }
    formData.append('stock', Number(payload.stock));
    if (payload.min_stock !== undefined && payload.min_stock !== null && payload.min_stock !== '') {
      formData.append('min_stock', Number(payload.min_stock));
    }
    if (payload.description) {
      formData.append('description', payload.description);
    }
    formData.append('is_featured', payload.is_featured ? '1' : '0');
    if (payload.category_id !== undefined && payload.category_id !== null && payload.category_id !== '') {
      formData.append('category_id', payload.category_id);
    }
    
    // New wizard fields
    if (payload.tags && Array.isArray(payload.tags)) {
      payload.tags.forEach((tag, index) => {
        formData.append('tags[' + index + ']', tag);
      });
    }
    
    if (payload.warehouse_id) {
      formData.append('warehouse_id', payload.warehouse_id);
    }
    
    if (payload.weight) {
      formData.append('weight', Number(payload.weight));
    }
    
    if (payload.dimensions) {
      if (payload.dimensions.length) formData.append('dimensions[length]', payload.dimensions.length);
      if (payload.dimensions.width) formData.append('dimensions[width]', payload.dimensions.width);
      if (payload.dimensions.height) formData.append('dimensions[height]', payload.dimensions.height);
    }

    if (Array.isArray(payload.images)) {
      payload.images.forEach((file, index) => {
        formData.append('images[' + index + ']', file);
      });
    }
    
    // Handle existing images to keep
    if (payload.existingImages && Array.isArray(payload.existingImages)) {
      payload.existingImages.forEach((imageId, index) => {
        formData.append('existing_images[' + index + ']', imageId);
      });
    }
    if (payload.id) {
      formData.append('_method', 'put');
      const loadingId = `update-product-${payload.id}`;
      toast.loading(t('admin.products.notifications.updating', 'Actualizando producto...'), { id: loadingId, position: 'top-center' });
      router.post(route('admin.products.update', payload.id), formData, {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: () => { setIsModalOpen(false); setEditingProduct(null); toast.success(t('admin.products.notifications.updated', 'Producto actualizado'), { id: loadingId, position: 'top-center' }); },
        onError: () => { toast.error(t('admin.products.notifications.update_error', 'No se pudo actualizar'), { id: loadingId, position: 'top-center' }); },
        onFinish: () => { setTimeout(() => toast.dismiss(loadingId), 800); },
      });
    } else {
      const loadingId = 'create-product';
      toast.loading(t('admin.products.notifications.creating', 'Creando producto...'), { id: loadingId, position: 'top-center' });
      router.post(route('admin.products.store'), formData, {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: () => { setIsModalOpen(false); setEditingProduct(null); toast.success(t('admin.products.notifications.created', 'Producto creado'), { id: loadingId, position: 'top-center' }); },
        onError: () => { toast.error(t('admin.products.notifications.create_error', 'No se pudo crear'), { id: loadingId, position: 'top-center' }); },
        onFinish: () => { setTimeout(() => toast.dismiss(loadingId), 800); },
      });
    }
  };

  const handleInventory = (item) => {
    router.get(route('admin.products.inventory.index', item.id));
  };

  const [adjustProduct, setAdjustProduct] = useState(null);
  const [adjustType, setAdjustType] = useState('entry');
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustNote, setAdjustNote] = useState('');
  const [adjustBusy, setAdjustBusy] = useState(false);

  const openAdjust = (product) => {
    setAdjustProduct(product);
    setAdjustType('entry');
    setAdjustQty(1);
    setAdjustNote('');
  };

  const submitAdjust = () => {
    if (!adjustProduct || adjustQty < 1) return;
    setAdjustBusy(true);
    router.post(
      route('admin.products.inventory.store', adjustProduct.id),
      { type: adjustType, quantity: adjustQty, notes: adjustNote, warehouse_id: adjustProduct.warehouse_id ?? undefined },
      {
        preserveScroll: true,
        onSuccess: () => { toast.success('Stock ajustado'); setAdjustProduct(null); },
        onError: () => toast.error('No se pudo ajustar el stock'),
        onFinish: () => setAdjustBusy(false),
      }
    );
  };

  const toggleSelect = (id) => setSelectedIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );
  const toggleAll = () => setSelectedIds(prev =>
    prev.length === data.length ? [] : data.map(p => p.id)
  );
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setBulkBusy(true);
    router.post(route('admin.products.bulk-destroy'), { ids: selectedIds }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(`${selectedIds.length} productos eliminados`);
        setSelectedIds([]);
        setBulkConfirmOpen(false);
      },
      onError: () => toast.error('No se pudo completar la acción'),
      onFinish: () => setBulkBusy(false),
    });
  };

  const activeFiltersCount = [debounced, stockFilter, categoryFilter].filter(Boolean).length;
  const formatProductPrice = (product) => {
    if (product?.price_admin_totals?.[displayCurrency] !== undefined) {
      return formatServerAmount(displayCurrency, product.price_admin_totals[displayCurrency]);
    }
    return formatActiveAmount(product?.price_usd || 0);
  };

  const columns = [
    {
      key: '_select',
      label: (
        <button onClick={toggleAll} className="flex items-center">
          {selectedIds.length === data.length && data.length > 0
            ? <CheckSquare className="w-4 h-4 text-primary" />
            : <Square className="w-4 h-4 text-muted-foreground" />}
        </button>
      ),
      width: '4%',
      render: (_, row) => (
        <button onClick={(e) => { e.stopPropagation(); toggleSelect(row.id); }} className="flex items-center">
          {selectedIds.includes(row.id)
            ? <CheckSquare className="w-4 h-4 text-primary" />
            : <Square className="w-4 h-4 text-muted-foreground" />}
        </button>
      ),
    },
    { key: 'name', label: t('admin.products.index.table.name', 'Nombre'), width: '22%' },
    { key: 'sku', label: t('admin.products.index.table.sku', 'SKU'), width: '15%' },
    {
      key: 'price_usd',
      label: displayCurrency,
      width: '15%',
      render: (v, row) => row?.price_admin_totals?.[displayCurrency] !== undefined
        ? formatServerAmount(displayCurrency, row.price_admin_totals[displayCurrency])
        : formatActiveAmount(v),
    },
    { key: 'stock', label: t('admin.products.index.table.stock', 'Stock'), width: '15%', render: (v, row) => {
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
            <span className="ml-1 text-xs font-normal text-red-500">({t('admin.products.values.low_stock', 'bajo')})</span>
          )}
        </span>
      );
    } },
    { key: 'is_featured', label: t('admin.products.index.table.featured', 'Destacado'), width: '10%', render: (v) => (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${v ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
        {v ? t('admin.products.values.yes', 'Sí') : t('admin.products.values.no', 'No')}
      </span>
    ) },
    { key: 'description', label: t('admin.products.index.table.description', 'Descripción'), width: '25%', render: (v) => (<p className="truncate" title={v}>{v || t('admin.products.values.empty', '-')}</p>) },
    { key: 'inventory', label: t('admin.products.index.table.inventory', 'Inventario'), width: '18%', render: (v, row) => (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleInventory(row)}
          className="px-2 py-1 text-xs rounded bg-muted hover:bg-muted/70 text-foreground border border-border"
        >
          {t('admin.products.index.actions.view_movements', 'Movimientos')}
        </button>
        <button
          onClick={() => openAdjust(row)}
          className="p-1.5 text-xs rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
          title="Ajuste rápido de stock"
        >
          <Zap className="w-3.5 h-3.5" />
        </button>
      </div>
    ) },
  ];

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.products.index.page_title', 'Productos')} />

      <PageHeader
        title={t('admin.products.index.page_title', 'Productos')}
        description={t('admin.products.index.context_description', 'Gestiona el catálogo, precios, stock e imágenes.')}
        icon={Package}
        breadcrumbs={[
          { label: t('nav.dashboard_admin', 'Dashboard'), href: route('dashboard') },
          { label: t('admin.products.index.page_title', 'Productos') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border rounded-lg bg-card hover:bg-muted transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">{t('admin.products.index.actions.import_excel', 'Importar')}</span>
            </button>
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('admin.products.index.actions.new', 'Nuevo producto')}
            </button>
          </div>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard
          label={t('admin.products.index.stats.products', 'Total productos')}
          value={formatNumber(summary?.total_products || data.length || 0)}
          icon={Package}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          sparkColor="#3B82F6"
        />
        <StatsCard
          label={`${t('admin.products.index.stats.inventory_usd', 'Valor inventario')} ${displayCurrency}`}
          value={
            summary?.total_products_value_admin_totals?.[displayCurrency] !== undefined
              ? formatServerAmount(displayCurrency, summary.total_products_value_admin_totals[displayCurrency])
              : formatActiveAmount(summary?.total_products_value_usd || 0)
          }
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          sparkColor="#10B981"
        />
        <StatsCard
          label={t('admin.products.index.stats.exits_30d', 'Salidas 30 días')}
          value={formatNumber(summary?.last_30_days_exits || 0)}
          icon={TrendingDown}
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          sparkColor="#F59E0B"
        />
      </div>

      {/* Table/Grid section */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-border">
          {/* Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.products.index.filters.search_placeholder', 'Buscar por nombre, SKU...')}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-ring focus:outline-none"
            />
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(v => !v)}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${showFilters || activeFiltersCount > 1 ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:bg-muted'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t('admin.common.filters', 'Filtros')}
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* View toggle */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => handleViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted text-muted-foreground'}`}
              title={t('admin.common.list_view', 'Vista lista')}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted text-muted-foreground'}`}
              title={t('admin.common.grid_view', 'Vista cuadrícula')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground">{t('admin.products.index.filters.stock', 'Stock')}</label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="text-xs border border-border rounded-lg px-2 py-1.5 bg-card focus:ring-1 focus:ring-ring focus:outline-none"
              >
                <option value="">{t('admin.common.all', 'Todos')}</option>
                <option value="in_stock">{t('admin.products.filters.in_stock', 'Con stock')}</option>
                <option value="low_stock">{t('admin.products.filters.low_stock', 'Stock bajo')}</option>
                <option value="out_of_stock">{t('admin.products.filters.out_of_stock', 'Sin stock')}</option>
              </select>
            </div>
            {categories.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground">{t('admin.nav.categories', 'Categoría')}</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs border border-border rounded-lg px-2 py-1.5 bg-card focus:ring-1 focus:ring-ring focus:outline-none"
                >
                  <option value="">{t('admin.common.all', 'Todas')}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={() => { setSearch(''); setStockFilter(''); setCategoryFilter(''); }}
                className="text-xs text-destructive hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />{t('admin.common.clear_filters', 'Limpiar filtros')}
              </button>
            )}
          </div>
        )}

        {/* Bulk actions bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border-b border-primary/20">
            <span className="text-sm font-medium text-foreground">
              {selectedIds.length} seleccionado{selectedIds.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setBulkConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar seleccionados
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Results info */}
        <div className="px-4 py-2 border-b border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {t('admin.common.showing_results', ':count resultados', { count: data.length })}
            {totalPages > 1 && ` — ${t('admin.common.page', 'pág.')} ${page}/${totalPages}`}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          {viewMode === 'grid' ? (
            <ProductGrid
              data={data}
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onInventory={handleInventory}
              formatPrice={formatProductPrice}
            />
          ) : (
            <AdminTable
              columns={columns}
              data={data}
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      <ProductWizard isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingProduct(null); }} onSave={handleSave} editingProduct={editingProduct} categories={categories} />
      <BulkImportModal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} warehouses={warehouses ?? (window.page?.props?.warehouses ?? [])} />

      <ConfirmDialog isOpen={confirmOpen} title={t('admin.products.confirm.title', 'Confirmar eliminación')} message={confirmItem ? `${t('admin.products.confirm.message_prefix', '¿Eliminar el producto')} "${confirmItem.name}"?` : ''} confirmText={t('admin.products.confirm.confirm', 'Eliminar')} cancelText={t('admin.products.confirm.cancel', 'Cancelar')} onConfirm={confirmDelete} onCancel={() => { if (!confirmBusy) { setConfirmOpen(false); setConfirmItem(null); } }} busy={confirmBusy} />
      <ConfirmDialog isOpen={bulkConfirmOpen} title="Eliminar productos" message={`¿Eliminar ${selectedIds.length} producto${selectedIds.length !== 1 ? 's' : ''} seleccionado${selectedIds.length !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`} confirmText="Eliminar todos" cancelText="Cancelar" onConfirm={handleBulkDelete} onCancel={() => { if (!bulkBusy) setBulkConfirmOpen(false); }} busy={bulkBusy} />

      {/* Stock Adjust Modal */}
      {adjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !adjustBusy && setAdjustProduct(null)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-foreground text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Ajuste rápido de stock
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">{adjustProduct.name}</p>
                <p className="text-xs text-muted-foreground">Stock actual: <strong>{adjustProduct.stock ?? 0}</strong></p>
              </div>
              <button onClick={() => setAdjustProduct(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Tipo de movimiento</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ v: 'entry', label: '+ Entrada', cls: 'text-emerald-700 border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20' }, { v: 'exit', label: '− Salida', cls: 'text-red-700 border-red-300 bg-red-50 dark:bg-red-900/20' }].map(({ v, label, cls }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAdjustType(v)}
                      className={`py-2 text-sm font-semibold rounded-lg border-2 transition-all ${adjustType === v ? cls + ' ring-2 ring-offset-1 ring-primary' : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={e => setAdjustQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-ring focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Notas (opcional)</label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={e => setAdjustNote(e.target.value)}
                  placeholder="Motivo del ajuste..."
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-ring focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAdjustProduct(null)}
                className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitAdjust}
                disabled={adjustBusy}
                className="flex-1 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                {adjustBusy ? 'Guardando...' : 'Aplicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
