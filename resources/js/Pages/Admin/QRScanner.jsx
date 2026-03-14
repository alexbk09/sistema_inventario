import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import { useState } from 'react';

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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Escáner QR</h1>
            <p className="text-sm text-muted-foreground">
              Escanea códigos para abrir rápidamente facturas o productos en el panel.
            </p>
          </div>
          <a
            href={route('admin.qr.codes')}
            className="px-3 py-2 rounded bg-muted hover:bg-muted/80 text-sm border border-border"
          >
            Ver QRs en lote
          </a>
        </div>

        {QrReader ? (
          <div className="max-w-md">
            <QrReader
              delay={300}
              style={{ width: '100%' }}
              onError={handleError}
              onScan={handleScan}
            />
          </div>
        ) : (
          <div className="p-4 border rounded bg-card text-sm text-muted-foreground">
            El lector QR se instalará más adelante.
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
