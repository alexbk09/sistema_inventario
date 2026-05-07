import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminFlowShell, { AdminFlowSection } from '@/Components/admin/AdminFlowShell.jsx';

export default function Create({ products, customers, warehouses = [], layaways = [], users = [] }) {
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
        quantity,
        subtotal: price * quantity,
        bs_subtotal: Number(item.bs_subtotal ?? 0),
      };
    });
  }, [data.items, products]);

  const subtotalUsd = itemsWithDetails.reduce((sum, item) => sum + item.subtotal, 0);
  const subtotalBs = itemsWithDetails.reduce((sum, item) => sum + (Number(item.bs_subtotal) || 0), 0);
  const paymentsTotalUsd = (data.payments || []).reduce((sum, payment) => sum + (Number(payment.amount_usd) || 0), 0);

  const layawaysForCustomer = useMemo(() => {
    if (!data.customer_id) return layaways;
    return (layaways || []).filter((layaway) => String(layaway.customer_id) === String(data.customer_id));
  }, [layaways, data.customer_id]);

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
      eyebrow: 'Cliente',
      title: 'Contexto',
      description: 'Cliente, documento, vendedor y notas visibles o internas.',
      badge: 'Base',
    },
    {
      key: 'items',
      eyebrow: 'Catalogo',
      title: 'Productos',
      description: 'Busca, agrega y ajusta cantidades antes de emitir la factura.',
      badge: `${itemsWithDetails.length}`,
    },
  ];

  const summary = (
    <>
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Resumen</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Factura en preparación</h2>
        <div className="mt-5 max-h-52 space-y-3 overflow-y-auto border-b border-slate-200 pb-4">
          {itemsWithDetails.length === 0 ? (
            <p className="text-sm text-slate-500">No hay productos agregados todavía.</p>
          ) : itemsWithDetails.map((item, index) => (
            <div key={`${item.product?.id ?? index}-summary`} className="flex justify-between gap-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{item.product?.name ?? 'Producto'}</p>
                <p className="text-xs text-slate-500">x{item.quantity}</p>
              </div>
              <p className="font-semibold text-slate-900">${item.subtotal.toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span>Subtotal USD</span>
            <strong className="text-slate-900">${subtotalUsd.toFixed(2)}</strong>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span>Subtotal Bs</span>
            <strong className="text-slate-900">Bs {subtotalBs.toLocaleString('es-VE')}</strong>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span>Pagos cargados</span>
            <strong className="text-slate-900">${paymentsTotalUsd.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Cobros rápidos</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">Puedes adelantar formas de pago básicas sin salir de la creación de factura.</p>
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
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
                <option value="zelle">Zelle</option>
                <option value="otro">Otro</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Monto USD"
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
          onClick={() => setData('payments', [...(data.payments || []), { method: 'efectivo', amount_usd: '' }])}
          className="mt-4 w-full rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Añadir pago
        </button>
      </div>
    </>
  );

  return (
    <AuthenticatedLayout>
      <Head title="Nueva factura" />

      <form onSubmit={submit}>
        <AdminFlowShell
          title="Crea facturas con un flujo más claro para el equipo administrativo"
          description="La vista se organiza por bloques para reducir ruido visual: primero defines el contexto de la operación y luego armas el detalle de productos, mientras el resumen queda siempre visible."
          backHref={route('admin.invoices.index')}
          backLabel="Volver al listado"
          stats={[
            { label: 'Productos', value: itemsWithDetails.length },
            { label: 'Total USD', value: `$${subtotalUsd.toFixed(2)}` },
            { label: 'Pagos', value: data.payments?.length ?? 0 },
          ]}
          sections={sections}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          contextTitle="Factura"
          contextDescription="Administra cliente, documento y detalle comercial sin perder de vista montos ni cobros rápidos."
          contextItems={[
            { label: 'Cliente', value: data.customer_id ? 'Asignado' : 'Opcional' },
            { label: 'Documento', value: data.document_type === 'invoice' ? 'Factura' : data.document_type === 'delivery_note' ? 'Nota de entrega' : 'Proforma' },
            { label: 'Crédito', value: data.credit_sale ? 'Sí' : 'No' },
          ]}
          summary={summary}
          actions={
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Guardado</p>
                <p className="mt-1 text-sm text-slate-600">Estás editando <span className="font-semibold text-slate-900">{sections.find((section) => section.key === activeSection)?.title}</span>.</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href={route('admin.invoices.index')}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={processing}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {processing ? 'Guardando...' : 'Crear factura'}
                </button>
              </div>
            </div>
          }
        >
          {activeSection === 'context' ? (
            <>
              <AdminFlowSection
                eyebrow="Documento"
                title="Contexto comercial"
                description="Define cliente, tipo de comprobante, bodega, vendedor y reglas opcionales de crédito antes de agregar productos."
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Cliente asociado</label>
                    <select
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                      value={data.customer_id}
                      onChange={(event) => setData('customer_id', event.target.value)}
                    >
                      <option value="">Sin cliente (opcional)</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de comprobante</label>
                    <select
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                      value={data.document_type}
                      onChange={(event) => setData('document_type', event.target.value)}
                    >
                      <option value="invoice">Factura</option>
                      <option value="delivery_note">Nota de entrega</option>
                      <option value="proforma">Proforma / Presupuesto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Sucursal</label>
                    <select
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                      value={data.warehouse_id}
                      onChange={(event) => setData('warehouse_id', event.target.value)}
                    >
                      <option value="">Todas</option>
                      {(warehouses || []).map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Vendedor</label>
                    <select
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                      value={data.seller_id}
                      onChange={(event) => setData('seller_id', event.target.value)}
                    >
                      <option value="">Usuario actual</option>
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
                      <span>Registrar como venta a crédito</span>
                    </label>
                    {data.credit_sale ? (
                      <div className="mt-3 max-w-sm">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de vencimiento</label>
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
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Apartado asociado</label>
                    <select
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                      value={data.layaway_id}
                      onChange={(event) => setData('layaway_id', event.target.value)}
                    >
                      <option value="">Sin apartado</option>
                      {layawaysForCustomer.map((layaway) => (
                        <option key={layaway.id} value={layaway.id}>
                          {layaway.number} – {layaway.customer?.name ?? 'Sin cliente'} – USD {Number(layaway.total_usd ?? 0).toFixed(2)}
                        </option>
                      ))}
                    </select>
                    {!data.customer_id && layawaysForCustomer.length > 0 ? (
                      <p className="mt-2 text-xs text-slate-500">Selecciona un cliente para filtrar sus apartados activos.</p>
                    ) : null}
                  </div>
                </div>
              </AdminFlowSection>

              <AdminFlowSection
                eyebrow="Notas"
                title="Notas internas y para el cliente"
                description="Separa la información operativa de la que sí verá el cliente en su factura o comprobante."
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Notas internas</label>
                    <textarea
                      className="min-h-[110px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                      placeholder="Solo visibles para el equipo interno."
                      value={data.internal_notes}
                      onChange={(event) => setData('internal_notes', event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Notas para el cliente</label>
                    <textarea
                      className="min-h-[110px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                      placeholder="Mensaje que aparecerá en la factura o comprobante."
                      value={data.public_notes}
                      onChange={(event) => setData('public_notes', event.target.value)}
                    />
                  </div>
                </div>
              </AdminFlowSection>
            </>
          ) : (
            <AdminFlowSection
              eyebrow="Catalogo"
              title="Productos y detalle"
              description="Busca por nombre, SKU o código de barras y arma la factura con cantidades y subtotales convertidos."
            >
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Buscar producto</label>
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Escribe para buscar..."
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                  />
                </div>

                <div className="overflow-hidden rounded-[24px] border border-slate-200">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">No se encontraron productos.</div>
                  ) : (
                    <ul className="max-h-64 divide-y divide-slate-200 overflow-y-auto bg-white">
                      {filteredProducts.map((product) => (
                        <li key={product.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">{product.name}</span>
                            <span className="text-xs text-slate-500">
                              USD {Number(product.price_usd ?? 0).toFixed(2)}
                              {typeof product.stock !== 'undefined' ? ` · Stock: ${product.stock}` : ''}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddProduct(product)}
                            className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                          >
                            Agregar
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">Ítems de la factura</h3>
                  {itemsWithDetails.length === 0 ? (
                    <p className="text-sm text-slate-500">Aún no has agregado productos. Usa el buscador para añadirlos.</p>
                  ) : (
                    <div className="overflow-hidden rounded-[24px] border border-slate-200">
                      <div className="max-h-[420px] overflow-auto bg-white">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              <th className="px-4 py-3 text-left">Producto</th>
                              <th className="px-4 py-3 text-center w-28">Cantidad</th>
                              <th className="px-4 py-3 text-right w-24">Precio</th>
                              <th className="px-4 py-3 text-right w-28">Subtotal USD</th>
                              <th className="px-4 py-3 text-right w-32">Subtotal Bs</th>
                              <th className="px-4 py-3 w-16" />
                            </tr>
                          </thead>
                          <tbody>
                            {itemsWithDetails.map((item, index) => (
                              <tr key={`${item.product?.id ?? index}-${index}`} className="border-t border-slate-200">
                                <td className="px-4 py-3 text-slate-900">{item.product?.name ?? 'Producto'}</td>
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(event) => handleQuantityChange(index, event.target.value)}
                                    className="w-20 rounded-xl border border-slate-300 bg-white px-2 py-2 text-center text-xs text-slate-900"
                                  />
                                </td>
                                <td className="px-4 py-3 text-right text-slate-900">${item.price.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-900">${item.subtotal.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                  {item.bs_subtotal ? (
                                    <span>Bs {Number(item.bs_subtotal).toLocaleString('es-VE')}</span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => fetchBsForItem(index)}
                                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                      Calcular Bs
                                    </button>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                                  >
                                    Quitar
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