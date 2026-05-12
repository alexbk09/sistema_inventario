<?php

namespace App\Http\Controllers;

use App\Mail\InvoiceCreated;
use App\Models\{Coupon, CreditMovement, Customer, Invoice, InvoiceContact, InvoiceItem, InvoicePayment, InvoiceStatus, MovementType, PaymentGatewayTransaction, Product};
use App\Services\{AdminMoneyService, AdminNotificationService, CurrencyService, InventoryService};
use App\Services\PayPalService;
use App\Services\StripeService;
use App\Support\CurrencySettings;
use App\Support\Settings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    public function index(CurrencyService $currency)
    {
        $rate = $currency->getPromedio('oficial') ?? (float) config('currency.bs_rate', 0);
        $payments = $this->paymentSettings();
        $payments = $this->publicPaymentConfiguration($payments);
        $checkoutCurrencies = $this->checkoutCurrencies();

        $customer = null;
        if (auth()->check()) {
            $customer = \App\Models\Customer::where('user_id', auth()->id())->first();
        }

        return Inertia::render('Checkout/Index', [
            'rate' => $rate,
            'payments' => $payments,
            'checkoutCurrencies' => $checkoutCurrencies,
            'defaultCheckoutCurrency' => $checkoutCurrencies[0]['code'] ?? 'USD',
            'customer' => $customer ? [
                'fullName' => $customer->name,
                'identification_type_id' => $customer->identification_type_id,
                'identification' => $customer->identification,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'address' => $customer->address,
                'city' => $customer->city ?? '',
                'postal_code' => $customer->postal_code ?? '',
            ] : null,
        ]);
    }

    public function store(Request $request, CurrencyService $currency, InventoryService $inventory, AdminNotificationService $notificationService, AdminMoneyService $adminMoneyService)
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
            'checkoutCurrency' => ['required','string','max:10'],
            'bank' => ['nullable','string','max:100'],
            'originBank' => ['nullable','string','max:100'],
            'reference' => ['nullable','string','max:100'],
            'date' => ['nullable','date'],
            'rateBs' => ['nullable','numeric'],
            'coupon_code' => ['nullable','string','max:50'],
            'paypalOrderId' => ['nullable','string','max:255'],
            'paypalCaptureId' => ['nullable','string','max:255'],
            'stripePaymentIntentId' => ['nullable','string','max:255'],
            'items' => ['required','array','min:1'],
            'items.*.product_id' => ['required','exists:products,id'],
            'items.*.quantity' => ['required','integer','min:1'],
            'items.*.price_usd' => ['nullable','numeric'],
        ]);

        $payments = $this->paymentSettings();
        $methods = collect($payments['methods'] ?? []);
        $selectedMethod = (string) ($payload['paymentMethod'] ?? '');
        $methodConfig = $methods->get($selectedMethod);

        if (!is_array($methodConfig) || empty($methodConfig['enabled'])) {
            return back()->withErrors([
                'paymentMethod' => 'El metodo de pago seleccionado no esta disponible actualmente.',
            ])->withInput();
        }

        if ($selectedMethod === 'manual') {
            foreach (['bank', 'originBank', 'reference', 'date'] as $field) {
                if (empty($payload[$field])) {
                    return back()->withErrors([
                        $field => 'Este campo es obligatorio para pagos manuales.',
                    ])->withInput();
                }
            }
        }

        if ($selectedMethod === 'paypal') {
            foreach (['paypalOrderId', 'paypalCaptureId'] as $field) {
                if (empty($payload[$field])) {
                    return back()->withErrors([
                        $field => 'Debes completar y capturar el pago con PayPal antes de confirmar.',
                    ])->withInput();
                }
            }
        }

        if ($selectedMethod === 'stripe' && empty($payload['stripePaymentIntentId'])) {
            return back()->withErrors([
                'stripePaymentIntentId' => 'Debes completar y verificar el pago con Stripe antes de confirmar.',
            ])->withInput();
        }

        // Costos/Impuestos (deben coincidir con el frontend)
        $shippingUsd = 200.0;
        $taxRate = 0.15;

        return DB::transaction(function () use ($payload, $currency, $inventory, $shippingUsd, $taxRate, $methodConfig, $selectedMethod) {
            $rate = isset($payload['rateBs']) ? (float) $payload['rateBs'] : null;
            $verifiedGatewayTransaction = null;
            $checkoutCurrency = $this->resolveCheckoutCurrency((string) ($payload['checkoutCurrency'] ?? 'USD'));

            if ($selectedMethod === 'paypal') {
                $verifiedGatewayTransaction = PaymentGatewayTransaction::query()
                    ->where('provider', 'paypal')
                    ->where('payment_method', 'paypal')
                    ->where('external_order_id', $payload['paypalOrderId'])
                    ->where('external_capture_id', $payload['paypalCaptureId'])
                    ->where('status', 'COMPLETED')
                    ->first();

                if (! $verifiedGatewayTransaction) {
                    return back()->withErrors([
                        'paymentMethod' => 'La captura de PayPal no pudo validarse en el servidor.',
                    ])->withInput();
                }

                if ($verifiedGatewayTransaction->invoice_id) {
                    return back()->withErrors([
                        'paymentMethod' => 'Esa captura de PayPal ya fue asociada a otra factura.',
                    ])->withInput();
                }
            }

            if ($selectedMethod === 'stripe') {
                $verifiedGatewayTransaction = PaymentGatewayTransaction::query()
                    ->where('provider', 'stripe')
                    ->where('payment_method', 'stripe')
                    ->where('external_order_id', $payload['stripePaymentIntentId'])
                    ->where('external_capture_id', $payload['stripePaymentIntentId'])
                    ->where('status', 'succeeded')
                    ->first();

                if (! $verifiedGatewayTransaction) {
                    return back()->withErrors([
                        'paymentMethod' => 'El pago con Stripe no pudo validarse en el servidor.',
                    ])->withInput();
                }

                if ($verifiedGatewayTransaction->invoice_id) {
                    return back()->withErrors([
                        'paymentMethod' => 'Ese pago de Stripe ya fue asociado a otra factura.',
                    ])->withInput();
                }
            }

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

            $currencySettings = $this->currencySettings();
            $enabledCurrencyContext = $adminMoneyService->getEnabledCurrencyContext($currencySettings);
            $documentSnapshot = $adminMoneyService->buildSnapshot(
                $enabledCurrencyContext['rates'] ?? [],
                $enabledCurrencyContext['base_currency'] ?? 'USD',
                now()->toIso8601String(),
            );

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
            $invoice->currency_code = $checkoutCurrency;
            $invoice->base_currency_code = $documentSnapshot['base_currency'] ?? 'USD';
            $invoice->exchange_rate_snapshot = $checkoutCurrency === ($documentSnapshot['base_currency'] ?? 'USD')
                ? 1
                : (float) ($documentSnapshot['rates'][$checkoutCurrency] ?? null);
            $invoice->exchange_rate_source = $adminMoneyService->resolveCurrencyRateSource($checkoutCurrency, $currencySettings) ?? 'manual';
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
                $unitPriceOriginal = $adminMoneyService->convertUsingSnapshot($priceUsd, $checkoutCurrency, $documentSnapshot);
                $subtotalOriginal = $adminMoneyService->convertUsingSnapshot($subtotalUsd, $checkoutCurrency, $documentSnapshot);

                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'product_id' => $product->id,
                    'quantity' => $qty,
                    'price_usd' => $priceUsd,
                    'subtotal_usd' => $subtotalUsd,
                    'subtotal_bs' => $subtotalBs,
                    'unit_currency_code' => $checkoutCurrency,
                    'unit_price_original' => $unitPriceOriginal,
                    'subtotal_original' => $subtotalOriginal,
                    'exchange_rate_snapshot' => $checkoutCurrency === ($documentSnapshot['base_currency'] ?? 'USD')
                        ? 1
                        : (float) ($documentSnapshot['rates'][$checkoutCurrency] ?? null),
                    'monetary_breakdown_json' => $adminMoneyService->buildDocumentTotals($subtotalUsd, $currencySettings, $documentSnapshot),
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
                default => ((float) ($methodConfig['fee_percent'] ?? 0)) / 100,
            };
            $baseForFees = max(0, $itemsTotalUsd - $discountUsd);
            $paymentFeeUsd = round($baseForFees * $paymentFeeRate, 2);

            // Impuestos y total
            $taxUsd = round($baseForFees * $taxRate, 2);
            $totalUsd = $baseForFees + $taxUsd + $shippingUsd + $paymentFeeUsd;
            $totalBs = $rate !== null
                ? round($totalUsd * $rate, 2)
                : $currency->usdToBs($totalUsd);
            [$chargedAmount, $chargedRate] = $this->convertUsdAmount($currency, $totalUsd, $checkoutCurrency);

            if ($verifiedGatewayTransaction
                && (
                    strtoupper((string) $verifiedGatewayTransaction->currency) !== $checkoutCurrency
                    || round((float) $verifiedGatewayTransaction->amount, 2) !== round($chargedAmount, 2)
                )) {
                return back()->withErrors([
                    'paymentMethod' => 'El monto validado por la pasarela no coincide con el total actual del pedido.',
                ])->withInput();
            }

            $invoice->update([
                'total_usd' => $totalUsd,
                'total_bs' => $totalBs,
                'currency_code' => $checkoutCurrency,
                'base_currency_code' => $documentSnapshot['base_currency'] ?? 'USD',
                'exchange_rate_snapshot' => $chargedRate,
                'exchange_rate_source' => $adminMoneyService->resolveCurrencyRateSource($checkoutCurrency, $currencySettings) ?? 'manual',
                'monetary_totals_json' => [
                    'original_currency' => $checkoutCurrency,
                    'original_amount' => round($chargedAmount, 2),
                    ...$adminMoneyService->buildDocumentTotals($totalUsd, $currencySettings, $documentSnapshot),
                ],
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
                'bank' => $payload['bank'] ?: ($methodConfig['label'] ?? strtoupper($payload['paymentMethod'])),
                'origin_bank' => $payload['originBank'] ?: ($payload['paymentMethod'] === 'paypal' ? 'PayPal' : ($payload['bank'] ?: 'N/A')),
                'reference' => $payload['reference'] ?: ($payload['paypalCaptureId'] ?? $payload['paypalOrderId'] ?? 'N/A'),
                'payment_date' => $payload['date'] ?: now()->toDateString(),
            ]);

            InvoicePayment::create([
                'invoice_id' => $invoice->id,
                'method' => $payload['paymentMethod'],
                'amount_usd' => $totalUsd,
                'amount_bs' => $totalBs,
                'payment_currency_code' => $checkoutCurrency,
                'amount_original' => round($chargedAmount, 2),
                'amount_base' => $totalUsd,
                'exchange_rate_snapshot' => $chargedRate,
                'exchange_rate_source' => $adminMoneyService->resolveCurrencyRateSource($checkoutCurrency, $currencySettings) ?? 'manual',
                'reference' => $payload['reference'] ?: ($payload['paypalCaptureId'] ?? $payload['paypalOrderId'] ?? null),
                'bank' => $payload['bank'] ?: ($payload['paymentMethod'] === 'paypal' ? 'PayPal' : ($payload['paymentMethod'] === 'stripe' ? 'Stripe' : null)),
                'notes' => $payload['paymentMethod'] === 'paypal'
                    ? 'Orden PayPal: '.($payload['paypalOrderId'] ?? 'N/A').' | Moneda: '.$checkoutCurrency.' | Tasa: '.number_format($chargedRate, 6, '.', '')
                    : ($payload['paymentMethod'] === 'stripe'
                        ? 'Payment Intent Stripe: '.($payload['stripePaymentIntentId'] ?? 'N/A').' | Moneda: '.$checkoutCurrency.' | Tasa: '.number_format($chargedRate, 6, '.', '')
                        : 'Moneda de cobro: '.$checkoutCurrency.' | Tasa: '.number_format($chargedRate, 6, '.', '')),
            ]);

            if ($verifiedGatewayTransaction) {
                $verifiedGatewayTransaction->forceFill([
                    'invoice_id' => $invoice->id,
                    'consumed_at' => now(),
                ])->save();

                $this->markInvoiceAsPaid($invoice, $inventory);
            } elseif ($payload['paymentMethod'] === 'manual') {
                $customerName = $invoice->customer?->name ?: $contact->full_name;
                $reference = $contact->reference;
                $message = 'Factura pendiente por pago manual / '.$notificationService->formatDocumentAmount(
                    'Total',
                    $invoice->currency_code,
                    $invoice->total_usd,
                    is_array($invoice->monetary_totals_json) ? $invoice->monetary_totals_json : null,
                );

                if ($customerName) {
                    $message .= ' / Cliente: '.$customerName;
                }

                if ($reference && $reference !== 'N/A') {
                    $message .= ' / Ref: '.$reference;
                }

                $notificationService->notifyStaff(
                    'manual_checkout_payment_pending',
                    'Validar pago manual: '.$invoice->number,
                    $message,
                    [
                        'severity' => 'warning',
                        'action_url' => route('admin.invoices.index'),
                        'action_label' => 'Revisar facturas',
                        'dedupe_key' => 'manual_checkout_payment_pending:invoice:'.$invoice->id,
                        'data' => [
                            'invoice_id' => $invoice->id,
                            'invoice_number' => $invoice->number,
                            'payment_method' => 'manual',
                        ],
                    ]
                );
            }

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
            'message' => __('app.confirmation.default_message'),
            'publicUrl' => $publicUrl,
            'qrUrl' => $invoiceId ? route('qr.invoice', ['invoice' => $invoiceId]) : null,
            'invoiceNumber' => $invoiceNumber,
        ]);
    }

    public function createPayPalOrder(Request $request, PayPalService $payPalService): JsonResponse
    {
        $payload = $request->validate([
            'paymentMethod' => ['required', 'in:paypal'],
            'checkoutCurrency' => ['required', 'string', 'max:10'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        if (! $payPalService->isEnabled()) {
            return response()->json(['message' => __('app.checkout.error_paypal_unavailable')], 422);
        }

        $payments = $this->paymentSettings();
        $methodConfig = $payments['methods']['paypal'] ?? [];

        if (empty($methodConfig['enabled'])) {
            return response()->json(['message' => __('app.checkout.error_paypal_disabled')], 422);
        }

        try {
            [$itemsTotalUsd, $discountUsd] = $this->resolveCartAmounts($payload);
            $baseForFees = max(0, $itemsTotalUsd - $discountUsd);
            $paymentFeeUsd = round($baseForFees * (((float) ($methodConfig['fee_percent'] ?? 0)) / 100), 2);
            $taxUsd = round($baseForFees * 0.15, 2);
            $totalUsd = $baseForFees + $taxUsd + 200.0 + $paymentFeeUsd;
            $checkoutCurrency = $this->resolveCheckoutCurrency((string) ($payload['checkoutCurrency'] ?? 'USD'));
            [$chargedAmount] = $this->convertUsdAmount(app(CurrencyService::class), $totalUsd, $checkoutCurrency);

            $general = Settings::get('general', ['company_name' => config('app.name')]);
            $order = $payPalService->createOrder($chargedAmount, $checkoutCurrency, [
                'brand_name' => $general['company_name'] ?? config('app.name'),
                'description' => 'Pedido en checkout',
                'custom_id' => 'checkout-'.Str::lower(Str::random(10)),
            ]);

            return response()->json([
                'orderID' => $order['id'] ?? null,
            ]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => $e->getCode() === 422 ? $e->getMessage() : __('app.checkout.error_paypal_start'),
            ], 422);
        }
    }

    public function capturePayPalOrder(Request $request, PayPalService $payPalService): JsonResponse
    {
        $payload = $request->validate([
            'paymentMethod' => ['required', 'in:paypal'],
            'orderID' => ['required', 'string', 'max:255'],
        ]);

        try {
            $capture = $payPalService->captureOrder($payload['orderID']);
            $captureId = $capture['purchase_units'][0]['payments']['captures'][0]['id'] ?? null;
            $captureStatus = (string) ($capture['status'] ?? '');

            if (! is_string($captureId) || $captureId === '') {
                return response()->json(['message' => __('app.checkout.error_paypal_invalid_capture')], 422);
            }

            if ($captureStatus !== 'COMPLETED') {
                return response()->json(['message' => __('app.checkout.error_paypal_capture_not_completed')], 422);
            }

            $captureAmount = (float) ($capture['purchase_units'][0]['payments']['captures'][0]['amount']['value'] ?? 0);
            $captureCurrency = $capture['purchase_units'][0]['payments']['captures'][0]['amount']['currency_code'] ?? 'USD';

            PaymentGatewayTransaction::updateOrCreate(
                [
                    'provider' => 'paypal',
                    'external_capture_id' => $captureId,
                ],
                [
                    'payment_method' => 'paypal',
                    'event_type' => 'capture',
                    'status' => $captureStatus,
                    'external_order_id' => $payload['orderID'],
                    'external_transaction_id' => $captureId,
                    'currency' => $captureCurrency,
                    'amount' => $captureAmount,
                    'payload' => $capture,
                    'verified_at' => now(),
                ]
            );

            return response()->json([
                'orderID' => $payload['orderID'],
                'captureID' => $captureId,
                'status' => $captureStatus,
            ]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => __('app.checkout.error_paypal_confirm')], 422);
        }
    }

    public function createStripePaymentIntent(Request $request, StripeService $stripeService): JsonResponse
    {
        $payload = $request->validate([
            'paymentMethod' => ['required', 'in:stripe'],
            'checkoutCurrency' => ['required', 'string', 'max:10'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        if (! $stripeService->isEnabled()) {
            return response()->json(['message' => __('app.checkout.error_stripe_unavailable')], 422);
        }

        $payments = $this->paymentSettings();
        $methodConfig = $payments['methods']['stripe'] ?? [];

        if (empty($methodConfig['enabled'])) {
            return response()->json(['message' => __('app.checkout.error_stripe_disabled')], 422);
        }

        try {
            [$itemsTotalUsd, $discountUsd] = $this->resolveCartAmounts($payload);
            $baseForFees = max(0, $itemsTotalUsd - $discountUsd);
            $paymentFeeUsd = round($baseForFees * (((float) ($methodConfig['fee_percent'] ?? 0)) / 100), 2);
            $taxUsd = round($baseForFees * 0.15, 2);
            $totalUsd = $baseForFees + $taxUsd + 200.0 + $paymentFeeUsd;
            $checkoutCurrency = $this->resolveCheckoutCurrency((string) ($payload['checkoutCurrency'] ?? 'USD'));
            [$chargedAmount] = $this->convertUsdAmount(app(CurrencyService::class), $totalUsd, $checkoutCurrency);

            $intent = $stripeService->createPaymentIntent($chargedAmount, strtolower($checkoutCurrency), [
                'description' => 'Pedido en checkout',
                'checkout_ref' => 'checkout-'.Str::lower(Str::random(10)),
            ]);

            return response()->json([
                'clientSecret' => $intent['client_secret'] ?? null,
                'paymentIntentId' => $intent['id'] ?? null,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => __('app.checkout.error_stripe_prepare'),
            ], 422);
        }
    }

    public function verifyStripePaymentIntent(Request $request, StripeService $stripeService): JsonResponse
    {
        $payload = $request->validate([
            'paymentMethod' => ['required', 'in:stripe'],
            'paymentIntentId' => ['required', 'string', 'max:255'],
        ]);

        try {
            $intent = $stripeService->retrievePaymentIntent($payload['paymentIntentId']);
            $status = (string) ($intent['status'] ?? '');

            if ($status !== 'succeeded') {
                return response()->json(['message' => __('app.checkout.error_stripe_not_confirmed')], 422);
            }

            $chargeId = $intent['latest_charge']['id'] ?? null;
            $amount = ((float) ($intent['amount_received'] ?? $intent['amount'] ?? 0)) / 100;
            $currency = strtoupper((string) ($intent['currency'] ?? 'USD'));

            PaymentGatewayTransaction::updateOrCreate(
                [
                    'provider' => 'stripe',
                    'external_capture_id' => $payload['paymentIntentId'],
                ],
                [
                    'payment_method' => 'stripe',
                    'event_type' => 'payment_intent',
                    'status' => $status,
                    'external_order_id' => $payload['paymentIntentId'],
                    'external_transaction_id' => $chargeId,
                    'currency' => $currency,
                    'amount' => $amount,
                    'payload' => $intent,
                    'verified_at' => now(),
                ]
            );

            return response()->json([
                'paymentIntentId' => $payload['paymentIntentId'],
                'status' => $status,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => __('app.checkout.error_stripe_verify')], 422);
        }
    }

    protected function publicPaymentConfiguration(array $payments): array
    {
        $methods = collect($payments['methods'] ?? [])->map(function (array $method, string $key) {
            if ($key === 'paypal') {
                unset($method['client_secret']);
            }

            if ($key === 'stripe') {
                unset($method['secret_key']);
            }

            return $method;
        })->all();

        return [
            'methods' => $methods,
            'bank_accounts' => array_values(array_filter(
                $payments['bank_accounts'] ?? [],
                fn ($account) => ($account['enabled'] ?? true) === true
            )),
            'origin_banks' => array_values(array_filter(
                $payments['origin_banks'] ?? [],
                fn ($bank) => ($bank['enabled'] ?? true) === true
            )),
        ];
    }

    protected function paymentSettings(): array
    {
        $defaults = [
            'methods' => [
                'manual' => [
                    'enabled' => true,
                    'label' => 'Transferencia bancaria',
                    'description' => 'Paga con transferencia o deposito y comparte tu referencia.',
                    'instructions' => 'Selecciona una cuenta bancaria, realiza tu pago y registra los datos de la transferencia.',
                    'fee_percent' => 0,
                ],
                'paypal' => [
                    'enabled' => false,
                    'label' => 'PayPal',
                    'description' => 'Configura PayPal en administracion para habilitarlo en checkout.',
                    'client_id' => null,
                    'client_secret' => null,
                    'environment' => 'sandbox',
                    'instructions' => 'Cuando este activo, los clientes podran continuar con PayPal.',
                    'fee_percent' => 0,
                ],
                'stripe' => [
                    'enabled' => false,
                    'label' => 'Stripe',
                    'description' => 'Paga con tarjeta internacional desde un formulario seguro.',
                    'publishable_key' => null,
                    'secret_key' => null,
                    'environment' => 'test',
                    'instructions' => 'Cuando este activo, podras pagar con tarjeta sin salir del checkout.',
                    'fee_percent' => 0,
                ],
            ],
            'bank_accounts' => [],
            'origin_banks' => [],
        ];

        return array_replace_recursive($defaults, Settings::get('payments', $defaults) ?? []);
    }

    protected function resolveCartAmounts(array $payload): array
    {
        $itemsTotalUsd = 0.0;

        foreach ($payload['items'] as $item) {
            $product = Product::findOrFail($item['product_id']);
            $itemsTotalUsd += ((float) $product->price_usd) * ((int) $item['quantity']);
        }

        $discountUsd = 0.0;
        if (! empty($payload['coupon_code'] ?? null)) {
            $code = strtoupper(trim($payload['coupon_code']));
            $coupon = Coupon::where('code', $code)->where('active', true)->first();

            if (! $coupon) {
                abort(422, 'El cupón ingresado no es válido.');
            }

            $now = now();
            if (($coupon->valid_from && $now->lt($coupon->valid_from)) ||
                ($coupon->valid_until && $now->gt($coupon->valid_until))) {
                abort(422, 'El cupón no está vigente.');
            }

            if ($coupon->max_uses !== null && $coupon->uses >= $coupon->max_uses) {
                abort(422, 'El cupón ha alcanzado el número máximo de usos.');
            }

            if ($coupon->min_amount_usd !== null && $itemsTotalUsd < $coupon->min_amount_usd) {
                abort(422, 'El total de la compra no cumple el mínimo para usar este cupón.');
            }

            $discountUsd = $coupon->type === 'percent'
                ? round($itemsTotalUsd * ($coupon->value / 100), 2)
                : min($itemsTotalUsd, (float) $coupon->value);
        }

        return [$itemsTotalUsd, $discountUsd];
    }

    protected function currencySettings(): array
    {
        return CurrencySettings::normalize(Settings::get('currency', CurrencySettings::defaults()));
    }

    protected function checkoutCurrencies(): array
    {
        $settings = $this->currencySettings();

        return array_values(array_map(
            fn (array $currency) => [
                'code' => $currency['code'],
                'name' => $currency['name'],
                'symbol' => $currency['symbol'],
            ],
            array_filter(
                $settings['supported_currencies'] ?? [],
                fn (array $currency) => (bool) ($currency['enabled'] ?? false) && (bool) ($currency['allow_checkout'] ?? false)
            )
        ));
    }

    protected function resolveCheckoutCurrency(string $requestedCurrency): string
    {
        $allowed = array_map(fn (array $currency) => $currency['code'], $this->checkoutCurrencies());
        $requestedCurrency = strtoupper(trim($requestedCurrency));

        if (in_array($requestedCurrency, $allowed, true)) {
            return $requestedCurrency;
        }

        return $allowed[0] ?? 'USD';
    }

    protected function convertUsdAmount(CurrencyService $currencyService, float $amountUsd, string $targetCurrency): array
    {
        $targetCurrency = strtoupper($targetCurrency);
        if ($targetCurrency === 'USD') {
            return [round($amountUsd, 2), 1.0];
        }

        $configured = $currencyService->getConfiguredExchangeRates($this->currencySettings());
        $rate = (float) ($configured['rates'][$targetCurrency] ?? 0);

        if ($rate <= 0) {
            throw ValidationException::withMessages([
                'checkoutCurrency' => 'No hay una tasa válida para la moneda seleccionada en checkout.',
            ]);
        }

        return [round($amountUsd * $rate, 2), $rate];
    }

    protected function markInvoiceAsPaid(Invoice $invoice, InventoryService $inventory): void
    {
        if ($invoice->status === 'paid') {
            return;
        }

        $invoice->status = 'paid';

        $paidStatus = InvoiceStatus::where('code', 'paid')->first();
        if ($paidStatus) {
            $invoice->invoice_status_id = $paidStatus->id;
        }

        $invoice->save();

        $movementType = MovementType::where('code', 'sale')->first();

        $invoice->loadMissing('items.product', 'customer', 'creditAccount');

        foreach ($invoice->items as $item) {
            if (! $item->product) {
                continue;
            }

            $inventory->registerExit(
                $item->product,
                (int) $item->quantity,
                (float) $item->price_usd,
                $movementType?->id,
                $invoice->number,
                'Salida por pago confirmado en checkout',
                $invoice->warehouse_id
            );
        }

        if (! $invoice->customer_id) {
            return;
        }

        $customer = $invoice->customer;
        if ($customer) {
            $pointsToAdd = (int) floor($invoice->total_usd ?? 0);
            $customer->loyalty_points = (int) ($customer->loyalty_points ?? 0) + $pointsToAdd;
            $customer->lifetime_spent_usd = (float) ($customer->lifetime_spent_usd ?? 0) + (float) ($invoice->total_usd ?? 0);
            $customer->last_purchase_at = now();
            $customer->save();
        }

        if (! $invoice->credit_account_id) {
            return;
        }

        $account = $invoice->creditAccount;
        if (! $account) {
            return;
        }

        CreditMovement::create([
            'credit_account_id' => $account->id,
            'invoice_id' => $invoice->id,
            'type' => 'payment',
            'amount_usd' => $invoice->total_usd,
            'amount_original' => (float) ($invoice->monetary_totals_json['original_amount'] ?? $invoice->total_usd),
            'currency_code' => (string) ($invoice->currency_code ?: 'USD'),
            'base_currency_code' => (string) ($invoice->base_currency_code ?: 'USD'),
            'exchange_rate_snapshot' => (float) ($invoice->exchange_rate_snapshot ?? 1),
            'exchange_rate_source' => $invoice->exchange_rate_source,
            'monetary_totals_json' => is_array($invoice->monetary_totals_json) ? $invoice->monetary_totals_json : null,
            'description' => 'Abono automático por factura '.$invoice->number,
            'paid_at' => now(),
        ]);

        $account->balance_usd = (float) $account->balance_usd - (float) $invoice->total_usd;
        $account->save();
    }
}
