import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import AdminFilters from '@/Components/common/AdminFilters.jsx';
import InvoiceModal from '@/Components/Admin/invoice/InvoiceModal';

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Facturas</h1>
            <p className="text-muted-foreground">Listado de facturas</p>
          </div>
          <Link href={route('admin.invoices.create')} className="px-3 py-2 bg-primary text-primary-foreground rounded">Nueva</Link>
        </div>

        <AdminFilters searchPlaceholder="Buscar por número, cliente o estado" searchValue={search} onSearchChange={setSearch} />

        <AdminTable
          columns={columns}
          data={data}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onView={handleViewInvoice}
        />

        <InvoiceModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          invoice={selectedInvoice}
        />
      </div>
    </AuthenticatedLayout>
  );
}
