import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

export default function Show({ transfer }) {
  const { data, setData, put, processing } = useForm({
    status: transfer.status,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route('admin.transfers.update', transfer.id));
  };

  return (
    <AuthenticatedLayout>
      <Head title={transfer.number} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">{transfer.number}</h1>
            <p className="text-sm text-muted-foreground">
              Transferencia de stock entre sucursales.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">ORIGEN</p>
                  <p className="text-sm text-foreground">{transfer.from_warehouse?.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">DESTINO</p>
                  <p className="text-sm text-foreground">{transfer.to_warehouse?.name}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">NOTAS</p>
                <p className="text-sm text-foreground whitespace-pre-line min-h-[2rem]">
                  {transfer.notes || 'Sin notas adicionales.'}
                </p>
              </div>
              <form onSubmit={handleSubmit} className="mt-4 flex items-end gap-3 flex-wrap">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Estado</label>
                  <select
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  >
                    <option value="draft">Borrador</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {processing ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </form>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-bold text-foreground mb-3">Productos</h2>
              <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Producto</th>
                      <th className="px-3 py-2 text-center w-24">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfer.items.map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="px-3 py-2 text-foreground">{item.product?.name ?? 'Producto'}</td>
                        <td className="px-3 py-2 text-center text-foreground">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <h2 className="text-lg font-bold text-foreground mb-2">Resumen</h2>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Productos:</span>
                <span className="font-semibold text-foreground">{transfer.items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estado actual:</span>
                <span className="font-semibold text-foreground">{transfer.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
