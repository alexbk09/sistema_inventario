<?php

namespace App\Exports;

use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class InventoryReportExport implements FromQuery, WithHeadings, WithMapping
{
    protected array $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function query()
    {
        $filters = $this->filters;

        return Product::query()
            ->with(['categories:id,name'])
            ->when($filters['category_id'] ?? null, function (Builder $q, $cid) {
                $q->whereHas('categories', function ($cq) use ($cid) {
                    $cq->where('categories.id', $cid);
                });
            })
            ->when($filters['search'] ?? null, function (Builder $q, $search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%");
                });
            })
            ->when(!empty($filters['low_stock_only']), function (Builder $q) {
                $q->where(function ($qq) {
                    $qq->whereNotNull('min_stock')
                        ->whereColumn('stock', '<=', 'min_stock');
                })->orWhere('stock', '<=', 0);
            })
            ->orderBy('name');
    }

    public function headings(): array
    {
        return [
            'Producto',
            'SKU',
            'Categorías',
            'Stock',
            'Costo prom. USD',
            'Precio USD',
            'Valor costo (USD)',
            'Valor venta (USD)',
        ];
    }

    public function map($product): array
    {
        $categoriesNames = $product->categories->pluck('name')->implode(', ');
        $valueCost = (int) ($product->stock ?? 0) * (float) ($product->average_cost_usd ?? 0);
        $valuePrice = (int) ($product->stock ?? 0) * (float) ($product->price_usd ?? 0);

        return [
            $product->name,
            $product->sku,
            $categoriesNames,
            (int) $product->stock,
            number_format((float) ($product->average_cost_usd ?? 0), 2, '.', ''),
            number_format((float) ($product->price_usd ?? 0), 2, '.', ''),
            number_format($valueCost, 2, '.', ''),
            number_format($valuePrice, 2, '.', ''),
        ];
    }
}
