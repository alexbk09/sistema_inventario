import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import { ArrowLeft, Gift, ShoppingBag } from 'lucide-react';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';

export default function Show({ customer, invoices }) {
  const { t } = useI18n();
  const { formatDateTime, formatNumber } = useLocaleFormat();
  const { displayCurrency, comparisonCurrency, formatPriceFromUsd, hasRateForCurrency } = useConfiguredCurrencyRates();
  const secondaryCurrency = comparisonCurrency && comparisonCurrency !== displayCurrency && hasRateForCurrency(comparisonCurrency)
    ? comparisonCurrency
    : null;
  const formatActiveAmount = (value, currency = displayCurrency) => formatPriceFromUsd(Number(value || 0), currency);
  return (
    <AuthenticatedLayout>
      <Head title={`${t('admin.customers.show.page_title_prefix', 'Cliente')}: ${customer.name}`} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">{customer.name}</h1>
            <p className="text-muted-foreground">{t('admin.customers.show.subtitle', 'Detalle del cliente, historial de compras y puntos de lealtad.')}</p>
          </div>
          <Link
            href={route('admin.customers.index')}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('admin.customers.show.back', 'Volver a clientes')}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4 lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <h2 className="text-lg font-semibold text-foreground">{t('admin.customers.show.contact_info', 'Información de contacto')}</h2>
              <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{t('admin.customers.show.email', 'Email')}:</span> {customer.email || t('admin.customers.values.empty', '-')} </p>
              <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{t('admin.customers.show.phone', 'Teléfono')}:</span> {customer.phone || t('admin.customers.values.empty', '-')} </p>
              <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{t('admin.customers.show.address', 'Dirección')}:</span> {customer.address || t('admin.customers.values.empty', '-')} </p>
              <p className="text-xs text-muted-foreground mt-2">
                {t('admin.customers.show.last_purchase', 'Última compra')}: {customer.last_purchase_at ? formatDateTime(customer.last_purchase_at) : t('admin.customers.show.no_purchases', 'Sin compras registradas')}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('admin.customers.show.loyalty_points', 'Puntos acumulados')}</p>
                  <p className="text-2xl font-bold text-foreground">{customer.loyalty_points}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Gift className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{`${t('admin.customers.show.total_spent_usd', 'Total gastado')} (${displayCurrency})`}</p>
                  <p className="text-2xl font-bold text-foreground">{formatActiveAmount(customer.lifetime_spent_usd || 0)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  {t('admin.customers.show.points_rule_prefix', 'Regla actual de puntos')}: <span className="font-medium text-foreground">{t('admin.customers.show.points_rule_value', '1 punto por cada compra confirmada registrada')}</span>.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-4">
              <h2 className="text-lg font-semibold text-foreground mb-4">{t('admin.customers.show.purchase_history', 'Historial de compras')}</h2>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('admin.customers.show.empty_history', 'Este cliente aún no tiene compras registradas.')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-foreground">{t('admin.customers.show.table.date', 'Fecha')}</th>
                        <th className="px-4 py-2 text-left font-medium text-foreground">{t('admin.customers.show.table.number', 'Número')}</th>
                        <th className="px-4 py-2 text-left font-medium text-foreground">{t('admin.customers.show.table.status', 'Estado')}</th>
                        <th className="px-4 py-2 text-left font-medium text-foreground">{`${t('admin.customers.show.table.total_usd', 'Total')} ${displayCurrency}`}</th>
                        <th className="px-4 py-2 text-left font-medium text-foreground">{secondaryCurrency ? `${t('admin.customers.show.table.total_bs', 'Total')} ${secondaryCurrency}` : t('admin.customers.show.table.total_bs', 'Referencia')}</th>
                        <th className="px-4 py-2 text-left font-medium text-foreground">{t('admin.customers.show.table.points', 'Puntos')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-border hover:bg-muted/50 transition">
                          <td className="px-4 py-2 text-muted-foreground">
                            {inv.created_at ? formatDateTime(inv.created_at) : ''}
                          </td>
                          <td className="px-4 py-2 text-foreground">{inv.number}</td>
                          <td className="px-4 py-2 text-muted-foreground">{inv.status_name || inv.status}</td>
                          <td className="px-4 py-2 text-foreground">{formatActiveAmount(inv.total_usd || 0)}</td>
                          <td className="px-4 py-2 text-foreground">{secondaryCurrency ? formatActiveAmount(inv.total_usd || 0, secondaryCurrency) : '—'}</td>
                          <td className="px-4 py-2 text-foreground">{inv.points_earned}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
