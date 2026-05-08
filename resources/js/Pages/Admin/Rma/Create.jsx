import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminFlowShell, { AdminFlowSection } from '@/Components/admin/AdminFlowShell.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';

export default function Create({ invoices = [], customers = [], products = [] }) {
  const { t } = useI18n();
  const { formatNumber } = useLocaleFormat();
  const { displayCurrency, formatPriceFromUsd } = useConfiguredCurrencyRates();
  const formatActiveAmount = (value) => formatPriceFromUsd(Number(value || 0), displayCurrency);
  const { data, setData, post, processing } = useForm({
    invoice_id: '',
    customer_id: '',
    reason_type: 'defective',
    reason: '',
    resolution_type: 'credit_note',
    items: [],
  });
  const [activeSection, setActiveSection] = useState('case');
  const [productSearch, setProductSearch] = useState('');

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => {
      const name = String(product.name ?? '').toLowerCase();
      const sku = String(product.sku ?? '').toLowerCase();
      const barcode = String(product.barcode ?? '').toLowerCase();
      return name.includes(term) || sku.includes(term) || barcode.includes(term);
    });
  }, [products, productSearch]);

  const itemsWithDetails = useMemo(() => {
    return data.items.map((item) => {
      const product = products.find((candidate) => String(candidate.id) === String(item.product_id));
      const price = Number(product?.price_usd ?? 0);
      const quantity = Number(item.quantity ?? 1);
      return { ...item, product, price, quantity, subtotal: price * quantity };
    });
  }, [data.items, products]);

  const subtotalUsd = itemsWithDetails.reduce((sum, item) => sum + item.subtotal, 0);

  const reasonTypeLabels = {
    defective: t('admin.rmas.reason_types.defective', 'Defecto'),
    warranty: t('admin.rmas.reason_types.warranty', 'Garantía'),
    other: t('admin.rmas.reason_types.other', 'Otro'),
  };

  const resolutionLabels = {
    credit_note: t('admin.rmas.resolutions.credit_note', 'Nota de crédito'),
    replace: t('admin.rmas.resolutions.replace', 'Reemplazo'),
    refund: t('admin.rmas.resolutions.refund', 'Reembolso'),
  };

  const handleAddProduct = (product) => {
    if (!product) return;
    const existingIndex = data.items.findIndex((item) => String(item.product_id) === String(product.id));
    if (existingIndex >= 0) {
      setData('items', data.items.map((item, index) => (
        index === existingIndex ? { ...item, quantity: Number(item.quantity ?? 1) + 1 } : item
      )));
      return;
    }

    setData('items', [...data.items, { product_id: product.id, quantity: 1, reason: '' }]);
  };

  const handleQuantityChange = (index, quantity) => {
    const value = Math.max(1, Number(quantity) || 1);
    setData('items', data.items.map((item, currentIndex) => (
      currentIndex === index ? { ...item, quantity: value } : item
    )));
  };

  const handleReasonChange = (index, reason) => {
    setData('items', data.items.map((item, currentIndex) => (
      currentIndex === index ? { ...item, reason } : item
    )));
  };

  const handleRemoveItem = (index) => {
    setData('items', data.items.filter((_, currentIndex) => currentIndex !== index));
  };

  const submit = (event) => {
    event.preventDefault();
    post(route('admin.rmas.store'));
  };

  const sections = [
    {
      key: 'case',
      eyebrow: t('admin.rmas.create.sections.case.eyebrow', 'Caso'),
      title: t('admin.rmas.create.sections.case.title', 'Datos del caso'),
      description: t('admin.rmas.create.sections.case.description', 'Factura, cliente, motivo y resolución esperada.'),
      badge: t('admin.rmas.create.sections.case.badge', 'Base'),
    },
    {
      key: 'items',
      eyebrow: t('admin.rmas.create.sections.items.eyebrow', 'Productos'),
      title: t('admin.rmas.create.sections.items.title', 'Ítems devueltos'),
      description: t('admin.rmas.create.sections.items.description', 'Busca artículos, ajusta cantidades y documenta el motivo por línea.'),
      badge: `${itemsWithDetails.length}`,
    },
  ];

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.rmas.create.page_title', 'Nueva devolución')} />

      <form onSubmit={submit}>
        <AdminFlowShell
          title={t('admin.rmas.create.hero_title', 'Registra devoluciones con un flujo más ordenado para soporte y caja')}
          description={t('admin.rmas.create.hero_description', 'La creación de RMA se divide en dos bloques claros: el caso comercial y los productos afectados. Así el equipo documenta mejor y evita perderse en una sola página larga.')}
          backHref={route('admin.rmas.index')}
          backLabel={t('admin.rmas.create.back_to_list', 'Volver al listado')}
          stats={[
            { label: t('admin.rmas.create.stats.items', 'Ítems'), value: itemsWithDetails.length },
            { label: `${t('admin.rmas.create.stats.estimated_total', 'Total estimado')} ${displayCurrency}`, value: formatActiveAmount(subtotalUsd) },
            { label: t('admin.rmas.create.stats.reason', 'Motivo'), value: reasonTypeLabels[data.reason_type] ?? reasonTypeLabels.other },
          ]}
          sections={sections}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          contextTitle={t('admin.rmas.create.context_title', 'Devolución / RMA')}
          contextDescription={t('admin.rmas.create.context_description', 'Mantén el caso documentado mientras ves el impacto estimado y los ítems agregados en la misma vista.')}
          contextItems={[
            { label: t('admin.rmas.create.context_items.invoice', 'Factura'), value: data.invoice_id ? t('admin.rmas.values.associated_female', 'Asociada') : t('admin.rmas.values.optional', 'Opcional') },
            { label: t('admin.rmas.create.context_items.customer', 'Cliente'), value: data.customer_id ? t('admin.rmas.values.associated_male', 'Asociado') : t('admin.rmas.values.optional', 'Opcional') },
            { label: t('admin.rmas.create.context_items.resolution', 'Resolución'), value: resolutionLabels[data.resolution_type] ?? resolutionLabels.credit_note },
          ]}
          summary={
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t('admin.rmas.create.summary.title', 'Resumen')}</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">{t('admin.rmas.create.summary.preparing', 'Devolución en preparación')}</h2>
              <div className="mt-5 max-h-52 space-y-3 overflow-y-auto border-b border-slate-200 pb-4">
                {itemsWithDetails.length === 0 ? (
                  <p className="text-sm text-slate-500">{t('admin.rmas.create.summary.empty', 'No hay productos agregados todavía.')}</p>
                ) : itemsWithDetails.map((item, index) => (
                  <div key={`${item.product?.id ?? index}-summary`} className="flex justify-between gap-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{item.product?.name ?? t('admin.rmas.values.product_fallback', 'Producto')}</p>
                      <p className="text-xs text-slate-500">x{item.quantity}</p>
                    </div>
                    <p className="font-semibold text-slate-900">{formatActiveAmount(item.subtotal)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                <span className="text-slate-600">{t('admin.rmas.create.summary.estimated_impact', 'Impacto estimado')}</span>
                <strong className="text-slate-900">{formatActiveAmount(subtotalUsd)}</strong>
              </div>
            </div>
          }
          actions={
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t('admin.rmas.create.actions.save_heading', 'Guardado')}</p>
                <p className="mt-1 text-sm text-slate-600">{t('admin.rmas.create.actions.editing', 'Estás editando')} <span className="font-semibold text-slate-900">{sections.find((section) => section.key === activeSection)?.title}</span>.</p>
              </div>
              <div className="flex gap-3">
                <Link href={route('admin.rmas.index')} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{t('admin.rmas.create.actions.cancel', 'Cancelar')}</Link>
                <button type="submit" disabled={processing} className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                  {processing ? t('admin.rmas.create.actions.saving', 'Guardando...') : t('admin.rmas.create.actions.submit', 'Registrar devolución')}
                </button>
              </div>
            </div>
          }
        >
          {activeSection === 'case' ? (
            <AdminFlowSection
              eyebrow={t('admin.rmas.create.flow.case.eyebrow', 'Caso')}
              title={t('admin.rmas.create.flow.case.title', 'Datos de la devolución')}
              description={t('admin.rmas.create.flow.case.description', 'Relaciona la operación con una factura o cliente y deja claro el motivo junto a la resolución sugerida.')}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.rmas.create.form.related_invoice', 'Factura relacionada')}</label>
                  <select value={data.invoice_id} onChange={(event) => setData('invoice_id', event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900">
                    <option value="">{t('admin.rmas.create.form.without_invoice', 'Sin factura')}</option>
                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>{invoice.number} · {formatActiveAmount(invoice.total_usd ?? 0)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.rmas.create.form.customer', 'Cliente')}</label>
                  <select value={data.customer_id} onChange={(event) => setData('customer_id', event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900">
                    <option value="">{t('admin.rmas.create.form.without_customer', 'Sin cliente asociado')}</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.rmas.create.form.reason_type', 'Tipo de motivo')}</label>
                  <select value={data.reason_type} onChange={(event) => setData('reason_type', event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900">
                    <option value="defective">{t('admin.rmas.create.form.reason_defective', 'Producto defectuoso')}</option>
                    <option value="warranty">{t('admin.rmas.reason_types.warranty', 'Garantía')}</option>
                    <option value="other">{t('admin.rmas.reason_types.other', 'Otro')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.rmas.create.form.resolution', 'Resolución sugerida')}</label>
                  <select value={data.resolution_type} onChange={(event) => setData('resolution_type', event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900">
                    <option value="credit_note">{resolutionLabels.credit_note}</option>
                    <option value="replace">{resolutionLabels.replace}</option>
                    <option value="refund">{resolutionLabels.refund}</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.rmas.create.form.case_description', 'Descripción del caso')}</label>
                  <textarea value={data.reason} onChange={(event) => setData('reason', event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900" placeholder={t('admin.rmas.create.form.case_description_placeholder', 'Describe el problema reportado por el cliente...')} />
                </div>
              </div>
            </AdminFlowSection>
          ) : (
            <AdminFlowSection
              eyebrow={t('admin.rmas.create.flow.items.eyebrow', 'Inventario')}
              title={t('admin.rmas.create.flow.items.title', 'Productos devueltos')}
              description={t('admin.rmas.create.flow.items.description', 'Busca productos por nombre, SKU o código de barras y deja un motivo específico por ítem.')}
            >
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.rmas.create.items.search_product', 'Buscar producto')}</label>
                  <input type="text" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder={t('admin.rmas.create.items.search_placeholder', 'Nombre, SKU o código de barras')} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900" />
                </div>
                <div className="overflow-hidden rounded-[24px] border border-slate-200">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">{t('admin.rmas.create.items.no_products', 'No se encontraron productos.')}</div>
                  ) : (
                    <ul className="max-h-64 divide-y divide-slate-200 overflow-y-auto bg-white">
                      {filteredProducts.map((product) => (
                        <li key={product.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">{product.name}</span>
                            <span className="text-xs text-slate-500">{formatActiveAmount(product.price_usd ?? 0)}{typeof product.stock !== 'undefined' ? ` · ${t('admin.rmas.create.items.current_stock', 'Stock actual')}: ${product.stock}` : ''}</span>
                          </div>
                          <button type="button" onClick={() => handleAddProduct(product)} className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800">{t('admin.rmas.create.items.add', 'Agregar')}</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">{t('admin.rmas.create.items.return_items', 'Ítems de la devolución')}</h3>
                  {itemsWithDetails.length === 0 ? (
                    <p className="text-sm text-slate-500">{t('admin.rmas.create.items.empty', 'Aún no has agregado productos.')}</p>
                  ) : (
                    <div className="overflow-hidden rounded-[24px] border border-slate-200">
                      <div className="max-h-[420px] overflow-auto bg-white">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              <th className="px-4 py-3 text-left">{t('admin.rmas.create.items.table.product', 'Producto')}</th>
                              <th className="px-4 py-3 text-center w-24">{t('admin.rmas.create.items.table.quantity', 'Cantidad')}</th>
                              <th className="px-4 py-3 text-right w-24">{`${t('admin.rmas.create.items.table.price', 'Precio')} ${displayCurrency}`}</th>
                              <th className="px-4 py-3 text-right w-28">{`${t('admin.rmas.create.items.table.subtotal', 'Subtotal')} ${displayCurrency}`}</th>
                              <th className="px-4 py-3">{t('admin.rmas.create.items.table.reason', 'Motivo')}</th>
                              <th className="px-4 py-3 w-16" />
                            </tr>
                          </thead>
                          <tbody>
                            {itemsWithDetails.map((item, index) => (
                              <tr key={`${item.product?.id ?? index}-${index}`} className="border-t border-slate-200 align-top">
                                <td className="px-4 py-3 text-slate-900">{item.product?.name ?? t('admin.rmas.values.product_fallback', 'Producto')}</td>
                                <td className="px-4 py-3 text-center">
                                  <input type="number" min={1} value={item.quantity} onChange={(event) => handleQuantityChange(index, event.target.value)} className="w-20 rounded-xl border border-slate-300 bg-white px-2 py-2 text-center text-xs text-slate-900" />
                                </td>
                                <td className="px-4 py-3 text-right text-slate-900">{formatActiveAmount(item.price)}</td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatActiveAmount(item.subtotal)}</td>
                                <td className="px-4 py-3 text-slate-900">
                                  <textarea value={item.reason || ''} onChange={(event) => handleReasonChange(index, event.target.value)} rows={2} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900" placeholder={t('admin.rmas.create.items.reason_placeholder', 'Descripción del problema de este producto')} />
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button type="button" onClick={() => handleRemoveItem(index)} className="text-xs font-semibold text-rose-600 hover:text-rose-700">{t('admin.rmas.create.items.remove', 'Quitar')}</button>
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