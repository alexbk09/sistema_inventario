import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';
import { Kanban, List, Eye, User, Calendar, DollarSign, ArrowUpCircle, ArrowDownCircle, LayoutGrid } from 'lucide-react';

const STATUS_COLORS = {
  pending:   { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', header: 'bg-amber-100 dark:bg-amber-900/30', badge: 'bg-amber-500' },
  paid:      { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', header: 'bg-emerald-100 dark:bg-emerald-900/30', badge: 'bg-emerald-500' },
  shipped:   { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', header: 'bg-blue-100 dark:bg-blue-900/30', badge: 'bg-blue-500' },
  delivered: { bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-800', header: 'bg-teal-100 dark:bg-teal-900/30', badge: 'bg-teal-500' },
  cancelled: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', header: 'bg-red-100 dark:bg-red-900/30', badge: 'bg-red-500' },
};

const DEFAULT_COLOR = { bg: 'bg-slate-50 dark:bg-slate-900/20', border: 'border-slate-200 dark:border-slate-800', header: 'bg-slate-100 dark:bg-slate-900/30', badge: 'bg-slate-500' };

export default function KanbanView({ columns, adminCurrencyContext = {} }) {
  const { t } = useI18n();
  const { formatPriceFromUsd } = useConfiguredCurrencyRates();
  const displayCurrency = adminCurrencyContext?.displayCurrency ?? 'USD';
  const formatAmount = (value) => formatPriceFromUsd(Number(value || 0), displayCurrency);

  const [draggingId, setDraggingId] = useState(null);

  const totalsByColumn = useMemo(() => {
    return columns.map(col => ({
      count: col.invoices.length,
      total: col.invoices.reduce((sum, inv) => sum + Number(inv.total_display || inv.total_usd || 0), 0),
    }));
  }, [columns]);

  const handleDragStart = (e, invoiceId) => {
    setDraggingId(invoiceId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetStatusCode) => {
    e.preventDefault();
    if (!draggingId) return;
    
    // Aquí se puede implementar el cambio de estado vía API
    // Por ahora solo feedback visual
    setDraggingId(null);
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.invoices.kanban_title', 'Kanban de Facturas')} />

      <div className="p-4 lg:p-6">
        {/* Header con toggle de vista */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-primary" />
              {t('admin.invoices.kanban_title', 'Kanban de Facturas')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('admin.invoices.kanban_subtitle', 'Vista pipeline por estado. Arrastra para cambiar estado.')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={route('admin.invoices.index')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium transition-colors"
            >
              <List className="w-4 h-4" />
              {t('admin.invoices.view_list', 'Lista')}
            </Link>
            <Link
              href={route('admin.invoices.create')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {t('admin.invoices.new', 'Nueva')}
            </Link>
          </div>
        </div>

        {/* Kanban Columns */}
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)]">
          {columns.map((col, idx) => {
            const colors = STATUS_COLORS[col.code] || DEFAULT_COLOR;
            const totals = totalsByColumn[idx];

            return (
              <div
                key={col.id}
                className={`flex-shrink-0 w-80 flex flex-col rounded-xl border ${colors.border} ${colors.bg} max-h-full`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.code)}
              >
                {/* Column Header */}
                <div className={`p-3 rounded-t-xl border-b ${colors.border} ${colors.header}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colors.badge}`} />
                      <h3 className="font-semibold text-sm">{col.name}</h3>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white dark:bg-black/20">
                      {totals.count}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatAmount(totals.total)}
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  {col.invoices.map((inv) => (
                    <div
                      key={inv.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, inv.id)}
                      className="bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-move group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{inv.number}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {inv.customer?.name || t('admin.invoices.walking_customer', 'Cliente ocasional')}
                          </p>
                        </div>
                        <span className="text-xs font-semibold whitespace-nowrap">
                          {formatAmount(inv.total_display)}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(inv.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <ArrowUpCircle className="w-3 h-3" />
                          {inv.items?.length || 0}
                        </span>
                      </div>

                      {/* Quick Actions */}
                      <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={route('admin.invoices.show', inv.id)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title={t('admin.common.view', 'Ver')}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}

                  {col.invoices.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                      {t('admin.invoices.empty_column', 'Sin facturas')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
