<?php

namespace App\Exports;

use App\Models\Invoice;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class SalesReportExport implements FromQuery, WithHeadings, WithMapping
{
    protected array $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function query()
    {
        $filters = $this->filters;

        return Invoice::query()
            ->with(['customer:id,name', 'warehouse:id,name,code'])
            ->when($filters['date_from'] ?? null, function (Builder $q, $from) {
                $q->whereDate('created_at', '>=', $from);
            })
            ->when($filters['date_to'] ?? null, function (Builder $q, $to) {
                $q->whereDate('created_at', '<=', $to);
            })
            ->when($filters['warehouse_id'] ?? null, function (Builder $q, $wid) {
                $q->where('warehouse_id', $wid);
            })
            ->when($filters['customer_id'] ?? null, function (Builder $q, $cid) {
                $q->where('customer_id', $cid);
            })
            ->when($filters['status'] ?? null, function (Builder $q, $status) {
                $q->where('status', $status);
            })
            ->when($filters['document_type'] ?? null, function (Builder $q, $type) {
                $q->where('document_type', $type);
            })
            ->orderByDesc('created_at');
    }

    public function headings(): array
    {
        return [
            __('app.report_exports.sales.columns.date'),
            __('app.report_exports.sales.columns.number'),
            __('app.report_exports.sales.columns.type'),
            __('app.report_exports.sales.columns.customer'),
            __('app.report_exports.sales.columns.branch_warehouse'),
            __('app.report_exports.sales.columns.status'),
            __('app.report_exports.sales.columns.total_usd'),
            __('app.report_exports.sales.columns.total_bs'),
        ];
    }

    public function map($invoice): array
    {
        $locale = app()->getLocale();
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

        return [
            $invoice->created_at?->copy()->locale($locale)->isoFormat('L LT'),
            $invoice->number,
            $typeLabels[$invoice->document_type] ?? $invoice->document_type,
            optional($invoice->customer)->name,
            $invoice->warehouse?->name ?? $invoice->warehouse?->code,
            $statusLabels[$invoice->status] ?? $invoice->status,
            number_format((float) $invoice->total_usd, 2, '.', ''),
            number_format((float) $invoice->total_bs, 2, '.', ''),
        ];
    }
}
