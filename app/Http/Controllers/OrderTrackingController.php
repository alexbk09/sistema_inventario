<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Inertia\Inertia;

class OrderTrackingController extends Controller
{
    public function show(Invoice $invoice)
    {
        return Inertia::render('Checkout/Confirmation', [
            'message' => 'Detalle de tu pedido',
            'invoiceNumber' => $invoice->number,
            'publicUrl' => url()->current(),
        ]);
    }
}
