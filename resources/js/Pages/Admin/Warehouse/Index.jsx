import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

export default function Index({ warehouses }) {
  const { data, setData, post, processing, reset } = useForm({
    name: '',
    code: '',
    address: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.warehouses.store'), {
      preserveScroll: true,
      onSuccess: () => reset(),
    });
  };

  return (
    <AuthenticatedLayout>
      <Head title="Sucursales" />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Sucursales / Bodegas</h1>
          <p className="text-muted-foreground">Administra los puntos físicos donde se almacena tu inventario.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Listado de sucursales</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Nombre</th>
                    <th className="px-3 py-2 text-left">Código</th>
                    <th className="px-3 py-2 text-left">Dirección</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.data.map((w) => (
                    <tr key={w.id} className="border-t border-border">
                      <td className="px-3 py-2 text-foreground">{w.name}</td>
                      <td className="px-3 py-2 text-foreground">{w.code}</td>
                      <td className="px-3 py-2 text-muted-foreground">{w.address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Nueva sucursal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Nombre</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Código</label>
                <input
                  type="text"
                  value={data.code}
                  onChange={(e) => setData('code', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Dirección</label>
                <textarea
                  value={data.address}
                  onChange={(e) => setData('address', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  rows={2}
                />
              </div>
              <button
                type="submit"
                disabled={processing}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
              >
                {processing ? 'Guardando...' : 'Crear sucursal'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
