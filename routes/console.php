<?php

use App\Services\CurrencyService;
use App\Support\Settings;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('currency:sync-configured-rates', function (CurrencyService $currencyService) {
    $synced = $currencyService->syncConfiguredRates();
    Settings::set('currency', $synced);

    $count = count($synced['supported_currencies'] ?? []);
    $this->info("Currency rates synchronized for {$count} configured currencies.");
})->purpose('Synchronize configured currency rates and persist latest values');

Schedule::command('currency:sync-configured-rates')->hourly();
