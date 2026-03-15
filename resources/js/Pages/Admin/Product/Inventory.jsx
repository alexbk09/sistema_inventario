import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import { useMemo, useState } from 'react';

export default function Inventory({ product, movements, summary, movementTypes, providers = [], warehouses = [], filters = {} }) {
  const [form, setForm] = useState({
    type: 'entry',
    quantity: 1,
    unit_price_usd: product.price_usd ?? 0,
    movement_type_id: movementTypes?.[0]?.id ?? '',
    provider_id: '',
    warehouse_id: warehouses?.[0]?.id ?? '',
    reference: '',
    notes: '',
  });

  const [providerSearch, setProviderSearch] = useState('');

  // filtros para el historial
  const [filterWarehouse, setFilterWarehouse] = useState(filters.warehouse_id ?? '');
  const [filterType, setFilterType] = useState(filters.type ?? '');
  const [filterDateFrom, setFilterDateFrom] = useState(filters.date_from ?? '');
  const [filterDateTo, setFilterDateTo] = useState(filters.date_to ?? '');

  const filteredProviders = useMemo(() => {
    const term = providerSearch.toLowerCase();
    if (!term) return providers;
    return providers.filter((p) => p.name.toLowerCase().includes(term));
  }, [providers, providerSearch]);

  const submit = (e) => {
    e.preventDefault();
    router.post(route('admin.products.inventory.store', product.id), form, {
      preserveScroll: true,
    });
  };

  const applyFilters = (page = 1) => {
    const params = {
      page,
      warehouse_id: filterWarehouse || undefined,
      type: filterType || undefined,
      date_from: filterDateFrom || undefined,
      date_to: filterDateTo || undefined,
    };
    router.get(route('admin.products.inventory.index', product.id), params, { replace: true, preserveState: true });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'quantity' || name === 'unit_price_usd' ? Number(value) : value }));
  };

  return (
    <AuthenticatedLayout>
      <Head title={`Inventario - ${product.name}`} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Inventario de producto</h1>
            <p className="text-muted-foreground">Gestiona entradas y salidas de stock para este producto.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-lg border border-border bg-muted/40">
            <h2 className="font-semibold text-foreground mb-2">Producto</h2>
            <p className="font-bold text-lg text-foreground">{product.name}</p>
            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
            <p className="text-sm text-muted-foreground mt-1">Stock actual: <span className="font-semibold text-foreground">{product.stock}</span></p>
            <p className="text-sm text-muted-foreground mt-1">Precio referencia: ${Number(product.price_usd).toFixed(2)}</p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-emerald-50/60">
            <h2 className="font-semibold text-emerald-800 mb-2">Entradas acumuladas</h2>
            <p className="text-sm text-emerald-700">Cantidad total: <span className="font-bold">{summary.entries_quantity}</span></p>
            <p className="text-sm text-emerald-700 mt-1">Valor total USD: <span className="font-bold">${summary.entries_total_value_usd.toFixed(2)}</span></p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-rose-50/60">
            <h2 className="font-semibold text-rose-800 mb-2">Salidas acumuladas</h2>
            <p className="text-sm text-rose-700">Cantidad total: <span className="font-bold">{summary.exits_quantity}</span></p>
            <p className="text-sm text-rose-700 mt-1">Valor total USD: <span className="font-bold">${summary.exits_total_value_usd.toFixed(2)}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <form onSubmit={submit} className="space-y-4 p-4 rounded-lg border border-border bg-background">
            <h2 className="font-semibold text-foreground mb-2">Registrar movimiento</h2>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Sucursal</label>
              <select
                name="warehouse_id"
                value={form.warehouse_id}
                onChange={handleChange}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Tipo</label>
              <select name="type" value={form.type} onChange={handleChange} className="w-full border border-border rounded px-3 py-2 text-sm bg-background">
                <option value="entry">Entrada</option>
                <option value="exit">Salida</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Movement type</label>
              <select name="movement_type_id" value={form.movement_type_id} onChange={handleChange} className="w-full border border-border rounded px-3 py-2 text-sm bg-background">
                {movementTypes.map((mt) => (
                  <option key={mt.id} value={mt.id}>{mt.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Proveedor (opcional)</label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Buscar proveedor..."
                  value={providerSearch}
                  onChange={(e) => setProviderSearch(e.target.value)}
                  className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
                />
                <select
                  name="provider_id"
                  value={form.provider_id}
                  onChange={handleChange}
                  className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
                >
                  <option value="">Sin proveedor</option>
                  {filteredProviders.map((prov) => (
                    <option key={prov.id} value={prov.id}>{prov.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Cantidad</label>
                <input type="number" name="quantity" min="1" value={form.quantity} onChange={handleChange} className="w-full border border-border rounded px-3 py-2 text-sm bg-background" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Precio unitario (USD)</label>
                <input type="number" name="unit_price_usd" min="0" step="0.01" value={form.unit_price_usd} onChange={handleChange} className="w-full border border-border rounded px-3 py-2 text-sm bg-background" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Referencia (opcional)</label>
              <input type="text" name="reference" value={form.reference} onChange={handleChange} className="w-full border border-border rounded px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Motivo del movimiento</label>
              <textarea name="notes" rows="3" value={form.notes} onChange={handleChange} className="w-full border border-border rounded px-3 py-2 text-sm bg-background" />
            </div>
            <button type="submit" className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition">
              Guardar movimiento
            </button>
          </form>

          <div className="md:col-span-2">
            <h2 className="font-semibold text-foreground mb-3">Historial de movimientos</h2>
            <div className="mb-3 grid grid-cols-1 md:grid-cols-5 gap-3">
              <select value={filterWarehouse} onChange={(e) => setFilterWarehouse(e.target.value)} className="border border-border rounded px-3 py-2 bg-background">
                <option value="">Todas las sucursales</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
              </select>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border border-border rounded px-3 py-2 bg-background">
                <option value="">Todos los tipos</option>
                <option value="entry">Entrada</option>
                <option value="exit">Salida</option>
              </select>
              <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="border border-border rounded px-3 py-2 bg-background" />
              <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="border border-border rounded px-3 py-2 bg-background" />
           
            <div className="flex gap-2 mb-3">
              <button type="button" onClick={() => applyFilters(1)} className="px-3 py-1 bg-primary text-primary-foreground rounded">Aplicar filtros</button>
              <button type="button" onClick={() => { setFilterWarehouse(''); setFilterType(''); setFilterDateFrom(''); setFilterDateTo(''); applyFilters(1); }} className="px-3 py-1 border border-border rounded">Limpiar</button>
            </div>
             </div>
            <div className="overflow-x-auto rounded-lg border border-border max-h-[420px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Fecha</th>
                    <th className="px-3 py-2 text-left font-semibold">Tipo</th>
                    <th className="px-3 py-2 text-left font-semibold">Origen</th>
                    <th className="px-3 py-2 text-left font-semibold">Sucursal</th>
                    <th className="px-3 py-2 text-right font-semibold">Cantidad</th>
                    <th className="px-3 py-2 text-right font-semibold">P. Unit USD</th>
                    <th className="px-3 py-2 text-right font-semibold">Valor total USD</th>
                    <th className="px-3 py-2 text-left font-semibold">Ref</th>
                    <th className="px-3 py-2 text-left font-semibold">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.data.map((m) => {
                    const isEntry = m.type === 'entry';
                    return (
                      <tr key={m.id} className="border-b border-border hover:bg-muted/40">
                        <td className="px-3 py-2">{new Date(m.created_at).toLocaleString('es-ES')}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${isEntry ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {isEntry ? 'Entrada' : 'Salida'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs capitalize">{m.source}</td>
                        <td className="px-3 py-2 text-xs">{m.warehouse ? `${m.warehouse.name} (${m.warehouse.code})` : '-'}</td>
                        <td className="px-3 py-2 text-right">{m.quantity}</td>
                        <td className="px-3 py-2 text-right">${Number(m.unit_price_usd).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">${Number(m.total_value_usd).toFixed(2)}</td>
                        <td className="px-3 py-2 text-xs">{m.reference || '-'}</td>
                        <td className="px-3 py-2 text-xs truncate max-w-[180px]" title={m.notes}>{m.notes || '-'}</td>
                      </tr>
                    );
                  })}
                  {movements.data.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground text-sm">
                        No hay movimientos registrados para este producto.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Paginador simple */}
            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-muted-foreground">Página {movements.current_page ?? movements.meta?.current_page ?? 1} de {movements.last_page ?? movements.meta?.last_page ?? 1}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => applyFilters((movements.current_page ?? movements.meta?.current_page ?? 1) - 1)} disabled={(movements.current_page ?? movements.meta?.current_page ?? 1) <= 1} className="px-3 py-1 border rounded">Anterior</button>
                <button onClick={() => applyFilters((movements.current_page ?? movements.meta?.current_page ?? 1) + 1)} disabled={(movements.current_page ?? movements.meta?.current_page ?? 1) >= (movements.last_page ?? movements.meta?.last_page ?? 1)} className="px-3 py-1 border rounded">Siguiente</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
