import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';
import { TrendingUp, TrendingDown, DollarSign, ArrowDownRight, ArrowUpRight } from 'lucide-react';
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

export default function CashFlowReport({ cashFlow, filters = {}, globalTotals = {}, chartData = {}, adminCurrencyContext = {} }) {
  const { t } = useI18n();
  const { formatNumber, formatCurrency } = useLocaleFormat();
  const { displayCurrency, formatPriceFromUsd } = useConfiguredCurrencyRates();
  const formatActiveAmount = (value) => formatPriceFromUsd(Number(value || 0), displayCurrency);
  const formatServerAmount = (code, value) => formatCurrency(Number(value || 0), code);

  const [localFilters, setLocalFilters] = useState({
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
    period: filters.period || 'daily',
  });

  const submitFilters = () => {
    router.get(route('admin.reports.cash_flow'), {
      ...localFilters,
    }, { preserveScroll: true, replace: true });
  };

  const chartLabels = chartData.labels || [];
  const incomeData = chartData.income || [];
  const expenseData = chartData.expense || [];
  const netData = chartData.net || [];

  const chartConfig = {
    labels: chartLabels,
    datasets: [
      {
        label: t('admin.reports.cash_flow.chart.income', 'Ingresos'),
        data: incomeData,
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.3,
      },
      //{
        //label: t('admin.reports.cash_flow.chart.expense', 'Egresos'),
        //data: expenseData,
        //borderColor: 'rgba(239, 68, 68, 1)',
        //backgroundColor: 'rgba(239, 68, 68, 0.1)',
        //fill: true,
        //tension: 0.3,
      //},
      {
        label: t('admin.reports.cash_flow.chart.net', 'Flujo Neto'),
        data: netData,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
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

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.reports.cash_flow.page_title', 'Reporte de Flujo de Caja')} />
      <AdminIndexShell
        title={t('admin.reports.cash_flow.hero_title', 'Analiza el flujo de caja de tu negocio')}
        description={t('admin.reports.cash_flow.hero_description', 'Visualiza ingresos vs egresos por período para entender la salud financiera.')}
        stats={[
          { 
            label: t('admin.reports.cash_flow.stats.total_income', 'Ingresos Totales'), 
            value: globalTotals.total_income_admin_totals?.[displayCurrency] !== undefined
              ? formatServerAmount(displayCurrency, globalTotals.total_income_admin_totals[displayCurrency])
              : formatActiveAmount(globalTotals.total_income || 0),
            icon: TrendingUp,
            iconColor: 'text-emerald-600',
            iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
          },
          { 
            label: t('admin.reports.cash_flow.stats.total_expense', 'Egresos Totales'), 
            value: globalTotals.total_expense_admin_totals?.[displayCurrency] !== undefined
              ? formatServerAmount(displayCurrency, globalTotals.total_expense_admin_totals[displayCurrency])
              : formatActiveAmount(globalTotals.total_expense || 0),
            icon: TrendingDown,
            iconColor: 'text-rose-600',
            iconBg: 'bg-rose-50 dark:bg-rose-900/20',
          },
          { 
            label: t('admin.reports.cash_flow.stats.net_cash_flow', 'Flujo Neto'), 
            value: globalTotals.net_cash_flow_admin_totals?.[displayCurrency] !== undefined
              ? formatServerAmount(displayCurrency, globalTotals.net_cash_flow_admin_totals[displayCurrency])
              : formatActiveAmount(globalTotals.net_cash_flow || 0),
            icon: globalTotals.net_cash_flow >= 0 ? ArrowUpRight : ArrowDownRight,
            iconColor: globalTotals.net_cash_flow >= 0 ? 'text-blue-600' : 'text-rose-600',
            iconBg: globalTotals.net_cash_flow >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-rose-50 dark:bg-rose-900/20',
          },
        ]}
        contextTitle={t('admin.reports.cash_flow.context_title', 'Flujo de Caja')}
        contextDescription={t('admin.reports.cash_flow.context_description', 'Análisis de ingresos vs egresos por período.')}
        contextItems={[
          { label: t('admin.reports.cash_flow.context_items.period', 'Período'), value: localFilters.period === 'daily' ? t('admin.reports.cash_flow.context_items.daily', 'Diario') : localFilters.period === 'weekly' ? t('admin.reports.cash_flow.context_items.weekly', 'Semanal') : t('admin.reports.cash_flow.context_items.monthly', 'Mensual') },
          { label: t('admin.reports.cash_flow.context_items.date_range', 'Rango'), value: `${filters.date_from} - ${filters.date_to}` },
          { label: t('admin.reports.cash_flow.context_items.periods', 'Períodos'), value: cashFlow.length },
        ]}
        filters={
          <div className="space-y-4 text-sm">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.cash_flow.filters.date_from', 'Desde')}</label>
                  <input
                    type="date"
                    className="w-full border border-border rounded px-2 py-1 bg-background"
                    value={localFilters.date_from}
                    onChange={(e) => setLocalFilters((f) => ({ ...f, date_from: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.cash_flow.filters.date_to', 'Hasta')}</label>
                  <input
                    type="date"
                    className="w-full border border-border rounded px-2 py-1 bg-background"
                    value={localFilters.date_to}
                    onChange={(e) => setLocalFilters((f) => ({ ...f, date_to: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reports.cash_flow.filters.period', 'Agrupar por')}</label>
                  <select
                    className="w-full border border-border rounded px-2 py-1 bg-background"
                    value={localFilters.period}
                    onChange={(e) => setLocalFilters((f) => ({ ...f, period: e.target.value }))}
                  >
                    <option value="daily">{t('admin.reports.cash_flow.filters.daily', 'Diario')}</option>
                    <option value="weekly">{t('admin.reports.cash_flow.filters.weekly', 'Semanal')}</option>
                    <option value="monthly">{t('admin.reports.cash_flow.filters.monthly', 'Mensual')}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                  onClick={() => {
                    setLocalFilters({
                      date_from: '',
                      date_to: '',
                      period: 'daily',
                    });
                    router.get(route('admin.reports.cash_flow'), {}, { replace: true });
                  }}
                >
                  {t('admin.reports.cash_flow.actions.clear_filters', 'Limpiar')}
                </button>
                <button
                  type="button"
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                  onClick={submitFilters}
                >
                  {t('admin.reports.cash_flow.actions.apply', 'Aplicar')}
                </button>
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-4 p-6">
          {/* Gráfico de flujo de caja */}
          <div className="rounded-lg border border-border bg-white p-4">
            <h3 className="text-sm font-semibold mb-4">{t('admin.reports.cash_flow.chart.title', 'Flujo de Caja por Período')}</h3>
            <div className="h-64">
              <Line data={chartConfig} options={chartOptions} />
            </div>
          </div>

          {/* Tabla de flujo de caja */}
          <div className="overflow-x-auto rounded-lg border border-border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">{t('admin.reports.cash_flow.table.period', 'Período')}</th>
                  <th className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.cash_flow.table.income', 'Ingresos')} ${displayCurrency}`}</th>
                  <th className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.cash_flow.table.expense', 'Egresos')} ${displayCurrency}`}</th>
                  <th className="px-3 py-2 text-right font-semibold">{`${t('admin.reports.cash_flow.table.net', 'Flujo Neto')} ${displayCurrency}`}</th>
                  <th className="px-3 py-2 text-right font-semibold">{t('admin.reports.cash_flow.table.invoices', 'Facturas')}</th>
                  <th className="px-3 py-2 text-right font-semibold">{t('admin.reports.cash_flow.table.movements', 'Movimientos')}</th>
                </tr>
              </thead>
              <tbody>
                {cashFlow.map((item) => (
                  <tr key={item.period} className="border-b border-border hover:bg-muted/40">
                    <td className="px-3 py-2 text-xs font-medium">{item.period}</td>
                    <td className="px-3 py-2 text-xs text-right text-emerald-600">
                      {item.total_income_admin_totals?.[displayCurrency] !== undefined
                        ? formatServerAmount(displayCurrency, item.total_income_admin_totals[displayCurrency])
                        : formatActiveAmount(item.total_income)}
                    </td>
                    <td className="px-3 py-2 text-xs text-right text-rose-600">
                      {item.total_expense_admin_totals?.[displayCurrency] !== undefined
                        ? formatServerAmount(displayCurrency, item.total_expense_admin_totals[displayCurrency])
                        : formatActiveAmount(item.total_expense)}
                    </td>
                    <td className={`px-3 py-2 text-xs text-right font-semibold ${item.net_cash_flow >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                      {item.net_cash_flow_admin_totals?.[displayCurrency] !== undefined
                        ? formatServerAmount(displayCurrency, item.net_cash_flow_admin_totals[displayCurrency])
                        : formatActiveAmount(item.net_cash_flow)}
                    </td>
                    <td className="px-3 py-2 text-xs text-right">{item.invoice_count}</td>
                    <td className="px-3 py-2 text-xs text-right">{item.movement_count}</td>
                  </tr>
                ))}
                {cashFlow.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">
                      {t('admin.reports.cash_flow.empty', 'No hay datos para el período seleccionado.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AdminIndexShell>
    </AuthenticatedLayout>
  );
}
