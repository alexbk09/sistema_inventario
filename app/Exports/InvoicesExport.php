<?php

namespace App\Exports;

use App\Models\Invoice;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class InvoicesExport implements FromQuery, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    public function __construct(
        private string $search = '',
        private string $status = '',
    ) {}

    public function query()
    {
        return Invoice::query()
            ->with(['customer:id,name', 'invoiceStatus:id,code,name'])
            ->when($this->search !== '', function ($q) {
                $q->where(function ($qq) {
                    $qq->where('number', 'like', "%{$this->search}%")
                       ->orWhereHas('customer', fn($c) => $c->where('name', 'like', "%{$this->search}%"));
                });
            })
            ->when($this->status !== '', fn($q) => $q->where('status', $this->status))
            ->latest();
    }

    public function headings(): array
    {
        return [
            'N° Factura',
            'Fecha',
            'Cliente',
            'Estado',
            'Tipo',
            'Total USD',
            'Total BS',
            'Notas internas',
        ];
    }

    public function map($invoice): array
    {
        return [
            $invoice->number,
            $invoice->created_at?->format('d/m/Y H:i'),
            $invoice->customer?->name ?? 'Cliente ocasional',
            $invoice->invoiceStatus?->name ?? $invoice->status,
            $invoice->document_type ?? 'invoice',
            number_format((float) $invoice->total_usd, 2),
            number_format((float) $invoice->total_bs, 2),
            $invoice->internal_notes ?? '',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
