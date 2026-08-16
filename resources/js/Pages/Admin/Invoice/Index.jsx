import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import InvoiceModal from '@/Components/admin/invoice/InvoiceModal.jsx';
import PageHeader from '@/Components/admin/PageHeader.jsx';
import StatsCard from '@/Components/admin/StatsCard.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';
import {
  ShoppingCart, DollarSign, Clock, CheckCircle2, XCircle,
  Plus, Search, X, SlidersHorizontal, Eye, FileText, TrendingUp, LayoutGrid,
  Download, ChevronDown, FileDown, FileSpreadsheet
} from 'lucide-react';

const STATUS_CONFIG = {
  pending:   { color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',   dot: 'bg-amber-400' },
  paid:      { color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
  shipped:   { color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',    dot: 'bg-blue-500' },
  delivered: { color: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',   dot: 'bg-teal-500' },
  cancelled: { color: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',       dot: 'bg-red-500' },
};

export default function Index({ invoices, filters, adminCurrencyContext = {}, summary = {} }) {
  const { t } = useI18n();
  const { formatCurrency, formatNumber } = useLocaleFormat();
  const { displayCurrency, comparisonCurrency, formatPriceFromUsd, hasRateForCurrency } = useConfiguredCurrencyRates();
  const secondaryCurrency = comparisonCurrency && comparisonCurrency !== displayCurrency && hasRateForCurrency(comparisonCurrency)
    ? comparisonCurrency
    : null;
  const formatActiveAmount = (value, currency = displayCurrency) => formatPriceFromUsd(Number(value || 0), currency);
  const visibleCurrencyCodes = Array.isArray(adminCurrencyContext?.codes) && adminCurrencyContext.codes.length > 0
    ? adminCurrencyContext.codes
    : [displayCurrency, ...(secondaryCurrency ? [secondaryCurrency] : [])].filter(Boolean);
  const currencyColumns = [...new Set(visibleCurrencyCodes)];
  const formatServerAmount = (code, value) => formatCurrency(Number(value || 0), code);
  const { data: initialData } = invoices;
  const [invoicesData, setInvoicesData] = useState(initialData);
  
  // Actualizar datos cuando cambian las props
  useEffect(() => {
    setInvoicesData(initialData);
  }, [initialData]);
  
  const data = invoicesData;
  const page = invoices.current_page ?? invoices?.meta?.current_page ?? 1;
  const totalPages = invoices.last_page ?? invoices?.meta?.last_page ?? 1;
  const [search, setSearch] = useState(filters?.search ?? '');
  const [debounced, setDebounced] = useState(search);
  const isFirst = useRef(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState(filters?.status ?? '');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setShowExportMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExportMenu]);

  const buildExportUrl = (format) => {
    const params = new URLSearchParams();
    if (debounced) params.set('search', debounced);
    if (statusFilter) params.set('status', statusFilter);
    params.set('format', format);
    return route('admin.invoices.export') + '?' + params.toString();
  };

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 350); return () => clearTimeout(t); }, [search]);
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    router.get(route('admin.invoices.index'), {
      search: debounced,
      status: statusFilter || undefined,
      page: 1,
    }, { preserveScroll: true, preserveState: true, replace: true });
  }, [debounced, statusFilter]);

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.invoices.index'), { page: nextPage, search: debounced, status: statusFilter || undefined }, { preserveScroll: true, replace: true });
  };

  const activeFilters = [debounced, statusFilter].filter(Boolean).length;
  const clearFilters = () => { setSearch(''); setStatusFilter(''); };

  const typeLabels = {
    invoice: t('admin.invoices.document_types.invoice', 'Factura'),
    delivery_note: t('admin.invoices.document_types.delivery_note', 'Nota de entrega'),
    proforma: t('admin.invoices.document_types.proforma', 'Proforma'),
  };

  const statusNames = {
    pending: t('admin.invoices.statuses.pending', 'Pendiente'),
    paid: t('admin.invoices.statuses.paid', 'Pagado'),
    shipped: t('admin.invoices.statuses.shipped', 'Enviado'),
    delivered: t('admin.invoices.statuses.delivered', 'Entregado'),
    cancelled: t('admin.invoices.statuses.cancelled', 'Cancelado'),
  };

  const columns = [
    {
      key: 'number',
      label: t('admin.invoices.index.table.number', 'Número'),
      width: '15%',
      render: (v, row) => (
        <span className="font-mono text-xs font-semibold text-foreground">{v}</span>
      ),
    },
    {
      key: 'document_type',
      label: t('admin.invoices.index.table.type', 'Tipo'),
      width: '12%',
      render: (v, row) => (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <FileText className="w-3 h-3" />
          {typeLabels[row?.document_type] ?? typeLabels.invoice}
        </span>
      ),
    },
    {
      key: 'customer',
      label: t('admin.invoices.index.table.customer', 'Cliente'),
      width: '22%',
      render: (v, row) => (
        <span className="font-medium text-foreground text-sm">
          {row?.contact?.full_name ?? v?.name ?? t('admin.invoices.index.table.not_available', 'N/A')}
        </span>
      ),
    },
    {
      key: 'status',
      label: t('admin.invoices.index.table.status', 'Estado'),
      width: '13%',
      render: (value, row) => {
        const code = row?.status ?? row?.invoice_status?.code ?? '';
        const name = statusNames[code] ?? row?.invoice_status?.name ?? value;
        const cfg = STATUS_CONFIG[code] ?? { color: 'bg-muted text-muted-foreground', dot: 'bg-gray-400' };
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {name}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: t('admin.invoices.index.table.date', 'Fecha'),
      width: '13%',
      render: (v) => v ? new Date(v).toLocaleDateString() : '—',
    },
    ...currencyColumns.map((code) => ({
      key: `total_${code}`,
      label: code,
      width: '13%',
      render: (v, row) => (
        <span className="font-semibold text-foreground">
          {row?.document_totals?.[code] !== undefined
            ? formatServerAmount(code, row.document_totals[code])
            : formatActiveAmount(row?.total_usd ?? 0, code)}
        </span>
      ),
    })),
  ];

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  const handleStatusChange = async (newStatus) => {
    if (!selectedInvoice || isSubmittingStatus) return;
    
    // Validar que el estado realmente cambió
    if (newStatus === selectedInvoice.status) {
      toast.info(t('admin.invoices.status_no_change', 'El estado no ha cambiado'));
      return;
    }
    
    setIsSubmittingStatus(true);
    
    try {
      // Preparar items desde la factura actual
      const items = selectedInvoice.items?.map(item => ({
        id: item.id,
        quantity: item.quantity,
      })) || [];

      // Axios maneja CSRF automáticamente
      await axios.put(`/admin/invoices/${selectedInvoice.id}`, {
        status: newStatus,
        items: items,
      }, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        }
      });

      // Actualizar la factura en la lista
      setInvoicesData((prevData) =>
        prevData.map((inv) =>
          inv.id === selectedInvoice.id ? { 
            ...inv, 
            status: newStatus,
            invoice_status: {
              ...inv.invoice_status,
              code: newStatus,
              name: statusNames[newStatus]
            }
          } : inv
        )
      );

      // Actualizar la factura seleccionada
      setSelectedInvoice((prev) => ({ 
        ...prev, 
        status: newStatus,
        invoice_status: {
          ...prev.invoice_status,
          code: newStatus,
          name: statusNames[newStatus]
        }
      }));
      
      toast.success(t('admin.invoices.status_updated', 'Estado actualizado correctamente'));
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error(error.response?.data?.message || error.message || t('admin.invoices.status_update_error', 'Error al actualizar el estado'));
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.invoices.index.page_title', 'Facturas')} />

      <PageHeader
        title={t('admin.invoices.index.page_title', 'Facturas')}
        description={t('admin.invoices.index.context_description', 'Historial de ventas, estados y totales.')}
        icon={ShoppingCart}
        breadcrumbs={[
          { label: 'Dashboard', href: route('dashboard') },
          { label: t('admin.invoices.index.page_title', 'Facturas') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {/* Export dropdown */}
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setShowExportMenu(v => !v)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border bg-background rounded-lg hover:bg-muted transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-1 w-44 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  <a
                    href={buildExportUrl('excel')}
                    onClick={() => setShowExportMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Excel (.xlsx)
                  </a>
                  <a
                    href={buildExportUrl('csv')}
                    onClick={() => setShowExportMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                  >
                    <FileDown className="w-4 h-4 text-blue-600" />
                    CSV
                  </a>
                  <a
                    href={buildExportUrl('pdf')}
                    onClick={() => setShowExportMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                    target="_blank" rel="noopener noreferrer"
                  >
                    <FileText className="w-4 h-4 text-red-600" />
                    PDF
                  </a>
                </div>
              )}
            </div>
            <Link
              href={route('admin.invoices.kanban')}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border bg-background rounded-lg hover:bg-muted transition-colors"
              title={t('admin.invoices.kanban_view', 'Vista Kanban')}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">{t('admin.invoices.kanban_view', 'Kanban')}</span>
            </Link>
            <Link
              href={route('admin.invoices.create')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('admin.invoices.index.actions.new_invoice', 'Nueva factura')}
            </Link>
          </div>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          label={t('admin.invoices.index.stats.total', 'Total facturas')}
          value={formatNumber(summary?.total ?? invoices?.total ?? data.length)}
          icon={ShoppingCart}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          sparkColor="#3B82F6"
        />
        <StatsCard
          label={t('admin.invoices.index.stats.pending', 'Pendientes')}
          value={formatNumber(summary?.pending ?? 0)}
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          sparkColor="#F59E0B"
        />
        <StatsCard
          label={t('admin.invoices.index.stats.paid', 'Pagadas')}
          value={formatNumber(summary?.paid ?? 0)}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          sparkColor="#10B981"
        />
        <StatsCard
          label={`${t('admin.invoices.index.stats.revenue', 'Ingresos')} ${displayCurrency}`}
          value={summary?.revenue_display ?? '—'}
          icon={TrendingUp}
          iconColor="text-violet-600"
          iconBg="bg-violet-50 dark:bg-violet-900/20"
          sparkColor="#7C3AED"
        />
      </div>

      {/* Table section */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-border">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.invoices.index.filters.search_placeholder', 'Buscar por número o cliente...')}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-ring focus:outline-none"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(v => !v)}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
              showFilters || statusFilter ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:bg-muted'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t('admin.common.filters', 'Filtros')}
            {activeFilters > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Status filter chips */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground mr-1">{t('admin.invoices.index.table.status', 'Estado')}:</span>
            {['', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((s) => {
              const label = s === '' ? t('admin.common.all', 'Todos') : (statusNames[s] ?? s);
              const cfg = s ? STATUS_CONFIG[s] : null;
              const isActive = statusFilter === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : `border-border bg-card hover:border-primary/40 ${cfg?.color ?? 'text-foreground'}`
                  }`}
                >
                  {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                  {label}
                </button>
              );
            })}
            {activeFilters > 0 && (
              <button type="button" onClick={clearFilters} className="ml-auto text-xs text-destructive hover:underline flex items-center gap-1">
                <X className="w-3 h-3" />{t('admin.common.clear_filters', 'Limpiar')}
              </button>
            )}
          </div>
        )}

        {/* Results info */}
        <div className="px-4 py-2 border-b border-border">
          <span className="text-xs text-muted-foreground">
            {data.length} {t('admin.invoices.index.stats.visible_invoices', 'facturas visibles')}
            {totalPages > 1 && ` — ${t('admin.common.page', 'pág.')} ${page}/${totalPages}`}
          </span>
        </div>

        <div className="p-4">
          <AdminTable
            columns={columns}
            data={data}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onView={handleViewInvoice}
          />
        </div>
      </div>

      <InvoiceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        invoice={selectedInvoice}
        isEditable={selectedInvoice?.status === 'pending'}
        onStatusChange={handleStatusChange}
        isSubmittingStatus={isSubmittingStatus}
      />
    </AuthenticatedLayout>
  );
}
