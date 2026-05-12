import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminFlowShell, { AdminFlowSection } from '@/Components/admin/AdminFlowShell.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { useConfiguredCurrencyRates } from '@/Hooks/useConfiguredCurrencyRates';

export default function Create({ products, customers, warehouses = [], layaways = [], users = [], adminCurrencyContext = {} }) {
  const { t } = useI18n();
  const { formatNumber, formatCurrency } = useLocaleFormat();
  const { displayCurrency, comparisonCurrency, formatPriceFromUsd, hasRateForCurrency, availableCurrencies, baseCurrency, ratesByCode } = useConfiguredCurrencyRates();
  const secondaryCurrency = comparisonCurrency && comparisonCurrency !== displayCurrency && hasRateForCurrency(comparisonCurrency)
    ? comparisonCurrency
    : null;
  const formatActiveAmount = (value, currency = displayCurrency) => formatPriceFromUsd(Number(value || 0), currency);
  const formatServerAmount = (code, value) => formatCurrency(Number(value || 0), code);
  const getProductDisplayPrice = (product, currency = displayCurrency) => product?.price_admin_totals?.[currency];
  const formatProductPrimaryAmount = (product, fallbackUsd) => getProductDisplayPrice(product) !== undefined
    ? formatServerAmount(displayCurrency, getProductDisplayPrice(product))
    : formatActiveAmount(fallbackUsd);
  const getLayawayAmount = (layaway) => layaway?.document_totals?.[displayCurrency] !== undefined
    ? formatServerAmount(displayCurrency, layaway.document_totals[displayCurrency])
    : formatActiveAmount(layaway?.total_usd ?? 0);
  const toBaseAmount = (value, currency = displayCurrency) => {
    const numericValue = Number(value || 0);
    if (currency === baseCurrency) {
      return numericValue;
    }

    const rate = Number(ratesByCode?.[currency] ?? 0);
    if (!rate) {
      return numericValue;
    }

    return numericValue / rate;
  };
  const { data, setData, post, processing } = useForm({
    customer_id: '',
    document_type: 'invoice',
    items: [],
    warehouse_id: '',
    layaway_id: '',
    credit_sale: false,
    credit_due_date: '',
    payments: [],
    seller_id: '',
    internal_notes: '',
    public_notes: '',
  });
  const [activeSection, setActiveSection] = useState('context');
  const [rate, setRate] = useState(null);
  const [search, setSearch] = useState('');

  const ensureRate = async () => {
    if (rate !== null) return rate;
    try {
      const res = await fetch('/api/currency/promedio');
      if (!res.ok) throw new Error('failed');
      const json = await res.json();
      const nextRate = Number(json.promedio ?? 0);
      setRate(nextRate);
      return nextRate;
    } catch (error) {
      console.error('Error fetching rate', error);
      return 0;
    }
  };

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;

    return products.filter((product) => {
      const name = String(product.name ?? '').toLowerCase();
      const sku = String(product.sku ?? '').toLowerCase();
      const barcode = String(product.barcode ?? '').toLowerCase();
      return name.includes(term) || sku.includes(term) || barcode.includes(term);
    });
  }, [products, search]);

  const itemsWithDetails = useMemo(() => {
    return data.items.map((item) => {
      const product = products.find((candidate) => String(candidate.id) === String(item.product_id));
      const price = Number(product?.price_usd ?? 0);
      const quantity = Number(item.quantity ?? 1);

      return {
        ...item,
        product,
        price,
        priceDisplay: getProductDisplayPrice(product),
        quantity,
        subtotal: price * quantity,
        subtotalDisplay: getProductDisplayPrice(product) !== undefined ? getProductDisplayPrice(product) * quantity : null,
        bs_subtotal: Number(item.bs_subtotal ?? 0),
      };
    });
  }, [data.items, products]);

  const subtotalUsd = itemsWithDetails.reduce((sum, item) => sum + item.subtotal, 0);
  const subtotalDisplay = itemsWithDetails.reduce((sum, item) => sum + Number(item.subtotalDisplay ?? 0), 0);
  const hasDisplaySubtotal = itemsWithDetails.length > 0 && itemsWithDetails.every((item) => item.subtotalDisplay !== null);
  const subtotalBs = itemsWithDetails.reduce((sum, item) => sum + (Number(item.bs_subtotal) || 0), 0);
  const paymentsTotalUsd = (data.payments || []).reduce((sum, payment) => sum + toBaseAmount(payment.amount_usd, payment.currency_code || displayCurrency), 0);

  const layawaysForCustomer = useMemo(() => {
    if (!data.customer_id) return layaways;
    return (layaways || []).filter((layaway) => String(layaway.customer_id) === String(data.customer_id));
  }, [layaways, data.customer_id]);

  const documentTypeLabels = {
    invoice: t('admin.invoices.document_types.invoice', 'Factura'),
    delivery_note: t('admin.invoices.document_types.delivery_note', 'Nota de entrega'),
    proforma: t('admin.invoices.document_types.proforma', 'Proforma'),
  };

  const paymentMethodLabels = {
    efectivo: t('admin.invoices.create.payment_methods.cash', 'Efectivo'),
    tarjeta: t('admin.invoices.create.payment_methods.card', 'Tarjeta'),
    transferencia: t('admin.invoices.create.payment_methods.transfer', 'Transferencia'),
    zelle: t('admin.invoices.create.payment_methods.zelle', 'Zelle'),
    otro: t('admin.invoices.create.payment_methods.other', 'Otro'),
  };

  const handleAddProduct = async (product) => {
    if (!product) return;

    const existingIndex = data.items.findIndex((item) => String(item.product_id) === String(product.id));

    if (existingIndex >= 0) {
      const nextItems = data.items.map((item, index) => (
        index === existingIndex
          ? { ...item, quantity: Number(item.quantity ?? 1) + 1 }
          : item
      ));
      const nextRate = await ensureRate();
      const updatedItems = nextItems.map((item, index) => {
        if (index !== existingIndex) return item;
        const matchedProduct = products.find((candidate) => String(candidate.id) === String(item.product_id));
        const price = Number(matchedProduct?.price_usd ?? 0);
        const quantity = Number(item.quantity ?? 1);
        return { ...item, bs_subtotal: Math.round(price * quantity * nextRate * 100) / 100 };
      });
      setData('items', updatedItems);
      return;
    }

    const nextRate = await ensureRate();
    const price = Number(product.price_usd ?? 0);
    setData('items', [
      ...data.items,
      {
        product_id: product.id,
        quantity: 1,
        bs_subtotal: Math.round(price * nextRate * 100) / 100,
      },
    ]);
  };

  const handleQuantityChange = async (index, quantity) => {
    const nextQuantity = Math.max(1, Number(quantity) || 1);
    const nextItems = data.items.map((item, currentIndex) => (
      currentIndex === index ? { ...item, quantity: nextQuantity } : item
    ));
    const nextRate = await ensureRate();
    const updatedItems = nextItems.map((item, currentIndex) => {
      if (currentIndex !== index) return item;
      const product = products.find((candidate) => String(candidate.id) === String(item.product_id));
      const price = Number(product?.price_usd ?? 0);
      return { ...item, bs_subtotal: Math.round(price * nextQuantity * nextRate * 100) / 100 };
    });
    setData('items', updatedItems);
  };

  const handleRemoveItem = (index) => {
    setData('items', data.items.filter((_, currentIndex) => currentIndex !== index));
  };

  const fetchBsForItem = async (index) => {
    const currentItem = itemsWithDetails[index];
    if (!currentItem) return;

    try {
      const res = await fetch('/api/currency/promedio');
      if (!res.ok) throw new Error('Error al obtener promedio');
      const json = await res.json();
      const currentRate = Number(json.promedio ?? 0);
      setRate(currentRate);
      const amountBs = Math.round(currentItem.subtotal * currentRate * 100) / 100;
      setData('items', data.items.map((item, currentIndex) => (
        currentIndex === index ? { ...item, bs_subtotal: amountBs } : item
      )));
    } catch (error) {
      console.error('fetchBsForItem error', error);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    post(route('admin.invoices.store'));
  };

  const sections = [
    {
      key: 'context',
      eyebrow: t('admin.invoices.create.sections.context.eyebrow', 'Cliente'),
      title: t('admin.invoices.create.sections.context.title', 'Contexto'),
      description: t('admin.invoices.create.sections.context.description', 'Cliente, documento, vendedor y notas visibles o internas.'),
      badge: t('admin.invoices.create.sections.context.badge', 'Base'),
    },
    {
      key: 'items',
      eyebrow: t('admin.invoices.create.sections.items.eyebrow', 'Catálogo'),
      title: t('admin.invoices.create.sections.items.title', 'Productos'),
      description: t('admin.invoices.create.sections.items.description', 'Busca, agrega y ajusta cantidades antes de emitir la factura.'),
      badge: `${itemsWithDetails.length}`,
    },
  ];

  const summary = (
    <>
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t('admin.invoices.create.summary.title', 'Resumen')}</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">{t('admin.invoices.create.summary.preparing', 'Factura en preparación')}</h2>
        <div className="mt-5 max-h-52 space-y-3 overflow-y-auto border-b border-slate-200 pb-4">
          {itemsWithDetails.length === 0 ? (
            <p className="text-sm text-slate-500">{t('admin.invoices.create.summary.empty', 'No hay productos agregados todavía.')}</p>
          ) : itemsWithDetails.map((item, index) => (
            <div key={`${item.product?.id ?? index}-summary`} className="flex justify-between gap-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{item.product?.name ?? t('admin.invoices.create.summary.product_fallback', 'Producto')}</p>
                <p className="text-xs text-slate-500">x{item.quantity}</p>
              </div>
              <p className="font-semibold text-slate-900">{item.subtotalDisplay !== null ? formatServerAmount(displayCurrency, item.subtotalDisplay) : formatActiveAmount(item.subtotal)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span>{`${t('admin.invoices.create.summary.subtotal_usd', 'Subtotal')} ${displayCurrency}`}</span>
            <strong className="text-slate-900">{hasDisplaySubtotal ? formatServerAmount(displayCurrency, subtotalDisplay) : formatActiveAmount(subtotalUsd)}</strong>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span>{secondaryCurrency ? `${t('admin.invoices.create.summary.subtotal_bs', 'Referencia')} ${secondaryCurrency}` : t('admin.invoices.create.summary.subtotal_bs', 'Referencia')}</span>
            <strong className="text-slate-900">{secondaryCurrency ? formatActiveAmount(subtotalUsd, secondaryCurrency) : t('admin.common.table.values.empty_dash', '—')}</strong>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span>{`${t('admin.invoices.create.summary.payments_loaded', 'Pagos cargados')} ${displayCurrency}`}</span>
            <strong className="text-slate-900">{formatActiveAmount(paymentsTotalUsd)}</strong>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t('admin.invoices.create.quick_payments.title', 'Cobros rápidos')}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t('admin.invoices.create.quick_payments.description', 'Puedes adelantar formas de pago básicas sin salir de la creación de factura.')}</p>
        <div className="mt-4 max-h-44 space-y-2 overflow-y-auto">
          {(data.payments || []).map((payment, index) => (
            <div key={`payment-${index}`} className="flex items-center gap-2 rounded-2xl bg-slate-50 p-2 text-xs">
              <select
                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-slate-700"
                value={payment.method}
                onChange={(event) => {
                  const nextPayments = [...data.payments];
                  nextPayments[index] = { ...nextPayments[index], method: event.target.value };
                  setData('payments', nextPayments);
                }}
              >
                <option value="efectivo">{paymentMethodLabels.efectivo}</option>
                <option value="tarjeta">{paymentMethodLabels.tarjeta}</option>
                <option value="transferencia">{paymentMethodLabels.transferencia}</option>
                <option value="zelle">{paymentMethodLabels.zelle}</option>
                <option value="otro">{paymentMethodLabels.otro}</option>
              </select>
              <select
                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-slate-700"
                value={payment.currency_code || displayCurrency}
                onChange={(event) => {
                  const nextPayments = [...data.payments];
                  nextPayments[index] = { ...nextPayments[index], currency_code: event.target.value };
                  setData('payments', nextPayments);
                }}
              >
                {availableCurrencies.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder={`${t('admin.invoices.create.quick_payments.amount_usd', 'Monto')} ${payment.currency_code || displayCurrency}`}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-2 py-2 text-slate-700"
                value={payment.amount_usd}
                onChange={(event) => {
                  const nextPayments = [...data.payments];
                  nextPayments[index] = { ...nextPayments[index], amount_usd: event.target.value };
                  setData('payments', nextPayments);
                }}
              />
              <button
                type="button"
                className="rounded-xl px-2 py-2 font-semibold text-rose-600 hover:bg-rose-50"
                onClick={() => setData('payments', (data.payments || []).filter((_, currentIndex) => currentIndex !== index))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setData('payments', [...(data.payments || []), { method: 'efectivo', amount_usd: '', currency_code: displayCurrency }])}
          className="mt-4 w-full rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          {t('admin.invoices.create.quick_payments.add_payment', 'Añadir pago')}
        </button>
      </div>
    </>
  );

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.invoices.create.page_title', 'Nueva factura')} />

      <form onSubmit={submit}>
        <AdminFlowShell
          title={t('admin.invoices.create.hero_title', 'Crea facturas con un flujo más claro para el equipo administrativo')}
          description={t('admin.invoices.create.hero_description', 'La vista se organiza por bloques para reducir ruido visual: primero defines el contexto de la operación y luego armas el detalle de productos, mientras el resumen queda siempre visible.')}
          backHref={route('admin.invoices.index')}
          backLabel={t('admin.invoices.create.back_to_list', 'Volver al listado')}
          stats={[
            { label: t('admin.invoices.create.stats.products', 'Productos'), value: itemsWithDetails.length },
            { label: `${t('admin.invoices.create.stats.total_usd', 'Total')} ${displayCurrency}`, value: hasDisplaySubtotal ? formatServerAmount(displayCurrency, subtotalDisplay) : formatActiveAmount(subtotalUsd) },
            { label: t('admin.invoices.create.stats.payments', 'Pagos'), value: data.payments?.length ?? 0 },
          ]}
          sections={sections}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          contextTitle={t('admin.invoices.create.context_title', 'Factura')}
          contextDescription={t('admin.invoices.create.context_description', 'Administra cliente, documento y detalle comercial sin perder de vista montos ni cobros rápidos.')}
          contextItems={[
            { label: t('admin.invoices.create.context_items.customer', 'Cliente'), value: data.customer_id ? t('admin.invoices.create.values.assigned', 'Asignado') : t('admin.invoices.create.values.optional', 'Opcional') },
            { label: t('admin.invoices.create.context_items.document', 'Documento'), value: documentTypeLabels[data.document_type] ?? documentTypeLabels.invoice },
            { label: t('admin.invoices.create.context_items.credit', 'Crédito'), value: data.credit_sale ? t('admin.invoices.create.values.yes', 'Sí') : t('admin.invoices.create.values.no', 'No') },
          ]}
          summary={summary}
          actions={
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t('admin.invoices.create.actions.save_heading', 'Guardado')}</p>
                <p className="mt-1 text-sm text-slate-600">{t('admin.invoices.create.actions.editing', 'Estás editando')} <span className="font-semibold text-slate-900">{sections.find((section) => section.key === activeSection)?.title}</span>.</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href={route('admin.invoices.index')}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {t('admin.invoices.create.actions.cancel', 'Cancelar')}
                </Link>
                <button
                  type="submit"
                  disabled={processing}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {processing ? t('admin.invoices.create.actions.saving', 'Guardando...') : t('admin.invoices.create.actions.submit', 'Crear factura')}
                </button>
              </div>
            </div>
          }
        >
          {activeSection === 'context' ? (
            <>
              <AdminFlowSection
                eyebrow={t('admin.invoices.create.flow.document.eyebrow', 'Documento')}
                title={t('admin.invoices.create.flow.document.title', 'Contexto comercial')}
                description={t('admin.invoices.create.flow.document.description', 'Define cliente, tipo de comprobante, bodega, vendedor y reglas opcionales de crédito antes de agregar productos.')}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.invoices.create.form.customer_associated', 'Cliente asociado')}</label>
                    <select
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                      value={data.customer_id}
                      onChange={(event) => setData('customer_id', event.target.value)}
                    >
                      <option value="">{t('admin.invoices.create.form.no_customer_optional', 'Sin cliente (opcional)')}</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.invoices.create.form.document_type', 'Tipo de comprobante')}</label>
                    <select
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                      value={data.document_type}
                      onChange={(event) => setData('document_type', event.target.value)}
                    >
                      <option value="invoice">{documentTypeLabels.invoice}</option>
                      <option value="delivery_note">{documentTypeLabels.delivery_note}</option>
                      <option value="proforma">{t('admin.invoices.create.form.proforma_budget', 'Proforma / Presupuesto')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.invoices.create.form.warehouse', 'Sucursal')}</label>
                    <select
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                      value={data.warehouse_id}
                      onChange={(event) => setData('warehouse_id', event.target.value)}
                    >
                      <option value="">{t('admin.invoices.create.form.all_warehouses', 'Todas')}</option>
                      {(warehouses || []).map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.invoices.create.form.seller', 'Vendedor')}</label>
                    <select
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                      value={data.seller_id}
                      onChange={(event) => setData('seller_id', event.target.value)}
                    >
                      <option value="">{t('admin.invoices.create.form.current_user', 'Usuario actual')}</option>
                      {(users || []).map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-900">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                        checked={data.credit_sale}
                        onChange={(event) => setData('credit_sale', event.target.checked)}
                      />
                      <span>{t('admin.invoices.create.form.credit_sale', 'Registrar como venta a crédito')}</span>
                    </label>
                    {data.credit_sale ? (
                      <div className="mt-3 max-w-sm">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">{t('admin.invoices.create.form.credit_due_date', 'Fecha de vencimiento')}</label>
                        <input
                          type="date"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                          value={data.credit_due_date}
                          onChange={(event) => setData('credit_due_date', event.target.value)}
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.invoices.create.form.layaway_associated', 'Apartado asociado')}</label>
                    <select
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                      value={data.layaway_id}
                      onChange={(event) => setData('layaway_id', event.target.value)}
                    >
                      <option value="">{t('admin.invoices.create.form.no_layaway', 'Sin apartado')}</option>
                      {layawaysForCustomer.map((layaway) => (
                        <option key={layaway.id} value={layaway.id}>
                            {layaway.number} – {layaway.customer?.name ?? t('admin.invoices.create.form.no_customer', 'Sin cliente')} – {getLayawayAmount(layaway)}
                        </option>
                      ))}
                    </select>
                    {!data.customer_id && layawaysForCustomer.length > 0 ? (
                      <p className="mt-2 text-xs text-slate-500">{t('admin.invoices.create.form.layaway_help', 'Selecciona un cliente para filtrar sus apartados activos.')}</p>
                    ) : null}
                  </div>
                </div>
              </AdminFlowSection>

              <AdminFlowSection
                eyebrow={t('admin.invoices.create.flow.notes.eyebrow', 'Notas')}
                title={t('admin.invoices.create.flow.notes.title', 'Notas internas y para el cliente')}
                description={t('admin.invoices.create.flow.notes.description', 'Separa la información operativa de la que sí verá el cliente en su factura o comprobante.')}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.invoices.create.form.internal_notes', 'Notas internas')}</label>
                    <textarea
                      className="min-h-[110px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                      placeholder={t('admin.invoices.create.form.internal_notes_placeholder', 'Solo visibles para el equipo interno.')}
                      value={data.internal_notes}
                      onChange={(event) => setData('internal_notes', event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.invoices.create.form.public_notes', 'Notas para el cliente')}</label>
                    <textarea
                      className="min-h-[110px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                      placeholder={t('admin.invoices.create.form.public_notes_placeholder', 'Mensaje que aparecerá en la factura o comprobante.')}
                      value={data.public_notes}
                      onChange={(event) => setData('public_notes', event.target.value)}
                    />
                  </div>
                </div>
              </AdminFlowSection>
            </>
          ) : (
            <AdminFlowSection
              eyebrow={t('admin.invoices.create.flow.items.eyebrow', 'Catálogo')}
              title={t('admin.invoices.create.flow.items.title', 'Productos y detalle')}
              description={t('admin.invoices.create.flow.items.description', 'Busca por nombre, SKU o código de barras y arma la factura con cantidades y subtotales convertidos.')}
            >
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.invoices.create.items.search_product', 'Buscar producto')}</label>
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t('admin.invoices.create.items.search_placeholder', 'Escribe para buscar...')}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                  />
                </div>

                <div className="overflow-hidden rounded-[24px] border border-slate-200">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">{t('admin.invoices.create.items.no_products_found', 'No se encontraron productos.')}</div>
                  ) : (
                    <ul className="max-h-64 divide-y divide-slate-200 overflow-y-auto bg-white">
                      {filteredProducts.map((product) => (
                        <li key={product.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">{product.name}</span>
                            <span className="text-xs text-slate-500">
                              {formatProductPrimaryAmount(product, product.price_usd ?? 0)}
                              {typeof product.stock !== 'undefined' ? ` · ${t('admin.invoices.create.items.stock', 'Stock')}: ${product.stock}` : ''}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddProduct(product)}
                            className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                          >
                            {t('admin.invoices.create.items.add', 'Agregar')}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">{t('admin.invoices.create.items.invoice_items', 'Ítems de la factura')}</h3>
                  {itemsWithDetails.length === 0 ? (
                    <p className="text-sm text-slate-500">{t('admin.invoices.create.items.empty', 'Aún no has agregado productos. Usa el buscador para añadirlos.')}</p>
                  ) : (
                    <div className="overflow-hidden rounded-[24px] border border-slate-200">
                      <div className="max-h-[420px] overflow-auto bg-white">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              <th className="px-4 py-3 text-left">{t('admin.invoices.create.items.table.product', 'Producto')}</th>
                              <th className="px-4 py-3 text-center w-28">{t('admin.invoices.create.items.table.quantity', 'Cantidad')}</th>
                              <th className="px-4 py-3 text-right w-24">{`${t('admin.invoices.create.items.table.price', 'Precio')} ${displayCurrency}`}</th>
                              <th className="px-4 py-3 text-right w-28">{`${t('admin.invoices.create.items.table.subtotal_usd', 'Subtotal')} ${displayCurrency}`}</th>
                              <th className="px-4 py-3 text-right w-32">{secondaryCurrency ? `${t('admin.invoices.create.items.table.subtotal_bs', 'Referencia')} ${secondaryCurrency}` : t('admin.invoices.create.items.table.subtotal_bs', 'Referencia')}</th>
                              <th className="px-4 py-3 w-16" />
                            </tr>
                          </thead>
                          <tbody>
                            {itemsWithDetails.map((item, index) => (
                              <tr key={`${item.product?.id ?? index}-${index}`} className="border-t border-slate-200">
                                <td className="px-4 py-3 text-slate-900">{item.product?.name ?? t('admin.invoices.create.summary.product_fallback', 'Producto')}</td>
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(event) => handleQuantityChange(index, event.target.value)}
                                    className="w-20 rounded-xl border border-slate-300 bg-white px-2 py-2 text-center text-xs text-slate-900"
                                  />
                                </td>
                                <td className="px-4 py-3 text-right text-slate-900">{item.priceDisplay !== undefined ? formatServerAmount(displayCurrency, item.priceDisplay) : formatActiveAmount(item.price)}</td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-900">{item.subtotalDisplay !== null ? formatServerAmount(displayCurrency, item.subtotalDisplay) : formatActiveAmount(item.subtotal)}</td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                  {secondaryCurrency ? formatActiveAmount(item.subtotal, secondaryCurrency) : t('admin.common.table.values.empty_dash', '—')}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                                  >
                                    {t('admin.invoices.create.items.remove', 'Quitar')}
                                  </button>
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