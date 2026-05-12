@php
    $locale = app()->getLocale();
    $thousandsSeparator = $locale === 'en' ? ',' : '.';
    $decimalSeparator = $locale === 'en' ? '.' : ',';
    $formatNumber = static fn ($value) => number_format((float) $value, 2, $decimalSeparator, $thousandsSeparator);
    $formatDateTime = static fn ($value) => $value ? $value->copy()->locale($locale)->isoFormat('L LT') : '';
    $visibleCurrencies = is_array($adminCurrencyContext['codes'] ?? null) && count($adminCurrencyContext['codes']) > 0
        ? $adminCurrencyContext['codes']
        : ['USD'];
    $defaultDisplayCurrency = (string) ($adminCurrencyContext['default_display_currency'] ?? 'USD');
@endphp

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <title>{{ __('app.report_exports.inventory.title') }}</title>
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
    <h1>{{ __('app.report_exports.inventory.title') }}</h1>
    <div class="meta">
        {{ __('app.report_exports.inventory.generated_at') }} {{ $formatDateTime(now()) }}<br>
        @if(!empty($filters['search']))
            {{ __('app.report_exports.inventory.search') }} "{{ $filters['search'] }}"<br>
        @endif
        @if(!empty($filters['category_id']))
            {{ __('app.report_exports.inventory.category_filtered') }} {{ $filters['category_id'] }}<br>
        @endif
        @if(!empty($filters['low_stock_only']))
            {{ __('app.report_exports.inventory.low_stock_only') }}<br>
        @endif
        {{ __('app.report_exports.inventory.metrics.total_units') }} {{ $valuation['total_units'] }}
        @foreach($visibleCurrencies as $currencyCode)
            | {{ __('app.report_exports.inventory.metrics.total_cost_usd') }} {{ $currencyCode }} {{ $formatNumber($valuation['total_cost_admin_totals'][$currencyCode] ?? 0) }}
            | {{ __('app.report_exports.inventory.metrics.total_price_usd') }} {{ $currencyCode }} {{ $formatNumber($valuation['total_price_admin_totals'][$currencyCode] ?? 0) }}
        @endforeach
        @if($products->count() >= $maxRows)
            <br><span class="small">* {{ __('app.report_exports.inventory.max_rows_notice', ['rows' => $maxRows]) }}</span>
        @endif
    </div>

    <table>
        <thead>
        <tr>
            <th>{{ __('app.report_exports.inventory.columns.product') }}</th>
            <th>{{ __('app.report_exports.inventory.columns.sku') }}</th>
            <th>{{ __('app.report_exports.inventory.columns.categories') }}</th>
            <th class="right">{{ __('app.report_exports.inventory.columns.stock') }}</th>
            <th class="right">{{ __('app.report_exports.inventory.columns.avg_cost_usd') }} {{ $defaultDisplayCurrency }}</th>
            <th class="right">{{ __('app.report_exports.inventory.columns.price_usd') }} {{ $defaultDisplayCurrency }}</th>
            @foreach($visibleCurrencies as $currencyCode)
                <th class="right">{{ __('app.report_exports.inventory.columns.value_cost_usd') }} {{ $currencyCode }}</th>
                <th class="right">{{ __('app.report_exports.inventory.columns.value_price_usd') }} {{ $currencyCode }}</th>
            @endforeach
        </tr>
        </thead>
        <tbody>
        @forelse($products as $product)
            @php
                $categoriesNames = $product->categories->pluck('name')->implode(', ');
                $stock = (int) ($product->stock ?? 0);
            @endphp
            <tr>
                <td>{{ $product->name }}</td>
                <td>{{ $product->sku }}</td>
                <td>{{ $categoriesNames }}</td>
                <td class="right">{{ $stock }}</td>
                <td class="right">{{ $formatNumber($product->average_cost_admin_totals[$defaultDisplayCurrency] ?? 0) }}</td>
                <td class="right">{{ $formatNumber($product->price_admin_totals[$defaultDisplayCurrency] ?? 0) }}</td>
                @foreach($visibleCurrencies as $currencyCode)
                    <td class="right">{{ $formatNumber($product->value_cost_admin_totals[$currencyCode] ?? 0) }}</td>
                    <td class="right">{{ $formatNumber($product->value_price_admin_totals[$currencyCode] ?? 0) }}</td>
                @endforeach
            </tr>
        @empty
            <tr>
                <td colspan="{{ 6 + (count($visibleCurrencies) * 2) }}" class="small">{{ __('app.report_exports.inventory.no_results') }}</td>
            </tr>
        @endforelse
        </tbody>
    </table>
</body>
</html>
