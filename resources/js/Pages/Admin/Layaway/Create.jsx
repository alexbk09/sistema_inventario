import { Head, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

export default function Create({ customers = [], products = [], rateBs }) {
  const { data, setData, post, processing } = useForm({
    customer_id: '',
    expires_at: '',
    notes: '',
    items: [],
  });

  const [productSearch, setProductSearch] = useState('');

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => String(p.name ?? '').toLowerCase().includes(term));
  }, [products, productSearch]);

  const itemsWithDetails = useMemo(() => {
    return data.items.map((it) => {
      const product = products.find((p) => String(p.id) === String(it.product_id));
      const quantity = Number(it.quantity ?? 1);
      const priceUsd = Number(product?.price_usd ?? 0);
      const subtotalUsd = priceUsd * quantity;
      const subtotalBs = subtotalUsd * Number(rateBs ?? 0);
      return { ...it, product, quantity, priceUsd, subtotalUsd, subtotalBs };
    });
  }, [data.items, products, rateBs]);

  const totalUsd = useMemo(
    () => itemsWithDetails.reduce((acc, it) => acc + (it.subtotalUsd || 0), 0),
    [itemsWithDetails],
  );
  const totalBs = totalUsd * Number(rateBs ?? 0);

  const handleAddProduct = (product) => {
    if (!product) return;
    const existingIndex = data.items.findIndex((it) => String(it.product_id) === String(product.id));
    if (existingIndex >= 0) {
      const next = data.items.map((it, idx) => (
        idx === existingIndex ? { ...it, quantity: Number(it.quantity ?? 1) + 1 } : it
      ));
      setData('items', next);
    } else {
      setData('items', [...data.items, { product_id: product.id, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (index, quantity) => {
    const value = Math.max(1, Number(quantity) || 1);
    const next = data.items.map((it, idx) => (
      idx === index ? { ...it, quantity: value } : it
    ));
    setData('items', next);
  };

  const handleRemoveItem = (index) => {
    const next = data.items.filter((_, idx) => idx !== index);
    setData('items', next);
  };

  const submit = (e) => {
    e.preventDefault();
    post(route('admin.layaways.store'));
  };

  return (
    <AuthenticatedLayout>
      <Head title="Nuevo apartado" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Nuevo Apartado</h1>
            <p className="text-muted-foreground">Separa productos para tu cliente con pagos parciales.</p>
          </div>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground">Datos del cliente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">Cliente</label>
                  <select
                    value={data.customer_id}
                    onChange={(e) => setData('customer_id', e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                    required
                  >
                    <option value="">Selecciona un cliente</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} - {c.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">Fecha de vencimiento</label>
                  <input
                    type="date"
                    value={data.expires_at}
                    onChange={(e) => setData('expires_at', e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Notas</label>
                <textarea
                  value={data.notes}
                  onChange={(e) => setData('notes', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  rows={2}
                  placeholder="Condiciones especiales, forma de pago, etc."
                />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-foreground">Productos</h2>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Buscar producto</label>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Filtrar por nombre"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                />
              </div>

              <div className="border border-border rounded-lg max-h-48 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">No se encontraron productos.</div>
                ) : (
                  <ul className="divide-y divide-border">
                    {filteredProducts.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/60">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{p.name}</span>
                          <span className="text-xs text-muted-foreground">Precio: ${Number(p.price_usd ?? 0).toFixed(2)}</span>
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

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Detalle del apartado</h3>
                {itemsWithDetails.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aún no has agregado productos.</p>
                ) : (
                  <div className="overflow-x-auto border border-border rounded-lg max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-3 py-2 text-left">Producto</th>
                          <th className="px-3 py-2 text-center w-24">Cantidad</th>
                          <th className="px-3 py-2 text-right w-24">Precio USD</th>
                          <th className="px-3 py-2 text-right w-28">Subtotal</th>
                          <th className="px-3 py-2 w-16" />
                        </tr>
                      </thead>
                      <tbody>
                        {itemsWithDetails.map((it, index) => (
                          <tr key={`${it.product?.id ?? index}-${index}`} className="border-t border-border">
                            <td className="px-3 py-2 text-foreground">{it.product?.name ?? 'Producto'}</td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                min={1}
                                value={it.quantity}
                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                className="w-20 text-center px-2 py-1 border border-border rounded bg-background text-foreground text-xs"
                              />
                            </td>
                            <td className="px-3 py-2 text-right text-foreground">${it.priceUsd.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right text-foreground">${it.subtotalUsd.toFixed(2)}</td>
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

          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 space-y-3 sticky top-20 h-fit">
              <h2 className="text-lg font-bold text-foreground mb-2">Resumen</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Productos:</span>
                  <span className="font-semibold text-foreground">{itemsWithDetails.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total USD:</span>
                  <span className="font-semibold text-foreground">${totalUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Bs:</span>
                  <span className="font-semibold text-foreground">{totalBs.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                El apartado se creará en estado <span className="font-semibold text-foreground">activo</span>. Podrás marcarlo como completado,
                cancelado o vencido desde su detalle.
              </p>

              <button
                type="submit"
                disabled={processing}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 text-sm mt-3"
              >
                {processing ? 'Guardando...' : 'Crear apartado'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
