import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import { useState } from 'react';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';

// Nota: react-qr-reader puede no soportar ciertas plataformas; cargamos condicionalmente.
let QrReader = null;
try {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  QrReader = require('react-qr-reader');
} catch (e) {}

export default function QRScanner() {
  const [lastScan, setLastScan] = useState(null);

  const handleScan = (data) => {
    if (!data || data === lastScan) return;
    const value = String(data).trim();
    if (!value) return;
    setLastScan(value);

    // Si es una URL completa, abrirla en una nueva pestaña
    if (/^https?:\/\//i.test(value)) {
      window.open(value, '_blank', 'noopener,noreferrer');
      return;
    }

    // Heurística simple: si parece número de factura o código similar, buscar en facturas
    if (/^(F-|INV-)/i.test(value) || /^\d{4,}$/.test(value)) {
      router.get(route('admin.invoices.index'), { search: value }, { preserveScroll: true });
      return;
    }

    // En otro caso, asumir que es SKU/código de producto y buscar en productos
    router.get(route('admin.products.index'), { search: value }, { preserveScroll: true });
  };

  const handleError = (err) => {
    console.error(err);
  };

  return (
    <AuthenticatedLayout>
      <Head title="Escáner QR" />
      <AdminIndexShell
        title="Escanea y deriva códigos con una interfaz más clara para operación rápida"
        description="La vista concentra el lector, el acceso al lote de QR y la lógica de desvío hacia facturas o productos dentro del mismo sistema visual del backoffice."
        stats={[
          { label: 'Escáner', value: QrReader ? 'Disponible' : 'Pendiente' },
          { label: 'Destino factura', value: 'Automático' },
          { label: 'Destino producto', value: 'Automático' },
        ]}
        contextTitle="Escáner QR"
        contextDescription="Usa esta pantalla para resolver lecturas rápidas en mostrador y saltar directo al módulo correcto según el contenido del código."
        contextItems={[
          { label: 'Última lectura', value: lastScan || 'Sin lecturas' },
          { label: 'QR por lote', value: 'Disponible' },
          { label: 'Heurística', value: 'Factura o producto' },
        ]}
        primaryAction={
          <Link
            href={route('admin.qr.codes')}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Ver QRs en lote
          </Link>
        }
        filters={
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Lectura</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Escanea un código y deriva la navegación sin salir del panel administrativo.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Facturas</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Los códigos con patrón de comprobante disparan una búsqueda directa sobre ventas.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Productos</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Los demás códigos se interpretan como SKU o identificador de producto para consulta rápida.</p>
            </div>
          </div>
        }
      >
        <div className="p-6">
          {QrReader ? (
            <div className="max-w-md rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <QrReader
                delay={300}
                style={{ width: '100%' }}
                onError={handleError}
                onScan={handleScan}
              />
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              El lector QR se instalará más adelante.
            </div>
          )}
        </div>
      </AdminIndexShell>
    </AuthenticatedLayout>
  );
}
