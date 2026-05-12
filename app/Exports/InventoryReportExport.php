<?php

namespace App\Exports;

use App\Models\Product;
use App\Services\AdminMoneyService;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class InventoryReportExport implements FromQuery, WithHeadings, WithMapping
{
    protected array $filters;
    protected array $currencyContext;
    protected AdminMoneyService $adminMoneyService;

    public function __construct(array $filters = [], ?array $currencyContext = null)
    {
        $this->filters = $filters;
        $this->adminMoneyService = app(AdminMoneyService::class);
        $this->currencyContext = $currencyContext ?? $this->adminMoneyService->getAdminCurrencyContext();
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
        $headings = [
            __('app.report_exports.inventory.columns.product'),
            __('app.report_exports.inventory.columns.sku'),
            __('app.report_exports.inventory.columns.categories'),
            __('app.report_exports.inventory.columns.stock'),
        ];

        $defaultDisplayCurrency = (string) ($this->currencyContext['default_display_currency'] ?? 'USD');
        $headings[] = __('app.report_exports.inventory.columns.avg_cost_usd').' '.$defaultDisplayCurrency;
        $headings[] = __('app.report_exports.inventory.columns.price_usd').' '.$defaultDisplayCurrency;

        foreach ($this->currencyContext['codes'] ?? [] as $code) {
            $headings[] = __('app.report_exports.inventory.columns.value_cost_usd').' '.$code;
            $headings[] = __('app.report_exports.inventory.columns.value_price_usd').' '.$code;
        }

        return $headings;
    }

    public function map($product): array
    {
        $categoriesNames = $product->categories->pluck('name')->implode(', ');
        $valueCost = (int) ($product->stock ?? 0) * (float) ($product->average_cost_usd ?? 0);
        $valuePrice = (int) ($product->stock ?? 0) * (float) ($product->price_usd ?? 0);
        $defaultDisplayCurrency = (string) ($this->currencyContext['default_display_currency'] ?? 'USD');
        $averageCostTotals = $this->adminMoneyService->buildAdminTotals((float) ($product->average_cost_usd ?? 0), null)['totals'];
        $priceTotals = $this->adminMoneyService->buildAdminTotals((float) ($product->price_usd ?? 0), null)['totals'];
        $valueCostTotals = $this->adminMoneyService->buildAdminTotals($valueCost, null)['totals'];
        $valuePriceTotals = $this->adminMoneyService->buildAdminTotals($valuePrice, null)['totals'];

        $row = [
            $product->name,
            $product->sku,
            $categoriesNames,
            (int) $product->stock,
            number_format((float) ($averageCostTotals[$defaultDisplayCurrency] ?? 0), 2, '.', ''),
            number_format((float) ($priceTotals[$defaultDisplayCurrency] ?? 0), 2, '.', ''),
        ];

        foreach ($this->currencyContext['codes'] ?? [] as $code) {
            $row[] = number_format((float) ($valueCostTotals[$code] ?? 0), 2, '.', '');
            $row[] = number_format((float) ($valuePriceTotals[$code] ?? 0), 2, '.', '');
        }

        return $row;
    }
}
