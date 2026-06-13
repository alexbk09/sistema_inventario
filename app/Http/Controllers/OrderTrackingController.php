<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Inertia\Inertia;

class OrderTrackingController extends Controller
{
    public function show(Invoice $invoice)
    {
        $invoice->load(['items.product', 'customer', 'payments', 'contact']);

        return Inertia::render('Checkout/Confirmation', [
            'message' => __('app.confirmation.order_detail_message'),
            'invoiceNumber' => $invoice->number,
            'invoiceId' => $invoice->id,
            'publicUrl' => url()->current(),
            'qrUrl' => route('qr.invoice', ['invoice' => $invoice->id]),
            'isPaid' => $invoice->status === 'paid' || $invoice->invoiceStatus?->code === 'paid',
            'invoice' => [
                'id' => $invoice->id,
                'number' => $invoice->number,
                'status' => $invoice->status,
                'subtotal' => $invoice->subtotal_usd,
                'tax' => $invoice->tax_usd ?? 0,
                'total' => $invoice->total_usd,
                'currency_code' => $invoice->currency_code ?? 'USD',
                'created_at' => $invoice->created_at?->toISOString(),
                'items' => $invoice->items->map(fn ($item) => [
                    'id' => $item->id,
                    'name' => $item->product?->name ?? 'Producto',
                    'quantity' => $item->quantity,
                    'price' => $item->price_usd,
                    'total' => $item->subtotal_usd,
                ]),
                'payments' => $invoice->payments->map(fn ($p) => [
                    'method' => $p->method,
                    'amount' => $p->amount_original ?? $p->amount_usd,
                    'currency' => $p->payment_currency_code ?? 'USD',
                    'reference' => $p->reference,
                    'date' => $p->paid_at?->toISOString() ?? $p->created_at?->toISOString(),
                ]),
                'customer' => [
                    'name' => $invoice->contact?->full_name ?? $invoice->customer?->name,
                    'email' => $invoice->contact?->email,
                    'phone' => $invoice->contact?->phone,
                    'address' => $invoice->contact?->address,
                    'city' => $invoice->contact?->city,
                ],
            ],
        ]);
    }
}
