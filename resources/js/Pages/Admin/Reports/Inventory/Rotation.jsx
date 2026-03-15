import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

export default function InventoryRotation({ products, filters = {}, metrics, warehouses = [] }) {
  const [localFilters, setLocalFilters] = useState({
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
    warehouse_id: filters.warehouse_id || '',
    search: filters.search || '',
    only_slow: Boolean(filters.only_slow || false),
  });

  const page = products.current_page ?? products?.meta?.current_page ?? 1;
  const totalPages = products.last_page ?? products?.meta?.last_page ?? 1;

  const submitFilters = () => {
    router.get(route('admin.reports.inventory.rotation'), {
      ...localFilters,
      only_slow: localFilters.only_slow ? 1 : 0,
      page: 1,
    }, { preserveScroll: true, replace: true });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.reports.inventory.rotation'), {
      ...filters,
      page: nextPage,
    }, { preserveScroll: true, replace: true });
  };

  return (
    <AuthenticatedLayout>
      <Head title="Rotación de productos" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Rotación de productos</h1>
            <p className="text-muted-foreground text-sm">
              Estima días de inventario por producto a partir de ventas registradas en movimientos de salida.
            </p>
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
            onClick={() => router.get(route('admin.reports.inventory.kardex'), {}, { replace: true })}
            className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
          >
            Kardex de inventario
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground"
          >
            Rotación de productos
          </button>
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Días del período</div>
            <div className="text-2xl font-semibold">{metrics.period_days}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Productos listados (página)</div>
            <div className="text-2xl font-semibold">{metrics.total_products}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Promedio días inventario (página)</div>
            <div className="text-2xl font-semibold">{Number(metrics.avg_days_inventory || 0).toFixed(1)}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Productos sin ventas con stock</div>
            <div className="text-2xl font-semibold">{metrics.products_without_sales}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="rounded-lg border border-border bg-white p-4 space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Desde</label>
              <input
                type="date"
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.date_from}
                onChange={(e) => setLocalFilters((f) => ({ ...f, date_from: e.target.value }))}
              />
              {!filters.date_from && filters.computed_date_from && (
                <p className="text-[11px] text-muted-foreground mt-1">Por defecto: últimos 30 días desde {filters.computed_date_from}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Hasta</label>
              <input
                type="date"
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.date_to}
                onChange={(e) => setLocalFilters((f) => ({ ...f, date_to: e.target.value }))}
              />
              {!filters.date_to && filters.computed_date_to && (
                <p className="text-[11px] text-muted-foreground mt-1">Por defecto: {filters.computed_date_to}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Sucursal (para ventas)</label>
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

          <div className="flex items-center justify-between pt-2">
            <label className="inline-flex items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                className="rounded border-border text-primary focus:ring-primary"
                checked={localFilters.only_slow}
                onChange={(e) => setLocalFilters((f) => ({ ...f, only_slow: e.target.checked }))}
              />
              <span>Mostrar solo productos de baja rotación (≥ 90 días o sin ventas con stock).</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
                onClick={() => {
                  setLocalFilters({
                    date_from: '',
                    date_to: '',
                    warehouse_id: '',
                    search: '',
                    only_slow: false,
                  });
                  router.get(route('admin.reports.inventory.rotation'), {}, { replace: true });
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
        </div>

        {/* Tabla de rotación */}
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Producto</th>
                <th className="px-3 py-2 text-left font-semibold">SKU / Código</th>
                <th className="px-3 py-2 text-right font-semibold">Stock actual</th>
                <th className="px-3 py-2 text-right font-semibold">Unidades vendidas período</th>
                <th className="px-3 py-2 text-right font-semibold">Promedio diario venta</th>
                <th className="px-3 py-2 text-right font-semibold">Días inventario estimados</th>
                <th className="px-3 py-2 text-left font-semibold">Última venta</th>
              </tr>
            </thead>
            <tbody>
              {products.data.map((p) => {
                const stock = Number(p.stock ?? 0);
                const unitsSold = Number(p.units_sold ?? 0);
                const daysInv = p.days_of_inventory !== null && p.days_of_inventory !== undefined
                  ? Number(p.days_of_inventory)
                  : null;
                const avgDaily = metrics.period_days > 0 ? (unitsSold / metrics.period_days) : 0;

                return (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/40">
                    <td className="px-3 py-2 text-xs">{p.name}</td>
                    <td className="px-3 py-2 text-xs">{p.sku || p.barcode || '—'}</td>
                    <td className="px-3 py-2 text-xs text-right">{stock.toFixed(0)}</td>
                    <td className="px-3 py-2 text-xs text-right">{unitsSold.toFixed(0)}</td>
                    <td className="px-3 py-2 text-xs text-right">{avgDaily.toFixed(2)}</td>
                    <td className="px-3 py-2 text-xs text-right">
                      {daysInv !== null ? daysInv.toFixed(1) : (stock > 0 ? 'Sin ventas' : '—')}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {p.last_sale_at ? new Date(p.last_sale_at).toLocaleString('es-ES') : 'Sin ventas en período'}
                    </td>
                  </tr>
                );
              })}
              {products.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
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
