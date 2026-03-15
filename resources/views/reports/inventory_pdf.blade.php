<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de inventario</title>
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
    <h1>Reporte de inventario</h1>
    <div class="meta">
        Generado: {{ now()->format('d/m/Y H:i') }}<br>
        @if(!empty($filters['search']))
            Búsqueda: "{{ $filters['search'] }}"<br>
        @endif
        @if(!empty($filters['category_id']))
            Categoría filtrada (ID): {{ $filters['category_id'] }}<br>
        @endif
        @if(!empty($filters['low_stock_only']))
            Solo productos con stock bajo/cero<br>
        @endif
        Unidades totales: {{ $valuation['total_units'] }} | Valor costo (USD): {{ number_format($valuation['total_cost_usd'], 2, ',', '.') }} | Valor venta (USD): {{ number_format($valuation['total_price_usd'], 2, ',', '.') }}
        @if($products->count() >= $maxRows)
            <br><span class="small">* Se muestran solo las primeras {{ $maxRows }} filas para el PDF.</span>
        @endif
    </div>

    <table>
        <thead>
        <tr>
            <th>Producto</th>
            <th>SKU</th>
            <th>Categorías</th>
            <th class="right">Stock</th>
            <th class="right">Costo prom. USD</th>
            <th class="right">Precio USD</th>
            <th class="right">Valor costo (USD)</th>
            <th class="right">Valor venta (USD)</th>
        </tr>
        </thead>
        <tbody>
        @forelse($products as $product)
            @php
                $categoriesNames = $product->categories->pluck('name')->implode(', ');
                $stock = (int) ($product->stock ?? 0);
                $cost = (float) ($product->average_cost_usd ?? 0);
                $price = (float) ($product->price_usd ?? 0);
                $valueCost = $stock * $cost;
                $valuePrice = $stock * $price;
            @endphp
            <tr>
                <td>{{ $product->name }}</td>
                <td>{{ $product->sku }}</td>
                <td>{{ $categoriesNames }}</td>
                <td class="right">{{ $stock }}</td>
                <td class="right">{{ number_format($cost, 2, ',', '.') }}</td>
                <td class="right">{{ number_format($price, 2, ',', '.') }}</td>
                <td class="right">{{ number_format($valueCost, 2, ',', '.') }}</td>
                <td class="right">{{ number_format($valuePrice, 2, ',', '.') }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="8" class="small">No hay productos para los filtros seleccionados.</td>
            </tr>
        @endforelse
        </tbody>
    </table>
</body>
</html>
