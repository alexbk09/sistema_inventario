<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        @php
            $general = \App\Support\Settings::get('general', []);
            $branding = \App\Support\Settings::get('branding', []);
            $systemTitle = $general['trade_name'] ?? $general['company_name'] ?? config('app.name', 'Laravel');
            $faviconUrl = $branding['favicon_url'] ?? null;
        @endphp
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ $systemTitle }}</title>
        @if ($faviconUrl)
            <link rel="icon" type="image/png" href="{{ $faviconUrl }}">
        @endif

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
