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
            'Fecha',
            'Número',
            'Tipo',
            'Cliente',
            'Sucursal/Bodega',
            'Estado',
            'Total USD',
            'Total BS',
        ];
    }

    public function map($invoice): array
    {
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

        return [
            optional($invoice->created_at)->format('Y-m-d H:i:s'),
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
