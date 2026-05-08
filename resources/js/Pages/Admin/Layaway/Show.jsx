import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';

export default function Show({ layaway, rateBs }) {
  const { t } = useI18n();
  const { formatDate, formatNumber } = useLocaleFormat();
  const { displayCurrency, comparisonCurrency, formatPriceFromUsd, hasRateForCurrency } = useConfiguredCurrencyRates();
  const secondaryCurrency = comparisonCurrency && comparisonCurrency !== displayCurrency && hasRateForCurrency(comparisonCurrency)
    ? comparisonCurrency
    : null;
  const formatActiveAmount = (value, currency = displayCurrency) => formatPriceFromUsd(Number(value || 0), currency);
  const { data, setData, put, processing } = useForm({
    status: layaway.status,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route('admin.layaways.update', layaway.id));
  };

  return (
    <AuthenticatedLayout>
      <Head title={layaway.number} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">{layaway.number}</h1>
            <p className="text-sm text-muted-foreground">
              {t('admin.layaways.show.subtitle', 'Apartado asociado al cliente')} {layaway.customer?.name ?? t('admin.layaways.values.not_available', 'N/A')}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{t('admin.layaways.show.customer', 'CLIENTE')}</p>
                  <p className="text-sm text-foreground">{layaway.customer?.name}</p>
                  <p className="text-xs text-muted-foreground">{layaway.customer?.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{t('admin.layaways.show.expires', 'VENCE')}</p>
                  <p className="text-sm text-foreground">{layaway.expires_at ? formatDate(layaway.expires_at) : t('admin.layaways.show.no_expiration', 'Sin fecha definida')}</p>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">{t('admin.layaways.show.notes', 'NOTAS')}</p>
                <p className="text-sm text-foreground whitespace-pre-line min-h-[2rem]">
                  {layaway.notes || t('admin.layaways.show.no_notes', 'Sin notas adicionales.')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 flex items-end gap-3 flex-wrap">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('admin.layaways.show.status', 'Estado')}</label>
                  <select
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  >
                    <option value="active">{t('admin.layaways.statuses.active', 'Activo')}</option>
                    <option value="completed">{t('admin.layaways.statuses.completed', 'Completado')}</option>
                    <option value="cancelled">{t('admin.layaways.statuses.cancelled', 'Cancelado')}</option>
                    <option value="expired">{t('admin.layaways.statuses.expired', 'Vencido')}</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {processing ? t('admin.layaways.show.actions.saving', 'Guardando...') : t('admin.layaways.show.actions.save', 'Guardar cambios')}
                </button>
              </form>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-bold text-foreground mb-3">{t('admin.layaways.show.products', 'Productos')}</h2>
              <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">{t('admin.layaways.show.table.product', 'Producto')}</th>
                      <th className="px-3 py-2 text-center w-24">{t('admin.layaways.show.table.quantity', 'Cantidad')}</th>
                      <th className="px-3 py-2 text-right w-24">{`${t('admin.layaways.show.table.price_usd', 'Precio')} ${displayCurrency}`}</th>
                      <th className="px-3 py-2 text-right w-28">{`${t('admin.layaways.show.table.subtotal', 'Subtotal')} ${displayCurrency}`}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {layaway.items.map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="px-3 py-2 text-foreground">{item.product?.name ?? t('admin.layaways.values.product_fallback', 'Producto')}</td>
                        <td className="px-3 py-2 text-center text-foreground">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-foreground">{formatActiveAmount(item.unit_price_usd ?? 0)}</td>
                        <td className="px-3 py-2 text-right text-foreground">{formatActiveAmount(item.subtotal_usd ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <h2 className="text-lg font-bold text-foreground mb-2">{t('admin.layaways.show.summary', 'Resumen')}</h2>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{`${t('admin.layaways.show.total_usd', 'Total')}: ${displayCurrency}`}</span>
                <span className="font-semibold text-foreground">{formatActiveAmount(layaway.total_usd ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{secondaryCurrency ? `${t('admin.layaways.show.total_bs', 'Referencia')}: ${secondaryCurrency}` : t('admin.layaways.show.total_bs', 'Referencia')}</span>
                <span className="font-semibold text-foreground">{secondaryCurrency ? formatActiveAmount(layaway.total_usd ?? 0, secondaryCurrency) : '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{`${t('admin.layaways.show.paid_usd', 'Pagado')}: ${displayCurrency}`}</span>
                <span className="font-semibold text-foreground">{formatActiveAmount(layaway.paid_usd ?? 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
