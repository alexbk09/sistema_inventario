<?php

namespace App\Http\Controllers;

use App\Models\{StockTransfer, StockTransferItem, Warehouse, Product};
use App\Services\AdminNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockTransferController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user() || !$request->user()->can('view warehouses')) {
            return redirect()->route('dashboard')->with('error', __('app.transfers.permissions.view_stock_denied'));
        }

        $transfers = StockTransfer::with(['fromWarehouse','toWarehouse'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Transfer/Index', [
            'transfers' => $transfers,
        ]);
    }

    public function create(Request $request)
    {
        if (!$request->user() || !$request->user()->can('manage warehouses')) {
            return redirect()->route('dashboard')->with('error', __('app.transfers.permissions.create_denied'));
        }

        $warehouses = Warehouse::orderBy('name')->get(['id','name','code']);
        $products = Product::orderBy('name')->get(['id','name','price_usd','stock']);

        return Inertia::render('Admin/Transfer/Create', [
            'warehouses' => $warehouses,
            'products' => $products,
        ]);
    }

    public function store(Request $request, AdminNotificationService $notificationService)
    {
        if (!$request->user() || !$request->user()->can('manage warehouses')) {
            return redirect()->route('dashboard')->with('error', __('app.transfers.permissions.create_denied'));
        }

        $data = $request->validate([
            'from_warehouse_id' => ['required','exists:warehouses,id'],
            'to_warehouse_id' => ['required','different:from_warehouse_id','exists:warehouses,id'],
            'notes' => ['nullable','string'],
            'items' => ['required','array','min:1'],
            'items.*.product_id' => ['required','exists:products,id'],
            'items.*.quantity' => ['required','integer','min:1'],
        ]);

        return DB::transaction(function () use ($data, $request, $notificationService) {
            $transfer = new StockTransfer();
            $transfer->number = 'TRF-'.Str::upper(Str::random(8));
            $transfer->from_warehouse_id = $data['from_warehouse_id'];
            $transfer->to_warehouse_id = $data['to_warehouse_id'];
            $transfer->status = 'draft';
            $transfer->notes = $data['notes'] ?? null;
            $transfer->user_id = $request->user()->id ?? null;
            $transfer->save();

            foreach ($data['items'] as $item) {
                StockTransferItem::create([
                    'stock_transfer_id' => $transfer->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                ]);
            }

            $notificationService->notifyStaff(
                'transfer_created',
                'Nuevo traslado '.$transfer->number,
                'Estado inicial: '.$transfer->status,
                [
                    'severity' => 'info',
                    'action_url' => route('admin.transfers.show', $transfer->id),
                    'action_label' => 'Ver traslado',
                    'dedupe_key' => 'transfer_created:'.$transfer->id,
                    'data' => [
                        'transfer_id' => $transfer->id,
                        'status' => $transfer->status,
                    ],
                ]
            );

            return redirect()->route('admin.transfers.show', $transfer->id)->with('success', __('app.transfers.notifications.created_draft'));
        });
    }

    public function show(Request $request, StockTransfer $transfer)
    {
        if (!$request->user() || !$request->user()->can('view warehouses')) {
            return redirect()->route('dashboard')->with('error', __('app.transfers.permissions.view_denied'));
        }

        $transfer->load(['fromWarehouse','toWarehouse','items.product']);

        return Inertia::render('Admin/Transfer/Show', [
            'transfer' => $transfer,
        ]);
    }

    public function update(Request $request, StockTransfer $transfer, AdminNotificationService $notificationService)
    {
        if (!$request->user() || !$request->user()->can('manage warehouses')) {
            return redirect()->route('dashboard')->with('error', __('app.transfers.permissions.update_denied'));
        }

        $data = $request->validate([
            'status' => ['required','in:draft,completed,cancelled'],
        ]);

        $oldStatus = $transfer->status;
        $transfer->status = $data['status'];
        $transfer->save();

        // Nota: aquí se podría integrar con InventoryService para ajustar stock por sucursal

        if ($oldStatus !== $transfer->status) {
            $notificationService->notifyStaff(
                'transfer_status_changed',
                'Traslado '.$transfer->number.' actualizado',
                'Estado: '.$oldStatus.' -> '.$transfer->status,
                [
                    'severity' => $transfer->status === 'completed' ? 'success' : 'warning',
                    'action_url' => route('admin.transfers.show', $transfer->id),
                    'action_label' => 'Ver traslado',
                    'dedupe_key' => 'transfer_status_changed:'.$transfer->id.':'.$transfer->status,
                    'data' => [
                        'transfer_id' => $transfer->id,
                        'old_status' => $oldStatus,
                        'new_status' => $transfer->status,
                    ],
                ]
            );
        }

        return redirect()->route('admin.transfers.show', $transfer->id)->with('success', __('app.transfers.notifications.updated'));
    }
}
