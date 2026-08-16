<?php

namespace App\Http\Controllers\Reports;

use App\Exports\InvoicesExport;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class InvoiceExportController extends Controller
{
    public function __invoke(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        $status = (string) $request->input('status', '');
        $format = strtolower((string) $request->input('format', 'excel'));

        if ($format === 'csv') {
            return Excel::download(
                new InvoicesExport($search, $status),
                'facturas_' . now()->format('Ymd_His') . '.csv',
                \Maatwebsite\Excel\Excel::CSV,
                ['Content-Type' => 'text/csv; charset=UTF-8']
            );
        }

        if ($format === 'excel') {
            return Excel::download(
                new InvoicesExport($search, $status),
                'facturas_' . now()->format('Ymd_His') . '.xlsx'
            );
        }

        // PDF
        $invoices = Invoice::query()
            ->with(['customer:id,name', 'invoiceStatus:id,code,name'])
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('number', 'like', "%{$search}%")
                       ->orWhereHas('customer', fn($c) => $c->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($status !== '', fn($q) => $q->where('status', $status))
            ->latest()
            ->limit(500)
            ->get();

        $pdf = Pdf::loadView('pdf.invoices-list', [
            'invoices' => $invoices,
            'search'   => $search,
            'status'   => $status,
            'date'     => now()->format('d/m/Y H:i'),
        ])->setPaper('a4', 'landscape');

        return $pdf->download('facturas_' . now()->format('Ymd_His') . '.pdf');
    }
}
