import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

const statusOptions = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'approved', label: 'Aprobada' },
  { value: 'rejected', label: 'Rechazada' },
  { value: 'completed', label: 'Completada' },
];

const resolutionLabels = {
  credit_note: 'Nota de crédito',
  replace: 'Reemplazo',
  refund: 'Reembolso',
};

export default function Show({ rma }) {
  const [status, setStatus] = useState(rma.status);
  const [resolutionType, setResolutionType] = useState(rma.resolution_type || 'credit_note');
  const [saving, setSaving] = useState(false);

  const handleUpdate = (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    router.put(route('admin.rmas.update', rma.id), {
      status,
      resolution_type: resolutionType,
    }, {
      preserveScroll: true,
      onFinish: () => setSaving(false),
    });
  };

  const statusLabel = statusOptions.find((s) => s.value === rma.status)?.label ?? rma.status;

  return (
    <AuthenticatedLayout>
      <Head title={rma.number} />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">{rma.number}</h1>
            <p className="text-sm text-muted-foreground">
              Gestión de devolución y garantía para productos y notas de crédito.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información principal */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">ESTADO</p>
                  <p className="text-lg font-bold text-foreground">{statusLabel}</p>
                </div>
                <form onSubmit={handleUpdate} className="flex flex-col sm:flex-row gap-2 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted-foreground">Actualizar estado</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted-foreground">Resolución</label>
                    <select
                      value={resolutionType}
                      onChange={(e) => setResolutionType(e.target.value)}
                      className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                    >
                      <option value="credit_note">Nota de crédito</option>
                      <option value="replace">Reemplazo</option>
                      <option value="refund">Reembolso</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">FACTURA RELACIONADA</p>
                  {rma.invoice ? (
                    <p className="text-sm text-foreground">{rma.invoice.number} · Estado: {rma.invoice.status}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin factura asociada</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">CLIENTE</p>
                  {rma.customer ? (
                    <p className="text-sm text-foreground">{rma.customer.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin cliente asociado</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1">MOTIVO GENERAL</p>
                <p className="text-sm text-foreground whitespace-pre-line min-h-[2rem]">
                  {rma.reason || 'Sin descripción detallada.'}
                </p>
              </div>
            </div>

            {/* Productos devueltos */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-bold text-foreground mb-3">Productos devueltos</h2>
              <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Producto</th>
                      <th className="px-3 py-2 text-center w-20">Cantidad</th>
                      <th className="px-3 py-2 text-right w-24">Precio</th>
                      <th className="px-3 py-2 text-right w-28">Subtotal</th>
                      <th className="px-3 py-2">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rma.items.map((item) => (
                      <tr key={item.id} className="border-t border-border align-top">
                        <td className="px-3 py-2 text-foreground">
                          {item.product?.name ?? 'Producto'}
                        </td>
                        <td className="px-3 py-2 text-center text-foreground">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-right text-foreground whitespace-nowrap">
                          ${Number(item.unit_price_usd ?? 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-foreground whitespace-nowrap">
                          ${Number(item.subtotal_usd ?? 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-sm text-muted-foreground whitespace-pre-line">
                          {item.reason || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div>
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <h2 className="text-lg font-bold text-foreground mb-2">Resumen monetario</h2>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total USD:</span>
                <span className="font-semibold text-foreground">${Number(rma.total_usd ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Bs.:</span>
                <span className="font-semibold text-foreground">Bs. {Number(rma.total_bs ?? 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">
                  Resolución actual: {resolutionLabels[rma.resolution_type] ?? 'Sin definir'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
