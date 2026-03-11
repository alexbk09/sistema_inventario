import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import { ArrowLeft, Gift, ShoppingBag } from 'lucide-react';

export default function Show({ customer, invoices }) {
  return (
    <AuthenticatedLayout>
      <Head title={`Cliente: ${customer.name}`} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">{customer.name}</h1>
            <p className="text-muted-foreground">Detalle del cliente, historial de compras y puntos de lealtad.</p>
          </div>
          <Link
            href={route('admin.customers.index')}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Clientes
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4 lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Información de contacto</h2>
              <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Email:</span> {customer.email || '-'} </p>
              <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Teléfono:</span> {customer.phone || '-'} </p>
              <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Dirección:</span> {customer.address || '-'} </p>
              <p className="text-xs text-muted-foreground mt-2">
                Última compra: {customer.last_purchase_at ? new Date(customer.last_purchase_at).toLocaleString('es-VE') : 'Sin compras registradas'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Puntos acumulados</p>
                  <p className="text-2xl font-bold text-foreground">{customer.loyalty_points}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Gift className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total gastado (USD)</p>
                  <p className="text-2xl font-bold text-foreground">${Number(customer.lifetime_spent_usd || 0).toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  Regla actual de puntos: <span className="font-medium text-foreground">1 punto por cada USD de compra confirmada</span>.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-4">
              <h2 className="text-lg font-semibold text-foreground mb-4">Historial de compras</h2>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Este cliente aún no tiene compras registradas.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-foreground">Fecha</th>
                        <th className="px-4 py-2 text-left font-medium text-foreground">Número</th>
                        <th className="px-4 py-2 text-left font-medium text-foreground">Estado</th>
                        <th className="px-4 py-2 text-left font-medium text-foreground">Total USD</th>
                        <th className="px-4 py-2 text-left font-medium text-foreground">Total BS</th>
                        <th className="px-4 py-2 text-left font-medium text-foreground">Puntos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-border hover:bg-muted/50 transition">
                          <td className="px-4 py-2 text-muted-foreground">
                            {inv.created_at ? new Date(inv.created_at).toLocaleString('es-VE') : ''}
                          </td>
                          <td className="px-4 py-2 text-foreground">{inv.number}</td>
                          <td className="px-4 py-2 text-muted-foreground">{inv.status_name || inv.status}</td>
                          <td className="px-4 py-2 text-foreground">${Number(inv.total_usd || 0).toFixed(2)}</td>
                          <td className="px-4 py-2 text-foreground">Bs {Number(inv.total_bs || 0).toFixed(2)}</td>
                          <td className="px-4 py-2 text-foreground">{inv.points_earned}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
