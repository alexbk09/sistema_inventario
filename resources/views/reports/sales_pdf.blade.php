<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de ventas</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .meta { font-size: 10px; color: #555; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 4px; }
        th { background: #f3f3f3; font-weight: bold; }
        .right { text-align: right; }
        .small { font-size: 9px; }
    </style>
</head>
<body>
    <h1>Reporte de ventas</h1>
    <div class="meta">
        Generado: {{ now()->format('d/m/Y H:i') }}<br>
        @if(!empty($filters['date_from']) || !empty($filters['date_to']))
            Rango: {{ $filters['date_from'] ?? 'inicio' }} - {{ $filters['date_to'] ?? 'hoy' }}<br>
        @endif
        Total facturas: {{ $metrics['total_invoices'] }} | Total USD: {{ number_format($metrics['total_usd'], 2, ',', '.') }} | Total BS: {{ number_format($metrics['total_bs'], 2, ',', '.') }} | Ticket prom. USD: {{ number_format($metrics['avg_ticket_usd'] ?? 0, 2, ',', '.') }}
        @if($invoices->count() >= $maxRows)
            <br><span class="small">* Se muestran solo las primeras {{ $maxRows }} filas para el PDF.</span>
        @endif
    </div>

    <table>
        <thead>
        <tr>
            <th>Fecha</th>
            <th>Número</th>
            <th>Tipo</th>
            <th>Cliente</th>
            <th>Sucursal/Bodega</th>
            <th>Estado</th>
            <th class="right">Total USD</th>
            <th class="right">Total BS</th>
        </tr>
        </thead>
        <tbody>
        @php
            $typeLabels = [
                'invoice' => 'Factura',
                'delivery_note' => 'Nota de entrega',
                'proforma' => 'Proforma',
            ];
            $statusLabels = [
                'pending' => 'Pendiente',
                'paid' => 'Pagado',
                'shipped' => 'Enviado',
                'delivered' => 'Entregado',
                'cancelled' => 'Cancelado',
            ];
        @endphp
        @forelse($invoices as $invoice)
            <tr>
                <td>{{ optional($invoice->created_at)->format('d/m/Y H:i') }}</td>
                <td>{{ $invoice->number }}</td>
                <td>{{ $typeLabels[$invoice->document_type] ?? $invoice->document_type }}</td>
                <td>{{ optional($invoice->customer)->name }}</td>
                <td>{{ $invoice->warehouse->name ?? $invoice->warehouse->code ?? '' }}</td>
                <td>{{ $statusLabels[$invoice->status] ?? $invoice->status }}</td>
                <td class="right">{{ number_format((float) $invoice->total_usd, 2, ',', '.') }}</td>
                <td class="right">{{ number_format((float) $invoice->total_bs, 2, ',', '.') }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="8" class="small">No hay facturas para los filtros seleccionados.</td>
            </tr>
        @endforelse
        </tbody>
    </table>
</body>
</html>
