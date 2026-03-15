<?php

namespace App\Http\Controllers;

use App\Support\Settings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use App\Models\Warehouse;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(): Response
    {
        $general = Settings::get('general', [
            'company_name' => config('app.name', 'Sistema Inventario'),
            'trade_name' => null,
            'tax_id' => null,
            'email' => null,
            'phone' => null,
            'whatsapp' => null,
        ]);

        $location = Settings::get('location', [
            'address' => null,
            'city' => null,
            'state' => null,
            'country' => null,
            'google_maps_url' => null,
        ]);

        $branding = Settings::get('branding', [
            'logo_url' => null,
            'logo_dark_url' => null,
            'favicon_url' => null,
            'primary_color' => '#0f172a',
            'secondary_color' => '#38bdf8',
        ]);

        $billing = Settings::get('billing', [
            'invoice_prefix' => 'F-',
            'invoice_length' => 8,
            'default_tax_percent' => 0,
            'enable_igtf' => false,
        ]);

        $currency = Settings::get('currency', [
            'base_currency' => 'USD',
            'secondary_currency' => 'VES',
            'rate_source' => 'dolarapi',
        ]);

        $store = Settings::get('store', [
            'home_title' => 'Tienda',
            'home_subtitle' => null,
            'contact_text' => null,
        ]);

        $inventory = Settings::get('inventory', [
            'allow_negative_stock' => false,
            'default_min_stock' => 0,
        ]);

        $warehousesConfig = Settings::get('warehouses', [
            'require_warehouse_on_invoice' => false,
            'default_warehouse_id' => null,
        ]);

        $security = Settings::get('security', [
            'min_password_length' => 8,
            'max_failed_logins' => 5,
            'enable_two_factor' => false,
        ]);

        $qr = Settings::get('qr', [
            'invoice_base_url' => null,
            'product_base_url' => null,
            'whatsapp_contact_url' => null,
        ]);

        $mail = Settings::get('mail', [
            'invoice_subject_prefix' => 'Factura',
            'footer_text' => null,
            'invoice_intro' => null,
            'invoice_button_text' => null,
        ]);

        $warehouseOptions = Warehouse::orderBy('name')->get(['id','name','code']);

        return Inertia::render('Admin/Settings/Index', [
            'general' => $general,
            'location' => $location,
            'branding' => $branding,
            'billing' => $billing,
            'currency' => $currency,
            'store' => $store,
            'inventory' => $inventory,
            'warehouses' => $warehousesConfig,
            'security' => $security,
            'qr' => $qr,
            'mail' => $mail,
            'warehouseOptions' => $warehouseOptions,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'general.company_name' => ['required', 'string', 'max:255'],
            'general.trade_name' => ['nullable', 'string', 'max:255'],
            'general.tax_id' => ['nullable', 'string', 'max:50'],
            'general.email' => ['nullable', 'email', 'max:255'],
            'general.phone' => ['nullable', 'string', 'max:50'],
            'general.whatsapp' => ['nullable', 'string', 'max:50'],

            'location.address' => ['nullable', 'string', 'max:500'],
            'location.city' => ['nullable', 'string', 'max:255'],
            'location.state' => ['nullable', 'string', 'max:255'],
            'location.country' => ['nullable', 'string', 'max:255'],
            'location.google_maps_url' => ['nullable', 'url', 'max:500'],

            'branding.logo_url' => ['nullable', 'string', 'max:500'],
            'branding.logo_dark_url' => ['nullable', 'string', 'max:500'],
            'branding.favicon_url' => ['nullable', 'string', 'max:500'],
            'branding.primary_color' => ['nullable', 'string', 'max:20'],
            'branding.secondary_color' => ['nullable', 'string', 'max:20'],

            'billing.invoice_prefix' => ['required', 'string', 'max:20'],
            'billing.invoice_length' => ['required', 'integer', 'min:4', 'max:12'],
            'billing.default_tax_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'billing.enable_igtf' => ['required', 'boolean'],

            'currency.base_currency' => ['required', 'string', 'max:10'],
            'currency.secondary_currency' => ['nullable', 'string', 'max:10'],
            'currency.rate_source' => ['required', 'string', 'max:50'],

            'store.home_title' => ['required', 'string', 'max:255'],
            'store.home_subtitle' => ['nullable', 'string', 'max:255'],
            'store.contact_text' => ['nullable', 'string', 'max:500'],

            'inventory.allow_negative_stock' => ['required', 'boolean'],
            'inventory.default_min_stock' => ['required', 'integer', 'min:0'],

            'warehouses.require_warehouse_on_invoice' => ['required', 'boolean'],
            'warehouses.default_warehouse_id' => ['nullable', 'integer', 'exists:warehouses,id'],

            'security.min_password_length' => ['required', 'integer', 'min:6', 'max:64'],
            'security.max_failed_logins' => ['required', 'integer', 'min:1', 'max:20'],
            'security.enable_two_factor' => ['required', 'boolean'],

            'qr.invoice_base_url' => ['nullable', 'url', 'max:500'],
            'qr.product_base_url' => ['nullable', 'url', 'max:500'],
            'qr.whatsapp_contact_url' => ['nullable', 'url', 'max:500'],

            'mail.invoice_subject_prefix' => ['required', 'string', 'max:100'],
            'mail.footer_text' => ['nullable', 'string', 'max:500'],
            'mail.invoice_intro' => ['nullable', 'string', 'max:500'],
            'mail.invoice_button_text' => ['nullable', 'string', 'max:100'],
        ]);

        \App\Support\Settings::set('general', $validated['general']);
        \App\Support\Settings::set('location', $validated['location']);
        \App\Support\Settings::set('branding', $validated['branding']);
        \App\Support\Settings::set('billing', $validated['billing']);
        \App\Support\Settings::set('currency', $validated['currency']);
        \App\Support\Settings::set('store', $validated['store']);
        \App\Support\Settings::set('inventory', $validated['inventory']);
        \App\Support\Settings::set('warehouses', $validated['warehouses']);
        \App\Support\Settings::set('security', $validated['security']);
        \App\Support\Settings::set('qr', $validated['qr']);
        \App\Support\Settings::set('mail', $validated['mail']);

        return back()->with('success', 'Configuración actualizada correctamente.');
    }
}
