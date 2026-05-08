@php
    $locale = app()->getLocale();
    $thousandsSeparator = $locale === 'en' ? ',' : '.';
    $decimalSeparator = $locale === 'en' ? '.' : ',';
    $formatNumber = static fn ($value) => number_format((float) $value, 2, $decimalSeparator, $thousandsSeparator);
    $formatDateTime = static fn ($value) => $value ? $value->copy()->locale($locale)->isoFormat('L LT') : '';
    $typeLabels = [
        'invoice' => __('app.report_exports.sales.document_types.invoice'),
        'delivery_note' => __('app.report_exports.sales.document_types.delivery_note'),
        'proforma' => __('app.report_exports.sales.document_types.proforma'),
    ];
    $statusLabels = [
        'pending' => __('app.report_exports.sales.statuses.pending'),
        'paid' => __('app.report_exports.sales.statuses.paid'),
        'shipped' => __('app.report_exports.sales.statuses.shipped'),
        'delivered' => __('app.report_exports.sales.statuses.delivered'),
        'cancelled' => __('app.report_exports.sales.statuses.cancelled'),
    ];
@endphp

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <title>{{ __('app.report_exports.sales.title') }}</title>
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
    <h1>{{ __('app.report_exports.sales.title') }}</h1>
    <div class="meta">
        {{ __('app.report_exports.sales.generated_at') }} {{ $formatDateTime(now()) }}<br>
        @if(!empty($filters['date_from']) || !empty($filters['date_to']))
            {{ __('app.report_exports.sales.range') }} {{ $filters['date_from'] ?? __('app.report_exports.sales.range_start') }} - {{ $filters['date_to'] ?? __('app.report_exports.sales.range_today') }}<br>
        @endif
        {{ __('app.report_exports.sales.metrics.total_invoices') }} {{ $metrics['total_invoices'] }} | {{ __('app.report_exports.sales.metrics.total_usd') }} {{ $formatNumber($metrics['total_usd']) }} | {{ __('app.report_exports.sales.metrics.total_bs') }} {{ $formatNumber($metrics['total_bs']) }} | {{ __('app.report_exports.sales.metrics.avg_ticket_usd') }} {{ $formatNumber($metrics['avg_ticket_usd'] ?? 0) }}
        @if($invoices->count() >= $maxRows)
            <br><span class="small">* {{ __('app.report_exports.sales.max_rows_notice', ['rows' => $maxRows]) }}</span>
        @endif
    </div>

    <table>
        <thead>
        <tr>
            <th>{{ __('app.report_exports.sales.columns.date') }}</th>
            <th>{{ __('app.report_exports.sales.columns.number') }}</th>
            <th>{{ __('app.report_exports.sales.columns.type') }}</th>
            <th>{{ __('app.report_exports.sales.columns.customer') }}</th>
            <th>{{ __('app.report_exports.sales.columns.branch_warehouse') }}</th>
            <th>{{ __('app.report_exports.sales.columns.status') }}</th>
            <th class="right">{{ __('app.report_exports.sales.columns.total_usd') }}</th>
            <th class="right">{{ __('app.report_exports.sales.columns.total_bs') }}</th>
        </tr>
        </thead>
        <tbody>
        @forelse($invoices as $invoice)
            <tr>
                <td>{{ $formatDateTime($invoice->created_at) }}</td>
                <td>{{ $invoice->number }}</td>
                <td>{{ $typeLabels[$invoice->document_type] ?? $invoice->document_type }}</td>
                <td>{{ optional($invoice->customer)->name }}</td>
                <td>{{ $invoice->warehouse->name ?? $invoice->warehouse->code ?? '' }}</td>
                <td>{{ $statusLabels[$invoice->status] ?? $invoice->status }}</td>
                <td class="right">{{ $formatNumber((float) $invoice->total_usd) }}</td>
                <td class="right">{{ $formatNumber((float) $invoice->total_bs) }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="8" class="small">{{ __('app.report_exports.sales.no_results') }}</td>
            </tr>
        @endforelse
        </tbody>
    </table>
</body>
</html>
