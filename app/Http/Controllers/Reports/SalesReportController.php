<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Warehouse;
use App\Models\InvoicePayment;
use App\Exports\SalesReportExport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class SalesReportController extends Controller
{
    public function index(Request $request)
    {
        $filters = [
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'warehouse_id' => $request->input('warehouse_id'),
            'customer_id' => $request->input('customer_id'),
            'seller_id' => $request->input('seller_id'),
            'status' => $request->input('status'),
            'document_type' => $request->input('document_type'),
            'payment_method' => $request->input('payment_method'),
        ];

        foreach ($filters as $key => $value) {
            if ($value === null || $value === '' || $value === 'null' || $value === 'undefined') {
                $filters[$key] = null;
            }
        }

        $baseQuery = Invoice::query()
            ->with(['customer:id,name', 'warehouse:id,name,code', 'seller:id,name'])
            ->when($filters['seller_id'], function ($q, $sid) {
                $q->where('seller_id', $sid);
            })
            ->when($filters['date_from'], function ($q, $from) {
                $q->whereDate('created_at', '>=', $from);
            })
            ->when($filters['date_to'], function ($q, $to) {
                $q->whereDate('created_at', '<=', $to);
            })
            ->when($filters['warehouse_id'], function ($q, $wid) {
                $q->where('warehouse_id', $wid);
            })
            ->when($filters['customer_id'], function ($q, $cid) {
                $q->where('customer_id', $cid);
            })
            ->when($filters['status'], function ($q, $status) {
                $q->where('status', $status);
            })
            ->when($filters['document_type'], function ($q, $type) {
                $q->where('document_type', $type);
            })
            ->when($filters['payment_method'], function ($q, $method) {
                $q->whereHas('payments', function ($pq) use ($method) {
                    $pq->where('method', $method);
                });
            });

        $metrics = (clone $baseQuery)
            ->selectRaw('COUNT(*) as total_invoices, COALESCE(SUM(total_usd), 0) as total_usd, COALESCE(SUM(total_bs), 0) as total_bs')
            ->first();

        $totalInvoices = (int) ($metrics->total_invoices ?? 0);
        $totalUsd = (float) ($metrics->total_usd ?? 0);

        $invoices = $baseQuery
            ->latest()
            ->paginate(25)
            ->withQueryString();

        $warehouses = Warehouse::orderBy('name')->get(['id', 'name', 'code']);
        $customers = Customer::orderBy('name')->limit(200)->get(['id', 'name']);
        $paymentMethods = InvoicePayment::select('method')->distinct()->orderBy('method')->pluck('method');
        $sellers = \App\Models\User::orderBy('name')->get(['id', 'name']);

        return inertia('Admin/Reports/Sales/Index', [
            'invoices' => $invoices,
            'filters' => $filters,
            'metrics' => [
                'total_invoices' => $totalInvoices,
                'total_usd' => $totalUsd,
                'total_bs' => (float) ($metrics->total_bs ?? 0),
                'avg_ticket_usd' => $totalInvoices > 0 ? $totalUsd / $totalInvoices : 0.0,
            ],
            'warehouses' => $warehouses,
            'customers' => $customers,
            'paymentMethods' => $paymentMethods,
            'sellers' => $sellers,
        ]);
    }

    public function topProducts(Request $request)
    {
        $filters = [
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'warehouse_id' => $request->input('warehouse_id'),
            'status' => $request->input('status'),
            'document_type' => $request->input('document_type'),
        ];

        foreach ($filters as $key => $value) {
            if ($value === null || $value === '' || $value === 'null' || $value === 'undefined') {
                $filters[$key] = null;
            }
        }

        $baseQuery = InvoiceItem::query()
            ->selectRaw('product_id, SUM(quantity) as total_quantity, SUM(subtotal_usd) as total_sales_usd')
            ->with(['product:id,name,sku,barcode'])
            ->whereHas('invoice', function ($q) use ($filters) {
                $q->when($filters['date_from'], function ($q, $from) {
                    $q->whereDate('created_at', '>=', $from);
                })
                    ->when($filters['date_to'], function ($q, $to) {
                        $q->whereDate('created_at', '<=', $to);
                    })
                    ->when($filters['warehouse_id'], function ($q, $wid) {
                        $q->where('warehouse_id', $wid);
                    })
                    ->when($filters['status'], function ($q, $status) {
                        $q->where('status', $status);
                    })
                    ->when($filters['document_type'], function ($q, $type) {
                        $q->where('document_type', $type);
                    });
            })
            ->groupBy('product_id');

        $rankedProducts = $baseQuery
            ->orderByDesc('total_quantity')
            ->orderBy('product_id')
            ->paginate(50)
            ->withQueryString();

        $warehouses = Warehouse::orderBy('name')->get(['id', 'name', 'code']);

        return inertia('Admin/Reports/Sales/TopProducts', [
            'items' => $rankedProducts,
            'filters' => $filters,
            'warehouses' => $warehouses,
        ]);
    }

    public function salesByCategory(Request $request)
    {
        $filters = [
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'warehouse_id' => $request->input('warehouse_id'),
            'status' => $request->input('status'),
            'document_type' => $request->input('document_type'),
        ];

        foreach ($filters as $key => $value) {
            if ($value === null || $value === '' || $value === 'null' || $value === 'undefined') {
                $filters[$key] = null;
            }
        }

        $baseQuery = InvoiceItem::query()
            ->join('products', 'invoice_items.product_id', '=', 'products.id')
            ->leftJoin('category_product', 'products.id', '=', 'category_product.product_id')
            ->leftJoin('categories', 'category_product.category_id', '=', 'categories.id')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->when($filters['date_from'], function ($q, $from) {
                $q->whereDate('invoices.created_at', '>=', $from);
            })
            ->when($filters['date_to'], function ($q, $to) {
                $q->whereDate('invoices.created_at', '<=', $to);
            })
            ->when($filters['warehouse_id'], function ($q, $wid) {
                $q->where('invoices.warehouse_id', $wid);
            })
            ->when($filters['status'], function ($q, $status) {
                $q->where('invoices.status', $status);
            })
            ->when($filters['document_type'], function ($q, $type) {
                $q->where('invoices.document_type', $type);
            })
            ->groupBy('categories.id', 'categories.name');

        $summary = (clone $baseQuery)
            ->selectRaw('COALESCE(categories.name, "Sin categoría") as category_name, SUM(invoice_items.quantity) as total_quantity, SUM(invoice_items.subtotal_usd) as total_sales_usd')
            ->orderByDesc('total_sales_usd')
            ->paginate(50)
            ->withQueryString();

        $warehouses = Warehouse::orderBy('name')->get(['id', 'name', 'code']);

        $totalMetrics = [
            'total_quantity' => (float) $summary->getCollection()->sum('total_quantity'),
            'total_sales_usd' => (float) $summary->getCollection()->sum('total_sales_usd'),
        ];

        return inertia('Admin/Reports/Sales/ByCategory', [
            'rows' => $summary,
            'filters' => $filters,
            'warehouses' => $warehouses,
            'metrics' => $totalMetrics,
        ]);
    }

    public function export(Request $request)
    {
        $filters = [
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'warehouse_id' => $request->input('warehouse_id'),
            'customer_id' => $request->input('customer_id'),
            'seller_id' => $request->input('seller_id'),
            'status' => $request->input('status'),
            'document_type' => $request->input('document_type'),
            'payment_method' => $request->input('payment_method'),
        ];

        foreach ($filters as $key => $value) {
            if ($value === null || $value === '' || $value === 'null' || $value === 'undefined') {
                $filters[$key] = null;
            }
        }

        $query = Invoice::query()
            ->with(['customer:id,name', 'warehouse:id,name,code', 'seller:id,name'])
            ->when($filters['seller_id'], function ($q, $sid) {
                $q->where('seller_id', $sid);
            })
            ->when($filters['date_from'], function ($q, $from) {
                $q->whereDate('created_at', '>=', $from);
            })
            ->when($filters['date_to'], function ($q, $to) {
                $q->whereDate('created_at', '<=', $to);
            })
            ->when($filters['warehouse_id'], function ($q, $wid) {
                $q->where('warehouse_id', $wid);
            })
            ->when($filters['customer_id'], function ($q, $cid) {
                $q->where('customer_id', $cid);
            })
            ->when($filters['status'], function ($q, $status) {
                $q->where('status', $status);
            })
            ->when($filters['document_type'], function ($q, $type) {
                $q->where('document_type', $type);
            })
            ->when($filters['payment_method'], function ($q, $method) {
                $q->whereHas('payments', function ($pq) use ($method) {
                    $pq->where('method', $method);
                });
            })
            ->orderByDesc('created_at');

        $fileName = 'reporte_ventas_'.now()->format('Ymd_His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$fileName.'"',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ];

        $callback = function () use ($query) {
            $handle = fopen('php://output', 'w');

            // BOM para Excel/UTF-8
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Fecha',
                'Número',
                'Tipo',
                'Cliente',
                'Sucursal/Bodega',
                'Estado',
                'Total USD',
                'Total BS',
            ]);

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

            $query->chunk(2000, function ($chunk) use ($handle, $typeLabels, $statusLabels) {
                foreach ($chunk as $invoice) {
                    fputcsv($handle, [
                        optional($invoice->created_at)->format('Y-m-d H:i:s'),
                        $invoice->number,
                        $typeLabels[$invoice->document_type] ?? $invoice->document_type,
                        optional($invoice->customer)->name,
                        $invoice->warehouse?->name ?? $invoice->warehouse?->code,
                        $statusLabels[$invoice->status] ?? $invoice->status,
                        number_format((float) $invoice->total_usd, 2, '.', ''),
                        number_format((float) $invoice->total_bs, 2, '.', ''),
                    ]);
                }
            });

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function exportExcel(Request $request)
    {
        $filters = [
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'warehouse_id' => $request->input('warehouse_id'),
            'customer_id' => $request->input('customer_id'),
            'status' => $request->input('status'),
            'document_type' => $request->input('document_type'),
            'payment_method' => $request->input('payment_method'),
        ];

        foreach ($filters as $key => $value) {
            if ($value === null || $value === '' || $value === 'null' || $value === 'undefined') {
                $filters[$key] = null;
            }
        }

        $fileName = 'reporte_ventas_'.now()->format('Ymd_His').'.xlsx';

        return Excel::download(new SalesReportExport($filters), $fileName);
    }

    public function exportPdf(Request $request)
    {
        $filters = [
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'warehouse_id' => $request->input('warehouse_id'),
            'customer_id' => $request->input('customer_id'),
            'status' => $request->input('status'),
            'document_type' => $request->input('document_type'),
            'payment_method' => $request->input('payment_method'),
        ];

        foreach ($filters as $key => $value) {
            if ($value === null || $value === '' || $value === 'null' || $value === 'undefined') {
                $filters[$key] = null;
            }
        }

        $query = Invoice::query()
            ->with(['customer:id,name', 'warehouse:id,name,code'])
            ->when($filters['date_from'], function ($q, $from) {
                $q->whereDate('created_at', '>=', $from);
            })
            ->when($filters['date_to'], function ($q, $to) {
                $q->whereDate('created_at', '<=', $to);
            })
            ->when($filters['warehouse_id'], function ($q, $wid) {
                $q->where('warehouse_id', $wid);
            })
            ->when($filters['customer_id'], function ($q, $cid) {
                $q->where('customer_id', $cid);
            })
            ->when($filters['status'], function ($q, $status) {
                $q->where('status', $status);
            })
            ->when($filters['document_type'], function ($q, $type) {
                $q->where('document_type', $type);
            })
            ->when($filters['payment_method'], function ($q, $method) {
                $q->whereHas('payments', function ($pq) use ($method) {
                    $pq->where('method', $method);
                });
            })
            ->orderByDesc('created_at');

        // Para PDFs mantenemos un límite razonable de filas para no generar archivos gigantes.
        $maxRows = 5000;
        $invoices = $query->limit($maxRows)->get();

        $metrics = [
            'total_invoices' => (int) $invoices->count(),
            'total_usd' => (float) $invoices->sum('total_usd'),
            'total_bs' => (float) $invoices->sum('total_bs'),
            'avg_ticket_usd' => $invoices->count() > 0 ? (float) $invoices->sum('total_usd') / (int) $invoices->count() : 0.0,
        ];

        $pdf = Pdf::loadView('reports.sales_pdf', [
            'invoices' => $invoices,
            'metrics' => $metrics,
            'filters' => $filters,
            'maxRows' => $maxRows,
        ])->setPaper('a4', 'landscape');

        $fileName = 'reporte_ventas_'.now()->format('Ymd_His').'.pdf';

        return $pdf->download($fileName);
    }
}
