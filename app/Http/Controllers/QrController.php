<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Product;
use App\Support\Settings;
use Illuminate\Http\Response as HttpResponse;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Inertia\Inertia;
use Inertia\Response;

class QrController extends Controller
{
    public function index(): Response
    {
        $invoices = Invoice::orderByDesc('id')
            ->limit(12)
            ->get(['id', 'number', 'status']);

        $products = Product::orderByDesc('id')
            ->limit(12)
            ->get(['id', 'name', 'sku', 'barcode']);

        $qr = Settings::get('qr', [
            'invoice_base_url' => null,
            'product_base_url' => null,
            'whatsapp_contact_url' => null,
        ]);

        return Inertia::render('Admin/QR/Index', [
            'invoices' => $invoices,
            'products' => $products,
            'qr' => $qr,
        ]);
    }

    public function invoice(Invoice $invoice): HttpResponse
    {
        $qrConfig = Settings::get('qr', []);
        $base = $qrConfig['invoice_base_url'] ?? null;

        if ($base) {
            $url = str_replace(
                ['{id}', '{numero}', '{number}'],
                [$invoice->id, $invoice->number, $invoice->number],
                $base
            );
        } else {
            $url = route('order.track', ['invoice' => $invoice->id]);
        }

        $image = QrCode::format('svg')
            ->size(220)
            ->margin(1)
            ->generate($url);

        return new HttpResponse($image, 200, ['Content-Type' => 'image/svg+xml']);
    }

    public function product(Product $product): HttpResponse
    {
        $qrConfig = Settings::get('qr', []);
        $base = $qrConfig['product_base_url'] ?? null;

        if ($base) {
            $url = str_replace(
                ['{id}', '{sku}', '{barcode}'],
                [$product->id, (string) $product->sku, (string) $product->barcode],
                $base
            );
        } else {
            $url = route('product.show', ['product' => $product->id]);
        }

        $image = QrCode::format('svg')
            ->size(220)
            ->margin(1)
            ->generate($url);

        return new HttpResponse($image, 200, ['Content-Type' => 'image/svg+xml']);
    }

    public function whatsapp(): HttpResponse
    {
        $qrConfig = Settings::get('qr', []);
        $whatsappUrl = $qrConfig['whatsapp_contact_url'] ?? null;

        if (! $whatsappUrl) {
            $general = Settings::get('general', [
                'whatsapp' => null,
            ]);

            $phone = $general['whatsapp'] ?? null;

            if (! $phone) {
                // Si no hay configuración, generar un QR genérico al home
                $whatsappUrl = route('home');
            } else {
                $digits = preg_replace('/[^0-9]/', '', (string) $phone);
                $whatsappUrl = 'https://wa.me/'.$digits;
            }
        }

        $image = QrCode::format('svg')
            ->size(220)
            ->margin(1)
            ->generate($whatsappUrl);

        return new HttpResponse($image, 200, ['Content-Type' => 'image/svg+xml']);
    }
}
