import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

export default function Create({ invoices = [], customers = [], products = [] }) {
  const { data, setData, post, processing } = useForm({
    invoice_id: '',
    customer_id: '',
    reason_type: 'defective',
    reason: '',
    resolution_type: 'credit_note',
    items: [],
  });

  const [productSearch, setProductSearch] = useState('');

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => {
      const name = String(p.name ?? '').toLowerCase();
      const sku = String(p.sku ?? '').toLowerCase();
      const barcode = String(p.barcode ?? '').toLowerCase();
      return name.includes(term) || sku.includes(term) || barcode.includes(term);
    });
  }, [products, productSearch]);

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
      };
    });
  }, [data.items, products]);

  const subtotalUsd = itemsWithDetails.reduce((sum, it) => sum + it.subtotal, 0);

  const handleAddProduct = (product) => {
    if (!product) return;
    const existingIndex = data.items.findIndex((it) => String(it.product_id) === String(product.id));
    if (existingIndex >= 0) {
      const next = data.items.map((it, idx) => (
        idx === existingIndex
          ? { ...it, quantity: Number(it.quantity ?? 1) + 1 }
          : it
      ));
      setData('items', next);
    } else {
      setData('items', [...data.items, { product_id: product.id, quantity: 1, reason: '' }]);
    }
  };

  const handleQuantityChange = (index, quantity) => {
    const value = Math.max(1, Number(quantity) || 1);
    const next = data.items.map((it, idx) => (
      idx === index ? { ...it, quantity: value } : it
    ));
    setData('items', next);
  };

  const handleReasonChange = (index, reason) => {
    const next = data.items.map((it, idx) => (
      idx === index ? { ...it, reason } : it
    ));
    setData('items', next);
  };

  const handleRemoveItem = (index) => {
    const next = data.items.filter((_, idx) => idx !== index);
    setData('items', next);
  };

  const submit = (e) => {
    e.preventDefault();
    post(route('admin.rmas.store'));
  };

  return (
    <AuthenticatedLayout>
      <Head title="Nueva devolución" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Nueva Devolución / RMA</h1>
            <p className="text-muted-foreground">
              Registra productos devueltos por defectos, garantía o notas de crédito.
            </p>
          </div>
          <Link
            href={route('admin.rmas.index')}
            className="px-3 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition"
          >
            Volver al listado
          </Link>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Datos generales */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-bold text-foreground mb-2">Datos de la devolución</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">
                    Factura relacionada (opcional)
                  </label>
                  <select
                    value={data.invoice_id}
                    onChange={(e) => setData('invoice_id', e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  >
                    <option value="">Sin factura</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.number} · ${Number(inv.total_usd ?? 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">
                    Cliente (opcional)
                  </label>
                  <select
                    value={data.customer_id}
                    onChange={(e) => setData('customer_id', e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  >
                    <option value="">Sin cliente asociado</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">
                    Tipo de motivo
                  </label>
                  <select
                    value={data.reason_type}
                    onChange={(e) => setData('reason_type', e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  >
                    <option value="defective">Producto defectuoso</option>
                    <option value="warranty">Garantía</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">
                    Resolución sugerida
                  </label>
                  <select
                    value={data.resolution_type}
                    onChange={(e) => setData('resolution_type', e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  >
                    <option value="credit_note">Nota de crédito</option>
                    <option value="replace">Reemplazo</option>
                    <option value="refund">Reembolso</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">
                  Descripción del caso
                </label>
                <textarea
                  value={data.reason}
                  onChange={(e) => setData('reason', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  placeholder="Describe el problema reportado por el cliente..."
                />
              </div>
            </div>

            {/* Buscador de productos */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h2 className="text-xl font-bold text-foreground">Productos devueltos</h2>
                <p className="text-xs text-muted-foreground">
                  Busca productos y añádelos a la devolución.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">
                  Buscar producto
                </label>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Nombre, SKU o código de barras"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
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
                                · Stock actual: {p.stock}
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

              {/* Items agregados a la devolución */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Ítems de la devolución</h3>
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
                          <th className="px-3 py-2 text-center w-24">Cantidad</th>
                          <th className="px-3 py-2 text-right w-24">Precio</th>
                          <th className="px-3 py-2 text-right w-28">Subtotal</th>
                          <th className="px-3 py-2">Motivo</th>
                          <th className="px-3 py-2 w-16" />
                        </tr>
                      </thead>
                      <tbody>
                        {itemsWithDetails.map((it, index) => (
                          <tr key={`${it.product?.id ?? index}-${index}`} className="border-t border-border align-top">
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
                            <td className="px-3 py-2 text-right font-semibold text-foreground whitespace-nowrap">
                              ${it.subtotal.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-foreground">
                              <textarea
                                value={it.reason || ''}
                                onChange={(e) => handleReasonChange(index, e.target.value)}
                                rows={2}
                                className="w-full px-2 py-1 border border-border rounded bg-background text-xs text-foreground"
                                placeholder="Descripción del problema de este producto"
                              />
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

          {/* Resumen */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-20 h-fit space-y-4">
              <h2 className="text-xl font-bold text-foreground">Resumen de devolución</h2>

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
                  <span className="text-muted-foreground">Total estimado USD:</span>
                  <span className="font-semibold text-foreground">${subtotalUsd.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-border space-y-3">
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 text-sm"
                >
                  {processing ? 'Guardando...' : 'Registrar devolución'}
                </button>

                <Link
                  href={route('admin.rmas.index')}
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
