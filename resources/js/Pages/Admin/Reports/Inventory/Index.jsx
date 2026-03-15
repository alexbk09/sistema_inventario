import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

export default function InventoryReportIndex({ products, filters = {}, valuation, categories = [] }) {
  const [localFilters, setLocalFilters] = useState({
    category_id: filters.category_id || '',
    search: filters.search || '',
    low_stock_only: !!filters.low_stock_only,
  });

  const page = products.current_page ?? products?.meta?.current_page ?? 1;
  const totalPages = products.last_page ?? products?.meta?.last_page ?? 1;

  const buildQueryString = () => {
    const clean = {};
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== false) {
        clean[key] = value;
      }
    });
    if (localFilters.low_stock_only) {
      clean.low_stock_only = 1;
    }
    return new URLSearchParams(clean).toString();
  };

  const submitFilters = () => {
    router.get(route('admin.reports.inventory.index'), {
      ...localFilters,
      low_stock_only: localFilters.low_stock_only ? 1 : '',
      page: 1,
    }, { preserveScroll: true, replace: true });
  };

  const handleExportCsv = () => {
    const qs = buildQueryString();
    const base = route('admin.reports.inventory.export');
    window.location.href = qs ? `${base}?${qs}` : base;
  };

  const handleExportExcel = () => {
    const qs = buildQueryString();
    const base = route('admin.reports.inventory.export_excel');
    window.location.href = qs ? `${base}?${qs}` : base;
  };

  const handleExportPdf = () => {
    const qs = buildQueryString();
    const base = route('admin.reports.inventory.export_pdf');
    window.location.href = qs ? `${base}?${qs}` : base;
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.reports.inventory.index'), {
      ...filters,
      page: nextPage,
    }, { preserveScroll: true, replace: true });
  };

  return (
    <AuthenticatedLayout>
      <Head title="Reporte de inventario" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Reporte de inventario</h1>
            <p className="text-muted-foreground text-sm">Valorización del stock actual por producto, con filtros por categoría, búsqueda y stock bajo.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-2 rounded border border-border text-xs font-medium hover:bg-muted"
            >
              CSV (masivo)
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-2 rounded bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
            >
              Excel
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="px-3 py-2 rounded bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/90"
            >
              PDF
            </button>
          </div>
        </div>

        {/* Navegación entre vistas de inventario */}
        <div className="flex gap-2 border-b border-border pb-2">
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground"
          >
            Valorización global
          </button>
          <button
            type="button"
            onClick={() => router.get(route('admin.reports.inventory.by_warehouse'), {}, { replace: true })}
            className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
          >
            Por producto y bodega
          </button>
          <button
            type="button"
            onClick={() => router.get(route('admin.reports.inventory.kardex'), {}, { replace: true })}
            className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
          >
            Kardex de inventario
          </button>
          <button
            type="button"
            onClick={() => router.get(route('admin.reports.inventory.rotation'), {}, { replace: true })}
            className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
          >
            Rotación de productos
          </button>
        </div>

        {/* Métricas de valorización */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Unidades totales</div>
            <div className="text-2xl font-semibold">{valuation.total_units}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Valor costo (USD)</div>
            <div className="text-2xl font-semibold">{valuation.total_cost_usd.toFixed(2)}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Valor venta (USD)</div>
            <div className="text-2xl font-semibold">{valuation.total_price_usd.toFixed(2)}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="rounded-lg border border-border bg-white p-4 space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Categoría</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.category_id}
                onChange={(e) => setLocalFilters((f) => ({ ...f, category_id: e.target.value }))}
              >
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Buscar</label>
              <input
                type="text"
                placeholder="Nombre, SKU o código de barras"
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.search}
                onChange={(e) => setLocalFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <input
                  type="checkbox"
                  className="rounded border-border"
                  checked={localFilters.low_stock_only}
                  onChange={(e) => setLocalFilters((f) => ({ ...f, low_stock_only: e.target.checked }))}
                />
                Solo productos con stock bajo/cero
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
              onClick={() => {
                setLocalFilters({ category_id: '', search: '', low_stock_only: false });
                router.get(route('admin.reports.inventory.index'), {}, { replace: true });
              }}
            >
              Limpiar filtros
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={submitFilters}
            >
              Aplicar filtros
            </button>
          </div>
        </div>

        {/* Tabla de productos */}
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Producto</th>
                <th className="px-3 py-2 text-left font-semibold">SKU</th>
                <th className="px-3 py-2 text-left font-semibold">Categorías</th>
                <th className="px-3 py-2 text-right font-semibold">Stock</th>
                <th className="px-3 py-2 text-right font-semibold">Costo prom. USD</th>
                <th className="px-3 py-2 text-right font-semibold">Precio USD</th>
                <th className="px-3 py-2 text-right font-semibold">Valor costo (USD)</th>
                <th className="px-3 py-2 text-right font-semibold">Valor venta (USD)</th>
              </tr>
            </thead>
            <tbody>
              {products.data.map((p) => {
                const categoriesNames = (p.categories || []).map((c) => c.name).join(', ');
                const valueCost = (p.stock || 0) * (p.average_cost_usd || 0);
                const valuePrice = (p.stock || 0) * (p.price_usd || 0);
                return (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/40">
                    <td className="px-3 py-2 text-xs">{p.name}</td>
                    <td className="px-3 py-2 text-xs">{p.sku}</td>
                    <td className="px-3 py-2 text-xs">{categoriesNames || '-'}</td>
                    <td className="px-3 py-2 text-xs text-right">{p.stock}</td>
                    <td className="px-3 py-2 text-xs text-right">{Number(p.average_cost_usd || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-xs text-right">{Number(p.price_usd || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-xs text-right">{valueCost.toFixed(2)}</td>
                    <td className="px-3 py-2 text-xs text-right">{valuePrice.toFixed(2)}</td>
                  </tr>
                );
              })}
              {products.data.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No hay productos para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
          <div>
            Página {page} de {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
