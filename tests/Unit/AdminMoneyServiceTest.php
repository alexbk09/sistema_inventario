<?php

namespace Tests\Unit;

use App\Services\AdminMoneyService;
use App\Services\CurrencyService;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AdminMoneyServiceTest extends TestCase
{
    protected function makeService(): AdminMoneyService
    {
        $currencyService = $this->createMock(CurrencyService::class);

        $currencyService
            ->method('getConfiguredExchangeRates')
            ->willReturn([
                'base_currency' => 'USD',
                'default_display_currency' => 'USD',
                'rates' => [
                    'USD' => 1.0,
                    'VES' => 36.5,
                    'EUR' => 0.92,
                ],
                'currencies' => [
                    [
                        'code' => 'USD',
                        'enabled' => true,
                        'visible_in_admin' => true,
                    ],
                    [
                        'code' => 'VES',
                        'enabled' => true,
                        'visible_in_admin' => true,
                    ],
                    [
                        'code' => 'EUR',
                        'enabled' => true,
                        'visible_in_admin' => false,
                    ],
                ],
            ]);

        return new AdminMoneyService($currencyService);
    }

    #[Test]
    public function returns_only_enabled_admin_visible_currencies(): void
    {
        $context = $this->makeService()->getAdminCurrencyContext([
            'base_currency' => 'USD',
            'default_display_currency' => 'USD',
            'supported_currencies' => [],
        ]);

        $this->assertSame(['USD', 'VES'], $context['codes']);
    }

    #[Test]
    public function returns_enabled_currencies_even_if_not_visible_in_admin(): void
    {
        $context = $this->makeService()->getEnabledCurrencyContext([
            'base_currency' => 'USD',
            'default_display_currency' => 'USD',
            'supported_currencies' => [],
        ]);

        $this->assertSame(['USD', 'VES', 'EUR'], $context['codes']);
    }

    #[Test]
    public function converts_from_base_currency_using_active_rates(): void
    {
        $converted = $this->makeService()->convertFromBase(10, 'VES', [
            'base_currency' => 'USD',
            'default_display_currency' => 'USD',
            'supported_currencies' => [],
        ]);

        $this->assertSame(365.0, $converted);
    }

    #[Test]
    public function converts_using_snapshot_rates_when_provided(): void
    {
        $service = $this->makeService();
        $snapshot = $service->buildSnapshot([
            'VES' => 40.25,
            'EUR' => 0.95,
        ], 'USD', '2026-05-12T10:00:00Z');

        $converted = $service->convertUsingSnapshot(10, 'VES', $snapshot);

        $this->assertSame(402.5, $converted);
    }

    #[Test]
    public function converts_from_non_base_currency_back_to_base(): void
    {
        $service = $this->makeService();
        $snapshot = $service->buildSnapshot([
            'VES' => 40.25,
            'EUR' => 0.95,
        ], 'USD', '2026-05-12T10:00:00Z');

        $converted = $service->convertToBase(402.5, 'VES', null, $snapshot);

        $this->assertSame(10.0, $converted);
    }

    #[Test]
    public function builds_totals_for_admin_visible_currencies(): void
    {
        $totals = $this->makeService()->buildAdminTotals(10, [
            'base_currency' => 'USD',
            'default_display_currency' => 'USD',
            'supported_currencies' => [],
        ]);

        $this->assertSame([
            'USD' => 10.0,
            'VES' => 365.0,
        ], $totals['totals']);
    }

    #[Test]
    public function builds_document_totals_for_all_enabled_currencies(): void
    {
        $totals = $this->makeService()->buildDocumentTotals(10, [
            'base_currency' => 'USD',
            'default_display_currency' => 'USD',
            'supported_currencies' => [],
        ]);

        $this->assertSame([
            'USD' => 10.0,
            'VES' => 365.0,
            'EUR' => 9.2,
        ], $totals['totals']);
    }
}