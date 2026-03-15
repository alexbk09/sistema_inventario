import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

export default function SalesReportIndex({ invoices, filters = {}, metrics, warehouses = [], customers = [], paymentMethods = [], sellers = [] }) {
  const [localFilters, setLocalFilters] = useState({
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
    warehouse_id: filters.warehouse_id || '',
    customer_id: filters.customer_id || '',
    seller_id: filters.seller_id || '',
    status: filters.status || '',
    document_type: filters.document_type || '',
    payment_method: filters.payment_method || '',
  });

  const page = invoices.current_page ?? invoices?.meta?.current_page ?? 1;
  const totalPages = invoices.last_page ?? invoices?.meta?.last_page ?? 1;

  const submitFilters = () => {
    router.get(route('admin.reports.sales.index'), {
      ...localFilters,
      page: 1,
    }, { preserveScroll: true, replace: true });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.reports.sales.index'), {
      ...filters,
      page: nextPage,
    }, { preserveScroll: true, replace: true });
  };

  const buildQueryString = () => {
    const clean = {};
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        clean[key] = value;
      }
    });
    return new URLSearchParams(clean).toString();
  };

  const handleExport = () => {
    const qs = buildQueryString();
    const base = route('admin.reports.sales.export');
    window.location.href = qs ? `${base}?${qs}` : base;
  };

  const handleExportExcel = () => {
    const qs = buildQueryString();
    const base = route('admin.reports.sales.export_excel');
    window.location.href = qs ? `${base}?${qs}` : base;
  };

  const handleExportPdf = () => {
    const qs = buildQueryString();
    const base = route('admin.reports.sales.export_pdf');
    window.location.href = qs ? `${base}?${qs}` : base;
  };

  const typeLabels = {
    invoice: 'Factura',
    delivery_note: 'Nota de entrega',
    proforma: 'Proforma',
  };

  const statusLabels = {
    pending: 'Pendiente',
    paid: 'Pagado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };

  return (
    <AuthenticatedLayout>
      <Head title="Reporte de ventas" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Reporte de ventas</h1>
            <p className="text-muted-foreground text-sm">Filtra por rango de fechas, sucursal, cliente, tipo de documento y estado. Exporta millones de filas vía CSV optimizado.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExport}
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

        {/* Navegaci\u00f3n entre vistas de ventas */}
        <div className="flex gap-2 border-b border-border pb-2">
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground"
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
            onClick={() => router.get(route('admin.reports.sales.by_category'), {}, { replace: true })}
            className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted"
          >
            Ventas por categor\u00eda
          </button>
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Facturas</div>
            <div className="text-2xl font-semibold">{metrics.total_invoices}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Total USD</div>
            <div className="text-2xl font-semibold">{metrics.total_usd.toFixed(2)}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Total BS</div>
            <div className="text-2xl font-semibold">{metrics.total_bs.toFixed(2)}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Ticket promedio (USD)</div>
            <div className="text-2xl font-semibold">{metrics.avg_ticket_usd.toFixed(2)}</div>
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
              <label className="block text-xs font-medium text-muted-foreground mb-1">Cliente</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.customer_id}
                onChange={(e) => setLocalFilters((f) => ({ ...f, customer_id: e.target.value }))}
              >
                <option value="">Todos</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">Lista limitada a 200 clientes más usados.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Estado</label>
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
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Método de pago</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.payment_method}
                onChange={(e) => setLocalFilters((f) => ({ ...f, payment_method: e.target.value }))}
              >
                <option value="">Todos</option>
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Vendedor</label>
              <select
                className="w-full border border-border rounded px-2 py-1 bg-background"
                value={localFilters.seller_id}
                onChange={(e) => setLocalFilters((f) => ({ ...f, seller_id: e.target.value }))}
              >
                <option value="">Todos</option>
                {sellers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
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
                  customer_id: '',
                  seller_id: '',
                  status: '',
                  document_type: '',
                  payment_method: '',
                });
                router.get(route('admin.reports.sales.index'), {}, { replace: true });
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

        {/* Tabla */}
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Fecha</th>
                <th className="px-3 py-2 text-left font-semibold">Número</th>
                <th className="px-3 py-2 text-left font-semibold">Tipo</th>
                <th className="px-3 py-2 text-left font-semibold">Cliente</th>
                <th className="px-3 py-2 text-left font-semibold">Sucursal</th>
                <th className="px-3 py-2 text-left font-semibold">Estado</th>
                <th className="px-3 py-2 text-right font-semibold">USD</th>
                <th className="px-3 py-2 text-right font-semibold">BS</th>
              </tr>
            </thead>
            <tbody>
              {invoices.data.map((inv) => (
                <tr key={inv.id} className="border-b border-border hover:bg-muted/40">
                  <td className="px-3 py-2 text-xs">{new Date(inv.created_at).toLocaleString('es-ES')}</td>
                  <td className="px-3 py-2 text-xs">{inv.number}</td>
                  <td className="px-3 py-2 text-xs">{typeLabels[inv.document_type] ?? inv.document_type}</td>
                  <td className="px-3 py-2 text-xs">{inv.customer?.name ?? 'N/A'}</td>
                  <td className="px-3 py-2 text-xs">{inv.warehouse?.name ?? inv.warehouse?.code ?? '-'}</td>
                  <td className="px-3 py-2 text-xs">{statusLabels[inv.status] ?? inv.status}</td>
                  <td className="px-3 py-2 text-xs text-right">{Number(inv.total_usd).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs text-right">{Number(inv.total_bs).toFixed(2)}</td>
                </tr>
              ))}
              {invoices.data.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No hay facturas para los filtros seleccionados.
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
