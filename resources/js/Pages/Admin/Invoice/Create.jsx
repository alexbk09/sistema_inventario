import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

export default function Create({ products, customers, warehouses = [], layaways = [] }) {
  const { data, setData, post, processing } = useForm({
    customer_id: '',
    document_type: 'invoice',
    items: [],
    warehouse_id: '',
    layaway_id: '',
    credit_sale: false,
    credit_due_date: '',
    payments: [],
  });
  const [internal_notes, setInternalNotes] = useState('');
  const [public_notes, setPublicNotes] = useState('');

  const [rate, setRate] = useState(null);

  const ensureRate = async () => {
    if (rate !== null) return rate;
    try {
      const res = await fetch('/api/currency/promedio');
      if (!res.ok) throw new Error('failed');
      const json = await res.json();
      const r = Number(json.promedio ?? 0);
      setRate(r);
      return r;
    } catch (e) {
      console.error('Error fetching rate', e);
      return 0;
    }
  };

  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => {
      const name = String(p.name ?? '').toLowerCase();
      const sku = String(p.sku ?? '').toLowerCase();
      const barcode = String(p.barcode ?? '').toLowerCase();
      return name.includes(term) || sku.includes(term) || barcode.includes(term);
    });
  }, [products, search]);

  const itemsWithDetails = useMemo(() => {
    return data.items.map((it) => {
      const product = products.find((p) => String(p.id) === String(it.product_id));
      const price = Number(product?.price_usd ?? 0);
      const quantity = Number(it.quantity ?? 1);
      return {
        ...it,
        product,
        price,
        quantity,
        subtotal: price * quantity,
        // si la API devolvió un valor en bolívares lo dejamos aquí
        bs_subtotal: Number(it.bs_subtotal ?? 0),
      };
    });
  }, [data.items, products]);

  const subtotalUsd = itemsWithDetails.reduce((sum, it) => sum + it.subtotal, 0);
  const paymentsTotalUsd = (data.payments || []).reduce((sum, p) => sum + (Number(p.amount_usd) || 0), 0);

  const layawaysForCustomer = useMemo(() => {
    if (!data.customer_id) return layaways;
    return (layaways || []).filter((l) => String(l.customer_id) === String(data.customer_id));
  }, [layaways, data.customer_id]);

  const handleAddProduct = async (product) => {
    if (!product) return;
    const existingIndex = data.items.findIndex((it) => String(it.product_id) === String(product.id));
    if (existingIndex >= 0) {
      const next = data.items.map((it, idx) => (
        idx === existingIndex
          ? { ...it, quantity: Number(it.quantity ?? 1) + 1 }
          : it
      ));
      // recalcular bs_subtotal para el item modificado
      const r = await ensureRate();
      const updated = next.map((it, idx) => {
        if (idx !== existingIndex) return it;
        const productObj = products.find((p) => String(p.id) === String(it.product_id));
        const price = Number(productObj?.price_usd ?? 0);
        const qty = Number(it.quantity ?? 1);
        const subtotal = price * qty;
        return { ...it, bs_subtotal: Math.round(subtotal * r * 100) / 100 };
      });
      setData('items', updated);
    } else {
      const newItem = { product_id: product.id, quantity: 1 };
      const r = await ensureRate();
      const price = Number(product.price_usd ?? 0);
      newItem.bs_subtotal = Math.round(price * 1 * r * 100) / 100;
      setData('items', [...data.items, newItem]);
    }
  };

  const handleQuantityChange = async (index, quantity) => {
    const value = Math.max(1, Number(quantity) || 1);
    const next = data.items.map((it, idx) => (
      idx === index ? { ...it, quantity: value } : it
    ));
    const r = await ensureRate();
    const updated = next.map((it, idx) => {
      if (idx !== index) return it;
      const productObj = products.find((p) => String(p.id) === String(it.product_id));
      const price = Number(productObj?.price_usd ?? 0);
      const qty = Number(it.quantity ?? 1);
      const subtotal = price * qty;
      return { ...it, bs_subtotal: Math.round(subtotal * r * 100) / 100 };
    });
    setData('items', updated);
  };

  const handleRemoveItem = (index) => {
    const next = data.items.filter((_, idx) => idx !== index);
    setData('items', next);
  };

  // Solicita al backend la conversión de USD a bolívares para el subtotal del item
  const fetchBsForItem = async (index) => {
    const it = itemsWithDetails[index];
    if (!it) return;
    try {
      const res = await fetch('/api/currency/promedio');
      if (!res.ok) throw new Error('Error al obtener promedio');
      const json = await res.json();
      const rate = Number(json.promedio ?? 0);
      const amountBs = Math.round((it.subtotal * rate) * 100) / 100;
      const next = data.items.map((it, idx) => (idx === index ? { ...it, bs_subtotal: amountBs } : it));
      setData('items', next);
    } catch (e) {
      console.error('fetchBsForItem error', e);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    post(route('admin.invoices.store'));
  };

  return (
    <AuthenticatedLayout>
      <Head title="Nueva factura" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Nueva factura</h1>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Notas internas</label>
                <textarea
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition min-h-[70px]"
                  placeholder="Solo visibles para el equipo interno (no para el cliente)."
                  value={data.internal_notes}
                  onChange={(e) => setData('internal_notes', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Notas para el cliente</label>
                <textarea
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition min-h-[70px]"
                  placeholder="Mensaje que aparecerá en la factura o comprobante."
                  value={data.public_notes}
                  onChange={(e) => setData('public_notes', e.target.value)}
                />
              </div>
            </div>
            <p className="text-muted-foreground">
              Crea una factura desde el panel de administración usando un flujo similar al checkout.
            </p>
          </div>
          <Link
            href={route('admin.invoices.index')}
            className="px-3 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition"
          >
            Volver al listado
          </Link>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal (similar al formulario de checkout) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cliente */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Datos del cliente</h2>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground mb-1">
                  Cliente asociado
                </label>
                <select
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                  value={data.customer_id}
                  onChange={(e) => setData('customer_id', e.target.value)}
                >
                  <option value="">Sin cliente (opcional)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-semibold text-foreground mb-1">Tipo de comprobante</label>
                <select
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                  value={data.document_type}
                  onChange={(e) => setData('document_type', e.target.value)}
                >
                  <option value="invoice">Factura</option>
                  <option value="delivery_note">Nota de entrega</option>
                  <option value="proforma">Proforma / Presupuesto</option>
                </select>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-semibold text-foreground mb-1">Sucursal (opcional)</label>
                <select
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                  value={data.warehouse_id}
                  onChange={(e) => setData('warehouse_id', e.target.value)}
                >
                  <option value="">Todas</option>
                  {(warehouses || []).map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>
              <div className="mt-4 space-y-2">
                <label className="inline-flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="rounded border-border text-primary focus:ring-primary"
                    checked={data.credit_sale}
                    onChange={(e) => setData('credit_sale', e.target.checked)}
                  />
                  <span>Registrar como venta a crédito (cargo en cuenta del cliente)</span>
                </label>
                {data.credit_sale && (
                  <div className="mt-1">
                    <label className="block text-xs font-semibold text-foreground mb-1">Fecha de vencimiento (opcional)</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition"
                      value={data.credit_due_date}
                      onChange={(e) => setData('credit_due_date', e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-foreground mb-1">Apartado asociado (opcional)</label>
                <select
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition text-sm"
                  value={data.layaway_id}
                  onChange={(e) => setData('layaway_id', e.target.value)}
                >
                  <option value="">Sin apartado</option>
                  {layawaysForCustomer.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.number} – {l.customer?.name ?? 'Sin cliente'} – USD {Number(l.total_usd ?? 0).toFixed(2)}
                    </option>
                  ))}
                </select>
                {!data.customer_id && layawaysForCustomer.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">Selecciona un cliente para filtrar sus apartados activos.</p>
                )}
              </div>
            </div>

            {/* Buscador de productos */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h2 className="text-xl font-bold text-foreground">Productos</h2>
                <p className="text-xs text-muted-foreground">
                  Busca productos por nombre, SKU o código de barras y agrégalos a la factura.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">
                  Buscar producto
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Escribe para buscar..."
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="border border-border rounded-lg max-h-56 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    No se encontraron productos.
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {filteredProducts.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/60">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{p.name}</span>
                          <span className="text-xs text-muted-foreground">
                            USD {Number(p.price_usd ?? 0).toFixed(2)}
                            {typeof p.stock !== 'undefined' && (
                              <>
                                {' '}
                                · Stock: {p.stock}
                              </>
                            )}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddProduct(p)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
                        >
                          Agregar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Items agregados a la factura */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Ítems de la factura</h3>
                {itemsWithDetails.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aún no has agregado productos. Usa el buscador para añadirlos.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-border rounded-lg max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-3 py-2 text-left">Producto</th>
                          <th className="px-3 py-2 text-center w-28">Cantidad</th>
                          <th className="px-3 py-2 text-right w-24">Precio</th>
                          <th className="px-3 py-2 text-right w-28">Subtotal USD</th>
                          <th className="px-3 py-2 text-right w-32">Subtotal Bs</th>
                          <th className="px-3 py-2 w-16" />
                        </tr>
                      </thead>
                      <tbody>
                        {itemsWithDetails.map((it, index) => (
                          <tr key={`${it.product?.id ?? index}-${index}`} className="border-t border-border">
                            <td className="px-3 py-2 text-foreground">
                              {it.product?.name ?? 'Producto'}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                min={1}
                                value={it.quantity}
                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                className="w-20 text-center px-2 py-1 border border-border rounded bg-background text-foreground text-xs"
                              />
                            </td>
                            <td className="px-3 py-2 text-right text-foreground">
                              ${it.price.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-foreground">
                              ${it.subtotal.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-foreground">
                              {it.bs_subtotal ? (
                                <span>Bs {Number(it.bs_subtotal).toLocaleString('es-VE')}</span>
                              ) : (
                                <button type="button" onClick={() => fetchBsForItem(index)} className="text-xs px-2 py-1 border rounded">
                                  Calcular Bs
                                </button>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-xs text-red-500 hover:text-red-600"
                              >
                                Quitar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resumen (similar al resumen del checkout) */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-20 h-fit space-y-4">
              <h2 className="text-xl font-bold text-foreground">Resumen de factura</h2>

              <div className="space-y-2 border-b border-border pb-3 max-h-40 overflow-y-auto">
                {itemsWithDetails.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay productos agregados todavía.
                  </p>
                ) : (
                  itemsWithDetails.map((it, index) => (
                    <div key={`${it.product?.id ?? index}-summary`} className="flex justify-between gap-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{it.product?.name ?? 'Producto'}</p>
                        <p className="text-xs text-muted-foreground">x{it.quantity}</p>
                      </div>
                      <p className="font-semibold text-foreground whitespace-nowrap">
                        ${it.subtotal.toFixed(2)}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal USD:</span>
                  <span className="font-semibold text-foreground">${subtotalUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal Bs (convertidos):</span>
                  <span className="font-semibold text-foreground">
                    Bs {itemsWithDetails.reduce((s, it) => s + (Number(it.bs_subtotal) || 0), 0).toLocaleString('es-VE')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total pagos USD:</span>
                  <span className="font-semibold text-foreground">${paymentsTotalUsd.toFixed(2)}</span>
                </div>
              </div>

              {/* Pagos rápidos */}
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">Pagos (opcional, puedes registrar formas de pago básicas aquí):</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {(data.payments || []).map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <select
                        className="border border-border rounded px-2 py-1 bg-background"
                        value={p.method}
                        onChange={(e) => {
                          const value = e.target.value;
                          const next = [...data.payments];
                          next[idx] = { ...next[idx], method: value };
                          setData('payments', next);
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
                        className="flex-1 border border-border rounded px-2 py-1 bg-background"
                        value={p.amount_usd}
                        onChange={(e) => {
                          const value = e.target.value;
                          const next = [...data.payments];
                          next[idx] = { ...next[idx], amount_usd: value };
                          setData('payments', next);
                        }}
                      />
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => {
                          const next = (data.payments || []).filter((_, i) => i !== idx);
                          setData('payments', next);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setData('payments', [...(data.payments || []), { method: 'efectivo', amount_usd: '' }])}
                  className="w-full py-1.5 border border-dashed border-border rounded text-xs text-muted-foreground hover:bg-muted/60"
                >
                  Añadir pago
                </button>
              </div>

              <div className="pt-3 border-t border-border space-y-3">
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 text-sm"
                >
                  {processing ? 'Guardando...' : 'Crear factura'}
                </button>

                <Link
                  href={route('admin.invoices.index')}
                  className="block w-full text-center py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition"
                >
                  Cancelar
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
