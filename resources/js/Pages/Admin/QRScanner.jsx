import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

// Nota: react-qr-reader puede no soportar ciertas plataformas; cargamos condicionalmente.
let QrReader = null;
try {
  QrReader = require('react-qr-reader');
} catch (e) {}

export default function QRScanner() {
  const handleScan = (data) => {
    if (data) {
      alert(`QR: ${data}`);
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  return (
    <AuthenticatedLayout>
      <Head title="Escáner QR" />
      <h1 className="text-2xl font-bold mb-4">Escáner QR</h1>
      {QrReader ? (
        <QrReader
          delay={300}
          style={{ width: '100%' }}
          onError={handleError}
          onScan={handleScan}
        />
      ) : (
        <div className="p-4 border rounded">
          El lector QR se instalará más adelante.
        </div>
      )}
    </AuthenticatedLayout>
  );
}
