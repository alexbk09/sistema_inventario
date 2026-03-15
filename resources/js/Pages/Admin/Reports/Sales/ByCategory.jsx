import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

export default function SalesByCategory({ rows, filters = {}, warehouses = [], metrics }) {
  const [localFilters, setLocalFilters] = useState({
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
    warehouse_id: filters.warehouse_id || '',
    status: filters.status || '',
    document_type: filters.document_type || '',
  });

  const page = rows.current_page ?? rows?.meta?.current_page ?? 1;
  const perPage = rows.per_page ?? rows?.meta?.per_page ?? 50;
  const totalPages = rows.last_page ?? rows?.meta?.last_page ?? 1;

  const submitFilters = () => {
    router.get(route('admin.reports.sales.by_category'), {
      ...localFilters,
      page: 1,
    }, { preserveScroll: true, replace: true });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.reports.sales.by_category'), {
      ...filters,
      page: nextPage,
    }, { preserveScroll: true, replace: true });
  };

  return (
    <AuthenticatedLayout>
      <Head title="Ventas por categoría" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Ventas por categoría</h1>
            <p className="text-muted-foreground text-sm">Resumen de ventas agrupadas por categoría de producto, filtrable por rango de fechas y sucursal.</p>
          </div>
        </div>

        {/* Navegación entre vistas de ventas */}
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
            onClick={() => router.get(route('admin.reports.sales.top_products'), {}, { replace: true })}
            className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
          >
            Ranking de productos
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground"
          >
            Ventas por categoría
          </button>
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Cantidad total vendida</div>
            <div className="text-2xl font-semibold">{Number(metrics.total_quantity || 0).toFixed(0)}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Total vendido USD</div>
            <div className="text-2xl font-semibold">{Number(metrics.total_sales_usd || 0).toFixed(2)}</div>
          </div>
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
                router.get(route('admin.reports.sales.by_category'), {}, { replace: true });
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

        {/* Tabla de resumen por categoría */}
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">#</th>
                <th className="px-3 py-2 text-left font-semibold">Categoría</th>
                <th className="px-3 py-2 text-right font-semibold">Cantidad vendida</th>
                <th className="px-3 py-2 text-right font-semibold">Total USD</th>
              </tr>
            </thead>
            <tbody>
              {rows.data.map((row, index) => (
                <tr key={row.category_name ?? index} className="border-b border-border hover:bg-muted/40">
                  <td className="px-3 py-2 text-xs">{(page - 1) * perPage + index + 1}</td>
                  <td className="px-3 py-2 text-xs">{row.category_name}</td>
                  <td className="px-3 py-2 text-xs text-right">{Number(row.total_quantity).toFixed(0)}</td>
                  <td className="px-3 py-2 text-xs text-right">{Number(row.total_sales_usd).toFixed(2)}</td>
                </tr>
              ))}
              {rows.data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No hay ventas para los filtros seleccionados.
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
