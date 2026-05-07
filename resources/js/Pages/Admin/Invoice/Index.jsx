import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import AdminFilters from '@/Components/common/AdminFilters.jsx';
import InvoiceModal from '@/Components/admin/invoice/InvoiceModal.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';

export default function Index({ invoices, filters }) {
  const { data } = invoices;
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
    invoice: 'Factura',
    delivery_note: 'Nota de entrega',
    proforma: 'Proforma',
  };

  const columns = [
    { key: 'number', label: 'Número', width: '20%' },
    { key: 'document_type', label: 'Tipo', width: '15%', render: (v, row) => typeLabels[row?.document_type] ?? 'Factura' },
    { key: 'customer', label: 'Cliente', width: '25%', render: (v, row) => row?.contact?.full_name ?? v?.name ?? 'N/A' },
    {
      key: 'status',
      label: 'Estado',
      width: '15%',
      render: (value, row) => {
        const code = row?.status ?? row?.invoice_status?.code ?? '';
        const name = row?.invoice_status?.name ?? {
          pending: 'Pendiente',
          paid: 'Pagado',
          shipped: 'Enviado',
          delivered: 'Entregado',
          cancelled: 'Cancelado',
        }[code] ?? value;

        const color = statusStyles[code] ?? 'bg-muted text-foreground';

        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${color}`}>
            {name}
          </span>
        );
      },
    },
    { key: 'total_usd', label: 'USD', width: '15%', render: (v) => Number(v).toFixed(2) },
    { key: 'total_bs', label: 'BS', width: '15%', render: (v) => Number(v).toFixed(2) },
  ];

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  return (
    <AuthenticatedLayout>
      <Head title="Facturas" />
      <AdminIndexShell
        title="Consulta facturas con un panel más claro para ventas y seguimiento"
        description="La vista prioriza búsqueda, acceso rápido a nuevas facturas y revisión del historial sin obligar al usuario a recorrer una página lineal y plana."
        stats={[
          { label: 'Facturas visibles', value: data.length },
          { label: 'Página', value: `${page}/${totalPages}` },
          { label: 'Filtro', value: debounced ? 'Activo' : 'General' },
        ]}
        contextTitle="Facturas"
        contextDescription="Revisa estados, totales y detalle comercial desde una tabla central con acceso inmediato al modal de consulta."
        contextItems={[
          { label: 'Búsqueda', value: debounced || 'Sin filtro' },
          { label: 'Modal', value: isModalOpen ? 'Abierto' : 'Disponible' },
          { label: 'Nueva factura', value: 'Acceso directo' },
        ]}
        primaryAction={
          <Link href={route('admin.invoices.create')} className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Nueva factura</Link>
        }
        filters={
          <AdminFilters searchPlaceholder="Buscar por número, cliente o estado" searchValue={search} onSearchChange={setSearch} />
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
      />
    </AuthenticatedLayout>
  );
}
