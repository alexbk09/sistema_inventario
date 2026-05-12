import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useI18n } from '@/Hooks/useI18n.ts';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat.ts';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';

export default function CustomerDashboard({ summary, invoices, topProducts, profile, currencyContext }) {
    const { t } = useI18n();
    const { formatDate, formatNumber } = useLocaleFormat();
    const { displayCurrency, formatPriceFromUsd } = useConfiguredCurrencyRates();
    const enabledCurrencyCodes = Array.isArray(currencyContext?.codes) ? currencyContext.codes : [];
    const formatActiveAmount = (value) => formatPriceFromUsd(Number(value || 0), displayCurrency);
    const formatServerAmount = (currencyCode, value) => new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

    const getDocumentAmount = (totals, baseAmount) => (
        displayCurrency && totals && totals[displayCurrency] !== undefined
            ? `${displayCurrency} ${formatServerAmount(displayCurrency, totals[displayCurrency])}`
            : formatActiveAmount(baseAmount ?? 0)
    );

    return (
        <AuthenticatedLayout>
            <Head title={t('customer_dashboard.page_title', 'Mi panel')} />
            <div className="max-w-4xl mx-auto py-10">
                <h1 className="text-2xl font-bold mb-6">{t('customer_dashboard.welcome', 'Bienvenido, :name', { name: profile.name })}</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-card p-4 rounded-lg shadow">
                        <div className="text-muted-foreground text-sm">{t('customer_dashboard.metrics.total_spent', 'Total gastado')}</div>
                        <div className="text-2xl font-bold">{getDocumentAmount(summary.documentTotals, summary.totalSpent)}</div>
                    </div>
                    <div className="bg-card p-4 rounded-lg shadow">
                        <div className="text-muted-foreground text-sm">{t('customer_dashboard.metrics.purchases', 'Compras')}</div>
                        <div className="text-2xl font-bold">{formatNumber(summary.totalPurchases ?? 0)}</div>
                    </div>
                    <div className="bg-card p-4 rounded-lg shadow">
                        <div className="text-muted-foreground text-sm">{t('customer_dashboard.metrics.last_purchase', 'Última compra')}</div>
                        <div className="text-2xl font-bold">{summary.lastPurchase ? formatDate(summary.lastPurchase) : t('customer_dashboard.values.empty', '-')}</div>
                    </div>
                </div>
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">{t('customer_dashboard.sections.history.title', 'Historial de compras')}</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-border rounded-lg">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2">{t('customer_dashboard.sections.history.table.number', '#')}</th>
                                    <th className="px-4 py-2">{t('customer_dashboard.sections.history.table.total', 'Total')}</th>
                                    <th className="px-4 py-2">{t('customer_dashboard.sections.history.table.date', 'Fecha')}</th>
                                    <th className="px-4 py-2">{t('customer_dashboard.sections.history.table.status', 'Estado')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.length > 0 ? invoices.map((inv) => (
                                    <tr key={inv.id} className="border-t">
                                        <td className="px-4 py-2">{inv.number}</td>
                                        <td className="px-4 py-2">{getDocumentAmount(inv.document_totals, inv.total_usd)}</td>
                                        <td className="px-4 py-2">{formatDate(inv.created_at)}</td>
                                        <td className="px-4 py-2">{t(`admin.invoices.statuses.${inv.status}`, inv.status)}</td>
                                    </tr>
                                )) : (
                                    <tr className="border-t">
                                        <td className="px-4 py-4 text-center text-sm text-muted-foreground" colSpan={4}>{t('customer_dashboard.sections.history.empty', 'Aún no tienes compras registradas.')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">{t('customer_dashboard.sections.top_products.title', 'Productos más comprados')}</h2>
                    {topProducts.length > 0 ? (
                        <ul className="list-disc pl-6">
                            {topProducts.map((prod, idx) => (
                                <li key={idx}>{prod.name} <span className="text-muted-foreground">({formatNumber(prod.quantity ?? 0)})</span></li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">{t('customer_dashboard.sections.top_products.empty', 'Aún no hay productos destacados en tu historial.')}</p>
                    )}
                </div>
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">{t('customer_dashboard.sections.profile.title', 'Datos de perfil')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><b>{t('customer_dashboard.sections.profile.fields.name', 'Nombre')}:</b> {profile.name}</div>
                        <div><b>{t('customer_dashboard.sections.profile.fields.email', 'Email')}:</b> {profile.email}</div>
                        <div><b>{t('customer_dashboard.sections.profile.fields.phone', 'Teléfono')}:</b> {profile.phone || t('customer_dashboard.values.empty', '-')}</div>
                        <div><b>{t('customer_dashboard.sections.profile.fields.address', 'Dirección')}:</b> {profile.address || t('customer_dashboard.values.empty', '-')}</div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
