<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Listado de Facturas</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; color: #333; }
        .header { background: #1e40af; color: white; padding: 16px 24px; margin-bottom: 20px; }
        .header h1 { font-size: 18px; font-weight: bold; }
        .header p { font-size: 10px; opacity: 0.8; margin-top: 2px; }
        .meta { padding: 0 24px 12px; display: flex; gap: 16px; font-size: 10px; color: #666; }
        .meta span { background: #f1f5f9; padding: 3px 8px; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 0 24px; width: calc(100% - 48px); }
        thead tr { background: #1e40af; color: white; }
        thead th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
        tbody tr { border-bottom: 1px solid #e2e8f0; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        tbody td { padding: 7px 10px; font-size: 10px; vertical-align: middle; }
        .badge { display: inline-block; padding: 2px 7px; border-radius: 999px; font-size: 9px; font-weight: 600; }
        .badge-pending  { background: #fef3c7; color: #92400e; }
        .badge-paid     { background: #d1fae5; color: #065f46; }
        .badge-cancelled{ background: #fee2e2; color: #991b1b; }
        .badge-shipped  { background: #dbeafe; color: #1e40af; }
        .badge-delivered{ background: #ccfbf1; color: #134e4a; }
        .amount { text-align: right; font-family: monospace; }
        .footer { position: fixed; bottom: 0; left: 0; right: 0; padding: 8px 24px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between; }
        .total-row { background: #1e40af !important; color: white; font-weight: bold; }
        .total-row td { padding: 9px 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Listado de Facturas</h1>
        <p>Generado el {{ $date }}{{ $search ? ' · Búsqueda: "'.$search.'"' : '' }}{{ $status ? ' · Estado: '.$status : '' }}</p>
    </div>

    <div class="meta">
        <span>Total registros: {{ count($invoices) }}</span>
        @if($status)
            <span>Filtro estado: {{ $status }}</span>
        @endif
    </div>

    <table>
        <thead>
            <tr>
                <th>N° Factura</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Tipo</th>
                <th style="text-align:right">Total USD</th>
                <th style="text-align:right">Total BS</th>
            </tr>
        </thead>
        <tbody>
            @forelse($invoices as $inv)
            <tr>
                <td><strong>{{ $inv->number }}</strong></td>
                <td>{{ $inv->created_at?->format('d/m/Y') }}</td>
                <td>{{ $inv->customer?->name ?? 'Cliente ocasional' }}</td>
                <td>
                    <span class="badge badge-{{ $inv->status ?? 'pending' }}">
                        {{ $inv->invoiceStatus?->name ?? ucfirst($inv->status ?? 'pending') }}
                    </span>
                </td>
                <td>{{ ucfirst($inv->document_type ?? 'invoice') }}</td>
                <td class="amount">{{ number_format((float)$inv->total_usd, 2) }}</td>
                <td class="amount">{{ number_format((float)$inv->total_bs, 2) }}</td>
            </tr>
            @empty
            <tr><td colspan="7" style="text-align:center;padding:20px;color:#94a3b8">Sin registros</td></tr>
            @endforelse
            @if(count($invoices) > 0)
            <tr class="total-row">
                <td colspan="5">TOTAL</td>
                <td class="amount">{{ number_format($invoices->sum('total_usd'), 2) }}</td>
                <td class="amount">{{ number_format($invoices->sum('total_bs'), 2) }}</td>
            </tr>
            @endif
        </tbody>
    </table>

    <div class="footer">
        <span>Sistema Inventario Premium</span>
        <span>Página <span class="pagenum"></span></span>
    </div>
</body>
</html>
