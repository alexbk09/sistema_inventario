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
use App\Services\AdminMoneyService;
use App\Support\Settings;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class SalesReportController extends Controller
{
    public function index(Request $request, AdminMoneyService $adminMoneyService)
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

        $currencySettings = Settings::get('currency', []);
        $totalInvoices = (int) ($metrics->total_invoices ?? 0);
        $totalUsd = (float) ($metrics->total_usd ?? 0);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);
        $zeroTotals = $this->buildZeroTotals($adminCurrencyContext['codes'] ?? []);
        $metricInvoices = (clone $baseQuery)->get(['id', 'total_usd', 'total_bs', 'currency_code', 'base_currency_code', 'monetary_totals_json']);
        $metricsByCurrency = $this->sumInvoiceDocumentTotals($metricInvoices, $adminMoneyService, $currencySettings, $zeroTotals);
        $avgTicketByCurrency = $this->divideTotals($metricsByCurrency, $totalInvoices, $zeroTotals);

        $invoices = $baseQuery
            ->latest()
            ->paginate(25)
            ->withQueryString();

        $invoices->setCollection(
            $invoices->getCollection()->map(function (Invoice $invoice) use ($adminMoneyService, $currencySettings) {
                $invoice->admin_totals = $this->resolveInvoiceDocumentTotals($invoice, $adminMoneyService, $currencySettings);

                return $invoice;
            })
        );

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
                'avg_ticket_admin_totals' => $avgTicketByCurrency,
            ],
            'metricsByCurrency' => $metricsByCurrency,
            'adminCurrencyContext' => $adminCurrencyContext,
            'warehouses' => $warehouses,
            'customers' => $customers,
            'paymentMethods' => $paymentMethods,
            'sellers' => $sellers,
        ]);
    }

    public function topProducts(Request $request, AdminMoneyService $adminMoneyService)
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

        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);
        $currencyCodes = $adminCurrencyContext['codes'] ?? [];
        $zeroTotals = [];

        foreach ($currencyCodes as $code) {
            $zeroTotals[$code] = 0.0;
        }

        $itemQuery = InvoiceItem::query()
            ->with([
                'product:id,name,sku,barcode',
                'invoice:id,created_at,warehouse_id,status,document_type,base_currency_code,monetary_totals_json',
            ])
            ->whereHas('invoice', function ($q) use ($filters) {
                $q->when($filters['date_from'], function ($invoiceQuery, $from) {
                    $invoiceQuery->whereDate('created_at', '>=', $from);
                })
                    ->when($filters['date_to'], function ($invoiceQuery, $to) {
                        $invoiceQuery->whereDate('created_at', '<=', $to);
                    })
                    ->when($filters['warehouse_id'], function ($invoiceQuery, $wid) {
                        $invoiceQuery->where('warehouse_id', $wid);
                    })
                    ->when($filters['status'], function ($invoiceQuery, $status) {
                        $invoiceQuery->where('status', $status);
                    })
                    ->when($filters['document_type'], function ($invoiceQuery, $type) {
                        $invoiceQuery->where('document_type', $type);
                    });
            });

        $productSummary = [];

        $itemQuery->chunkById(500, function ($items) use (&$productSummary, $adminMoneyService, $currencySettings, $zeroTotals) {
            foreach ($items as $item) {
                $productId = (int) ($item->product_id ?? 0);

                if (! array_key_exists($productId, $productSummary)) {
                    $productSummary[$productId] = [
                        'product_id' => $productId,
                        'product' => $item->product,
                        'total_quantity' => 0,
                        'total_sales_usd' => 0.0,
                        'document_totals' => $zeroTotals,
                    ];
                }

                $itemTotals = $this->resolveInvoiceItemDocumentTotals($item, $adminMoneyService, $currencySettings);
                $productSummary[$productId]['total_quantity'] += (int) ($item->quantity ?? 0);
                $productSummary[$productId]['total_sales_usd'] = round($productSummary[$productId]['total_sales_usd'] + (float) ($item->subtotal_usd ?? 0), 2);

                foreach ($itemTotals as $code => $amount) {
                    $productSummary[$productId]['document_totals'][$code] = round(($productSummary[$productId]['document_totals'][$code] ?? 0) + (float) $amount, 2);
                }
            }
        });

        $rankedCollection = collect(array_values($productSummary))
            ->sort(function (array $left, array $right) {
                $quantityComparison = $right['total_quantity'] <=> $left['total_quantity'];

                if ($quantityComparison !== 0) {
                    return $quantityComparison;
                }

                return $left['product_id'] <=> $right['product_id'];
            })
            ->values();

        $page = max((int) $request->integer('page', 1), 1);
        $perPage = 50;
        $rankedProducts = new LengthAwarePaginator(
            $rankedCollection->forPage($page, $perPage)->values(),
            $rankedCollection->count(),
            $perPage,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );

        $warehouses = Warehouse::orderBy('name')->get(['id', 'name', 'code']);

        return inertia('Admin/Reports/Sales/TopProducts', [
            'items' => $rankedProducts,
            'filters' => $filters,
            'warehouses' => $warehouses,
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }

    public function salesByCategory(Request $request, AdminMoneyService $adminMoneyService)
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

        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);
        $currencyCodes = $adminCurrencyContext['codes'] ?? [];
        $zeroTotals = [];

        foreach ($currencyCodes as $code) {
            $zeroTotals[$code] = 0.0;
        }

        $itemQuery = InvoiceItem::query()
            ->with([
                'invoice:id,created_at,warehouse_id,status,document_type,base_currency_code,monetary_totals_json',
                'product.categories:id,name',
            ])
            ->whereHas('invoice', function ($q) use ($filters) {
                $q->when($filters['date_from'], function ($invoiceQuery, $from) {
                    $invoiceQuery->whereDate('created_at', '>=', $from);
                })
                ->when($filters['date_to'], function ($invoiceQuery, $to) {
                    $invoiceQuery->whereDate('created_at', '<=', $to);
                })
                ->when($filters['warehouse_id'], function ($invoiceQuery, $wid) {
                    $invoiceQuery->where('warehouse_id', $wid);
                })
                ->when($filters['status'], function ($invoiceQuery, $status) {
                    $invoiceQuery->where('status', $status);
                })
                ->when($filters['document_type'], function ($invoiceQuery, $type) {
                    $invoiceQuery->where('document_type', $type);
                });
            });

        $categorySummary = [];

        $itemQuery->chunkById(500, function ($items) use (&$categorySummary, $adminMoneyService, $currencySettings, $zeroTotals) {
            foreach ($items as $item) {
                $categoryNames = $item->product?->categories?->pluck('name')->filter()->values();

                if (! $categoryNames || $categoryNames->isEmpty()) {
                    $categoryNames = collect(['Sin categoría']);
                }

                $itemTotals = $this->resolveInvoiceItemDocumentTotals($item, $adminMoneyService, $currencySettings);

                foreach ($categoryNames as $categoryName) {
                    if (! array_key_exists($categoryName, $categorySummary)) {
                        $categorySummary[$categoryName] = [
                            'category_name' => $categoryName,
                            'total_quantity' => 0,
                            'total_sales_usd' => 0.0,
                            'document_totals' => $zeroTotals,
                        ];
                    }

                    $categorySummary[$categoryName]['total_quantity'] += (int) ($item->quantity ?? 0);
                    $categorySummary[$categoryName]['total_sales_usd'] = round($categorySummary[$categoryName]['total_sales_usd'] + (float) ($item->subtotal_usd ?? 0), 2);

                    foreach ($itemTotals as $code => $amount) {
                        $categorySummary[$categoryName]['document_totals'][$code] = round(($categorySummary[$categoryName]['document_totals'][$code] ?? 0) + (float) $amount, 2);
                    }
                }
            }
        });

        $summaryCollection = collect(array_values($categorySummary))
            ->sortByDesc('total_sales_usd')
            ->values();

        $page = max((int) $request->integer('page', 1), 1);
        $perPage = 50;
        $summary = new LengthAwarePaginator(
            $summaryCollection->forPage($page, $perPage)->values(),
            $summaryCollection->count(),
            $perPage,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );

        $warehouses = Warehouse::orderBy('name')->get(['id', 'name', 'code']);

        $totalSalesAdminTotals = $zeroTotals;
        foreach ($summaryCollection as $row) {
            foreach (($row['document_totals'] ?? []) as $code => $amount) {
                $totalSalesAdminTotals[$code] = round(($totalSalesAdminTotals[$code] ?? 0) + (float) $amount, 2);
            }
        }

        $totalMetrics = [
            'total_quantity' => (float) $summaryCollection->sum('total_quantity'),
            'total_sales_usd' => (float) $summaryCollection->sum('total_sales_usd'),
            'total_sales_admin_totals' => $totalSalesAdminTotals,
        ];

        return inertia('Admin/Reports/Sales/ByCategory', [
            'rows' => $summary,
            'filters' => $filters,
            'warehouses' => $warehouses,
            'metrics' => $totalMetrics,
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }

    protected function resolveInvoiceItemDocumentTotals(InvoiceItem $item, AdminMoneyService $adminMoneyService, array $currencySettings): array
    {
        if (is_array($item->monetary_breakdown_json['totals'] ?? null)) {
            return $item->monetary_breakdown_json['totals'];
        }

        $invoice = $item->invoice;
        $snapshot = is_array($invoice?->monetary_totals_json['rates'] ?? null)
            ? [
                'base_currency' => (string) ($invoice?->base_currency_code ?: 'USD'),
                'captured_at' => $invoice?->monetary_totals_json['captured_at'] ?? null,
                'rates' => $invoice?->monetary_totals_json['rates'] ?? [],
            ]
            : null;

        return $adminMoneyService->buildDocumentTotals((float) ($item->subtotal_usd ?? 0), $currencySettings, $snapshot)['totals'];
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

        $adminMoneyService = app(AdminMoneyService::class);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext();

        $fileName = __('app.report_exports.sales.file_prefix').'_'.now()->format('Ymd_His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$fileName.'"',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ];

        $currencySettings = Settings::get('currency', []);

        $callback = function () use ($query, $adminMoneyService, $adminCurrencyContext, $currencySettings) {
            $locale = app()->getLocale();
            $handle = fopen('php://output', 'w');

            // BOM para Excel/UTF-8
            fwrite($handle, "\xEF\xBB\xBF");

            $headings = [
                __('app.report_exports.sales.columns.date'),
                __('app.report_exports.sales.columns.number'),
                __('app.report_exports.sales.columns.type'),
                __('app.report_exports.sales.columns.customer'),
                __('app.report_exports.sales.columns.branch_warehouse'),
                __('app.report_exports.sales.columns.status'),
            ];

            foreach ($adminCurrencyContext['codes'] ?? [] as $code) {
                $headings[] = __('app.report_exports.sales.columns.total_usd').' '.$code;
            }

            fputcsv($handle, $headings);

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

            $query->chunk(2000, function ($chunk) use ($handle, $typeLabels, $statusLabels, $locale, $adminMoneyService, $adminCurrencyContext, $currencySettings) {
                foreach ($chunk as $invoice) {
                    $row = [
                        $invoice->created_at?->copy()->locale($locale)->isoFormat('L LT'),
                        $invoice->number,
                        $typeLabels[$invoice->document_type] ?? $invoice->document_type,
                        optional($invoice->customer)->name,
                        $invoice->warehouse?->name ?? $invoice->warehouse?->code,
                        $statusLabels[$invoice->status] ?? $invoice->status,
                    ];

                    $totals = $this->resolveInvoiceDocumentTotals($invoice, $adminMoneyService, $currencySettings);
                    foreach (($adminCurrencyContext['codes'] ?? []) as $code) {
                        $row[] = number_format((float) ($totals[$code] ?? 0), 2, '.', '');
                    }

                    fputcsv($handle, $row);
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

        $fileName = __('app.report_exports.sales.file_prefix').'_'.now()->format('Ymd_His').'.xlsx';

        $adminMoneyService = app(AdminMoneyService::class);

        return Excel::download(new SalesReportExport($filters, $adminMoneyService->getAdminCurrencyContext()), $fileName);
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

        $adminMoneyService = app(AdminMoneyService::class);
        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);
        $zeroTotals = $this->buildZeroTotals($adminCurrencyContext['codes'] ?? []);

        // Para PDFs mantenemos un límite razonable de filas para no generar archivos gigantes.
        $maxRows = 5000;
        $invoices = $query->limit($maxRows)->get()->map(function (Invoice $invoice) use ($adminMoneyService, $currencySettings) {
            $invoice->admin_totals = $this->resolveInvoiceDocumentTotals($invoice, $adminMoneyService, $currencySettings);

            return $invoice;
        });

        $metricsByCurrency = $this->sumInvoiceDocumentTotals($invoices, $adminMoneyService, $currencySettings, $zeroTotals);
        $avgTicketByCurrency = $this->divideTotals($metricsByCurrency, (int) $invoices->count(), $zeroTotals);

        $metrics = [
            'total_invoices' => (int) $invoices->count(),
            'total_usd' => (float) $invoices->sum('total_usd'),
            'total_bs' => (float) $invoices->sum('total_bs'),
            'avg_ticket_usd' => $invoices->count() > 0 ? (float) $invoices->sum('total_usd') / (int) $invoices->count() : 0.0,
            'avg_ticket_admin_totals' => $avgTicketByCurrency,
        ];

        $pdf = Pdf::loadView('reports.sales_pdf', [
            'invoices' => $invoices,
            'metrics' => $metrics,
            'metricsByCurrency' => $metricsByCurrency,
            'adminCurrencyCodes' => $adminCurrencyContext['codes'] ?? [],
            'filters' => $filters,
            'maxRows' => $maxRows,
        ])->setPaper('a4', 'landscape');

        $fileName = __('app.report_exports.sales.file_prefix').'_'.now()->format('Ymd_His').'.pdf';

        return $pdf->download($fileName);
    }

    protected function buildZeroTotals(array $currencyCodes): array
    {
        $totals = [];

        foreach ($currencyCodes as $code) {
            $totals[$code] = 0.0;
        }

        return $totals;
    }

    protected function sumInvoiceDocumentTotals(iterable $invoices, AdminMoneyService $adminMoneyService, array $currencySettings, array $zeroTotals): array
    {
        $totals = $zeroTotals;

        foreach ($invoices as $invoice) {
            $documentTotals = $this->resolveInvoiceDocumentTotals($invoice, $adminMoneyService, $currencySettings);

            foreach ($totals as $code => $amount) {
                $totals[$code] = round($amount + (float) ($documentTotals[$code] ?? 0), 2);
            }
        }

        return $totals;
    }

    protected function divideTotals(array $totals, int $divisor, array $zeroTotals): array
    {
        if ($divisor <= 0) {
            return $zeroTotals;
        }

        $result = $zeroTotals;

        foreach ($totals as $code => $amount) {
            $result[$code] = round((float) $amount / $divisor, 2);
        }

        return $result;
    }

    protected function resolveInvoiceDocumentTotals(Invoice $invoice, AdminMoneyService $adminMoneyService, array $currencySettings): array
    {
        if (is_array($invoice->monetary_totals_json['totals'] ?? null)) {
            return $invoice->monetary_totals_json['totals'];
        }

        $snapshot = is_array($invoice->monetary_totals_json['rates'] ?? null)
            ? [
                'base_currency' => (string) ($invoice->base_currency_code ?: 'USD'),
                'captured_at' => $invoice->monetary_totals_json['captured_at'] ?? null,
                'rates' => $invoice->monetary_totals_json['rates'],
            ]
            : null;

        return $adminMoneyService->buildDocumentTotals((float) ($invoice->total_usd ?? 0), $currencySettings, $snapshot)['totals'];
    }
}
