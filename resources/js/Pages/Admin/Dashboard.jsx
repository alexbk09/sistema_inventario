import { Head, router, Link } from '@inertiajs/react';
import { useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import { useI18n } from '@/Hooks/useI18n.ts';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat.ts';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';
import StatsCard from '@/Components/admin/StatsCard';
import PageHeader from '@/Components/admin/PageHeader';
import CurrencyWidget from '@/Components/admin/CurrencyWidget';
import SalesHeatmap from '@/Components/admin/SalesHeatmap';
import {
  ShoppingCart, TrendingUp, Package, AlertTriangle, DollarSign,
  CreditCard, BarChart2, Users, RotateCcw, BookOpen, Wallet,
  ArrowRight, Clock, Layers, Activity, FileText, Zap, ExternalLink
} from 'lucide-react';
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

const ACTIVITY_STATUS = {
  pending:   { color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  paid:      { color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  shipped:   { color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  delivered: { color: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  cancelled: { color: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  open:      { color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  resolved:  { color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

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
  recentActivity = [],
  creditAlerts = [],
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

  const salesSparkData = useMemo(() => salesChart.current?.slice(-14) || [], [salesChart]);

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.dashboard.page_title', 'Dashboard')} />
      <div className="space-y-6">

        <PageHeader
          title={t('admin.dashboard.title', 'Dashboard')}
          description={t('admin.dashboard.description', 'Resumen rápido de ventas, clientes y productos de los últimos 30 días.')}
          icon={BarChart2}
          actions={
            <div className="flex gap-2 items-end">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.dashboard.filters.warehouse', 'Sucursal')}</label>
                <select
                  className="border border-border rounded-lg px-3 py-1.5 bg-card text-sm focus:ring-2 focus:ring-ring focus:outline-none"
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
              <Link
                href={route('admin.invoices.create')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                {t('admin.dashboard.actions.new_invoice', 'Nueva venta')}
              </Link>
            </div>
          }
        />

        {/* KPIs principales — row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label={`${t('admin.dashboard.metrics.analytics.total_sales_usd', 'Ventas 30 días')} ${displayCurrency}`}
            value={getMoneyValue('total_sales', displayCurrency, metrics.total_usd || 0)}
            icon={TrendingUp}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50 dark:bg-emerald-900/20"
            sparkData={salesSparkData}
            sparkColor="#10B981"
            trendLabel={t('admin.dashboard.metrics.analytics.vs_prev', 'vs período anterior')}
          />
          <StatsCard
            label={t('admin.dashboard.metrics.analytics.total_invoices', 'Facturas (30 días)')}
            value={formatNumber(metrics.total_invoices ?? 0)}
            icon={ShoppingCart}
            iconColor="text-blue-600"
            iconBg="bg-blue-50 dark:bg-blue-900/20"
            sparkColor="#3B82F6"
          />
          <StatsCard
            label={`${t('admin.dashboard.metrics.analytics.avg_ticket_usd', 'Ticket promedio')} ${displayCurrency}`}
            value={getMoneyValue('avg_ticket', displayCurrency, metrics.avg_ticket_usd || 0)}
            icon={DollarSign}
            iconColor="text-violet-600"
            iconBg="bg-violet-50 dark:bg-violet-900/20"
            sparkColor="#7C3AED"
          />
          <StatsCard
            label={t('admin.dashboard.metrics.classic.low_stock_products', 'Stock bajo')}
            value={formatNumber(legacyMetrics.low_stock_products || 0)}
            icon={AlertTriangle}
            iconColor="text-amber-600"
            iconBg="bg-amber-50 dark:bg-amber-900/20"
            sparkColor="#F59E0B"
            trendLabel={t('admin.dashboard.metrics.classic.low_stock_help', 'Productos en cero o bajo mínimo')}
          />
        </div>

        {/* KPIs secundarios — row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CurrencyWidget initialRate={rate} />
          <StatsCard
            label={`${t('admin.dashboard.metrics.classic.today_sales_usd', 'Ventas HOY')} (${displayCurrency})`}
            value={getMoneyValue('today_sales', displayCurrency, legacyMetrics.today_sales_usd || 0)}
            subvalue={t('admin.dashboard.metrics.classic.paid_invoices_count', ':count facturas pagadas', { count: formatNumber(legacyMetrics.today_sales_count || 0) })}
            icon={Clock}
            iconColor="text-sky-600"
            iconBg="bg-sky-50 dark:bg-sky-900/20"
            sparkColor="#0EA5E9"
          />
          <StatsCard
            label={t('admin.dashboard.metrics.analytics.credit_sales', 'Ventas a crédito')}
            value={getMoneyValue('credit_sales', displayCurrency, metrics.credit_sales_usd || 0)}
            subvalue={t('admin.dashboard.metrics.analytics.share_of_total', ':percent del total', { percent: formatPercent(creditShare) })}
            icon={CreditCard}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50 dark:bg-indigo-900/20"
            sparkColor="#6366F1"
          />
          <StatsCard
            label={`${t('admin.dashboard.metrics.analytics.margin_usd', 'Margen estimado')} ${displayCurrency}`}
            value={getMoneyValue('margin', displayCurrency, metrics.margin_usd || 0)}
            icon={Layers}
            iconColor="text-rose-600"
            iconBg="bg-rose-50 dark:bg-rose-900/20"
            sparkColor="#E11D48"
          />
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-primary" />{t('admin.dashboard.summary.invoices.title', 'Resumen de facturas')}</h2>
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

          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-primary" />{t('admin.dashboard.summary.inventory.title', 'Inventario general')}</h2>
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

          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Layers className="w-4 h-4 text-primary" />{t('admin.dashboard.summary.operations.title', 'Operaciones abiertas')}</h2>
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
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">{`${t('admin.dashboard.charts.sales.title', 'Ventas por día')} (${displayCurrency})`}</h2>
              <span className="text-xs text-muted-foreground">{t('admin.dashboard.charts.sales.comparison', 'Comparación últimos 30 días vs período anterior')}</span>
            </div>
            <div className="h-64">
              <Line data={salesData} options={salesOptions} />
            </div>
          </div>

          {/* Distribución crédito vs contado */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
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

        {/* Heatmap ventas por hora/día */}
        <SalesHeatmap heatmap={charts.heatmap ?? []} />

        {/* Top productos y clientes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
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

          <div className="rounded-xl border border-border bg-card p-5">
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
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">{t('admin.dashboard.quick_links.title', 'Accesos rápidos')}</h2>
            <p className="text-xs text-muted-foreground hidden sm:block">{t('admin.dashboard.quick_links.description', 'Accesos directos a secciones clave.')}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {[
              { href: route('admin.products.index'), icon: Package, label: t('admin.dashboard.quick_links.items.products.title', 'Productos'), color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { href: route('admin.invoices.index'), icon: ShoppingCart, label: t('admin.dashboard.quick_links.items.invoices.title', 'Facturas'), color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { href: route('admin.customers.index'), icon: Users, label: t('admin.dashboard.quick_links.items.customers.title', 'Clientes'), color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
              { href: route('admin.rmas.index'), icon: RotateCcw, label: t('admin.dashboard.quick_links.items.rmas.title', 'RMA'), color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
              { href: route('admin.credits.index'), icon: Wallet, label: t('admin.dashboard.quick_links.items.credits.title', 'Créditos'), color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
              { href: route('admin.layaways.index'), icon: BookOpen, label: t('admin.dashboard.quick_links.items.layaways', 'Apartados'), color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { href: route('admin.warehouses.index'), icon: Layers, label: t('admin.dashboard.quick_links.items.warehouses.title', 'Bodegas'), color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
              { href: route('admin.providers.index'), icon: BarChart2, label: t('admin.dashboard.quick_links.items.providers.title', 'Proveedores'), color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800' },
            ].map(({ href, icon: Icon, label, color, bg }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group text-center"
              >
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <span className="text-xs font-medium text-foreground truncate w-full">{label}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>

        {/* Feed de actividad reciente */}
        {recentActivity.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                {t('admin.dashboard.activity.title', 'Actividad reciente')}
              </h2>
              <Link href={route('admin.invoices.index')} className="text-xs text-primary hover:underline flex items-center gap-1">
                {t('admin.common.see_all', 'Ver todo')} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-1">
              {recentActivity.map((item, i) => {
                const statusCfg = ACTIVITY_STATUS[item.status] ?? { color: 'bg-muted text-muted-foreground' };
                const isInvoice = item.type === 'invoice';
                const href = isInvoice ? route('admin.invoices.index') : route('admin.rmas.index');
                const timeAgo = item.created_at
                  ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '';
                return (
                  <div key={i} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/40 transition-colors group">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isInvoice ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'
                    }`}>
                      {isInvoice
                        ? <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
                        : <RotateCcw className="w-3.5 h-3.5 text-rose-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground font-mono">{item.label}</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusCfg.color}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {item.amount_usd != null && (
                        <p className="text-xs font-semibold text-foreground">${item.amount_usd.toFixed(2)}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Alertas accionables: 3 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Stock bajo */}
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-amber-100 dark:border-amber-900/30 bg-amber-50/60 dark:bg-amber-900/10 rounded-t-xl">
              <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {t('admin.dashboard.alerts.low_stock.title', 'Stock bajo')}
                {lowStockProducts.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200 text-[10px] font-bold">
                    {lowStockProducts.length}
                  </span>
                )}
              </h2>
              <Link href={route('admin.products.index')} className="text-xs text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1">
                {t('admin.common.see_all', 'Ver todos')} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {lowStockProducts.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xs text-muted-foreground">{t('admin.dashboard.alerts.low_stock.empty', 'Stock en niveles óptimos')}</p>
                </div>
              ) : lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 group hover:bg-muted/30 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    p.stock <= 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
                  }`}>
                    <Package className={`w-3.5 h-3.5 ${ p.stock <= 0 ? 'text-red-500' : 'text-amber-500' }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${ p.stock <= 0 ? 'text-red-600' : 'text-amber-600' }`}>{p.stock}</p>
                    <p className="text-[10px] text-muted-foreground">mín {p.min_stock ?? '—'}</p>
                  </div>
                  <Link
                    href={route('admin.products.inventory.index', p.id)}
                    className="shrink-0 p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition opacity-0 group-hover:opacity-100"
                    title="Ir al inventario"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Apartados vencidos */}
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-rose-100 dark:border-rose-900/30 bg-rose-50/60 dark:bg-rose-900/10 rounded-t-xl">
              <h2 className="text-sm font-semibold text-rose-800 dark:text-rose-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {t('admin.dashboard.alerts.expired_layaways.title', 'Apartados vencidos')}
                {expiredLayaways.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-200 text-[10px] font-bold">
                    {expiredLayaways.length}
                  </span>
                )}
              </h2>
              <Link href={route('admin.layaways.index')} className="text-xs text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1">
                {t('admin.common.see_all', 'Ver todos')} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {expiredLayaways.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xs text-muted-foreground">{t('admin.dashboard.alerts.expired_layaways.empty', 'Sin apartados vencidos')}</p>
                </div>
              ) : expiredLayaways.map((l) => (
                <div key={l.id} className="flex items-center gap-3 px-4 py-2.5 group hover:bg-muted/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shrink-0">
                    <BookOpen className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{l.customer?.name || 'Sin cliente'}</p>
                    <p className="text-[10px] text-muted-foreground">{l.number} · vence {formatDate(l.expires_at)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-foreground">
                      {l.document_totals?.[displayCurrency] !== undefined
                        ? formatServerAmount(displayCurrency, l.document_totals[displayCurrency])
                        : formatActiveAmount(l.total_usd || 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{displayCurrency}</p>
                  </div>
                  <Link
                    href={route('admin.layaways.index')}
                    className="shrink-0 p-1.5 rounded-md bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-100 transition opacity-0 group-hover:opacity-100"
                    title="Ir a apartados"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Créditos al límite */}
          <div className="rounded-xl border border-violet-200 dark:border-violet-900/40 bg-card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-violet-100 dark:border-violet-900/30 bg-violet-50/60 dark:bg-violet-900/10 rounded-t-xl">
              <h2 className="text-sm font-semibold text-violet-800 dark:text-violet-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                {t('admin.dashboard.alerts.credits.title', 'Créditos al límite')}
                {creditAlerts.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-violet-200 dark:bg-violet-800 text-violet-900 dark:text-violet-200 text-[10px] font-bold">
                    {creditAlerts.length}
                  </span>
                )}
              </h2>
              <Link href={route('admin.credits.index')} className="text-xs text-violet-700 dark:text-violet-400 hover:underline flex items-center gap-1">
                {t('admin.common.see_all', 'Ver todos')} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {creditAlerts.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xs text-muted-foreground">{t('admin.dashboard.alerts.credits.empty', 'Sin créditos cerca del límite')}</p>
                </div>
              ) : creditAlerts.map((c) => (
                <div key={c.id} className="px-4 py-2.5 group hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-foreground truncate flex-1">{c.customer}</p>
                    <span className={`text-[10px] font-bold ml-2 ${
                      c.pct >= 100 ? 'text-red-600' : c.pct >= 90 ? 'text-orange-600' : 'text-amber-600'
                    }`}>{c.pct}%</span>
                    <Link
                      href={route('admin.credits.index')}
                      className="ml-2 p-1 rounded-md bg-violet-50 dark:bg-violet-900/20 text-violet-600 hover:bg-violet-100 transition opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        c.pct >= 100 ? 'bg-red-500' : c.pct >= 90 ? 'bg-orange-500' : 'bg-amber-400'
                      }`}
                      style={{ width: `${Math.min(c.pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    ${c.balance_usd.toFixed(2)} / ${c.limit_usd.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AuthenticatedLayout>
  );
}
