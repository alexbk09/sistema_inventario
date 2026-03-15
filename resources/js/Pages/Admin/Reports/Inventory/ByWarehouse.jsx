import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

export default function InventoryByWarehouse({ rows, filters = {}, warehouses = [], valuation }) {
  const [localFilters, setLocalFilters] = useState({
    warehouse_id: filters.warehouse_id || '',
    search: filters.search || '',
  });

  const page = rows.current_page ?? rows?.meta?.current_page ?? 1;
  const totalPages = rows.last_page ?? rows?.meta?.last_page ?? 1;

  const submitFilters = () => {
    router.get(route('admin.reports.inventory.by_warehouse'), {
      ...localFilters,
      page: 1,
    }, { preserveScroll: true, replace: true });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.reports.inventory.by_warehouse'), {
      ...filters,
      page: nextPage,
    }, { preserveScroll: true, replace: true });
  };

  return (
    <AuthenticatedLayout>
      <Head title="Inventario por bodega" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Inventario por bodega</h1>
            <p className="text-muted-foreground text-sm">Valorización de stock actual por producto y sucursal/bodega usando movimientos.</p>
          </div>
        </div>

        {/* Navegación entre vistas de inventario */}
        <div className="flex gap-2 border-b border-border pb-2">
          <button
            type="button"
            onClick={() => router.get(route('admin.reports.inventory.index'), {}, { replace: true })}
            className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
          >
            Valorización global
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground"
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

        {/* Métricas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Unidades totales (página)</div>
            <div className="text-2xl font-semibold">{Number(valuation.total_units || 0).toFixed(0)}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Valor costo USD (página)</div>
            <div className="text-2xl font-semibold">{Number(valuation.total_cost_usd || 0).toFixed(2)}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Valor venta USD (página)</div>
            <div className="text-2xl font-semibold">{Number(valuation.total_price_usd || 0).toFixed(2)}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="rounded-lg border border-border bg-white p-4 space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Sucursal/Bodega</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.warehouse_id}
                onChange={(e) => setLocalFilters((f) => ({ ...f, warehouse_id: e.target.value }))}
              >
                <option value="">Todas</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.code ? `(${w.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Buscar producto</label>
              <input
                type="text"
                className="w-full border border-border rounded px-2 py-1 bg-background"
                placeholder="Nombre, SKU o código de barras"
                value={localFilters.search}
                onChange={(e) => setLocalFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
              onClick={() => {
                setLocalFilters({ warehouse_id: '', search: '' });
                router.get(route('admin.reports.inventory.by_warehouse'), {}, { replace: true });
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

        {/* Tabla de inventario por bodega */}
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Sucursal</th>
                <th className="px-3 py-2 text-left font-semibold">Producto</th>
                <th className="px-3 py-2 text-left font-semibold">SKU / Código</th>
                <th className="px-3 py-2 text-right font-semibold">Stock unidades</th>
                <th className="px-3 py-2 text-right font-semibold">Costo prom. USD</th>
                <th className="px-3 py-2 text-right font-semibold">Precio USD</th>
                <th className="px-3 py-2 text-right font-semibold">Valor costo USD</th>
                <th className="px-3 py-2 text-right font-semibold">Valor venta USD</th>
              </tr>
            </thead>
            <tbody>
              {rows.data.map((row) => {
                const units = Number(row.stock_units ?? 0);
                const cost = Number(row.product?.average_cost_usd ?? 0);
                const price = Number(row.product?.price_usd ?? 0);
                const valueCost = units * cost;
                const valuePrice = units * price;
                return (
                  <tr key={`${row.product_id}-${row.warehouse_id}`} className="border-b border-border hover:bg-muted/40">
                    <td className="px-3 py-2 text-xs">{row.warehouse?.name || row.warehouse?.code || '—'}</td>
                    <td className="px-3 py-2 text-xs">{row.product?.name || 'Producto eliminado'}</td>
                    <td className="px-3 py-2 text-xs">{row.product?.sku || row.product?.barcode || '—'}</td>
                    <td className="px-3 py-2 text-xs text-right">{units.toFixed(0)}</td>
                    <td className="px-3 py-2 text-xs text-right">{cost.toFixed(2)}</td>
                    <td className="px-3 py-2 text-xs text-right">{price.toFixed(2)}</td>
                    <td className="px-3 py-2 text-xs text-right">{valueCost.toFixed(2)}</td>
                    <td className="px-3 py-2 text-xs text-right">{valuePrice.toFixed(2)}</td>
                  </tr>
                );
              })}
              {rows.data.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No hay registros para los filtros seleccionados.
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
