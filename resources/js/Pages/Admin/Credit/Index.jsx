import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';

export default function Index({ accounts, customers = [] }) {
  const { data } = accounts;
  const page = accounts.current_page ?? accounts?.meta?.current_page ?? 1;
  const totalPages = accounts.last_page ?? accounts?.meta?.last_page ?? 1;

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.credits.index'), { page: nextPage }, { preserveScroll: true, replace: true });
  };

  const handleView = (item) => {
    router.get(route('admin.credits.show', item.id));
  };

  const columns = [
    { key: 'customer', label: 'Cliente', width: '30%', render: (_v, row) => row.customer?.name ?? 'N/A' },
    { key: 'status', label: 'Estado', width: '15%' },
    { key: 'credit_limit_usd', label: 'Límite USD', width: '20%', render: (v) => `$${Number(v ?? 0).toFixed(2)}` },
    { key: 'balance_usd', label: 'Saldo USD', width: '20%', render: (v) => `$${Number(v ?? 0).toFixed(2)}` },
  ];

  const { data: form, setData, post, processing, reset } = useForm({
    customer_id: customers?.[0]?.id ?? '',
    credit_limit_usd: '',
    status: 'active',
  });

  const handleCreate = (e) => {
    e.preventDefault();
    post(route('admin.credits.store'), {
      preserveScroll: true,
      onSuccess: () => reset({ customer_id: customers?.[0]?.id ?? '', credit_limit_usd: '', status: 'active' }),
    });
  };

  return (
    <AuthenticatedLayout>
      <Head title="Cuentas de crédito" />
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-1">Cuentas de Crédito</h1>
            <p className="text-muted-foreground text-sm">Controla el saldo y límite de crédito de tus clientes.</p>

            <div className="mt-4">
              <AdminTable
                columns={columns}
                data={data}
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onView={handleView}
              />
            </div>
          </div>

          <div className="w-full lg:w-80 bg-card border border-border rounded-lg p-4 space-y-3">
            <h2 className="text-lg font-bold text-foreground mb-1">Nueva cuenta</h2>
            <p className="text-xs text-muted-foreground mb-2">Selecciona un cliente y define el límite de crédito.</p>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Cliente</label>
                <select
                  value={form.customer_id}
                  onChange={(e) => setData('customer_id', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Límite de crédito (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.credit_limit_usd}
                  onChange={(e) => setData('credit_limit_usd', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  placeholder="Opcional"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Estado</label>
                <select
                  value={form.status}
                  onChange={(e) => setData('status', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                >
                  <option value="active">Activa</option>
                  <option value="suspended">Suspendida</option>
                  <option value="closed">Cerrada</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={processing || customers.length === 0}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
              >
                {processing ? 'Guardando...' : 'Crear cuenta'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
