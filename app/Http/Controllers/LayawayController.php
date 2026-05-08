<?php

namespace App\Http\Controllers;

use App\Models\{Layaway, LayawayItem, Customer, Product};
use App\Services\AdminNotificationService;
use App\Services\CurrencyService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LayawayController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user() || !$request->user()->can('view credits')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.layaways.permissions.view_denied'));
        }

        $status = (string) $request->input('status', '');

        $layaways = Layaway::with('customer')
            ->when($status !== '', function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Layaway/Index', [
            'layaways' => $layaways,
            'filters' => [
                'status' => $status,
            ],
        ]);
    }

    public function create(Request $request)
    {
        if (!$request->user() || !$request->user()->can('manage credits')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.layaways.permissions.create_denied'));
        }

        $customers = Customer::orderBy('name')->get(['id','name']);
        $products = Product::orderBy('name')->get(['id','name','price_usd','stock']);

        return Inertia::render('Admin/Layaway/Create', [
            'customers' => $customers,
            'products' => $products,
        ]);
    }

    public function store(Request $request, CurrencyService $currency, AdminNotificationService $notificationService)
    {
        if (!$request->user() || !$request->user()->can('manage credits')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.layaways.permissions.create_denied'));
        }

        $data = $request->validate([
            'customer_id' => ['nullable','exists:customers,id'],
            'expires_at' => ['nullable','date'],
            'notes' => ['nullable','string'],
            'items' => ['required','array','min:1'],
            'items.*.product_id' => ['required','exists:products,id'],
            'items.*.quantity' => ['required','integer','min:1'],
        ]);

        return DB::transaction(function () use ($data, $currency, $notificationService) {
            $layaway = new Layaway();
            $layaway->number = 'LAY-'.Str::upper(Str::random(8));
            $layaway->customer_id = $data['customer_id'] ?? null;
            $layaway->status = 'active';
            $layaway->expires_at = $data['expires_at'] ?? null;
            $layaway->notes = $data['notes'] ?? null;
            $layaway->total_usd = 0;
            $layaway->total_bs = 0;
            $layaway->paid_usd = 0;
            $layaway->save();

            $totalUsd = 0.0;

            foreach ($data['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                $qty = (int) $item['quantity'];
                $unitPrice = (float) ($product->price_usd ?? 0);
                $subtotalUsd = $unitPrice * $qty;
                $subtotalBs = $currency->usdToBs($subtotalUsd);

                LayawayItem::create([
                    'layaway_id' => $layaway->id,
                    'product_id' => $product->id,
                    'quantity' => $qty,
                    'unit_price_usd' => $unitPrice,
                    'subtotal_usd' => $subtotalUsd,
                    'subtotal_bs' => $subtotalBs,
                ]);

                $totalUsd += $subtotalUsd;
            }

            $layaway->update([
                'total_usd' => $totalUsd,
                'total_bs' => $currency->usdToBs($totalUsd),
            ]);

            $notificationMessage = 'Total: $'.number_format((float) $layaway->total_usd, 2);
            if ($layaway->expires_at) {
                $notificationMessage .= ' / Vence: '.$layaway->expires_at->format('d/m/Y H:i');
            }

            $notificationService->notifyStaff(
                'layaway_created',
                'Nuevo apartado '.$layaway->number,
                $notificationMessage,
                [
                    'severity' => 'info',
                    'action_url' => route('admin.layaways.show', $layaway->id),
                    'action_label' => 'Ver apartado',
                    'dedupe_key' => 'layaway_created:'.$layaway->id,
                    'data' => [
                        'layaway_id' => $layaway->id,
                        'status' => $layaway->status,
                    ],
                ]
            );

            return redirect()->route('admin.layaways.index')->with('success', __('app.admin.layaways.notifications.created'));
        });
    }

    public function show(Request $request, Layaway $layaway)
    {
        if (!$request->user() || !$request->user()->can('view credits')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.layaways.permissions.view_denied'));
        }

        $layaway->load(['customer','items.product']);

        return Inertia::render('Admin/Layaway/Show', [
            'layaway' => $layaway,
        ]);
    }

    public function update(Request $request, Layaway $layaway, AdminNotificationService $notificationService)
    {
        if (!$request->user() || !$request->user()->can('manage credits')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.layaways.permissions.update_denied'));
        }

        $data = $request->validate([
            'status' => ['required','in:active,completed,cancelled,expired'],
        ]);

        $oldStatus = $layaway->status;
        $layaway->status = $data['status'];
        $layaway->save();

        if ($oldStatus !== $layaway->status) {
            $notificationService->notifyStaff(
                'layaway_status_changed',
                'Apartado '.$layaway->number.' actualizado',
                'Estado: '.$oldStatus.' -> '.$layaway->status,
                [
                    'severity' => $layaway->status === 'completed' ? 'success' : 'warning',
                    'action_url' => route('admin.layaways.show', $layaway->id),
                    'action_label' => 'Ver apartado',
                    'dedupe_key' => 'layaway_status_changed:'.$layaway->id.':'.$layaway->status,
                    'data' => [
                        'layaway_id' => $layaway->id,
                        'old_status' => $oldStatus,
                        'new_status' => $layaway->status,
                    ],
                ]
            );
        }

        return redirect()->route('admin.layaways.show', $layaway->id)->with('success', __('app.admin.layaways.notifications.updated'));
    }
}
