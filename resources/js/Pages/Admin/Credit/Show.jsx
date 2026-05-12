import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';

export default function Show({ account, adminCurrencyContext }) {
  const { t } = useI18n();
  const { displayCurrency } = useConfiguredCurrencyRates();
  const adminCurrencyCodes = Array.isArray(adminCurrencyContext?.codes) ? adminCurrencyContext.codes : [];
  const formatMoney = (value) => new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
  const translateStatus = (status) => t(`admin.credits.statuses.${status}`, status ?? t('admin.credits.values.empty_dash', '—'));
  const translateMovementType = (type) => t(`admin.credits.movement_types.${type}`, type ?? t('admin.credits.values.empty_dash', '—'));
  const { data, setData, post, processing, reset } = useForm({
    type: 'charge',
    amount_usd: '',
    currency_code: displayCurrency,
    description: '',
    due_date: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.credits.movements.store', account.id), {
      preserveScroll: true,
      onSuccess: () => reset({ type: 'charge', amount_usd: '', currency_code: displayCurrency, description: '', due_date: '' }),
    });
  };

  return (
    <AuthenticatedLayout>
      <Head title={`${t('admin.credits.show.page_title_prefix', 'Crédito')} - ${account.customer?.name}`} />
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">{account.customer?.name}</h1>
            <p className="text-sm text-muted-foreground">{t('admin.credits.show.subtitle', 'Cuenta de crédito del cliente.')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <h2 className="text-lg font-bold text-foreground mb-2">{t('admin.credits.show.summary.title', 'Resumen')}</h2>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('admin.credits.show.summary.status', 'Estado')}:</span>
                <span className="font-semibold text-foreground">{translateStatus(account.status)}</span>
              </div>
              {adminCurrencyCodes.map((code) => (
                <div key={`limit-${code}`} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{`${t('admin.credits.show.summary.credit_limit_usd', 'Límite')}: ${code}`}</span>
                  <span className="font-semibold text-foreground">{formatMoney(account.credit_limit_admin_totals?.[code] ?? 0)}</span>
                </div>
              ))}
              {adminCurrencyCodes.map((code) => (
                <div key={`balance-${code}`} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{`${t('admin.credits.show.summary.current_balance', 'Saldo actual')}: ${code}`}</span>
                  <span className="font-semibold text-foreground">{formatMoney(account.balance_admin_totals?.[code] ?? 0)}</span>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border rounded-lg p-6 mt-6 space-y-3">
              <h2 className="text-lg font-bold text-foreground mb-2">{t('admin.credits.show.form.title', 'Nuevo movimiento')}</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('admin.credits.show.form.type', 'Tipo')}</label>
                  <select
                    value={data.type}
                    onChange={(e) => setData('type', e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  >
                    <option value="charge">{t('admin.credits.movement_types.charge', 'Cargo (aumenta saldo)')}</option>
                    <option value="payment">{t('admin.credits.movement_types.payment', 'Pago (disminuye saldo)')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">{`${t('admin.credits.show.form.amount_usd', 'Monto')} ${displayCurrency}`}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.amount_usd}
                    onChange={(e) => {
                      setData('amount_usd', e.target.value);
                      setData('currency_code', displayCurrency);
                    }}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('admin.credits.show.form.due_date_optional', 'Fecha de vencimiento (opcional)')}</label>
                  <input
                    type="date"
                    value={data.due_date}
                    onChange={(e) => setData('due_date', e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('admin.credits.show.form.description', 'Descripción')}</label>
                  <textarea
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                    rows={2}
                    placeholder={t('admin.credits.show.form.description_placeholder', 'Concepto del cargo o pago')}
                  />
                </div>
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 text-sm"
                >
                  {processing ? t('admin.credits.values.saving', 'Guardando...') : t('admin.credits.show.form.submit', 'Registrar movimiento')}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-bold text-foreground mb-3">{t('admin.credits.show.movements.title', 'Movimientos recientes')}</h2>
              <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">{t('admin.credits.show.movements.table.date', 'Fecha')}</th>
                      <th className="px-3 py-2 text-left">{t('admin.credits.show.movements.table.type', 'Tipo')}</th>
                      <th className="px-3 py-2 text-right">{t('admin.credits.show.movements.table.amount_usd', 'Monto origen')}</th>
                      {adminCurrencyCodes.map((code) => (
                        <th key={code} className="px-3 py-2 text-right">{`${t('admin.credits.show.movements.table.amount_usd', 'Monto')} ${code}`}</th>
                      ))}
                      <th className="px-3 py-2 text-left">{t('admin.credits.show.movements.table.description', 'Descripción')}</th>
                      <th className="px-3 py-2 text-left">{t('admin.credits.show.movements.table.due', 'Vence')}</th>
                      <th className="px-3 py-2 text-left">{t('admin.credits.show.movements.table.paid', 'Pagado')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.movements.map((m) => (
                      <tr key={m.id} className="border-t border-border">
                        <td className="px-3 py-2 text-foreground">{m.created_at}</td>
                        <td className="px-3 py-2 text-foreground">{translateMovementType(m.type)}</td>
                        <td className="px-3 py-2 text-right text-foreground">{`${m.display_currency_code ?? 'USD'} ${formatMoney(m.display_original_amount ?? 0)}`}</td>
                        {adminCurrencyCodes.map((code) => (
                          <td key={`${m.id}-${code}`} className="px-3 py-2 text-right text-foreground">{formatMoney(m.admin_totals?.[code] ?? 0)}</td>
                        ))}
                        <td className="px-3 py-2 text-foreground">{m.description}</td>
                        <td className="px-3 py-2 text-foreground">{m.due_date ?? t('admin.credits.values.empty_dash', '—')}</td>
                        <td className="px-3 py-2 text-foreground">{m.paid_at ? t('admin.credits.values.yes', 'Sí') : t('admin.credits.values.no', 'No')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
