import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import { useState } from 'react';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import { useI18n } from '@/Hooks/useI18n';

// Nota: react-qr-reader puede no soportar ciertas plataformas; cargamos condicionalmente.
let QrReader = null;
try {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  QrReader = require('react-qr-reader');
} catch (e) {}

export default function QRScanner() {
  const { t } = useI18n();
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
      <Head title={t('admin.qr_scanner.page_title', 'Escaner QR')} />
      <AdminIndexShell
        title={t('admin.qr_scanner.hero_title', 'Escanea y deriva codigos con una interfaz mas clara para operacion rapida')}
        description={t('admin.qr_scanner.hero_description', 'La vista concentra el lector, el acceso al lote de QR y la logica de desvio hacia facturas o productos dentro del mismo sistema visual del backoffice.')}
        stats={[
          { label: t('admin.qr_scanner.stats.scanner', 'Escaner'), value: QrReader ? t('admin.qr_scanner.values.available', 'Disponible') : t('admin.qr_scanner.values.pending', 'Pendiente') },
          { label: t('admin.qr_scanner.stats.invoice_destination', 'Destino factura'), value: t('admin.qr_scanner.values.automatic', 'Automatico') },
          { label: t('admin.qr_scanner.stats.product_destination', 'Destino producto'), value: t('admin.qr_scanner.values.automatic', 'Automatico') },
        ]}
        contextTitle={t('admin.qr_scanner.context_title', 'Escaner QR')}
        contextDescription={t('admin.qr_scanner.context_description', 'Usa esta pantalla para resolver lecturas rapidas en mostrador y saltar directo al modulo correcto segun el contenido del codigo.')}
        contextItems={[
          { label: t('admin.qr_scanner.context_items.last_scan', 'Ultima lectura'), value: lastScan || t('admin.qr_scanner.values.no_scans', 'Sin lecturas') },
          { label: t('admin.qr_scanner.context_items.batch_qr', 'QR por lote'), value: t('admin.qr_scanner.values.available', 'Disponible') },
          { label: t('admin.qr_scanner.context_items.heuristic', 'Heuristica'), value: t('admin.qr_scanner.values.invoice_or_product', 'Factura o producto') },
        ]}
        primaryAction={
          <Link
            href={route('admin.qr.codes')}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {t('admin.qr_scanner.actions.batch', 'Ver QRs en lote')}
          </Link>
        }
        filters={
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.qr_scanner.cards.scan.title', 'Lectura')}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('admin.qr_scanner.cards.scan.description', 'Escanea un codigo y deriva la navegacion sin salir del panel administrativo.')}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.qr_scanner.cards.invoices.title', 'Facturas')}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('admin.qr_scanner.cards.invoices.description', 'Los codigos con patron de comprobante disparan una busqueda directa sobre ventas.')}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.qr_scanner.cards.products.title', 'Productos')}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('admin.qr_scanner.cards.products.description', 'Los demas codigos se interpretan como SKU o identificador de producto para consulta rapida.')}</p>
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
              {t('admin.qr_scanner.reader_pending', 'El lector QR se instalara mas adelante.')}
            </div>
          )}
        </div>
      </AdminIndexShell>
    </AuthenticatedLayout>
  );
}
