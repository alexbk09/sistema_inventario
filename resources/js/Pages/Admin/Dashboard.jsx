import { Head, router, Link } from '@inertiajs/react';
import { useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import { useI18n } from '@/Hooks/useI18n.ts';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat.ts';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';
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
  adminCurrencyContext = {},
  dashboardMoney = {},
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
  const { t } = useI18n();
  const { formatCurrency, formatDate, formatNumber } = useLocaleFormat();
  const { displayCurrency, convertFromUsd, formatPriceFromUsd } = useConfiguredCurrencyRates();
  const salesChart = charts.sales || { labels: [], current: [], previous: [] };
  const visibleCurrencyCodes = Array.isArray(adminCurrencyContext?.codes) && adminCurrencyContext.codes.length > 0
    ? adminCurrencyContext.codes
    : [displayCurrency];
  const summaryCurrencyCodes = visibleCurrencyCodes.slice(0, 2);

  const salesData = useMemo(() => ({
    labels: salesChart.labels,
    datasets: [
      {
        label: t('admin.dashboard.charts.sales.current_period', 'Últimos 30 días'),
        data: Array.isArray(salesChart.currentByCurrency?.[displayCurrency])
          ? salesChart.currentByCurrency[displayCurrency]
          : salesChart.current.map((value) => convertFromUsd(value, displayCurrency)),
        borderColor: 'rgba(59,130,246,1)',
        backgroundColor: 'rgba(59,130,246,0.15)',
        tension: 0.3,
        fill: true,
      },
      {
        label: t('admin.dashboard.charts.sales.previous_period', 'Período anterior'),
        data: Array.isArray(salesChart.previousByCurrency?.[displayCurrency])
          ? salesChart.previousByCurrency[displayCurrency]
          : salesChart.previous.map((value) => convertFromUsd(value, displayCurrency)),
        borderColor: 'rgba(148,163,184,1)',
        backgroundColor: 'rgba(148,163,184,0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  }), [convertFromUsd, displayCurrency, salesChart, t]);

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
        label: t('admin.dashboard.charts.top_products.dataset', 'Cantidad vendida'),
        data: topProducts.map((p) => p.quantity ?? 0),
        backgroundColor: 'rgba(34,197,94,0.7)',
      },
    ],
  }), [topProducts, t]);

  const topCustomersData = useMemo(() => ({
    labels: topCustomers.map((c) => c.label),
    datasets: [
      {
        label: `${t('admin.dashboard.charts.top_customers.dataset', 'Ventas')} ${displayCurrency}`,
        data: topCustomers.map((c) => c.admin_totals?.[displayCurrency] ?? convertFromUsd(c.total_sales_usd ?? 0, displayCurrency)),
        backgroundColor: 'rgba(249,115,22,0.8)',
      },
    ],
  }), [convertFromUsd, displayCurrency, topCustomers, t]);

  const handleWarehouseChange = (e) => {
    const warehouseId = e.target.value || '';
    router.get(route('dashboard'), {
      ...filters,
      warehouse_id: warehouseId || undefined,
    }, { preserveScroll: true, replace: true });
  };

  const creditShare = metrics.credit_share ?? 0;
  const cashShare = metrics.cash_share ?? 0;
  const formatPercent = (value) => `${formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  const formatActiveAmount = (value, currency = displayCurrency) => formatPriceFromUsd(Number(value || 0), currency);
  const formatServerAmount = (code, value) => formatCurrency(Number(value || 0), code);
  const getMoneyValue = (bucket, code, fallback) => {
    const serverValue = dashboardMoney?.[bucket]?.totals?.[code];
    if (serverValue !== undefined) {
      return formatServerAmount(code, serverValue);
    }

    return formatActiveAmount(fallback, code);
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.dashboard.page_title', 'Dashboard')} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">{t('admin.dashboard.title', 'Dashboard')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('admin.dashboard.description', 'Resumen rápido de ventas, clientes y productos de los últimos 30 días.')}
            </p>
          </div>
          <div className="flex gap-3 items-center text-sm">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.dashboard.filters.warehouse', 'Sucursal/Bodega')}</label>
              <select
                className="border border-border rounded px-2 py-1 bg-background text-sm"
                value={filters.warehouse_id || selected_warehouse || ''}
                onChange={handleWarehouseChange}
              >
                <option value="">{t('admin.dashboard.filters.all_warehouses', 'Todas')}</option>
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
            <div className="text-xs uppercase text-muted-foreground mb-1">{t('admin.dashboard.metrics.analytics.total_invoices', 'Facturas (30 días)')}</div>
            <div className="text-2xl font-semibold">{formatNumber(metrics.total_invoices ?? 0)}</div>
          </div>
          {summaryCurrencyCodes.map((code) => (
            <div key={`sales-${code}`} className="rounded-lg border border-border bg-white p-4">
              <div className="text-xs uppercase text-muted-foreground mb-1">{`${t('admin.dashboard.metrics.analytics.total_sales_usd', 'Ventas (30 días)')} ${code}`}</div>
              <div className="text-2xl font-semibold">{getMoneyValue('total_sales', code, metrics.total_usd || 0)}</div>
            </div>
          ))}
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">{`${t('admin.dashboard.metrics.analytics.avg_ticket_usd', 'Ticket promedio')} ${displayCurrency}`}</div>
            <div className="text-2xl font-semibold">{getMoneyValue('avg_ticket', displayCurrency, metrics.avg_ticket_usd || 0)}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">{`${t('admin.dashboard.metrics.analytics.margin_usd', 'Margen estimado')} ${displayCurrency}`}</div>
            <div className="text-2xl font-semibold">{getMoneyValue('margin', displayCurrency, metrics.margin_usd || 0)}</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">{t('admin.dashboard.metrics.analytics.credit_sales', 'Ventas a crédito')}</div>
            <div className="text-2xl font-semibold">{getMoneyValue('credit_sales', displayCurrency, metrics.credit_sales_usd || 0)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">{t('admin.dashboard.metrics.analytics.share_of_total', ':percent del total', { percent: formatPercent(creditShare) })}</p>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">{t('admin.dashboard.metrics.analytics.cash_sales', 'Ventas de contado')}</div>
            <div className="text-2xl font-semibold">{getMoneyValue('cash_sales', displayCurrency, metrics.cash_sales_usd || 0)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">{t('admin.dashboard.metrics.analytics.share_of_total', ':percent del total', { percent: formatPercent(cashShare) })}</p>
          </div>
        </div>

        {/* Resumen clásico del negocio */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">{t('admin.dashboard.metrics.classic.day_rate', 'Tasa del día')}</div>
            <div className="text-2xl font-semibold">{rate ? formatNumber(rate, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : t('admin.dashboard.metrics.classic.values.empty_dash', '—')}</div>
            <p className="text-[11px] text-muted-foreground mt-1">{t('admin.dashboard.metrics.classic.day_rate_help', 'Promedio oficial de conversión monetaria.')}</p>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">{`${t('admin.dashboard.metrics.classic.today_sales_usd', 'Ventas HOY')} (${displayCurrency})`}</div>
            <div className="text-2xl font-semibold">{getMoneyValue('today_sales', displayCurrency, legacyMetrics.today_sales_usd || 0)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">{t('admin.dashboard.metrics.classic.paid_invoices_count', ':count facturas pagadas', { count: formatNumber(legacyMetrics.today_sales_count || 0) })}</p>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">{`${t('admin.dashboard.metrics.classic.month_sales_usd', 'Ventas MES')} (${displayCurrency})`}</div>
            <div className="text-2xl font-semibold">{getMoneyValue('month_sales', displayCurrency, legacyMetrics.month_sales_usd || 0)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">{t('admin.dashboard.metrics.classic.paid_invoices_count', ':count facturas pagadas', { count: formatNumber(legacyMetrics.month_sales_count || 0) })}</p>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="text-xs uppercase text-muted-foreground mb-1">{t('admin.dashboard.metrics.classic.low_stock_products', 'Productos con stock bajo')}</div>
            <div className="text-2xl font-semibold">{formatNumber(legacyMetrics.low_stock_products || 0)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">{t('admin.dashboard.metrics.classic.low_stock_help', 'Incluye productos en cero o negativos.')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-white p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">{t('admin.dashboard.summary.invoices.title', 'Resumen de facturas')}</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t('admin.dashboard.summary.invoices.pending', 'Pendientes')}</dt>
                <dd className="font-medium">{formatNumber(legacyMetrics.invoice_pending || 0)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t('admin.dashboard.summary.invoices.paid', 'Pagadas')}</dt>
                <dd className="font-medium">{formatNumber(legacyMetrics.invoice_paid || 0)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t('admin.dashboard.summary.invoices.cancelled', 'Anuladas')}</dt>
                <dd className="font-medium">{formatNumber(legacyMetrics.invoice_cancelled || 0)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-white p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">{t('admin.dashboard.summary.inventory.title', 'Inventario general')}</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t('admin.dashboard.summary.inventory.total_stock', 'Stock total')}</dt>
                <dd className="font-medium">{formatNumber(legacyMetrics.total_stock || 0)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t('admin.dashboard.summary.inventory.products', 'Productos')}</dt>
                <dd className="font-medium">{formatNumber(counts.products || 0)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t('admin.dashboard.summary.inventory.categories', 'Categorías')}</dt>
                <dd className="font-medium">{formatNumber(counts.categories || 0)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-white p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">{t('admin.dashboard.summary.operations.title', 'Operaciones abiertas')}</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t('admin.dashboard.summary.operations.rma_pending', 'RMA pendientes/aprobadas')}</dt>
                <dd className="font-medium">{formatNumber(legacyMetrics.rma_pending || 0)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t('admin.dashboard.summary.operations.active_layaways', 'Apartados activos')}</dt>
                <dd className="font-medium">{formatNumber(legacyMetrics.layaway_active || 0)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t('admin.dashboard.summary.operations.active_credits', 'Créditos activos')}</dt>
                <dd className="font-medium">{formatNumber(legacyMetrics.credit_open || 0)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Gráfico de ventas por día */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-white p-4 lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">{`${t('admin.dashboard.charts.sales.title', 'Ventas por día')} (${displayCurrency})`}</h2>
              <span className="text-xs text-muted-foreground">{t('admin.dashboard.charts.sales.comparison', 'Comparación últimos 30 días vs período anterior')}</span>
            </div>
            <div className="h-64">
              <Line data={salesData} options={salesOptions} />
            </div>
          </div>

          {/* Distribución crédito vs contado */}
          <div className="rounded-lg border border-border bg-white p-4 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">{t('admin.dashboard.charts.distribution.title', 'Distribución ventas crédito/contado')}</h2>
              <p className="text-xs text-muted-foreground mb-2">
                {t('admin.dashboard.charts.distribution.description', 'Muestra el peso relativo de las ventas a crédito frente a las de contado en el período actual.')}
              </p>
            </div>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  {t('admin.dashboard.charts.distribution.credit', 'Crédito')}
                </span>
                <span>{formatPercent(creditShare)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  {t('admin.dashboard.charts.distribution.cash', 'Contado')}
                </span>
                <span>{formatPercent(cashShare)}</span>
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
            <h2 className="text-sm font-semibold text-foreground mb-2">{t('admin.dashboard.charts.top_products.title', 'Top productos (por cantidad)')}</h2>
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
              <p className="text-xs text-muted-foreground">{t('admin.dashboard.charts.empty', 'No hay datos para el período seleccionado.')}</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-white p-4">
            <h2 className="text-sm font-semibold text-foreground mb-2">{`${t('admin.dashboard.charts.top_customers.title', 'Top clientes por ventas')} (${displayCurrency})`}</h2>
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
              <p className="text-xs text-muted-foreground">{t('admin.dashboard.charts.empty', 'No hay datos para el período seleccionado.')}</p>
            )}
          </div>
        </div>

        {/* Gestión rápida de módulos */}
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">{t('admin.dashboard.quick_links.title', 'Gestionar módulos')}</h2>
            <p className="text-xs text-muted-foreground">{t('admin.dashboard.quick_links.description', 'Accesos directos a secciones clave del sistema.')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <Link href={route('admin.products.index')} className="border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
              <div className="font-medium">{t('admin.dashboard.quick_links.items.products.title', 'Productos')}</div>
              <div className="text-xs text-muted-foreground">{t('admin.dashboard.quick_links.items.products.description', 'Gestionar catálogo y stock.')}</div>
            </Link>
            <Link href={route('admin.categories.index')} className="border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
              <div className="font-medium">{t('admin.dashboard.quick_links.items.categories.title', 'Categorías')}</div>
              <div className="text-xs text-muted-foreground">{t('admin.dashboard.quick_links.items.categories.description', 'Organizar productos por familia.')}</div>
            </Link>
            <Link href={route('admin.providers.index')} className="border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
              <div className="font-medium">{t('admin.dashboard.quick_links.items.providers.title', 'Proveedores')}</div>
              <div className="text-xs text-muted-foreground">{t('admin.dashboard.quick_links.items.providers.description', 'Ver y actualizar proveedores.')}</div>
            </Link>
            <Link href={route('admin.invoices.index')} className="border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
              <div className="font-medium">{t('admin.dashboard.quick_links.items.invoices.title', 'Facturas')}</div>
              <div className="text-xs text-muted-foreground">{t('admin.dashboard.quick_links.items.invoices.description', 'Histórico y gestión de ventas.')}</div>
            </Link>
            <Link href={route('admin.customers.index')} className="border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
              <div className="font-medium">{t('admin.dashboard.quick_links.items.customers.title', 'Clientes')}</div>
              <div className="text-xs text-muted-foreground">{t('admin.dashboard.quick_links.items.customers.description', 'Administrar cartera de clientes.')}</div>
            </Link>
            <Link href={route('admin.users.index')} className="border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
              <div className="font-medium">{t('admin.dashboard.quick_links.items.users.title', 'Usuarios')}</div>
              <div className="text-xs text-muted-foreground">{t('admin.dashboard.quick_links.items.users.description', 'Permisos y accesos al sistema.')}</div>
            </Link>
            <Link href={route('admin.rmas.index')} className="border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
              <div className="font-medium">{t('admin.dashboard.quick_links.items.rmas.title', 'Devoluciones (RMA)')}</div>
              <div className="text-xs text-muted-foreground">{t('admin.dashboard.quick_links.items.rmas.description', 'Gestionar garantías y devoluciones.')}</div>
            </Link>
            <Link href={route('admin.warehouses.index')} className="border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
              <div className="font-medium">{t('admin.dashboard.quick_links.items.warehouses.title', 'Sucursales/Bodegas')}</div>
              <div className="text-xs text-muted-foreground">{t('admin.dashboard.quick_links.items.warehouses.description', 'Configurar almacenes físicos.')}</div>
            </Link>
            <Link href={route('admin.credits.index')} className="border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
              <div className="font-medium">{t('admin.dashboard.quick_links.items.credits.title', 'Créditos')}</div>
              <div className="text-xs text-muted-foreground">{t('admin.dashboard.quick_links.items.credits.description', 'Cuentas de crédito de clientes.')}</div>
            </Link>
          </div>
        </div>

        {/* Listas de alerta: stock bajo y apartados vencidos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-white p-4">
            <h2 className="text-sm font-semibold text-foreground mb-2">{t('admin.dashboard.alerts.low_stock.title', 'Productos con stock bajo')}</h2>
            {lowStockProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-border text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left py-1 pr-2">{t('admin.dashboard.alerts.low_stock.headers.sku', 'SKU')}</th>
                      <th className="text-left py-1 pr-2">{t('admin.dashboard.alerts.low_stock.headers.product', 'Producto')}</th>
                      <th className="text-right py-1 pr-2">{t('admin.dashboard.alerts.low_stock.headers.stock', 'Stock')}</th>
                      <th className="text-right py-1 pr-2">{t('admin.dashboard.alerts.low_stock.headers.min_stock', 'Mín.')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((p) => (
                      <tr key={p.id} className="border-b border-border/60 last:border-0">
                        <td className="py-1 pr-2 text-xs text-muted-foreground">{p.sku}</td>
                        <td className="py-1 pr-2">{p.name}</td>
                        <td className="py-1 pr-2 text-right font-medium">{formatNumber(p.stock)}</td>
                        <td className="py-1 pr-2 text-right text-xs text-muted-foreground">{p.min_stock ?? t('admin.dashboard.alerts.low_stock.values.empty_dash', '—')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t('admin.dashboard.alerts.low_stock.empty', 'No hay productos con stock bajo según la configuración actual.')}</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-white p-4">
            <h2 className="text-sm font-semibold text-foreground mb-2">{t('admin.dashboard.alerts.expired_layaways.title', 'Apartados vencidos')}</h2>
            {expiredLayaways.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-border text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left py-1 pr-2">{t('admin.dashboard.alerts.expired_layaways.headers.number', 'N°')}</th>
                      <th className="text-left py-1 pr-2">{t('admin.dashboard.alerts.expired_layaways.headers.customer', 'Cliente')}</th>
                      <th className="text-right py-1 pr-2">{`${t('admin.dashboard.alerts.expired_layaways.headers.total_usd', 'Total')} ${displayCurrency}`}</th>
                      <th className="text-left py-1 pr-2">{t('admin.dashboard.alerts.expired_layaways.headers.expires_at', 'Vence')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiredLayaways.map((l) => (
                      <tr key={l.id} className="border-b border-border/60 last:border-0">
                        <td className="py-1 pr-2 text-xs text-muted-foreground">{l.number}</td>
                        <td className="py-1 pr-2">{l.customer?.name || t('admin.dashboard.alerts.expired_layaways.customer_fallback', 'Sin cliente')}</td>
                        <td className="py-1 pr-2 text-right font-medium">{l.document_totals?.[displayCurrency] !== undefined ? formatServerAmount(displayCurrency, l.document_totals[displayCurrency]) : formatActiveAmount(l.total_usd || 0)}</td>
                        <td className="py-1 pr-2 text-xs text-muted-foreground">{formatDate(l.expires_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t('admin.dashboard.alerts.expired_layaways.empty', 'No hay apartados vencidos en este momento.')}</p>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
