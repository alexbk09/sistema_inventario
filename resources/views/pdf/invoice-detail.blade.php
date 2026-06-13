<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Factura {{ $invoice->number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
        }
        .container {
            padding: 20px 30px;
        }
        /* Header / Membrete */
        .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }
        .company-info {
            flex: 1;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
        }
        .company-details {
            font-size: 10px;
            color: #666;
        }
        .company-details p {
            margin: 2px 0;
        }
        .logo-container {
            text-align: right;
        }
        .logo {
            max-width: 120px;
            max-height: 80px;
        }
        .invoice-title {
            text-align: center;
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin: 20px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        /* Invoice Info */
        .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
        }
        .invoice-details, .client-details {
            width: 48%;
        }
        .section-title {
            font-size: 11px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 8px;
            letter-spacing: 1px;
        }
        .detail-row {
            display: flex;
            margin: 3px 0;
        }
        .detail-label {
            font-weight: bold;
            width: 100px;
            color: #475569;
        }
        .detail-value {
            flex: 1;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 11px;
        }
        .status-paid {
            background: #dcfce7;
            color: #166534;
        }
        .status-pending {
            background: #fef3c7;
            color: #92400e;
        }
        .status-cancelled {
            background: #fee2e2;
            color: #991b1b;
        }
        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 11px;
        }
        th {
            background: #1e40af;
            color: white;
            padding: 10px 8px;
            text-align: left;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.5px;
        }
        td {
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
        }
        tr:nth-child(even) {
            background: #f8fafc;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        /* Payment Details */
        .payment-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
            background: #ffffff;
        }
        .payment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
            margin-bottom: 10px;
        }
        .payment-title {
            font-weight: bold;
            font-size: 13px;
            color: #1e40af;
        }
        .payment-date {
            font-size: 10px;
            color: #64748b;
        }
        .payment-grid {
            display: flex;
            gap: 20px;
        }
        .payment-column {
            flex: 1;
        }
        .payment-row {
            display: flex;
            margin: 4px 0;
            font-size: 11px;
        }
        .payment-label {
            width: 110px;
            color: #64748b;
        }
        .payment-value {
            flex: 1;
            font-weight: 500;
        }
        .amount-usd {
            font-weight: bold;
            color: #1e40af;
        }
        .amount-bs {
            font-weight: bold;
            color: #059669;
        }
        .reference-box {
            background: #f1f5f9;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 11px;
        }
        .operation-badge {
            display: inline-block;
            background: #dbeafe;
            color: #1e40af;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
        }
        /* Totals */
        .totals-section {
            margin-top: 20px;
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
        }
        .totals-table {
            width: 100%;
        }
        .totals-table td {
            padding: 6px 10px;
            border: none;
        }
        .totals-table .label {
            text-align: right;
            color: #64748b;
        }
        .totals-table .value {
            text-align: right;
            font-weight: 500;
            width: 150px;
        }
        .totals-table .total-row {
            font-size: 14px;
            font-weight: bold;
            background: #1e40af;
            color: white;
        }
        .totals-table .total-row td {
            padding: 10px;
        }
        /* Footer */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #1e40af;
            color: white;
            padding: 15px 30px;
            font-size: 10px;
        }
        .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .footer-left {
            flex: 1;
        }
        .footer-center {
            text-align: center;
            flex: 1;
        }
        .footer-right {
            text-align: right;
            flex: 1;
        }
        .footer-company {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 3px;
        }
        .footer-contact {
            font-size: 9px;
            opacity: 0.9;
        }
        /* Page break */
        .page-break {
            page-break-after: always;
        }
        .no-break {
            page-break-inside: avoid;
        }
        /* Notes */
        .notes-section {
            margin-top: 15px;
            padding: 10px;
            background: #fefce8;
            border-left: 4px solid #eab308;
            border-radius: 0 4px 4px 0;
        }
        .notes-title {
            font-weight: bold;
            color: #92400e;
            font-size: 11px;
            margin-bottom: 5px;
        }
        .notes-content {
            font-size: 10px;
            color: #713f12;
            font-style: italic;
        }
        /* Payment Summary */
        .payment-summary {
            display: flex;
            justify-content: space-around;
            margin: 15px 0;
            background: #eff6ff;
            padding: 15px;
            border-radius: 8px;
        }
        .summary-item {
            text-align: center;
        }
        .summary-label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .summary-value {
            font-size: 16px;
            font-weight: bold;
            color: #1e40af;
        }
        .summary-value.pending {
            color: #dc2626;
        }
        .summary-value.paid {
            color: #059669;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header / Membrete -->
        <div class="header">
            <div class="header-top">
                <div class="company-info">
                    @if($company['logo'])
                    <div class="logo-container" style="margin-bottom: 10px;">
                        <img src="{{ $company['logo'] }}" alt="Logo" class="logo">
                    </div>
                    @endif
                    <div class="company-name">{{ $company['name'] }}</div>
                    <div class="company-details">
                        @if($company['address'])<p>{{ $company['address'] }}</p>@endif
                        @if($company['phone'] || $company['email'])
                        <p>
                            @if($company['phone'])Tel: {{ $company['phone'] }}@endif
                            @if($company['phone'] && $company['email']) | @endif
                            @if($company['email']){{ $company['email'] }}@endif
                        </p>
                        @endif
                        @if($company['tax_id'])<p>RIF/NIT: {{ $company['tax_id'] }}</p>@endif
                    </div>
                </div>
                <div style="text-align: right;">
                    <div class="invoice-title">FACTURA</div>
                    <div style="font-size: 18px; font-weight: bold; color: #1e40af;">
                        #{{ $invoice->number }}
                    </div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 5px;">
                        Fecha: {{ $invoice->created_at ? $invoice->created_at->format('d/m/Y H:i') : '-' }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Invoice Info -->
        <div class="invoice-info">
            <div class="invoice-details">
                <div class="section-title">Información de la Factura</div>
                <div class="detail-row">
                    <span class="detail-label">Número:</span>
                    <span class="detail-value">{{ $invoice->number }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Fecha:</span>
                    <span class="detail-value">{{ $invoice->created_at ? $invoice->created_at->format('d/m/Y') : '-' }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Estado:</span>
                    <span class="detail-value">
                        <span class="status-badge 
                            {{ $invoice->status === 'paid' ? 'status-paid' : ($invoice->status === 'cancelled' ? 'status-cancelled' : 'status-pending') }}">
                            {{ $invoice->status === 'paid' ? 'PAGADA' : ($invoice->status === 'cancelled' ? 'CANCELADA' : 'PENDIENTE') }}
                        </span>
                    </span>
                </div>
                @if($invoice->warehouse)
                <div class="detail-row">
                    <span class="detail-label">Almacén:</span>
                    <span class="detail-value">{{ $invoice->warehouse->name }}</span>
                </div>
                @endif
            </div>
            <div class="client-details">
                <div class="section-title">Datos del Cliente</div>
                <div class="detail-row">
                    <span class="detail-label">Nombre:</span>
                    <span class="detail-value">{{ $customer['name'] }}</span>
                </div>
                @if($customer['document'])
                <div class="detail-row">
                    <span class="detail-label">Documento:</span>
                    <span class="detail-value">{{ $customer['document'] }}</span>
                </div>
                @endif
                @if($customer['email'])
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">{{ $customer['email'] }}</span>
                </div>
                @endif
                @if($customer['phone'])
                <div class="detail-row">
                    <span class="detail-label">Teléfono:</span>
                    <span class="detail-value">{{ $customer['phone'] }}</span>
                </div>
                @endif
                @if($customer['address'])
                <div class="detail-row">
                    <span class="detail-label">Dirección:</span>
                    <span class="detail-value">{{ $customer['address'] }}{{ $customer['city'] ? ', ' . $customer['city'] : '' }}</span>
                </div>
                @endif
            </div>
        </div>

        <!-- Items Table -->
        <table>
            <thead>
                <tr>
                    <th style="width: 10%;">Código</th>
                    <th style="width: 40%;">Descripción</th>
                    <th style="width: 15%;" class="text-center">Cantidad</th>
                    <th style="width: 17%;" class="text-right">Precio Unit.</th>
                    <th style="width: 18%;" class="text-right">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice->items as $item)
                <tr>
                    <td>{{ $item->product?->sku ?? $item->product?->code ?? '-' }}</td>
                    <td>{{ $item->product?->name ?? $item->description ?? 'Producto' }}</td>
                    <td class="text-center">{{ number_format($item->quantity, 2) }}</td>
                    <td class="text-right">
                        @if($item->unit_currency_code === 'VES' || $item->unit_currency_code === 'BS')
                            Bs. {{ number_format($item->unit_price_original ?? $item->price_usd, 2) }}
                            @if($item->price_usd && $item->price_usd != ($item->unit_price_original ?? 0))
                                <br><small style="color: #64748b;">(${{ number_format($item->price_usd, 2) }})</small>
                            @endif
                        @else
                            ${{ number_format($item->price_usd, 2) }}
                        @endif
                    </td>
                    <td class="text-right">
                        @if($item->unit_currency_code === 'VES' || $item->unit_currency_code === 'BS')
                            Bs. {{ number_format($item->subtotal_original ?? ($item->subtotal_usd * ($item->exchange_rate ?? 1)), 2) }}
                            @if($item->subtotal_usd)
                                <br><small style="color: #64748b;">(${{ number_format($item->subtotal_usd, 2) }})</small>
                            @endif
                        @else
                            ${{ number_format($item->subtotal_usd, 2) }}
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td class="label">Subtotal:</td>
                    <td class="value">
                        @if(isset($totals['by_currency']['VES']))
                            Bs. {{ number_format($totals['by_currency']['VES']['subtotal'], 2) }}
                            <br><small style="color: #64748b;">(${{ number_format($totals['subtotal_usd'] ?? $totals['subtotal'], 2) }})</small>
                        @else
                            ${{ number_format($totals['subtotal_usd'] ?? $totals['subtotal'], 2) }}
                        @endif
                    </td>
                </tr>
                @if(($totals['tax_usd'] ?? 0) > 0 || ($totals['tax'] ?? 0) > 0)
                <tr>
                    <td class="label">Impuestos:</td>
                    <td class="value">
                        @if(isset($totals['by_currency']['VES']))
                            Bs. {{ number_format($totals['by_currency']['VES']['tax'], 2) }}
                            <br><small style="color: #64748b;">(${{ number_format($totals['tax_usd'] ?? $totals['tax'], 2) }})</small>
                        @else
                            ${{ number_format($totals['tax_usd'] ?? $totals['tax'], 2) }}
                        @endif
                    </td>
                </tr>
                @endif
                @if(($totals['shipping_usd'] ?? 0) > 0 || ($totals['shipping'] ?? 0) > 0)
                <tr>
                    <td class="label">Envío:</td>
                    <td class="value">
                        @if(isset($totals['by_currency']['VES']))
                            Bs. {{ number_format($totals['by_currency']['VES']['shipping'] ?? 0, 2) }}
                            <br><small style="color: #64748b;">(${{ number_format($totals['shipping_usd'] ?? $totals['shipping'], 2) }})</small>
                        @else
                            ${{ number_format($totals['shipping_usd'] ?? $totals['shipping'], 2) }}
                        @endif
                    </td>
                </tr>
                @endif
                <tr class="total-row">
                    <td class="label">TOTAL:</td>
                    <td class="value">
                        @if(isset($totals['by_currency']['VES']))
                            Bs. {{ number_format($totals['by_currency']['VES']['total'], 2) }}
                            <div style="font-size: 10px; font-weight: normal; margin-top: 3px;">
                                (${{ number_format($totals['total_usd'] ?? $totals['total'], 2) }} USD)
                            </div>
                        @else
                            ${{ number_format($totals['total_usd'] ?? $totals['total'], 2) }}
                        @endif
                    </td>
                </tr>
            </table>
        </div>

        <!-- Payment Details -->
        @if(count($payments) > 0)
        <div style="margin-top: 30px;">
            <div class="section-title" style="font-size: 13px; margin-bottom: 15px;">
                DETALLES DE PAGO
            </div>

            @foreach($payments as $payment)
            <div class="payment-card no-break">
                <div class="payment-header">
                    <div class="payment-title">
                        PAGO #{{ $loop->iteration }}
                        <span style="margin-left: 10px; font-size: 11px; color: #64748b;">
                            {{ $payment['method_label'] }}
                        </span>
                    </div>
                    <div class="payment-date">
                        {{ $payment['payment_date'] ? \Carbon\Carbon::parse($payment['payment_date'])->format('d/m/Y H:i') : '-' }}
                    </div>
                </div>
                
                <div class="payment-grid">
                    <div class="payment-column">
                        <div style="font-size: 10px; font-weight: bold; color: #64748b; margin-bottom: 8px; text-transform: uppercase;">
                            Montos
                        </div>
                        <div class="payment-row">
                            <span class="payment-label">Monto USD:</span>
                            <span class="payment-value amount-usd">
                                ${{ number_format($payment['amount_usd'], 2) }}
                            </span>
                        </div>
                        @if($payment['amount_bs'] > 0)
                        <div class="payment-row">
                            <span class="payment-label">Monto BS:</span>
                            <span class="payment-value amount-bs">
                                Bs. {{ number_format($payment['amount_bs'], 2) }}
                            </span>
                        </div>
                        @endif
                        @if($payment['exchange_rate'])
                        <div class="payment-row">
                            <span class="payment-label">Tasa:</span>
                            <span class="payment-value" style="font-size: 10px; color: #64748b;">
                                Bs. {{ number_format($payment['exchange_rate'], 2) }}
                            </span>
                        </div>
                        @endif
                    </div>
                    
                    <div class="payment-column">
                        <div style="font-size: 10px; font-weight: bold; color: #64748b; margin-bottom: 8px; text-transform: uppercase;">
                            Información Bancaria
                        </div>
                        @if($payment['reference'])
                        <div class="payment-row">
                            <span class="payment-label">Referencia:</span>
                            <span class="payment-value">
                                <span class="reference-box">{{ $payment['reference'] }}</span>
                            </span>
                        </div>
                        @endif
                        @if($payment['bank'])
                        <div class="payment-row">
                            <span class="payment-label">Banco Destino:</span>
                            <span class="payment-value">{{ $payment['bank'] }}</span>
                        </div>
                        @endif
                        @if($payment['origin_bank'])
                        <div class="payment-row">
                            <span class="payment-label">Banco Origen:</span>
                            <span class="payment-value">{{ $payment['origin_bank'] }}</span>
                        </div>
                        @endif
                        @if($payment['operation_type'])
                        <div class="payment-row">
                            <span class="payment-label">Tipo:</span>
                            <span class="payment-value">
                                <span class="operation-badge">{{ $payment['operation_type_label'] }}</span>
                            </span>
                        </div>
                        @endif
                    </div>
                </div>

                @if($payment['notes'])
                <div class="notes-section" style="margin-top: 10px;">
                    <div class="notes-title">Notas:</div>
                    <div class="notes-content">{{ $payment['notes'] }}</div>
                </div>
                @endif
            </div>
            @endforeach

            <!-- Payment Summary -->
            <div class="payment-summary">
                @php
                    $totalPaid = $payments->sum('amount_usd');
                    $totalInvoice = $totals['total_usd'] ?? $totals['total'] ?? 0;
                    $pending = max(0, $totalInvoice - $totalPaid);
                @endphp
                <div class="summary-item">
                    <div class="summary-label">Total Factura</div>
                    <div class="summary-value">${{ number_format($totalInvoice, 2) }}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Total Pagado</div>
                    <div class="summary-value paid">${{ number_format($totalPaid, 2) }}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Saldo Pendiente</div>
                    <div class="summary-value {{ $pending > 0 ? 'pending' : 'paid' }}">
                        ${{ number_format($pending, 2) }}
                    </div>
                </div>
            </div>
        </div>
        @endif
    </div>

    <!-- Footer -->
    <div class="footer">
        <div class="footer-content">
            <div class="footer-left">
                <div class="footer-company">{{ $company['name'] }}</div>
                @if($company['address'])
                <div class="footer-contact">{{ $company['address'] }}</div>
                @endif
            </div>
            <div class="footer-center">
                @if($company['phone'])
                <div class="footer-contact">Tel: {{ $company['phone'] }}</div>
                @endif
            </div>
            <div class="footer-right">
                @if($company['email'])
                <div class="footer-contact">{{ $company['email'] }}</div>
                @endif
                @if($company['tax_id'])
                <div class="footer-contact" style="margin-top: 3px;">RIF/NIT: {{ $company['tax_id'] }}</div>
                @endif
            </div>
        </div>
    </div>
</body>
</html>
