<?php

namespace Database\Seeders;

use App\Support\Settings;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        Settings::set('general', [
            'company_name' => 'Mi Empresa de Inventario',
            'trade_name' => 'Mi Tienda',
            'tax_id' => 'J-00000000-0',
            'email' => 'info@example.com',
            'phone' => '+58 000-0000000',
            'whatsapp' => '+58 000-0000000',
            'facebook_url' => 'https://facebook.com',
            'instagram_url' => 'https://instagram.com',
            'twitter_url' => 'https://twitter.com',
        ]);

        Settings::set('location', [
            'address' => 'Calle Principal, Centro Comercial X, Local 1',
            'city' => 'Caracas',
            'state' => 'Distrito Capital',
            'country' => 'Venezuela',
            'google_maps_url' => null,
        ]);

        Settings::set('branding', [
            'logo_url' => null,
            'logo_dark_url' => null,
            'favicon_url' => null,
            'primary_color' => '#0f172a',
            'secondary_color' => '#38bdf8',
        ]);

        Settings::set('billing', [
            'invoice_prefix' => 'F-',
            'invoice_length' => 8,
            'default_tax_percent' => 16,
            'enable_igtf' => false,
        ]);

        Settings::set('currency', [
            'base_currency' => 'USD',
            'secondary_currency' => 'VES',
            'rate_source' => 'dolarapi',
        ]);

        Settings::set('store', [
            'home_title' => 'Tienda en línea',
            'home_subtitle' => 'Inventario y facturación fáciles',
            'contact_text' => 'Contáctanos para pedidos al mayor y detal.',
        ]);

        Settings::set('inventory', [
            'allow_negative_stock' => false,
            'default_min_stock' => 0,
        ]);

        Settings::set('warehouses', [
            'require_warehouse_on_invoice' => false,
            'default_warehouse_id' => null,
        ]);

        Settings::set('security', [
            'min_password_length' => 8,
            'max_failed_logins' => 5,
            'enable_two_factor' => false,
        ]);

        Settings::set('qr', [
            'invoice_base_url' => null,
            'product_base_url' => null,
            'whatsapp_contact_url' => null,
        ]);
    }
}
