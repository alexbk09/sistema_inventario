import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminFlowShell, { AdminFlowSection } from '@/Components/admin/AdminFlowShell.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';

export default function Create({ customers = [], products = [], rateBs, adminCurrencyContext = {} }) {
  const { t } = useI18n();
  const { formatNumber, formatCurrency } = useLocaleFormat();
  const { displayCurrency, comparisonCurrency, formatPriceFromUsd, hasRateForCurrency } = useConfiguredCurrencyRates();
  const secondaryCurrency = comparisonCurrency && comparisonCurrency !== displayCurrency && hasRateForCurrency(comparisonCurrency)
    ? comparisonCurrency
    : null;
  const formatActiveAmount = (value, currency = displayCurrency) => formatPriceFromUsd(Number(value || 0), currency);
  const formatServerAmount = (code, value) => formatCurrency(Number(value || 0), code);
  const getProductDisplayPrice = (product, currency = displayCurrency) => product?.price_admin_totals?.[currency];
  const { data, setData, post, processing } = useForm({
    customer_id: '',
    expires_at: '',
    notes: '',
    items: [],
  });
  const [activeSection, setActiveSection] = useState('customer');
  const [productSearch, setProductSearch] = useState('');

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => String(product.name ?? '').toLowerCase().includes(term));
  }, [products, productSearch]);

  const itemsWithDetails = useMemo(() => {
    return data.items.map((item) => {
      const product = products.find((candidate) => String(candidate.id) === String(item.product_id));
      const quantity = Number(item.quantity ?? 1);
      const priceUsd = Number(product?.price_usd ?? 0);
      const subtotalUsd = priceUsd * quantity;
      const subtotalBs = subtotalUsd * Number(rateBs ?? 0);
      return {
        ...item,
        product,
        quantity,
        priceUsd,
        priceDisplay: getProductDisplayPrice(product),
        subtotalUsd,
        subtotalDisplay: getProductDisplayPrice(product) !== undefined ? getProductDisplayPrice(product) * quantity : null,
        subtotalBs,
      };
    });
  }, [data.items, products, rateBs]);

  const totalUsd = useMemo(() => itemsWithDetails.reduce((sum, item) => sum + (item.subtotalUsd || 0), 0), [itemsWithDetails]);
  const totalDisplay = useMemo(() => itemsWithDetails.reduce((sum, item) => sum + Number(item.subtotalDisplay ?? 0), 0), [itemsWithDetails]);
  const hasDisplayTotal = itemsWithDetails.length > 0 && itemsWithDetails.every((item) => item.subtotalDisplay !== null);
  const totalBs = totalUsd * Number(rateBs ?? 0);

  const handleAddProduct = (product) => {
    if (!product) return;
    const existingIndex = data.items.findIndex((item) => String(item.product_id) === String(product.id));
    if (existingIndex >= 0) {
      setData('items', data.items.map((item, index) => (
        index === existingIndex ? { ...item, quantity: Number(item.quantity ?? 1) + 1 } : item
      )));
      return;
    }
    setData('items', [...data.items, { product_id: product.id, quantity: 1 }]);
  };

  const handleQuantityChange = (index, quantity) => {
    const value = Math.max(1, Number(quantity) || 1);
    setData('items', data.items.map((item, currentIndex) => (
      currentIndex === index ? { ...item, quantity: value } : item
    )));
  };

  const handleRemoveItem = (index) => {
    setData('items', data.items.filter((_, currentIndex) => currentIndex !== index));
  };

  const submit = (event) => {
    event.preventDefault();
    post(route('admin.layaways.store'));
  };

  const sections = [
    {
      key: 'customer',
      eyebrow: t('admin.layaways.create.sections.customer.eyebrow', 'Cliente'),
      title: t('admin.layaways.create.sections.customer.title', 'Datos del apartado'),
      description: t('admin.layaways.create.sections.customer.description', 'Selecciona al cliente, vencimiento y notas del acuerdo.'),
      badge: t('admin.layaways.create.sections.customer.badge', 'Base'),
    },
    {
      key: 'items',
      eyebrow: t('admin.layaways.create.sections.items.eyebrow', 'Reserva'),
      title: t('admin.layaways.create.sections.items.title', 'Productos'),
      description: t('admin.layaways.create.sections.items.description', 'Agrega los artículos que quedarán separados y revisa el total reservado.'),
      badge: `${itemsWithDetails.length}`,
    },
  ];

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.layaways.create.page_title', 'Nuevo apartado')} />

      <form onSubmit={submit}>
        <AdminFlowShell
          title={t('admin.layaways.create.hero_title', 'Crea apartados con un flujo más claro para ventas y atención al cliente')}
          description={t('admin.layaways.create.hero_description', 'El formulario se divide en datos del acuerdo y detalle de productos reservados, mientras el resumen lateral mantiene visible el compromiso económico del apartado.')}
          stats={[
            { label: t('admin.layaways.create.stats.items', 'Ítems'), value: itemsWithDetails.length },
            { label: `${t('admin.layaways.create.stats.total_usd', 'Total')} ${displayCurrency}`, value: hasDisplayTotal ? formatServerAmount(displayCurrency, totalDisplay) : formatActiveAmount(totalUsd) },
            { label: t('admin.layaways.create.stats.rate', 'Tasa'), value: formatNumber(rateBs ?? 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
          ]}
          sections={sections}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          contextTitle={t('admin.layaways.create.context_title', 'Apartado')}
          contextDescription={t('admin.layaways.create.context_description', 'Mantén visible el monto reservado y el estado del acuerdo mientras completas la información del cliente.')}
          contextItems={[
            { label: t('admin.layaways.create.context_items.customer', 'Cliente'), value: data.customer_id ? t('admin.layaways.values.assigned', 'Asignado') : t('admin.layaways.values.pending', 'Pendiente') },
            { label: t('admin.layaways.create.context_items.expires', 'Vence'), value: data.expires_at || t('admin.layaways.values.without_date', 'Sin fecha') },
            { label: t('admin.layaways.create.context_items.initial_status', 'Estado inicial'), value: t('admin.layaways.statuses.active', 'Activo') },
          ]}
          summary={
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t('admin.layaways.create.summary.title', 'Resumen')}</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">{t('admin.layaways.create.summary.preparing', 'Apartado en preparación')}</h2>
              <div className="mt-5 max-h-52 space-y-3 overflow-y-auto border-b border-slate-200 pb-4">
                {itemsWithDetails.length === 0 ? (
                  <p className="text-sm text-slate-500">{t('admin.layaways.create.summary.empty', 'Aún no has agregado productos.')}</p>
                ) : itemsWithDetails.map((item, index) => (
                  <div key={`${item.product?.id ?? index}-summary`} className="flex justify-between gap-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{item.product?.name ?? t('admin.layaways.values.product_fallback', 'Producto')}</p>
                      <p className="text-xs text-slate-500">x{item.quantity}</p>
                    </div>
                    <p className="font-semibold text-slate-900">{item.subtotalDisplay !== null ? formatServerAmount(displayCurrency, item.subtotalDisplay) : formatActiveAmount(item.subtotalUsd)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>{`${t('admin.layaways.create.summary.total_usd', 'Total')} ${displayCurrency}`}</span>
                  <strong className="text-slate-900">{hasDisplayTotal ? formatServerAmount(displayCurrency, totalDisplay) : formatActiveAmount(totalUsd)}</strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>{secondaryCurrency ? `${t('admin.layaways.create.summary.total_bs', 'Referencia')} ${secondaryCurrency}` : t('admin.layaways.create.summary.total_bs', 'Referencia')}</span>
                  <strong className="text-slate-900">{secondaryCurrency ? formatActiveAmount(totalUsd, secondaryCurrency) : t('admin.common.table.values.empty_dash', '—')}</strong>
                </div>
              </div>
              <p className="mt-4 text-xs leading-6 text-slate-500">{t('admin.layaways.create.summary.note', 'El apartado se creará en estado activo. Luego podrá completarse, cancelarse o marcarse como vencido desde su detalle.')}</p>
            </div>
          }
          actions={
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t('admin.layaways.create.actions.save_heading', 'Guardado')}</p>
                <p className="mt-1 text-sm text-slate-600">{t('admin.layaways.create.actions.editing', 'Estás editando')} <span className="font-semibold text-slate-900">{sections.find((section) => section.key === activeSection)?.title}</span>.</p>
              </div>
              <div className="flex gap-3">
                <Link href={route('admin.layaways.index')} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{t('admin.layaways.create.actions.cancel', 'Cancelar')}</Link>
                <button type="submit" disabled={processing} className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                  {processing ? t('admin.layaways.create.actions.saving', 'Guardando...') : t('admin.layaways.create.actions.submit', 'Crear apartado')}
                </button>
              </div>
            </div>
          }
        >
          {activeSection === 'customer' ? (
            <AdminFlowSection
              eyebrow={t('admin.layaways.create.flow.customer.eyebrow', 'Acuerdo')}
              title={t('admin.layaways.create.flow.customer.title', 'Datos del cliente')}
              description={t('admin.layaways.create.flow.customer.description', 'Relaciona el apartado con un cliente, define vencimiento y documenta cualquier condición especial.')}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.layaways.create.form.customer', 'Cliente')}</label>
                  <select value={data.customer_id} onChange={(event) => setData('customer_id', event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900" required>
                    <option value="">{t('admin.layaways.create.form.select_customer', 'Selecciona un cliente')}</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name} - {customer.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.layaways.create.form.expiration_date', 'Fecha de vencimiento')}</label>
                  <input type="date" value={data.expires_at} onChange={(event) => setData('expires_at', event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.layaways.create.form.notes', 'Notas')}</label>
                  <textarea value={data.notes} onChange={(event) => setData('notes', event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900" placeholder={t('admin.layaways.create.form.notes_placeholder', 'Condiciones especiales, forma de pago, etc.')} />
                </div>
              </div>
            </AdminFlowSection>
          ) : (
            <AdminFlowSection
              eyebrow={t('admin.layaways.create.flow.items.eyebrow', 'Reserva')}
              title={t('admin.layaways.create.flow.items.title', 'Productos del apartado')}
              description={t('admin.layaways.create.flow.items.description', 'Busca productos por nombre, agrégalos a la reserva y valida el detalle económico del apartado.')}
            >
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.layaways.create.items.search_product', 'Buscar producto')}</label>
                  <input type="text" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder={t('admin.layaways.create.items.search_placeholder', 'Filtrar por nombre')} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900" />
                </div>
                <div className="overflow-hidden rounded-[24px] border border-slate-200">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">{t('admin.layaways.create.items.no_products', 'No se encontraron productos.')}</div>
                  ) : (
                    <ul className="max-h-64 divide-y divide-slate-200 overflow-y-auto bg-white">
                      {filteredProducts.map((product) => (
                        <li key={product.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">{product.name}</span>
                            <span className="text-xs text-slate-500">{`${t('admin.layaways.create.items.price', 'Precio')}: ${getProductDisplayPrice(product) !== undefined ? formatServerAmount(displayCurrency, getProductDisplayPrice(product)) : formatActiveAmount(product.price_usd ?? 0)}`}</span>
                          </div>
                          <button type="button" onClick={() => handleAddProduct(product)} className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800">{t('admin.layaways.create.items.add', 'Agregar')}</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">{t('admin.layaways.create.items.detail_title', 'Detalle del apartado')}</h3>
                  {itemsWithDetails.length === 0 ? (
                    <p className="text-sm text-slate-500">{t('admin.layaways.create.items.empty', 'Aún no has agregado productos.')}</p>
                  ) : (
                    <div className="overflow-hidden rounded-[24px] border border-slate-200">
                      <div className="max-h-[420px] overflow-auto bg-white">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              <th className="px-4 py-3 text-left">{t('admin.layaways.create.items.table.product', 'Producto')}</th>
                              <th className="px-4 py-3 text-center w-24">{t('admin.layaways.create.items.table.quantity', 'Cantidad')}</th>
                              <th className="px-4 py-3 text-right w-24">{`${t('admin.layaways.create.items.table.price_usd', 'Precio')} ${displayCurrency}`}</th>
                              <th className="px-4 py-3 text-right w-28">{`${t('admin.layaways.create.items.table.subtotal', 'Subtotal')} ${displayCurrency}`}</th>
                              <th className="px-4 py-3 w-16" />
                            </tr>
                          </thead>
                          <tbody>
                            {itemsWithDetails.map((item, index) => (
                              <tr key={`${item.product?.id ?? index}-${index}`} className="border-t border-slate-200">
                                <td className="px-4 py-3 text-slate-900">{item.product?.name ?? t('admin.layaways.values.product_fallback', 'Producto')}</td>
                                <td className="px-4 py-3 text-center">
                                  <input type="number" min={1} value={item.quantity} onChange={(event) => handleQuantityChange(index, event.target.value)} className="w-20 rounded-xl border border-slate-300 bg-white px-2 py-2 text-center text-xs text-slate-900" />
                                </td>
                                <td className="px-4 py-3 text-right text-slate-900">{item.priceDisplay !== undefined ? formatServerAmount(displayCurrency, item.priceDisplay) : formatActiveAmount(item.priceUsd)}</td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-900">{item.subtotalDisplay !== null ? formatServerAmount(displayCurrency, item.subtotalDisplay) : formatActiveAmount(item.subtotalUsd)}</td>
                                <td className="px-4 py-3 text-center">
                                  <button type="button" onClick={() => handleRemoveItem(index)} className="text-xs font-semibold text-rose-600 hover:text-rose-700">{t('admin.layaways.create.items.remove', 'Quitar')}</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </AdminFlowSection>
          )}
        </AdminFlowShell>
      </form>
    </AuthenticatedLayout>
  );
}