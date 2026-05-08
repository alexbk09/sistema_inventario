<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Inertia\Inertia;

class OrderTrackingController extends Controller
{
    public function show(Invoice $invoice)
    {
        return Inertia::render('Checkout/Confirmation', [
            'message' => __('app.confirmation.order_detail_message'),
            'invoiceNumber' => $invoice->number,
            'publicUrl' => url()->current(),
        ]);
    }
}
