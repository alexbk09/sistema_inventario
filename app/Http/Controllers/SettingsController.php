<?php

namespace App\Http\Controllers;

use App\Services\CurrencyService;
use App\Support\CurrencySettings;
use App\Support\Settings;
use App\Support\TranslationKeySanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use App\Models\Warehouse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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
            'facebook_url' => null,
            'instagram_url' => null,
            'twitter_url' => null,
            'youtube_url' => null,
            'tiktok_url' => null,
            'linkedin_url' => null,
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

        $currency = CurrencySettings::normalize(Settings::get('currency', CurrencySettings::defaults()));

        $store = $this->normalizeStoreSettings(Settings::get('store', $this->defaultStoreSettings()));

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

        $paymentDefaults = [
            'methods' => [
                'manual' => [
                    'enabled' => true,
                    'label' => 'Transferencia bancaria',
                    'description' => 'Paga con transferencia o deposito y carga tu referencia.',
                    'instructions' => 'Transfiere a una de las cuentas disponibles y completa la referencia de pago.',
                    'fee_percent' => 0,
                ],
                'paypal' => [
                    'enabled' => false,
                    'label' => 'PayPal',
                    'description' => 'Habilita pagos con PayPal desde tu configuracion.',
                    'client_id' => null,
                    'client_secret' => null,
                    'environment' => 'sandbox',
                    'instructions' => 'Configura tu Client ID y Secret para habilitar PayPal.',
                    'fee_percent' => 0,
                ],
                'stripe' => [
                    'enabled' => false,
                    'label' => 'Stripe',
                    'description' => 'Acepta tarjetas internacionales con Stripe.',
                    'publishable_key' => null,
                    'secret_key' => null,
                    'environment' => 'test',
                    'instructions' => 'Configura tus llaves de Stripe para habilitar el cobro con tarjeta.',
                    'fee_percent' => 0,
                ],
            ],
            'bank_accounts' => [],
            'origin_banks' => [],
        ];
        $payments = array_replace_recursive($paymentDefaults, Settings::get('payments', $paymentDefaults) ?? []);

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
            'payments' => $payments,
            'warehouseOptions' => $warehouseOptions,
            'envPaypalConfigured' => filled(config('services.paypal.client_id')) && filled(config('services.paypal.client_secret')),
            'envStripeConfigured' => filled(config('services.stripe.publishable_key')) && filled(config('services.stripe.secret_key')),
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
            'general.facebook_url' => ['nullable', 'url', 'max:500'],
            'general.instagram_url' => ['nullable', 'url', 'max:500'],
            'general.twitter_url' => ['nullable', 'url', 'max:500'],
            'general.youtube_url' => ['nullable', 'url', 'max:500'],
            'general.tiktok_url' => ['nullable', 'url', 'max:500'],
            'general.linkedin_url' => ['nullable', 'url', 'max:500'],

            'location.address' => ['nullable', 'string', 'max:500'],
            'location.city' => ['nullable', 'string', 'max:255'],
            'location.state' => ['nullable', 'string', 'max:255'],
            'location.country' => ['nullable', 'string', 'max:255'],
            'location.google_maps_url' => ['nullable', 'url', 'max:500'],

            'branding.logo_url' => ['nullable', 'string', 'max:500'],
            'branding.logo_dark_url' => ['nullable', 'string', 'max:500'],
            'branding.favicon_url' => ['nullable', 'string', 'max:500'],
            'branding.logo_file' => ['nullable', 'file', 'image', 'max:4096'],
            'branding.logo_dark_file' => ['nullable', 'file', 'image', 'max:4096'],
            'branding.favicon_file' => ['nullable', 'file', 'image', 'max:2048'],
            'branding.primary_color' => ['nullable', 'string', 'max:20'],
            'branding.secondary_color' => ['nullable', 'string', 'max:20'],

            'billing.invoice_prefix' => ['required', 'string', 'max:20'],
            'billing.invoice_length' => ['required', 'integer', 'min:4', 'max:12'],
            'billing.default_tax_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'billing.enable_igtf' => ['required', 'boolean'],

            'currency.base_currency' => ['required', 'string', 'max:10'],
            'currency.secondary_currency' => ['nullable', 'string', 'max:10'],
            'currency.default_display_currency' => ['nullable', 'string', 'max:10'],
            'currency.rate_source' => ['required', 'string', 'max:50'],
            'currency.rate_provider' => ['nullable', 'string', 'max:50'],
            'currency.auto_refresh_enabled' => ['nullable', 'boolean'],
            'currency.auto_refresh_interval_minutes' => ['nullable', 'integer', 'min:5', 'max:1440'],
            'currency.supported_currencies' => ['nullable', 'array'],
            'currency.supported_currencies.*.code' => ['required', 'string', 'max:10'],
            'currency.supported_currencies.*.name' => ['required', 'string', 'max:100'],
            'currency.supported_currencies.*.symbol' => ['required', 'string', 'max:20'],
            'currency.supported_currencies.*.enabled' => ['nullable', 'boolean'],
            'currency.supported_currencies.*.visible_in_store' => ['nullable', 'boolean'],
            'currency.supported_currencies.*.visible_in_admin' => ['nullable', 'boolean'],
            'currency.supported_currencies.*.allow_checkout' => ['nullable', 'boolean'],
            'currency.supported_currencies.*.rate_mode' => ['nullable', 'in:auto,manual'],
            'currency.supported_currencies.*.rate_provider' => ['nullable', 'string', 'max:50'],
            'currency.supported_currencies.*.manual_rate' => ['nullable', 'numeric', 'min:0'],
            'currency.supported_currencies.*.last_rate' => ['nullable', 'numeric', 'min:0'],
            'currency.supported_currencies.*.last_synced_at' => ['nullable', 'string', 'max:100'],
            'currency.supported_currencies.*.markup_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'currency.supported_currencies.*.rounding_mode' => ['nullable', 'string', 'max:50'],

            'store.home_title' => ['required', 'string', 'max:255'],
            'store.home_subtitle' => ['nullable', 'string', 'max:255'],
            'store.hero_badge' => ['nullable', 'string', 'max:120'],
            'store.hero_description' => ['nullable', 'string', 'max:700'],
            'store.hero_primary_cta_label' => ['nullable', 'string', 'max:100'],
            'store.hero_primary_cta_url' => ['nullable', 'string', 'max:500'],
            'store.hero_secondary_cta_label' => ['nullable', 'string', 'max:100'],
            'store.hero_secondary_cta_url' => ['nullable', 'string', 'max:500'],
            'store.contact_text' => ['nullable', 'string', 'max:500'],
            'store.hero_banners' => ['nullable', 'array'],
            'store.hero_banners.*.title' => ['required', 'string', 'max:160'],
            'store.hero_banners.*.description' => ['nullable', 'string', 'max:280'],
            'store.hero_banners.*.image_url' => ['nullable', 'string', 'max:500'],
            'store.hero_banners.*.background_color' => ['nullable', 'string', 'max:20'],
            'store.hero_banners.*.text_color' => ['nullable', 'string', 'max:20'],
            'store.hero_banner_files' => ['nullable', 'array'],
            'store.hero_banner_files.*' => ['nullable', 'file', 'image', 'max:5120'],
            'store.home_highlights' => ['nullable', 'array'],
            'store.home_highlights.*.eyebrow' => ['nullable', 'string', 'max:80'],
            'store.home_highlights.*.title' => ['required', 'string', 'max:120'],
            'store.home_highlights.*.description' => ['nullable', 'string', 'max:220'],
            'store.home_highlights.*.background_color' => ['nullable', 'string', 'max:20'],
            'store.home_highlights.*.text_color' => ['nullable', 'string', 'max:20'],
            'store.home_highlights.*.image_url' => ['nullable', 'string', 'max:500'],

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

            'payments.methods.manual.enabled' => ['required', 'boolean'],
            'payments.methods.manual.label' => ['required', 'string', 'max:100'],
            'payments.methods.manual.description' => ['nullable', 'string', 'max:255'],
            'payments.methods.manual.instructions' => ['nullable', 'string', 'max:1000'],
            'payments.methods.manual.fee_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],

            'payments.methods.paypal.enabled' => ['required', 'boolean'],
            'payments.methods.paypal.label' => ['required', 'string', 'max:100'],
            'payments.methods.paypal.description' => ['nullable', 'string', 'max:255'],
            'payments.methods.paypal.client_id' => ['nullable', 'string', 'max:255'],
            'payments.methods.paypal.client_secret' => ['nullable', 'string', 'max:255'],
            'payments.methods.paypal.environment' => ['nullable', 'in:sandbox,live'],
            'payments.methods.paypal.instructions' => ['nullable', 'string', 'max:1000'],
            'payments.methods.paypal.fee_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],

            'payments.methods.stripe.enabled' => ['required', 'boolean'],
            'payments.methods.stripe.label' => ['required', 'string', 'max:100'],
            'payments.methods.stripe.description' => ['nullable', 'string', 'max:255'],
            'payments.methods.stripe.publishable_key' => ['nullable', 'string', 'max:255'],
            'payments.methods.stripe.secret_key' => ['nullable', 'string', 'max:255'],
            'payments.methods.stripe.environment' => ['nullable', 'in:test,live'],
            'payments.methods.stripe.instructions' => ['nullable', 'string', 'max:1000'],
            'payments.methods.stripe.fee_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],

            'payments.bank_accounts' => ['nullable', 'array'],
            'payments.bank_accounts.*.bank_name' => ['required', 'string', 'max:120'],
            'payments.bank_accounts.*.account_name' => ['required', 'string', 'max:120'],
            'payments.bank_accounts.*.account_number' => ['required', 'string', 'max:80'],
            'payments.bank_accounts.*.account_type' => ['nullable', 'string', 'max:50'],
            'payments.bank_accounts.*.identification' => ['nullable', 'string', 'max:80'],
            'payments.bank_accounts.*.email' => ['nullable', 'email', 'max:255'],
            'payments.bank_accounts.*.phone' => ['nullable', 'string', 'max:50'],
            'payments.bank_accounts.*.notes' => ['nullable', 'string', 'max:500'],
            'payments.bank_accounts.*.enabled' => ['required', 'boolean'],

            'payments.origin_banks' => ['nullable', 'array'],
            'payments.origin_banks.*.name' => ['required', 'string', 'max:120'],
            'payments.origin_banks.*.enabled' => ['required', 'boolean'],
        ]);

        \App\Support\Settings::set('general', $validated['general']);
        \App\Support\Settings::set('location', $validated['location']);
        $branding = $validated['branding'];
        $branding = $this->storeBrandingFiles($request, $branding);

        $store = $this->normalizeStoreSettings($validated['store'] ?? []);
        $store = $this->storeHomeBannerFiles($request, $store);

        \App\Support\Settings::set('branding', $branding);
        \App\Support\Settings::set('billing', $validated['billing']);
        \App\Support\Settings::set('currency', CurrencySettings::normalize($validated['currency'] ?? []));
        \App\Support\Settings::set('store', $store);
        \App\Support\Settings::set('inventory', $validated['inventory']);
        \App\Support\Settings::set('warehouses', $validated['warehouses']);
        \App\Support\Settings::set('security', $validated['security']);
        \App\Support\Settings::set('qr', $validated['qr']);
        \App\Support\Settings::set('mail', $validated['mail']);

        $payments = $validated['payments'];
        $payments['bank_accounts'] = array_map(
            fn ($account) => [
                ...$account,
                'enabled' => filter_var($account['enabled'] ?? true, FILTER_VALIDATE_BOOLEAN),
            ],
            $payments['bank_accounts'] ?? []
        );
        $payments['origin_banks'] = array_map(
            fn ($bank) => [
                ...$bank,
                'enabled' => filter_var($bank['enabled'] ?? true, FILTER_VALIDATE_BOOLEAN),
            ],
            $payments['origin_banks'] ?? []
        );

        // Eliminar credenciales sensibles de la configuración guardada en DB
        // Las credenciales deben estar en .env (config/services.php)
        if (isset($payments['methods']['stripe'])) {
            unset($payments['methods']['stripe']['secret_key']);
            unset($payments['methods']['stripe']['publishable_key']);
        }
        if (isset($payments['methods']['paypal'])) {
            unset($payments['methods']['paypal']['client_secret']);
            unset($payments['methods']['paypal']['client_id']);
        }

        \App\Support\Settings::set('payments', $payments);

        return back()->with('success', TranslationKeySanitizer::translate('app.admin.settings.notifications.updated'));
    }

    public function syncCurrencyRates(CurrencyService $currencyService): RedirectResponse
    {
        $synced = $currencyService->syncConfiguredRates();
        Settings::set('currency', $synced);

        return back()->with('success', TranslationKeySanitizer::translate('app.admin.settings.notifications.currency_synced'));
    }

    private function defaultStoreSettings(): array
    {
        return [
            'home_title' => TranslationKeySanitizer::translate('app.admin.settings.commerce.store.defaults.home_title'),
            'home_subtitle' => null,
            'hero_badge' => TranslationKeySanitizer::translate('app.admin.settings.commerce.store.defaults.hero_badge'),
            'hero_description' => null,
            'hero_primary_cta_label' => TranslationKeySanitizer::translate('app.admin.settings.commerce.store.defaults.hero_primary_cta_label'),
            'hero_primary_cta_url' => '/shop',
            'hero_secondary_cta_label' => TranslationKeySanitizer::translate('app.admin.settings.commerce.store.defaults.hero_secondary_cta_label'),
            'hero_secondary_cta_url' => '#contacto',
            'contact_text' => null,
            'hero_banners' => [
                [
                    'title' => TranslationKeySanitizer::translate('app.admin.settings.commerce.store.defaults.banner_one_title'),
                    'description' => TranslationKeySanitizer::translate('app.admin.settings.commerce.store.defaults.banner_one_description'),
                    'image_url' => null,
                    'background_color' => null,
                    'text_color' => null,
                ],
                [
                    'title' => TranslationKeySanitizer::translate('app.admin.settings.commerce.store.defaults.banner_two_title'),
                    'description' => TranslationKeySanitizer::translate('app.admin.settings.commerce.store.defaults.banner_two_description'),
                    'image_url' => null,
                    'background_color' => null,
                    'text_color' => null,
                ],
                [
                    'title' => TranslationKeySanitizer::translate('app.admin.settings.commerce.store.defaults.banner_three_title'),
                    'description' => TranslationKeySanitizer::translate('app.admin.settings.commerce.store.defaults.banner_three_description'),
                    'image_url' => null,
                    'background_color' => null,
                    'text_color' => null,
                ],
            ],
            'home_highlights' => [
                [
                    'eyebrow' => TranslationKeySanitizer::translate('app.admin.settings.commerce.store.defaults.highlight_one_eyebrow'),
                    'title' => TranslationKeySanitizer::translate('app.admin.settings.commerce.store.defaults.highlight_one_title'),
                    'description' => TranslationKeySanitizer::translate('app.admin.settings.commerce.store.defaults.highlight_one_description'),
                ],
                [
                    'eyebrow' => TranslationKeySanitizer::translate('app.admin.settings.commerce.store.defaults.highlight_two_eyebrow'),
                    'title' => TranslationKeySanitizer::translate('app.admin.settings.commerce.store.defaults.highlight_two_title'),
                    'description' => TranslationKeySanitizer::translate('app.admin.settings.commerce.store.defaults.highlight_two_description'),
                    'image_url' => null,
                    'background_color' => null,
                    'text_color' => null,
                ],
                [
                    'eyebrow' => TranslationKeySanitizer::translate('app.admin.settings.commerce.store.defaults.highlight_three_eyebrow'),
                    'title' => TranslationKeySanitizer::translate('app.admin.settings.commerce.store.defaults.highlight_three_title'),
                    'description' => TranslationKeySanitizer::translate('app.admin.settings.commerce.store.defaults.highlight_three_description'),
                    'image_url' => null,
                    'background_color' => null,
                    'text_color' => null,
                ],
            ],
        ];
    }

    private function normalizeStoreSettings(?array $store): array
    {
        $defaults = $this->defaultStoreSettings();
        $normalized = array_replace_recursive($defaults, $store ?? []);

        $normalized['hero_banners'] = collect($normalized['hero_banners'] ?? [])
            ->take(5)
            ->map(function ($banner, $index) use ($defaults) {
                $fallback = $defaults['hero_banners'][$index] ?? ['title' => '', 'description' => '', 'image_url' => null];

                return [
                    'title' => $this->normalizeStoredTranslationValue($banner['title'] ?? $fallback['title'] ?? ''),
                    'description' => $this->normalizeStoredTranslationValue($banner['description'] ?? $fallback['description'] ?? ''),
                    'image_url' => trim((string) ($banner['image_url'] ?? $fallback['image_url'] ?? '')) ?: null,
                    'background_color' => trim((string) ($banner['background_color'] ?? $fallback['background_color'] ?? '')) ?: null,
                    'text_color' => trim((string) ($banner['text_color'] ?? $fallback['text_color'] ?? '')) ?: null,
                ];
            })
            ->filter(fn ($banner) => $banner['title'] !== '')
            ->values()
            ->all();

        if ($normalized['hero_banners'] === []) {
            $normalized['hero_banners'] = $defaults['hero_banners'];
        }

        $normalized['home_highlights'] = collect($normalized['home_highlights'] ?? [])
            ->take(6)
            ->map(function ($item, $index) use ($defaults) {
                $fallback = $defaults['home_highlights'][$index] ?? ['eyebrow' => null, 'title' => '', 'description' => null];

                return [
                    'eyebrow' => $this->normalizeStoredTranslationValue($item['eyebrow'] ?? $fallback['eyebrow'] ?? '', true),
                    'title' => $this->normalizeStoredTranslationValue($item['title'] ?? $fallback['title'] ?? ''),
                    'description' => $this->normalizeStoredTranslationValue($item['description'] ?? $fallback['description'] ?? '', true),
                    'image_url' => trim((string) ($item['image_url'] ?? $fallback['image_url'] ?? '')) ?: null,
                    'background_color' => trim((string) ($item['background_color'] ?? $fallback['background_color'] ?? '')) ?: null,
                    'text_color' => trim((string) ($item['text_color'] ?? $fallback['text_color'] ?? '')) ?: null,
                ];
            })
            ->filter(fn ($item) => $item['title'] !== '')
            ->values()
            ->all();

        if ($normalized['home_highlights'] === []) {
            $normalized['home_highlights'] = $defaults['home_highlights'];
        }

        foreach ([
            'home_title',
            'home_subtitle',
            'hero_badge',
            'hero_description',
            'hero_primary_cta_label',
            'hero_primary_cta_url',
            'hero_secondary_cta_label',
            'hero_secondary_cta_url',
            'contact_text',
        ] as $field) {
            $normalized[$field] = $this->normalizeStoredTranslationValue($normalized[$field] ?? null, true);
        }

        return $normalized;
    }

    private function normalizeStoredTranslationValue(mixed $value, bool $allowNull = false): ?string
    {
        if (! is_string($value)) {
            return $allowNull ? null : '';
        }

        $normalized = trim((string) TranslationKeySanitizer::sanitize($value));

        if ($normalized === '') {
            return $allowNull ? null : '';
        }

        if ($normalized === '') {
            return $allowNull ? null : '';
        }

        return $normalized;
    }

    private function storeBrandingFiles(Request $request, array $branding): array
    {
        $currentBranding = Settings::get('branding', []);

        foreach ([
            'logo_file' => 'logo_url',
            'logo_dark_file' => 'logo_dark_url',
            'favicon_file' => 'favicon_url',
        ] as $fileField => $urlField) {
            $file = $request->file("branding.{$fileField}");

            if (! $file instanceof UploadedFile) {
                continue;
            }

            $this->deleteManagedAsset($currentBranding[$urlField] ?? null);
            $path = $file->store('settings/branding', 'public');
            $branding[$urlField] = Storage::disk('public')->url($path);
        }

        unset($branding['logo_file'], $branding['logo_dark_file'], $branding['favicon_file']);

        return $branding;
    }

    private function storeHomeBannerFiles(Request $request, array $store): array
    {
        $files = $request->file('store.hero_banner_files', []);
        $currentStore = Settings::get('store', []);
        $currentBanners = $currentStore['hero_banners'] ?? [];

        foreach ($store['hero_banners'] ?? [] as $index => $banner) {
            $file = $files[$index] ?? null;

            if (! $file instanceof UploadedFile) {
                continue;
            }

            $this->deleteManagedAsset($currentBanners[$index]['image_url'] ?? null);
            $path = $file->store('settings/home-banners', 'public');
            $store['hero_banners'][$index]['image_url'] = Storage::disk('public')->url($path);
        }

        unset($store['hero_banner_files']);

        return $store;
    }

    private function deleteManagedAsset(?string $url): void
    {
        if (! is_string($url) || $url === '') {
            return;
        }

        $parsedPath = parse_url($url, PHP_URL_PATH);

        if (! is_string($parsedPath) || ! str_contains($parsedPath, '/storage/settings/')) {
            return;
        }

        $relativePath = ltrim(str_replace('/storage/', '', $parsedPath), '/');

        if ($relativePath !== '' && Storage::disk('public')->exists($relativePath)) {
            Storage::disk('public')->delete($relativePath);
        }
    }
}
