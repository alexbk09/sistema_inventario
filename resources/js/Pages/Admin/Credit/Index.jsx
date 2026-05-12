import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminTable from '@/Components/admin/provider/AdminTableProviders.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';

export default function Index({ accounts, customers = [], adminCurrencyContext }) {
  const { t } = useI18n();
  const { displayCurrency } = useConfiguredCurrencyRates();
  const { data } = accounts;
  const page = accounts.current_page ?? accounts?.meta?.current_page ?? 1;
  const totalPages = accounts.last_page ?? accounts?.meta?.last_page ?? 1;
  const adminCurrencyCodes = Array.isArray(adminCurrencyContext?.codes) ? adminCurrencyContext.codes : [];

  const formatMoney = (value) => new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    router.get(route('admin.credits.index'), { page: nextPage }, { preserveScroll: true, replace: true });
  };

  const handleView = (item) => {
    router.get(route('admin.credits.show', item.id));
  };

  const columns = [
    { key: 'customer', label: t('admin.credits.index.table.customer', 'Cliente'), width: '30%', render: (_v, row) => row.customer?.name ?? t('admin.credits.values.not_available', 'N/A') },
    { key: 'status', label: t('admin.credits.index.table.status', 'Estado'), width: '15%' },
    ...adminCurrencyCodes.map((code) => ({
      key: `credit_limit_admin_totals.${code}`,
      label: `${t('admin.credits.index.table.credit_limit_usd', 'Límite')} ${code}`,
      width: '18%',
      render: (_v, row) => formatMoney(row.credit_limit_admin_totals?.[code] ?? 0),
    })),
    ...adminCurrencyCodes.map((code) => ({
      key: `balance_admin_totals.${code}`,
      label: `${t('admin.credits.index.table.balance_usd', 'Saldo')} ${code}`,
      width: '18%',
      render: (_v, row) => formatMoney(row.balance_admin_totals?.[code] ?? 0),
    })),
  ];

  const { data: form, setData, post, processing, reset } = useForm({
    customer_id: customers?.[0]?.id ?? '',
    credit_limit_usd: '',
    currency_code: displayCurrency,
    status: 'active',
  });

  const handleCreate = (e) => {
    e.preventDefault();
    post(route('admin.credits.store'), {
      preserveScroll: true,
      onSuccess: () => reset({ customer_id: customers?.[0]?.id ?? '', credit_limit_usd: '', currency_code: displayCurrency, status: 'active' }),
    });
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.credits.index.page_title', 'Cuentas de crédito')} />
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-1">{t('admin.credits.index.title', 'Cuentas de crédito')}</h1>
            <p className="text-muted-foreground text-sm">{t('admin.credits.index.description', 'Controla el saldo y límite de crédito de tus clientes.')}</p>

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
            <h2 className="text-lg font-bold text-foreground mb-1">{t('admin.credits.index.form.title', 'Nueva cuenta')}</h2>
            <p className="text-xs text-muted-foreground mb-2">{t('admin.credits.index.form.description', 'Selecciona un cliente y define el límite de crédito.')}</p>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('admin.credits.index.form.customer', 'Cliente')}</label>
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
                <label className="block text-xs font-semibold text-muted-foreground mb-1">{`${t('admin.credits.index.form.credit_limit_usd', 'Límite de crédito')} (${displayCurrency})`}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.credit_limit_usd}
                  onChange={(e) => {
                    setData('credit_limit_usd', e.target.value);
                    setData('currency_code', displayCurrency);
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  placeholder={t('admin.credits.index.form.optional', 'Opcional')}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('admin.credits.index.form.status', 'Estado')}</label>
                <select
                  value={form.status}
                  onChange={(e) => setData('status', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                >
                  <option value="active">{t('admin.credits.statuses.active', 'Activa')}</option>
                  <option value="suspended">{t('admin.credits.statuses.suspended', 'Suspendida')}</option>
                  <option value="closed">{t('admin.credits.statuses.closed', 'Cerrada')}</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={processing || customers.length === 0}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
              >
                {processing ? t('admin.credits.values.saving', 'Guardando...') : t('admin.credits.index.form.create', 'Crear cuenta')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
