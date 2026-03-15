import { Head, router, Link } from '@inertiajs/react';
import { useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

export default function Dashboard({
  filters = {},
  charts = {},
  metrics = {},
  legacyMetrics = {},
  counts = {},
  lowStockProducts = [],
  expiredLayaways = [],
  topProducts = [],
  topCustomers = [],
  warehouses = [],
  selected_warehouse = null,
  rate = null,
}) {
  const salesChart = charts.sales || { labels: [], current: [], previous: [] };

  const salesData = useMemo(() => ({
    labels: salesChart.labels,
    datasets: [
      {
        label: 'Últimos 30 días',
        data: salesChart.current,
        borderColor: 'rgba(59,130,246,1)',
        backgroundColor: 'rgba(59,130,246,0.15)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Período anterior',
        data: salesChart.previous,
        borderColor: 'rgba(148,163,184,1)',
        backgroundColor: 'rgba(148,163,184,0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  }), [salesChart]);

  const salesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const topProductsData = useMemo(() => ({
    labels: topProducts.map((p) => p.label),
    datasets: [
      {
        label: 'Cantidad vendida',
        data: topProducts.map((p) => p.quantity ?? 0),
        backgroundColor: 'rgba(34,197,94,0.7)',
      },
    ],
  }), [topProducts]);

  const topCustomersData = useMemo(() => ({
    labels: topCustomers.map((c) => c.label),
    datasets: [
      {
        label: 'Ventas USD',
        data: topCustomers.map((c) => c.total_sales_usd ?? 0),
        backgroundColor: 'rgba(249,115,22,0.8)',
      },
    ],
  }), [topCustomers]);

  const handleWarehouseChange = (e) => {
    const warehouseId = e.target.value || '';
    router.get(route('dashboard'), {
      ...filters,
      warehouse_id: warehouseId || undefined,
    }, { preserveScroll: true, replace: true });
  };

  const creditShare = metrics.credit_share ?? 0;
  const cashShare = metrics.cash_share ?? 0;

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Resumen rápido de ventas, clientes y productos de los últimos 30 días.
            </p>
          </div>
          <div className="flex gap-3 items-center text-sm">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Sucursal/Bodega</label>
              <select
                className="border border-border rounded px-2 py-1 bg-background text-sm"
                value={filters.warehouse_id || selected_warehouse || ''}
                onChange={handleWarehouseChange}
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
        </div>

        {/* KPIs analíticos últimos 30 días */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Facturas (30 días)</div>
            <div className="text-2xl font-semibold">{metrics.total_invoices ?? 0}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Ventas USD (30 días)</div>
            <div className="text-2xl font-semibold">{Number(metrics.total_usd || 0).toFixed(2)}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Ticket promedio USD</div>
            <div className="text-2xl font-semibold">{Number(metrics.avg_ticket_usd || 0).toFixed(2)}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Margen estimado USD</div>
            <div className="text-2xl font-semibold">{Number(metrics.margin_usd || 0).toFixed(2)}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Ventas a crédito</div>
            <div className="text-2xl font-semibold">{Number(metrics.credit_sales_usd || 0).toFixed(2)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">{creditShare.toFixed(1)}% del total</p>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Ventas de contado</div>
            <div className="text-2xl font-semibold">{Number(metrics.cash_sales_usd || 0).toFixed(2)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">{cashShare.toFixed(1)}% del total</p>
          </div>
        </div>

        {/* Resumen clásico del negocio */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Tasa del día</div>
            <div className="text-2xl font-semibold">{rate ? Number(rate).toFixed(2) : '--'}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Promedio oficial USD → Bs.</p>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Ventas HOY (USD)</div>
            <div className="text-2xl font-semibold">{Number(legacyMetrics.today_sales_usd || 0).toFixed(2)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">{legacyMetrics.today_sales_count || 0} facturas pagadas</p>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Ventas MES (USD)</div>
            <div className="text-2xl font-semibold">{Number(legacyMetrics.month_sales_usd || 0).toFixed(2)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">{legacyMetrics.month_sales_count || 0} facturas pagadas</p>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">Productos con stock bajo</div>
            <div className="text-2xl font-semibold">{legacyMetrics.low_stock_products || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Incluye productos en cero o negativos.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-white p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Resumen de facturas</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Pendientes</dt>
                <dd className="font-medium">{legacyMetrics.invoice_pending || 0}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Pagadas</dt>
                <dd className="font-medium">{legacyMetrics.invoice_paid || 0}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Anuladas</dt>
                <dd className="font-medium">{legacyMetrics.invoice_cancelled || 0}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-white p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Inventario general</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Stock total</dt>
                <dd className="font-medium">{legacyMetrics.total_stock || 0}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Productos</dt>
                <dd className="font-medium">{counts.products || 0}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Categorías</dt>
                <dd className="font-medium">{counts.categories || 0}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-white p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Operaciones abiertas</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">RMA pendientes/aprobadas</dt>
                <dd className="font-medium">{legacyMetrics.rma_pending || 0}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Apartados activos</dt>
                <dd className="font-medium">{legacyMetrics.layaway_active || 0}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Créditos activos</dt>
                <dd className="font-medium">{legacyMetrics.credit_open || 0}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Gráfico de ventas por día */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-white p-4 lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">Ventas por día (USD)</h2>
              <span className="text-xs text-muted-foreground">Comparación últimos 30 días vs período anterior</span>
            </div>
            <div className="h-64">
              <Line data={salesData} options={salesOptions} />
            </div>
          </div>

          {/* Distribución crédito vs contado */}
          <div className="rounded-lg border border-border bg-white p-4 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">Distribución ventas crédito/contado</h2>
              <p className="text-xs text-muted-foreground mb-2">
                Muestra el peso relativo de las ventas a crédito frente a las de contado en el período actual.
              </p>
            </div>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Crédito
                </span>
                <span>{creditShare.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  Contado
                </span>
                <span>{cashShare.toFixed(1)}%</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-2 bg-blue-500"
                  style={{ width: `${Math.min(Math.max(creditShare, 0), 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top productos y clientes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-white p-4">
            <h2 className="text-sm font-semibold text-foreground mb-2">Top productos (por cantidad)</h2>
            {topProducts.length > 0 ? (
              <div className="h-64">
                <Bar
                  data={topProductsData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No hay datos para el período seleccionado.</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-white p-4">
            <h2 className="text-sm font-semibold text-foreground mb-2">Top clientes (por ventas USD)</h2>
            {topCustomers.length > 0 ? (
              <div className="h-64">
                <Bar
                  data={topCustomersData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No hay datos para el período seleccionado.</p>
            )}
          </div>
        </div>

        {/* Gestión rápida de módulos */}
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Gestionar módulos</h2>
            <p className="text-xs text-muted-foreground">Accesos directos a secciones clave del sistema.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <Link href={route('admin.products.index')} className="border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
              <div className="font-medium">Productos</div>
              <div className="text-xs text-muted-foreground">Gestionar catálogo y stock.</div>
            </Link>
            <Link href={route('admin.categories.index')} className="border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
              <div className="font-medium">Categorías</div>
              <div className="text-xs text-muted-foreground">Organizar productos por familia.</div>
            </Link>
            <Link href={route('admin.providers.index')} className="border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
              <div className="font-medium">Proveedores</div>
              <div className="text-xs text-muted-foreground">Ver y actualizar proveedores.</div>
            </Link>
            <Link href={route('admin.invoices.index')} className="border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
              <div className="font-medium">Facturas</div>
              <div className="text-xs text-muted-foreground">Histórico y gestión de ventas.</div>
            </Link>
            <Link href={route('admin.customers.index')} className="border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
              <div className="font-medium">Clientes</div>
              <div className="text-xs text-muted-foreground">Administrar cartera de clientes.</div>
            </Link>
            <Link href={route('admin.users.index')} className="border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
              <div className="font-medium">Usuarios</div>
              <div className="text-xs text-muted-foreground">Permisos y accesos al sistema.</div>
            </Link>
            <Link href={route('admin.rmas.index')} className="border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
              <div className="font-medium">Devoluciones (RMA)</div>
              <div className="text-xs text-muted-foreground">Gestionar garantías y devoluciones.</div>
            </Link>
            <Link href={route('admin.warehouses.index')} className="border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
              <div className="font-medium">Sucursales/Bodegas</div>
              <div className="text-xs text-muted-foreground">Configurar almacenes físicos.</div>
            </Link>
            <Link href={route('admin.credits.index')} className="border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
              <div className="font-medium">Créditos</div>
              <div className="text-xs text-muted-foreground">Cuentas de crédito de clientes.</div>
            </Link>
          </div>
        </div>

        {/* Listas de alerta: stock bajo y apartados vencidos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-white p-4">
            <h2 className="text-sm font-semibold text-foreground mb-2">Productos con stock bajo</h2>
            {lowStockProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-border text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left py-1 pr-2">SKU</th>
                      <th className="text-left py-1 pr-2">Producto</th>
                      <th className="text-right py-1 pr-2">Stock</th>
                      <th className="text-right py-1 pr-2">Mín.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((p) => (
                      <tr key={p.id} className="border-b border-border/60 last:border-0">
                        <td className="py-1 pr-2 text-xs text-muted-foreground">{p.sku}</td>
                        <td className="py-1 pr-2">{p.name}</td>
                        <td className="py-1 pr-2 text-right font-medium">{p.stock}</td>
                        <td className="py-1 pr-2 text-right text-xs text-muted-foreground">{p.min_stock ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No hay productos con stock bajo según la configuración actual.</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-white p-4">
            <h2 className="text-sm font-semibold text-foreground mb-2">Apartados vencidos</h2>
            {expiredLayaways.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-border text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left py-1 pr-2">N°</th>
                      <th className="text-left py-1 pr-2">Cliente</th>
                      <th className="text-right py-1 pr-2">Total USD</th>
                      <th className="text-left py-1 pr-2">Vence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiredLayaways.map((l) => (
                      <tr key={l.id} className="border-b border-border/60 last:border-0">
                        <td className="py-1 pr-2 text-xs text-muted-foreground">{l.number}</td>
                        <td className="py-1 pr-2">{l.customer?.name || 'Sin cliente'}</td>
                        <td className="py-1 pr-2 text-right font-medium">{Number(l.total_usd || 0).toFixed(2)}</td>
                        <td className="py-1 pr-2 text-xs text-muted-foreground">{l.expires_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No hay apartados vencidos en este momento.</p>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
