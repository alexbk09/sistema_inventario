import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import AdminFilters from '@/Components/common/AdminFilters.jsx';
import InvoiceModal from '@/Components/admin/invoice/InvoiceModal.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';

export default function Index({ invoices, filters, adminCurrencyContext = {} }) {
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

  const statusStyles = {
    pending: 'bg-yellow-50 text-yellow-700',
    paid: 'bg-green-50 text-green-700',
    shipped: 'bg-blue-50 text-blue-700',
    delivered: 'bg-teal-50 text-teal-700',
    cancelled: 'bg-red-50 text-red-700',
  };

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { if (isFirst.current) { isFirst.current = false; return; } router.get(route('admin.invoices.index'), { search: debounced, page: 1 }, { preserveScroll: true, preserveState: true, replace: true }); }, [debounced]);

  const handlePageChange = (nextPage) => { if (nextPage < 1 || nextPage > totalPages) return; router.get(route('admin.invoices.index'), { page: nextPage, search: debounced }, { preserveScroll: true, replace: true }); };

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
    { key: 'number', label: t('admin.invoices.index.table.number', 'Número'), width: '20%' },
    { key: 'document_type', label: t('admin.invoices.index.table.type', 'Tipo'), width: '15%', render: (v, row) => typeLabels[row?.document_type] ?? typeLabels.invoice },
    { key: 'customer', label: t('admin.invoices.index.table.customer', 'Cliente'), width: '25%', render: (v, row) => row?.contact?.full_name ?? v?.name ?? t('admin.invoices.index.table.not_available', 'N/A') },
    {
      key: 'status',
      label: t('admin.invoices.index.table.status', 'Estado'),
      width: '15%',
      render: (value, row) => {
        const code = row?.status ?? row?.invoice_status?.code ?? '';
        // Usar traducción del frontend primero, luego el nombre del backend
        const name = statusNames[code] ?? row?.invoice_status?.name ?? value;

        const color = statusStyles[code] ?? 'bg-muted text-foreground';

        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${color}`}>
            {name}
          </span>
        );
      },
    },
    ...currencyColumns.map((code) => ({
      key: `total_${code}`,
      label: code,
      width: '15%',
      render: (v, row) => row?.document_totals?.[code] !== undefined
        ? formatServerAmount(code, row.document_totals[code])
        : formatActiveAmount(row?.total_usd ?? 0, code),
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
      <AdminIndexShell
        title={t('admin.invoices.index.hero_title', 'Consulta facturas con un panel más claro para ventas y seguimiento')}
        description={t('admin.invoices.index.hero_description', 'La vista prioriza búsqueda, acceso rápido a nuevas facturas y revisión del historial sin obligar al usuario a recorrer una página lineal y plana.')}
        stats={[
          { label: t('admin.invoices.index.stats.visible_invoices', 'Facturas visibles'), value: data.length },
          { label: t('admin.invoices.index.stats.page', 'Página'), value: `${page}/${totalPages}` },
          { label: t('admin.invoices.index.stats.filter', 'Filtro'), value: debounced ? t('admin.invoices.index.values.active', 'Activo') : t('admin.invoices.index.values.general', 'General') },
        ]}
        contextTitle={t('admin.invoices.index.context_title', 'Facturas')}
        contextDescription={t('admin.invoices.index.context_description', 'Revisa estados, totales y detalle comercial desde una tabla central con acceso inmediato al modal de consulta.')}
        contextItems={[
          { label: t('admin.invoices.index.context_items.search', 'Búsqueda'), value: debounced || t('admin.invoices.index.values.without_filter', 'Sin filtro') },
          { label: t('admin.invoices.index.context_items.modal', 'Modal'), value: isModalOpen ? t('admin.invoices.index.values.open', 'Abierto') : t('admin.invoices.index.values.available', 'Disponible') },
          { label: t('admin.invoices.index.context_items.new_invoice', 'Nueva factura'), value: t('admin.invoices.index.values.direct_access', 'Acceso directo') },
        ]}
        primaryAction={
          <Link href={route('admin.invoices.create')} className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">{t('admin.invoices.index.actions.new_invoice', 'Nueva factura')}</Link>
        }
        filters={
          <AdminFilters searchPlaceholder={t('admin.invoices.index.filters.search_placeholder', 'Buscar por número, cliente o estado')} searchValue={search} onSearchChange={setSearch} />
        }
      >
        <AdminTable
          columns={columns}
          data={data}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onView={handleViewInvoice}
        />
      </AdminIndexShell>

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
