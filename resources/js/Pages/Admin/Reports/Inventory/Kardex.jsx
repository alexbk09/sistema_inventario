import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

export default function InventoryKardex({ movements, filters = {}, product, products = [], warehouses = [] }) {
  const [localFilters, setLocalFilters] = useState({
    product_id: filters.product_id || '',
    warehouse_id: filters.warehouse_id || '',
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
  });

  const page = movements.current_page ?? movements?.meta?.current_page ?? 1;
  const totalPages = movements.last_page ?? movements?.meta?.last_page ?? 1;

  const submitFilters = () => {
    router.get(route('admin.reports.inventory.kardex'), {
      ...localFilters,
      page: 1,
    }, { preserveScroll: true, replace: true });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.reports.inventory.kardex'), {
      ...filters,
      page: nextPage,
    }, { preserveScroll: true, replace: true });
  };

  return (
    <AuthenticatedLayout>
      <Head title="Kardex de inventario" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Kardex de inventario</h1>
            <p className="text-muted-foreground text-sm">Consulta detallada de movimientos de inventario por producto y sucursal.</p>
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
            onClick={() => router.get(route('admin.reports.inventory.by_warehouse'), {}, { replace: true })}
            className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
          >
            Por producto y bodega
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground"
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

        {/* Filtros */}
        <div className="rounded-lg border border-border bg-white p-4 space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Producto</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.product_id}
                onChange={(e) => setLocalFilters((f) => ({ ...f, product_id: e.target.value }))}
              >
                <option value="">Selecciona un producto</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.sku ? `(${p.sku})` : ''}
                  </option>
                ))}
              </select>
            </div>
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
              <label className="block text-xs font-medium text-muted-foreground mb-1">Desde</label>
              <input
                type="date"
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.date_from}
                onChange={(e) => setLocalFilters((f) => ({ ...f, date_from: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Hasta</label>
              <input
                type="date"
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.date_to}
                onChange={(e) => setLocalFilters((f) => ({ ...f, date_to: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
              onClick={() => {
                setLocalFilters({
                  product_id: '',
                  warehouse_id: '',
                  date_from: '',
                  date_to: '',
                });
                router.get(route('admin.reports.inventory.kardex'), {}, { replace: true });
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

        {/* Resumen del producto */}
        {product && (
          <div className="rounded-lg border border-border bg-white p-4 text-sm flex flex-wrap gap-4 items-center">
            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1">Producto</div>
              <div className="font-semibold">{product.name}</div>
              <div className="text-xs text-muted-foreground">SKU: {product.sku || '—'} / Código: {product.barcode || '—'}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1">Stock actual</div>
              <div className="text-xl font-semibold">{Number(product.stock ?? 0)}</div>
            </div>
          </div>
        )}

        {/* Tabla de movimientos */}
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Fecha</th>
                <th className="px-3 py-2 text-left font-semibold">Tipo</th>
                <th className="px-3 py-2 text-left font-semibold">Sucursal</th>
                <th className="px-3 py-2 text-right font-semibold">Cantidad</th>
                <th className="px-3 py-2 text-right font-semibold">Costo/Precio USD</th>
                <th className="px-3 py-2 text-right font-semibold">Total USD</th>
                <th className="px-3 py-2 text-left font-semibold">Referencia</th>
                <th className="px-3 py-2 text-left font-semibold">Notas</th>
              </tr>
            </thead>
            <tbody>
              {movements.data.map((mov) => (
                <tr key={mov.id} className="border-b border-border hover:bg-muted/40">
                  <td className="px-3 py-2 text-xs">{new Date(mov.created_at).toLocaleString('es-ES')}</td>
                  <td className="px-3 py-2 text-xs">{mov.movement_type?.name || mov.type}</td>
                  <td className="px-3 py-2 text-xs">{mov.warehouse?.name || mov.warehouse?.code || '—'}</td>
                  <td className="px-3 py-2 text-xs text-right">{Number(mov.quantity).toFixed(0)}</td>
                  <td className="px-3 py-2 text-xs text-right">{Number(mov.unit_price_usd ?? mov.cost_usd ?? 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs text-right">{Number(mov.total_value_usd ?? 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs">{mov.reference || '—'}</td>
                  <td className="px-3 py-2 text-xs">{mov.notes || '—'}</td>
                </tr>
              ))}
              {movements.data.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No hay movimientos para los filtros seleccionados.
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
