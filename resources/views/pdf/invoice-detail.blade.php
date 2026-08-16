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
            padding: 20px 30px 80px 30px; /* bottom padding para footer fijo */
        }
        /* Header / Membrete Profesional - Compatible con DomPDF */
        .header {
            background-color: #1e40af;
            color: white;
            padding: 20px 30px;
            margin: -20px -30px 25px -30px;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-table td {
            vertical-align: middle;
            padding: 0;
        }
        .logo-container {
            background: white;
            padding: 8px;
            text-align: center;
        }
        .logo {
            max-width: 80px;
            max-height: 60px;
        }
        .company-info {
            color: white;
            padding-left: 15px;
        }
        .company-name {
            font-size: 22px;
            font-weight: bold;
            color: white;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        .company-details {
            font-size: 10px;
            color: white;
            line-height: 1.5;
        }
        .company-tax {
            background-color: rgba(255,255,255,0.2);
            padding: 3px 10px;
            font-size: 9px;
            font-weight: bold;
            margin-top: 5px;
            display: inline-block;
        }
        .invoice-meta {
            text-align: right;
            color: white;
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
        /* Invoice Info - Tabla para DomPDF */
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background: #f8fafc;
        }
        .info-table td {
            width: 50%;
            padding: 15px;
            vertical-align: top;
        }
        .info-table td:first-child {
            border-right: 1px solid #e2e8f0;
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
        /* Footer Profesional - Compatible con DomPDF */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: #1e40af;
            color: white;
            padding: 15px 30px;
            font-size: 10px;
        }
        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }
        .footer-table td {
            vertical-align: middle;
            padding: 0 10px;
        }
        .footer-left {
            text-align: left;
        }
        .footer-center {
            text-align: center;
            border-left: 1px solid rgba(255,255,255,0.3);
            border-right: 1px solid rgba(255,255,255,0.3);
        }
        .footer-right {
            text-align: right;
        }
        .footer-company {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 3px;
            text-transform: uppercase;
        }
        .footer-contact {
            font-size: 9px;
            line-height: 1.4;
        }
        .footer-thanks {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
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
        <!-- Header / Membrete Profesional -->
        <div class="header">
            <table class="header-table">
                <tr>
                    <td width="100" style="text-align: center;">
                        {{-- Logo desactivado temporalmente - usar base64 para imágenes en DomPDF --}}
                        {{-- @if($company['logo'])
                        <div class="logo-container">
                            <img src="{{ $company['logo'] }}" alt="{{ $company['name'] }}" class="logo">
                        </div>
                        @endif --}}
                    </td>
                    <td>
                        <div class="company-info">
                            <div class="company-name">{{ $company['name'] }}</div>
                            <div class="company-details">
                                @if($company['address'])<div>{{ $company['address'] }}</div>@endif
                                @if($company['phone'])<div>Tel: {{ $company['phone'] }}</div>@endif
                                @if($company['email'])<div>{{ $company['email'] }}</div>@endif
                            </div>
                            @if($company['tax_id'])
                            <div class="company-tax">RIF/NIT: {{ $company['tax_id'] }}</div>
                            @endif
                        </div>
                    </td>
                    <td width="200" class="invoice-meta">
                        <div style="font-size: 24px; font-weight: bold; margin-bottom: 3px;">FACTURA</div>
                        <div style="font-size: 16px; font-weight: bold;">
                            #{{ $invoice->number }}
                        </div>
                        <div style="font-size: 10px; margin-top: 5px;">
                            {{ $invoice->created_at ? $invoice->created_at->format('d/m/Y H:i') : '-' }}
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Invoice Info y Cliente lado a lado -->
        <table class="info-table">
            <tr>
                <td>
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
                            <span class="status-badge {{ $invoice->status === 'paid' ? 'status-paid' : ($invoice->status === 'cancelled' ? 'status-cancelled' : 'status-pending') }}">
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
                </td>
                <td>
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
                </td>
            </tr>
        </table>

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

        <!-- Totals - Full Breakdown -->
        <div class="totals-section" style="margin-top: 25px;">
            @php
                $hasVes    = isset($totals['by_currency']['VES']);
                $subUsd    = $totals['subtotal_usd'] ?? $totals['subtotal'] ?? 0;
                $taxUsd    = $totals['tax_usd']      ?? $totals['tax']      ?? 0;
                $shipUsd   = $totals['shipping_usd'] ?? $totals['shipping'] ?? 0;
                $discUsd   = $totals['discount_usd'] ?? $totals['discount'] ?? 0;
                $otherUsd  = $totals['other_charges_usd'] ?? 0;
                $totalUsd  = $totals['total_usd']    ?? $totals['total']    ?? 0;
                $exRate    = $totals['exchange_rate'] ?? null;
                $exDate    = $totals['exchange_rate_captured_at'] ?? null;
                $baseCur   = $totals['base_currency'] ?? 'USD';
            @endphp

            {{-- Caja de desglose derecha --}}
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
                <tr>
                    {{-- Columna izquierda vacía --}}
                    <td style="width: 50%; vertical-align: top; padding-right: 10px;">
                        {{-- Tasa de cambio si aplica --}}
                        @if($exRate && $exRate > 1)
                        <table style="width: 100%; border-collapse: collapse; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 4px;">
                            <tr>
                                <td style="padding: 8px 12px;">
                                    <div style="font-size: 10px; color: #92400e; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">
                                        Tasa de cambio aplicada
                                    </div>
                                    <div style="font-size: 13px; color: #78350f; font-weight: bold;">
                                        1 USD = Bs. {{ number_format($exRate, 2) }}
                                    </div>
                                    @if($exDate)
                                    <div style="font-size: 9px; color: #92400e; margin-top: 2px;">
                                        Capturada: {{ \Carbon\Carbon::parse($exDate)->format('d/m/Y H:i') }}
                                    </div>
                                    @endif
                                    <div style="font-size: 9px; color: #92400e; margin-top: 2px;">
                                        Moneda base: {{ $baseCur }}
                                    </div>
                                </td>
                            </tr>
                        </table>
                        @endif
                    </td>

                    {{-- Columna derecha con desglose --}}
                    <td style="width: 50%; vertical-align: top;">
                        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 4px;">
                            {{-- Subtotal --}}
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 7px 12px; font-size: 11px; color: #475569;">Subtotal</td>
                                <td style="padding: 7px 12px; font-size: 11px; text-align: right; color: #1e293b;">
                                    @if($hasVes)
                                        Bs. {{ number_format($totals['by_currency']['VES']['subtotal'], 2) }}
                                        <br><span style="font-size: 9px; color: #94a3b8;">(${{ number_format($subUsd, 2) }})</span>
                                    @else
                                        ${{ number_format($subUsd, 2) }}
                                    @endif
                                </td>
                            </tr>

                            {{-- Impuestos --}}
                            @if($taxUsd > 0)
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 7px 12px; font-size: 11px; color: #475569;">Impuestos (IVA)</td>
                                <td style="padding: 7px 12px; font-size: 11px; text-align: right; color: #1e293b;">
                                    @if($hasVes)
                                        Bs. {{ number_format($totals['by_currency']['VES']['tax'], 2) }}
                                        <br><span style="font-size: 9px; color: #94a3b8;">(${{ number_format($taxUsd, 2) }})</span>
                                    @else
                                        ${{ number_format($taxUsd, 2) }}
                                    @endif
                                </td>
                            </tr>
                            @endif

                            {{-- Envío --}}
                            @if($shipUsd > 0)
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 7px 12px; font-size: 11px; color: #475569;">Envío</td>
                                <td style="padding: 7px 12px; font-size: 11px; text-align: right; color: #1e293b;">
                                    @if($hasVes)
                                        Bs. {{ number_format($totals['by_currency']['VES']['shipping'], 2) }}
                                        <br><span style="font-size: 9px; color: #94a3b8;">(${{ number_format($shipUsd, 2) }})</span>
                                    @else
                                        ${{ number_format($shipUsd, 2) }}
                                    @endif
                                </td>
                            </tr>
                            @endif

                            {{-- Descuento --}}
                            @if($discUsd > 0)
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 7px 12px; font-size: 11px; color: #16a34a;">Descuento</td>
                                <td style="padding: 7px 12px; font-size: 11px; text-align: right; color: #16a34a;">
                                    @if($hasVes)
                                        - Bs. {{ number_format($totals['by_currency']['VES']['discount'], 2) }}
                                        <br><span style="font-size: 9px; color: #94a3b8;">(-${{ number_format($discUsd, 2) }})</span>
                                    @else
                                        -${{ number_format($discUsd, 2) }}
                                    @endif
                                </td>
                            </tr>
                            @endif

                            {{-- Otros cargos --}}
                            @if($otherUsd > 0)
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 7px 12px; font-size: 11px; color: #b45309;">Otros cargos</td>
                                <td style="padding: 7px 12px; font-size: 11px; text-align: right; color: #b45309;">
                                    @if($hasVes)
                                        Bs. {{ number_format($totals['by_currency']['VES']['other_charges'], 2) }}
                                        <br><span style="font-size: 9px; color: #94a3b8;">(${{ number_format($otherUsd, 2) }})</span>
                                    @else
                                        ${{ number_format($otherUsd, 2) }}
                                    @endif
                                </td>
                            </tr>
                            @endif

                            {{-- Total final --}}
                            <tr style="background: #1e40af;">
                                <td style="padding: 10px 12px; font-size: 12px; font-weight: bold; color: white;">TOTAL</td>
                                <td style="padding: 10px 12px; font-size: 14px; font-weight: bold; text-align: right; color: white;">
                                    @if($hasVes)
                                        Bs. {{ number_format($totals['by_currency']['VES']['total'], 2) }}
                                        <br><span style="font-size: 9px; font-weight: normal; opacity: 0.85;">(${{ number_format($totalUsd, 2) }} USD)</span>
                                    @else
                                        ${{ number_format($totalUsd, 2) }}
                                    @endif
                                </td>
                            </tr>
                        </table>
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

    <!-- Footer Profesional -->
    <div class="footer">
        <table class="footer-table">
            <tr>
                <td class="footer-left" width="33%">
                    <div class="footer-company">{{ $company['name'] }}</div>
                    @if($company['address'])
                    <div class="footer-contact">{{ $company['address'] }}</div>
                    @endif
                    @if($company['tax_id'])
                    <div class="footer-contact" style="margin-top: 3px;">RIF/NIT: {{ $company['tax_id'] }}</div>
                    @endif
                </td>
                <td class="footer-center" width="34%">
                    <div class="footer-thanks">¡Gracias por su compra!</div>
                    <div style="font-size: 8px; margin-top: 3px;">Generado: {{ now()->format('d/m/Y H:i') }}</div>
                </td>
                <td class="footer-right" width="33%">
                    @if($company['phone'])
                    <div class="footer-contact">Tel: {{ $company['phone'] }}</div>
                    @endif
                    @if($company['email'])
                    <div class="footer-contact" style="margin-top: 3px;">{{ $company['email'] }}</div>
                    @endif
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
