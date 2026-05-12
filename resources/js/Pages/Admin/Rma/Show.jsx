import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';

export default function Show({ rma, adminCurrencyContext = {} }) {
  const { t } = useI18n();
  const { formatCurrency } = useLocaleFormat();
  const { displayCurrency, comparisonCurrency, formatPriceFromUsd, hasRateForCurrency } = useConfiguredCurrencyRates();
  const secondaryCurrency = comparisonCurrency && comparisonCurrency !== displayCurrency && hasRateForCurrency(comparisonCurrency)
    ? comparisonCurrency
    : null;
  const visibleCurrencyCodes = Array.isArray(adminCurrencyContext?.codes) && adminCurrencyContext.codes.length > 0
    ? adminCurrencyContext.codes
    : [displayCurrency, ...(secondaryCurrency ? [secondaryCurrency] : [])].filter(Boolean);
  const currencyColumns = [...new Set(visibleCurrencyCodes)];
  const formatActiveAmount = (value, currency = displayCurrency) => formatPriceFromUsd(Number(value || 0), currency);
  const formatServerAmount = (code, value) => formatCurrency(Number(value || 0), code);
  const [status, setStatus] = useState(rma.status);
  const [resolutionType, setResolutionType] = useState(rma.resolution_type || 'credit_note');
  const [saving, setSaving] = useState(false);

  const statusOptions = [
    { value: 'pending', label: t('admin.rmas.statuses.pending', 'Pendiente') },
    { value: 'approved', label: t('admin.rmas.statuses.approved', 'Aprobada') },
    { value: 'rejected', label: t('admin.rmas.statuses.rejected', 'Rechazada') },
    { value: 'completed', label: t('admin.rmas.statuses.completed', 'Completada') },
  ];

  const resolutionLabels = {
    credit_note: t('admin.rmas.resolutions.credit_note', 'Nota de crédito'),
    replace: t('admin.rmas.resolutions.replace', 'Reemplazo'),
    refund: t('admin.rmas.resolutions.refund', 'Reembolso'),
  };
  const translateInvoiceStatus = (invoiceStatus) => t(`admin.invoices.statuses.${invoiceStatus}`, invoiceStatus ?? t('admin.common.table.values.empty_dash', '—'));

  const handleUpdate = (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    router.put(route('admin.rmas.update', rma.id), {
      status,
      resolution_type: resolutionType,
    }, {
      preserveScroll: true,
      onFinish: () => setSaving(false),
    });
  };

  const statusLabel = statusOptions.find((s) => s.value === rma.status)?.label ?? rma.status;

  return (
    <AuthenticatedLayout>
      <Head title={rma.number} />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">{rma.number}</h1>
            <p className="text-sm text-muted-foreground">
              {t('admin.rmas.show.subtitle', 'Gestión de devolución y garantía para productos y notas de crédito.')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información principal */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{t('admin.rmas.show.status_label', 'ESTADO')}</p>
                  <p className="text-lg font-bold text-foreground">{statusLabel}</p>
                </div>
                <form onSubmit={handleUpdate} className="flex flex-col sm:flex-row gap-2 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted-foreground">{t('admin.rmas.show.update_status', 'Actualizar estado')}</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted-foreground">{t('admin.rmas.show.resolution', 'Resolución')}</label>
                    <select
                      value={resolutionType}
                      onChange={(e) => setResolutionType(e.target.value)}
                      className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                    >
                      <option value="credit_note">{resolutionLabels.credit_note}</option>
                      <option value="replace">{resolutionLabels.replace}</option>
                      <option value="refund">{resolutionLabels.refund}</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                  >
                    {saving ? t('admin.rmas.show.actions.saving', 'Guardando...') : t('admin.rmas.show.actions.save', 'Guardar')}
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{t('admin.rmas.show.related_invoice', 'FACTURA RELACIONADA')}</p>
                  {rma.invoice ? (
                    <p className="text-sm text-foreground">{rma.invoice.number} · {t('admin.rmas.show.invoice_status', 'Estado')}: {translateInvoiceStatus(rma.invoice.status)}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('admin.rmas.show.without_invoice', 'Sin factura asociada')}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{t('admin.rmas.show.customer', 'CLIENTE')}</p>
                  {rma.customer ? (
                    <p className="text-sm text-foreground">{rma.customer.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('admin.rmas.show.without_customer', 'Sin cliente asociado')}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1">{t('admin.rmas.show.general_reason', 'MOTIVO GENERAL')}</p>
                <p className="text-sm text-foreground whitespace-pre-line min-h-[2rem]">
                  {rma.reason || t('admin.rmas.show.no_description', 'Sin descripción detallada.')}
                </p>
              </div>
            </div>

            {/* Productos devueltos */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-bold text-foreground mb-3">{t('admin.rmas.show.items_title', 'Productos devueltos')}</h2>
              <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">{t('admin.rmas.show.table.product', 'Producto')}</th>
                      <th className="px-3 py-2 text-center w-20">{t('admin.rmas.show.table.quantity', 'Cantidad')}</th>
                      <th className="px-3 py-2 text-right w-24">{`${t('admin.rmas.show.table.price', 'Precio')} ${displayCurrency}`}</th>
                      {currencyColumns.map((code) => (
                        <th key={code} className="px-3 py-2 text-right w-28">{`${t('admin.rmas.show.table.subtotal', 'Subtotal')} ${code}`}</th>
                      ))}
                      <th className="px-3 py-2">{t('admin.rmas.show.table.reason', 'Motivo')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rma.items.map((item) => (
                      <tr key={item.id} className="border-t border-border align-top">
                        <td className="px-3 py-2 text-foreground">
                          {item.product?.name ?? t('admin.rmas.values.product_fallback', 'Producto')}
                        </td>
                        <td className="px-3 py-2 text-center text-foreground">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-right text-foreground whitespace-nowrap">
                          {item.unit_price_admin_totals?.[displayCurrency] !== undefined
                            ? formatServerAmount(displayCurrency, item.unit_price_admin_totals[displayCurrency])
                            : formatActiveAmount(item.unit_price_usd ?? 0)}
                        </td>
                        {currencyColumns.map((code) => (
                          <td key={`${item.id}-${code}`} className="px-3 py-2 text-right font-semibold text-foreground whitespace-nowrap">
                            {item.document_totals?.[code] !== undefined
                              ? formatServerAmount(code, item.document_totals[code])
                              : formatActiveAmount(item.subtotal_usd ?? 0, code)}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-sm text-muted-foreground whitespace-pre-line">
                          {item.reason || t('admin.common.table.values.empty_dash', '—')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div>
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <h2 className="text-lg font-bold text-foreground mb-2">{t('admin.rmas.show.money_summary', 'Resumen monetario')}</h2>
              {currencyColumns.map((code) => (
                <div key={code} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{`${t('admin.rmas.show.total_usd', 'Total')}: ${code}`}</span>
                  <span className="font-semibold text-foreground">
                    {rma.document_totals?.[code] !== undefined
                      ? formatServerAmount(code, rma.document_totals[code])
                      : formatActiveAmount(rma.total_usd ?? 0, code)}
                  </span>
                </div>
              ))}
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">
                  {t('admin.rmas.show.current_resolution', 'Resolución actual')}: {resolutionLabels[rma.resolution_type] ?? t('admin.rmas.show.undefined', 'Sin definir')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
