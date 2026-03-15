import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

export default function SalesTopProducts({ items, filters = {}, warehouses = [] }) {
  const [localFilters, setLocalFilters] = useState({
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
    warehouse_id: filters.warehouse_id || '',
    status: filters.status || '',
    document_type: filters.document_type || '',
  });

  const page = items.current_page ?? items?.meta?.current_page ?? 1;
  const perPage = items.per_page ?? items?.meta?.per_page ?? 50;
  const totalPages = items.last_page ?? items?.meta?.last_page ?? 1;

  const submitFilters = () => {
    router.get(route('admin.reports.sales.top_products'), {
      ...localFilters,
      page: 1,
    }, { preserveScroll: true, replace: true });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.reports.sales.top_products'), {
      ...filters,
      page: nextPage,
    }, { preserveScroll: true, replace: true });
  };

  return (
    <AuthenticatedLayout>
      <Head title="Ranking de productos" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Ranking de productos m\u00e1s vendidos</h1>
            <p className="text-muted-foreground text-sm">Top de productos por cantidad vendida, filtrable por rango de fechas y sucursal.</p>
          </div>
        </div>

        {/* Navegaci\u00f3n entre vistas de ventas */}
        <div className="flex gap-2 border-b border-border pb-2">
          <button
            type="button"
            onClick={() => router.get(route('admin.reports.sales.index'), {}, { replace: true })}
            className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
          >
            Reporte de facturas
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground"
          >
            Ranking de productos
          </button>
          <button
            type="button"
            onClick={() => router.get(route('admin.reports.sales.by_category'), {}, { replace: true })}
            className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
          >
            Ventas por categoría
          </button>
        </div>

        {/* Filtros */}
        <div className="rounded-lg border border-border bg-white p-4 space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Estado de factura</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.status}
                onChange={(e) => setLocalFilters((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo de documento</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.document_type}
                onChange={(e) => setLocalFilters((f) => ({ ...f, document_type: e.target.value }))}
              >
                <option value="">Todos</option>
                <option value="invoice">Factura</option>
                <option value="delivery_note">Nota de entrega</option>
                <option value="proforma">Proforma</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
              onClick={() => {
                setLocalFilters({
                  date_from: '',
                  date_to: '',
                  warehouse_id: '',
                  status: '',
                  document_type: '',
                });
                router.get(route('admin.reports.sales.top_products'), {}, { replace: true });
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

        {/* Tabla de ranking */}
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">#</th>
                <th className="px-3 py-2 text-left font-semibold">Producto</th>
                <th className="px-3 py-2 text-left font-semibold">SKU / C\u00f3digo</th>
                <th className="px-3 py-2 text-right font-semibold">Cantidad vendida</th>
                <th className="px-3 py-2 text-right font-semibold">Total USD</th>
              </tr>
            </thead>
            <tbody>
              {items.data.map((row, index) => (
                <tr key={row.product_id} className="border-b border-border hover:bg-muted/40">
                  <td className="px-3 py-2 text-xs">
                    {(page - 1) * perPage + index + 1}
                  </td>
                  <td className="px-3 py-2 text-xs">{row.product?.name ?? 'Producto eliminado'}</td>
                  <td className="px-3 py-2 text-xs">{row.product?.sku || row.product?.barcode || '-'}</td>
                  <td className="px-3 py-2 text-xs text-right">{Number(row.total_quantity).toFixed(0)}</td>
                  <td className="px-3 py-2 text-xs text-right">{Number(row.total_sales_usd).toFixed(2)}</td>
                </tr>
              ))}
              {items.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No hay ventas para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginaci\u00f3n */}
        <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
          <div>
            P\u00e1gina {page} de {totalPages}
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
