import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminFlowShell, { AdminFlowSection } from '@/Components/admin/AdminFlowShell.jsx';
import { useI18n } from '@/Hooks/useI18n';

export default function Create({ warehouses = [], products = [] }) {
  const { t } = useI18n();
  const { data, setData, post, processing } = useForm({
    from_warehouse_id: '',
    to_warehouse_id: '',
    notes: '',
    items: [],
  });
  const [activeSection, setActiveSection] = useState('route');
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
      return { ...item, product, quantity };
    });
  }, [data.items, products]);

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
    post(route('admin.transfers.store'));
  };

  const sections = [
    {
      key: 'route',
      eyebrow: t('admin.transfers.create.sections.route.eyebrow', 'Ruta'),
      title: t('admin.transfers.create.sections.route.title', 'Origen y destino'),
      description: t('admin.transfers.create.sections.route.description', 'Selecciona bodegas y deja notas operativas de la transferencia.'),
      badge: t('admin.transfers.create.sections.route.badge', 'Base'),
    },
    {
      key: 'items',
      eyebrow: t('admin.transfers.create.sections.items.eyebrow', 'Carga'),
      title: t('admin.transfers.create.sections.items.title', 'Productos'),
      description: t('admin.transfers.create.sections.items.description', 'Busca artículos y define las cantidades que viajarán entre sucursales.'),
      badge: `${itemsWithDetails.length}`,
    },
  ];

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.transfers.create.page_title', 'Nueva transferencia')} />

      <form onSubmit={submit}>
        <AdminFlowShell
          title={t('admin.transfers.create.hero_title', 'Organiza transferencias internas con un flujo más claro para operaciones')}
          description={t('admin.transfers.create.hero_description', 'La vista separa la ruta de la transferencia del detalle de productos, manteniendo un resumen lateral que ayuda a validar el movimiento antes de crearlo.')}
          stats={[
            { label: t('admin.transfers.create.stats.items', 'Ítems'), value: itemsWithDetails.length },
            { label: t('admin.transfers.create.stats.origin', 'Origen'), value: data.from_warehouse_id ? t('admin.transfers.values.defined', 'Definido') : t('admin.transfers.values.pending', 'Pendiente') },
            { label: t('admin.transfers.create.stats.destination', 'Destino'), value: data.to_warehouse_id ? t('admin.transfers.values.defined', 'Definido') : t('admin.transfers.values.pending', 'Pendiente') },
          ]}
          sections={sections}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          contextTitle={t('admin.transfers.create.context_title', 'Transferencia')}
          contextDescription={t('admin.transfers.create.context_description', 'Valida rápidamente si la ruta y la carga están listas antes de pasar la operación a borrador.')}
          contextItems={[
            { label: t('admin.transfers.create.context_items.products', 'Productos'), value: itemsWithDetails.length },
            { label: t('admin.transfers.create.context_items.initial_status', 'Estado inicial'), value: t('admin.transfers.statuses.draft', 'Borrador') },
            { label: t('admin.transfers.create.context_items.notes', 'Notas'), value: data.notes ? t('admin.transfers.values.loaded', 'Cargadas') : t('admin.transfers.values.optional_plural', 'Opcionales') },
          ]}
          summary={
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t('admin.transfers.create.summary.title', 'Resumen')}</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">{t('admin.transfers.create.summary.preparing', 'Transferencia en preparación')}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('admin.transfers.create.summary.description', 'La transferencia se creará en estado borrador hasta que el movimiento físico se complete.')}</p>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>{t('admin.transfers.create.summary.products', 'Productos')}</span>
                  <strong className="text-slate-900">{itemsWithDetails.length}</strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>{t('admin.transfers.create.summary.origin', 'Origen')}</span>
                  <strong className="text-slate-900">{data.from_warehouse_id ? t('admin.transfers.values.ready', 'Listo') : t('admin.transfers.values.pending', 'Pendiente')}</strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>{t('admin.transfers.create.summary.destination', 'Destino')}</span>
                  <strong className="text-slate-900">{data.to_warehouse_id ? t('admin.transfers.values.ready', 'Listo') : t('admin.transfers.values.pending', 'Pendiente')}</strong>
                </div>
              </div>
            </div>
          }
          actions={
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t('admin.transfers.create.actions.save_heading', 'Guardado')}</p>
                <p className="mt-1 text-sm text-slate-600">{t('admin.transfers.create.actions.editing', 'Estás editando')} <span className="font-semibold text-slate-900">{sections.find((section) => section.key === activeSection)?.title}</span>.</p>
              </div>
              <div className="flex gap-3">
                <Link href={route('admin.transfers.index')} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{t('admin.transfers.create.actions.cancel', 'Cancelar')}</Link>
                <button type="submit" disabled={processing} className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                  {processing ? t('admin.transfers.create.actions.saving', 'Guardando...') : t('admin.transfers.create.actions.submit', 'Crear transferencia')}
                </button>
              </div>
            </div>
          }
        >
          {activeSection === 'route' ? (
            <AdminFlowSection
              eyebrow={t('admin.transfers.create.flow.route.eyebrow', 'Logística')}
              title={t('admin.transfers.create.flow.route.title', 'Datos de la transferencia')}
              description={t('admin.transfers.create.flow.route.description', 'Escoge la bodega de origen, la de destino y documenta cualquier detalle operativo útil para el equipo.')}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.transfers.create.form.origin_branch', 'Sucursal origen')}</label>
                  <select value={data.from_warehouse_id} onChange={(event) => setData('from_warehouse_id', event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900" required>
                    <option value="">{t('admin.transfers.create.form.select_origin', 'Selecciona origen')}</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.transfers.create.form.destination_branch', 'Sucursal destino')}</label>
                  <select value={data.to_warehouse_id} onChange={(event) => setData('to_warehouse_id', event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900" required>
                    <option value="">{t('admin.transfers.create.form.select_destination', 'Selecciona destino')}</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.code})</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.transfers.create.form.notes', 'Notas')}</label>
                  <textarea value={data.notes} onChange={(event) => setData('notes', event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900" placeholder={t('admin.transfers.create.form.notes_placeholder', 'Detalle adicional de la transferencia')} />
                </div>
              </div>
            </AdminFlowSection>
          ) : (
            <AdminFlowSection
              eyebrow={t('admin.transfers.create.flow.items.eyebrow', 'Carga')}
              title={t('admin.transfers.create.flow.items.title', 'Productos a mover')}
              description={t('admin.transfers.create.flow.items.description', 'Busca productos por nombre, agrégalos a la operación y define cuántas unidades se trasladarán.')}
            >
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('admin.transfers.create.items.search_product', 'Buscar producto')}</label>
                  <input type="text" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder={t('admin.transfers.create.items.search_placeholder', 'Filtrar por nombre')} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900" />
                </div>
                <div className="overflow-hidden rounded-[24px] border border-slate-200">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">{t('admin.transfers.create.items.no_products', 'No se encontraron productos.')}</div>
                  ) : (
                    <ul className="max-h-64 divide-y divide-slate-200 overflow-y-auto bg-white">
                      {filteredProducts.map((product) => (
                        <li key={product.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">{product.name}</span>
                            <span className="text-xs text-slate-500">{t('admin.transfers.create.items.current_stock', 'Stock actual')}: {product.stock}</span>
                          </div>
                          <button type="button" onClick={() => handleAddProduct(product)} className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800">{t('admin.transfers.create.items.add', 'Agregar')}</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">{t('admin.transfers.create.items.transfer_items', 'Ítems de la transferencia')}</h3>
                  {itemsWithDetails.length === 0 ? (
                    <p className="text-sm text-slate-500">{t('admin.transfers.create.items.empty', 'Aún no has agregado productos.')}</p>
                  ) : (
                    <div className="overflow-hidden rounded-[24px] border border-slate-200">
                      <div className="max-h-[360px] overflow-auto bg-white">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              <th className="px-4 py-3 text-left">{t('admin.transfers.create.items.table.product', 'Producto')}</th>
                              <th className="px-4 py-3 text-center w-24">{t('admin.transfers.create.items.table.quantity', 'Cantidad')}</th>
                              <th className="px-4 py-3 w-16" />
                            </tr>
                          </thead>
                          <tbody>
                            {itemsWithDetails.map((item, index) => (
                              <tr key={`${item.product?.id ?? index}-${index}`} className="border-t border-slate-200">
                                <td className="px-4 py-3 text-slate-900">{item.product?.name ?? t('admin.transfers.values.product_fallback', 'Producto')}</td>
                                <td className="px-4 py-3 text-center">
                                  <input type="number" min={1} value={item.quantity} onChange={(event) => handleQuantityChange(index, event.target.value)} className="w-20 rounded-xl border border-slate-300 bg-white px-2 py-2 text-center text-xs text-slate-900" />
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button type="button" onClick={() => handleRemoveItem(index)} className="text-xs font-semibold text-rose-600 hover:text-rose-700">{t('admin.transfers.create.items.remove', 'Quitar')}</button>
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