import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

export default function Show({ account }) {
  const { data, setData, post, processing, reset } = useForm({
    type: 'charge',
    amount_usd: '',
    description: '',
    due_date: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.credits.movements.store', account.id), {
      preserveScroll: true,
      onSuccess: () => reset(),
    });
  };

  return (
    <AuthenticatedLayout>
      <Head title={`Crédito - ${account.customer?.name}`} />
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">{account.customer?.name}</h1>
            <p className="text-sm text-muted-foreground">Cuenta de crédito del cliente.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <h2 className="text-lg font-bold text-foreground mb-2">Resumen</h2>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estado:</span>
                <span className="font-semibold text-foreground">{account.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Límite USD:</span>
                <span className="font-semibold text-foreground">${Number(account.limit_usd ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Saldo actual:</span>
                <span className="font-semibold text-foreground">${Number(account.balance_usd ?? 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 mt-6 space-y-3">
              <h2 className="text-lg font-bold text-foreground mb-2">Nuevo movimiento</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Tipo</label>
                  <select
                    value={data.type}
                    onChange={(e) => setData('type', e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  >
                    <option value="charge">Cargo (aumenta saldo)</option>
                    <option value="payment">Pago (disminuye saldo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Monto USD</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.amount_usd}
                    onChange={(e) => setData('amount_usd', e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Fecha de vencimiento (opcional)</label>
                  <input
                    type="date"
                    value={data.due_date}
                    onChange={(e) => setData('due_date', e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Descripción</label>
                  <textarea
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                    rows={2}
                    placeholder="Concepto del cargo o pago"
                  />
                </div>
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 text-sm"
                >
                  {processing ? 'Guardando...' : 'Registrar movimiento'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-bold text-foreground mb-3">Movimientos recientes</h2>
              <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Fecha</th>
                      <th className="px-3 py-2 text-left">Tipo</th>
                      <th className="px-3 py-2 text-right">Monto USD</th>
                      <th className="px-3 py-2 text-left">Descripción</th>
                      <th className="px-3 py-2 text-left">Vence</th>
                      <th className="px-3 py-2 text-left">Pagado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.movements.map((m) => (
                      <tr key={m.id} className="border-t border-border">
                        <td className="px-3 py-2 text-foreground">{m.created_at}</td>
                        <td className="px-3 py-2 text-foreground">{m.type}</td>
                        <td className="px-3 py-2 text-right text-foreground">${Number(m.amount_usd ?? 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-foreground">{m.description}</td>
                        <td className="px-3 py-2 text-foreground">{m.due_date ?? '—'}</td>
                        <td className="px-3 py-2 text-foreground">{m.paid_at ? 'Sí' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
