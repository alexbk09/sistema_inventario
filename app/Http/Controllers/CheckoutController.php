<?php

namespace App\Http\Controllers;

use App\Models\{Invoice, InvoiceItem, Product, InvoiceContact, Customer, InvoiceStatus, Coupon};
use App\Services\CurrencyService;
use App\Mail\InvoiceCreated;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    public function index(CurrencyService $currency)
    {
        $rate = $currency->getPromedio('oficial') ?? (float) config('currency.bs_rate', 0);

        return Inertia::render('Checkout/Index', [
            'rate' => $rate,
        ]);
    }

    public function store(Request $request, CurrencyService $currency)
    {
        $payload = $request->validate([
            'fullName' => ['required','string','max:255'],
            'identification_type_id' => ['required','exists:identification_types,id'],
            'identification' => ['required','string','max:50'],
            'email' => ['required','email','max:255'],
            'phone' => ['nullable','string','max:50'],
            'address' => ['required','string','max:255'],
            'city' => ['nullable','string','max:100'],
            'zipCode' => ['nullable','string','max:20'],
            'paymentMethod' => ['required','string','max:100'],
            'bank' => ['required','string','max:100'],
            'originBank' => ['required','string','max:100'],
            'reference' => ['required','string','max:100'],
            'date' => ['required','date'],
            'rateBs' => ['nullable','numeric'],
            'coupon_code' => ['nullable','string','max:50'],
            'items' => ['required','array','min:1'],
            'items.*.product_id' => ['required','exists:products,id'],
            'items.*.quantity' => ['required','integer','min:1'],
            'items.*.price_usd' => ['nullable','numeric'],
        ]);

        // Costos/Impuestos (deben coincidir con el frontend)
        $shippingUsd = 200.0;
        $taxRate = 0.15;

        return DB::transaction(function () use ($payload, $currency, $shippingUsd, $taxRate) {
            $rate = isset($payload['rateBs']) ? (float) $payload['rateBs'] : null;
            // Cliente asociado (CRM)
            $customer = Customer::firstOrCreate(
                ['email' => $payload['email']],
                [
                    'name' => $payload['fullName'],
                    'phone' => $payload['phone'] ?? null,
                    'address' => $payload['address'],
                    'user_id' => auth()->id(),
                    'identification_type_id' => $payload['identification_type_id'],
                    'identification' => $payload['identification'],
                ]
            );

            // Si ya existía, actualizamos identificación en caso de venir vacía anteriormente
            if (!$customer->wasRecentlyCreated) {
                $customer->identification_type_id = $payload['identification_type_id'];
                $customer->identification = $payload['identification'];
                $customer->save();
            }

            // Crear factura base
            $invoice = new Invoice();
            $invoice->number = 'INV-'.Str::upper(Str::random(8));
            $invoice->status = 'pending';
            $invoice->customer_id = $customer?->id;

            $pendingStatus = InvoiceStatus::where('code', 'pending')->first();
            if ($pendingStatus) {
                $invoice->invoice_status_id = $pendingStatus->id;
            }

            $invoice->total_usd = 0;
            $invoice->total_bs = 0;
            $invoice->save();

            // Items
            $itemsTotalUsd = 0.0;
            foreach ($payload['items'] as $it) {
                $product = Product::findOrFail($it['product_id']);
                $qty = (int) $it['quantity'];
                // Validar stock
                if ($qty > $product->stock) {
                    return back()->withErrors(['items' => "No hay stock suficiente para {$product->name}" ]);
                }

                $priceUsd = isset($it['price_usd']) ? (float) $it['price_usd'] : (float) $product->price_usd;
                $subtotalUsd = $priceUsd * $qty;
                $subtotalBs = $rate !== null
                    ? round($subtotalUsd * $rate, 2)
                    : $currency->usdToBs($subtotalUsd);

                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'product_id' => $product->id,
                    'quantity' => $qty,
                    'price_usd' => $priceUsd,
                    'subtotal_usd' => $subtotalUsd,
                    'subtotal_bs' => $subtotalBs,
                ]);

                $itemsTotalUsd += $subtotalUsd;
            }

            // Cupón de descuento (si aplica)
            $discountUsd = 0.0;
            if (!empty($payload['coupon_code'] ?? null)) {
                $code = strtoupper(trim($payload['coupon_code']));
                $coupon = Coupon::where('code', $code)->where('active', true)->first();

                if (!$coupon) {
                    return back()->withErrors(['coupon_code' => 'El cupón ingresado no es válido.'])->withInput();
                }

                $now = now();
                if (($coupon->valid_from && $now->lt($coupon->valid_from)) ||
                    ($coupon->valid_until && $now->gt($coupon->valid_until))) {
                    return back()->withErrors(['coupon_code' => 'El cupón no está vigente.'])->withInput();
                }

                if ($coupon->max_uses !== null && $coupon->uses >= $coupon->max_uses) {
                    return back()->withErrors(['coupon_code' => 'El cupón ha alcanzado el número máximo de usos.'])->withInput();
                }

                if ($coupon->min_amount_usd !== null && $itemsTotalUsd < $coupon->min_amount_usd) {
                    return back()->withErrors(['coupon_code' => 'El total de la compra no cumple el mínimo para usar este cupón.'])->withInput();
                }

                if ($coupon->type === 'percent') {
                    $discountUsd = round($itemsTotalUsd * ($coupon->value / 100), 2);
                } else {
                    $discountUsd = min($itemsTotalUsd, (float) $coupon->value);
                }

                $coupon->increment('uses');
            }

            // Recargo/descuento por método de pago
            $paymentFeeRate = match ($payload['paymentMethod']) {
                'pago-movil' => 0.02,
                default => 0.0,
            };
            $baseForFees = max(0, $itemsTotalUsd - $discountUsd);
            $paymentFeeUsd = round($baseForFees * $paymentFeeRate, 2);

            // Impuestos y total
            $taxUsd = round($baseForFees * $taxRate, 2);
            $totalUsd = $baseForFees + $taxUsd + $shippingUsd + $paymentFeeUsd;
            $totalBs = $rate !== null
                ? round($totalUsd * $rate, 2)
                : $currency->usdToBs($totalUsd);

            $invoice->update([
                'total_usd' => $totalUsd,
                'total_bs' => $totalBs,
            ]);

            // Datos de contacto asociados
            $contact = InvoiceContact::create([
                'invoice_id' => $invoice->id,
                'full_name' => $payload['fullName'],
                'email' => $payload['email'],
                'phone' => $payload['phone'] ?? null,
                'address' => $payload['address'],
                'city' => $payload['city'] ?? null,
                'zip_code' => $payload['zipCode'] ?? null,
                'payment_method' => $payload['paymentMethod'],
                'bank' => $payload['bank'],
                'origin_bank' => $payload['originBank'],
                'reference' => $payload['reference'],
                'payment_date' => $payload['date'],
            ]);

            // Notificación por correo (cliente + correo de la empresa si está configurado)
            try {
                $to = $contact->email;

                if ($to) {
                    Mail::to($to)->queue(new InvoiceCreated($invoice));
                }

                $general = \App\Support\Settings::get('general', [
                    'email' => null,
                ]);

                if (!empty($general['email']) && $general['email'] !== $to) {
                    Mail::to($general['email'])->queue(new InvoiceCreated($invoice));
                }
            } catch (\Throwable $e) {
                // No interrumpir el checkout si el correo falla
                report($e);
            }

            // Respuesta: redirigir a confirmación
            return redirect()->route('checkout.confirmation')->with([
                'invoice_number' => $invoice->number,
                'invoice_id' => $invoice->id,
            ]);
        });
    }

    public function confirmation()
    {
        $invoiceId = session('invoice_id');
        $invoiceNumber = session('invoice_number');

        $publicUrl = null;
        if ($invoiceId) {
            $publicUrl = route('order.track', ['invoice' => $invoiceId]);
        }

        return Inertia::render('Checkout/Confirmation', [
            'message' => 'Tu pedido fue registrado. ¡Gracias!',
            'publicUrl' => $publicUrl,
            'qrUrl' => $invoiceId ? route('qr.invoice', ['invoice' => $invoiceId]) : null,
            'invoiceNumber' => $invoiceNumber,
        ]);
    }
}
