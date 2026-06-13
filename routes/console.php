<?php

use App\Models\CreditMovement;
use App\Models\Invoice;
use App\Models\InvoiceAdjustment;
use App\Models\Layaway;
use App\Models\Rma;
use App\Services\AdminMoneyService;
use App\Services\CurrencyService;
use App\Support\Settings;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Storage;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('currency:status', function (CurrencyService $currencyService) {
    $settings = Settings::get('currency', []);
    $this->info('Currency Status Check');
    $this->info('======================');

    $supportedCurrencies = $settings['supported_currencies'] ?? [];
    $now = now();

    foreach ($supportedCurrencies as $currency) {
        $code = $currency['code'] ?? 'N/A';
        $enabled = $currency['enabled'] ?? false ? '✓' : '✗';
        $rateMode = $currency['rate_mode'] ?? 'manual';
        $lastRate = $currency['last_rate'] ?? null;
        $lastSynced = $currency['last_synced_at'] ?? null;

        $syncStatus = 'N/A';
        if ($rateMode === 'auto' && $lastSynced) {
            try {
                $syncedAt = \Carbon\Carbon::parse($lastSynced);
                $hours = $now->diffInHours($syncedAt);
                if ($hours < 1) {
                    $syncStatus = 'Fresh (< 1h)';
                } elseif ($hours < 24) {
                    $syncStatus = "{$hours}h ago";
                } else {
                    $syncStatus = 'STALE (> 24h)';
                }
            } catch (\Throwable $e) {
                $syncStatus = 'Invalid date';
            }
        }

        $rateDisplay = $lastRate ? number_format($lastRate, 6) : 'N/A';
        $manualRate = $currency['manual_rate'] ?? null;
        $manualRateDisplay = $manualRate ? number_format($manualRate, 6) : 'N/A';

        if ($rateMode === 'manual') {
            $this->info("[{$enabled}] {$code} | Rate: {$rateDisplay} | Mode: {$rateMode} | Manual: {$manualRateDisplay} | Sync: {$syncStatus}");
        } else {
            $this->info("[{$enabled}] {$code} | Rate: {$rateDisplay} | Mode: {$rateMode} | Sync: {$syncStatus}");
        }
    }

    $this->info('');
    $this->info('To force sync: php artisan currency:sync-configured-rates');
})->purpose('Check current currency rates status');

Artisan::command('currency:sync-configured-rates', function (CurrencyService $currencyService) {
    $this->info('Syncing currency rates...');
    try {
        $synced = $currencyService->syncConfiguredRates();
        Settings::set('currency', $synced);

        $count = count($synced['supported_currencies'] ?? []);
        $this->info("✓ Currency rates synchronized for {$count} configured currencies.");

        // Show rates
        foreach ($synced['supported_currencies'] ?? [] as $currency) {
            $code = $currency['code'] ?? 'N/A';
            $rate = $currency['last_rate'] ?? null;
            if ($rate) {
                $this->info("  {$code}: " . number_format($rate, 6));
            }
        }
    } catch (\Throwable $e) {
        $this->error('Sync failed: ' . $e->getMessage());
        \Log::error('Currency sync failed', ['error' => $e->getMessage()]);
    }
})->purpose('Synchronize configured currency rates and persist latest values');

Artisan::command('currency:backfill-document-snapshots', function (AdminMoneyService $adminMoneyService) {
    $settings = Settings::get('currency', []);
    $enabledContext = $adminMoneyService->getEnabledCurrencyContext($settings);
    $reportTimestamp = now();
    $report = [
        'generated_at' => $reportTimestamp->toIso8601String(),
        'base_currency' => (string) ($enabledContext['base_currency'] ?? 'USD'),
        'summary' => [],
        'issues' => [],
    ];

    $registerIssues = function (string $entity, int|string $recordId, array $issues, array $context = []) use (&$report) {
        $normalizedIssues = array_values(array_unique(array_filter($issues)));

        if ($normalizedIssues === []) {
            return;
        }

        $report['issues'][] = [
            'entity' => $entity,
            'record_id' => $recordId,
            'issues' => $normalizedIssues,
            'context' => $context,
        ];
    };

    $resolveSnapshotRate = function (string $currencyCode, array $snapshot, array &$issues): ?float {
        $baseCurrency = (string) ($snapshot['base_currency'] ?? 'USD');

        if ($currencyCode === $baseCurrency) {
            return 1.0;
        }

        $rate = $snapshot['rates'][$currencyCode] ?? null;
        if (! is_numeric($rate) || (float) $rate <= 0) {
            $issues[] = 'missing_snapshot_rate_for_currency';

            return null;
        }

        return (float) $rate;
    };

    $resolveOriginalAmount = function (float $baseAmount, string $currencyCode, array $snapshot, array &$issues) use ($adminMoneyService): float {
        $baseCurrency = (string) ($snapshot['base_currency'] ?? 'USD');

        if ($currencyCode === $baseCurrency) {
            return round($baseAmount, 2);
        }

        try {
            return $adminMoneyService->convertUsingSnapshot($baseAmount, $currencyCode, $snapshot);
        } catch (\Throwable) {
            $issues[] = 'original_amount_fell_back_to_base_amount';

            return round($baseAmount, 2);
        }
    };

    $inferSnapshot = function (float $baseAmount, ?float $secondaryAmount = null) use ($adminMoneyService, $settings, $enabledContext) {
        $capturedAt = now()->toIso8601String();
        $baseCurrency = (string) ($enabledContext['base_currency'] ?? 'USD');
        $rates = $enabledContext['rates'] ?? [];
        $issues = [];

        if ($baseAmount > 0 && is_numeric($secondaryAmount) && (float) $secondaryAmount > 0) {
            $secondaryCode = null;

            foreach (($enabledContext['currencies'] ?? []) as $currency) {
                if (($currency['code'] ?? null) !== $baseCurrency) {
                    $secondaryCode = (string) $currency['code'];
                    break;
                }
            }

            if ($secondaryCode !== null) {
                $rates[$secondaryCode] = round(((float) $secondaryAmount / $baseAmount), 6);
            } else {
                $issues[] = 'secondary_currency_not_available_for_ratio_inference';
            }
        } elseif ($baseAmount <= 0 && (! is_numeric($secondaryAmount) || (float) $secondaryAmount <= 0)) {
            $issues[] = 'insufficient_amounts_to_infer_snapshot';
        }

        return [
            'snapshot' => $adminMoneyService->buildSnapshot($rates, $baseCurrency, $capturedAt),
            'issues' => $issues,
        ];
    };

    $backfillInvoices = function () use ($adminMoneyService, $settings, $inferSnapshot, $registerIssues, $resolveSnapshotRate, $resolveOriginalAmount) {
        $updated = 0;

        Invoice::query()
            ->where(function ($query) {
                $query->whereNull('monetary_totals_json')
                    ->orWhereNull('currency_code')
                    ->orWhereNull('base_currency_code');
            })
            ->with(['items', 'payments'])
            ->chunkById(100, function ($invoices) use (&$updated, $adminMoneyService, $settings, $inferSnapshot, $registerIssues, $resolveSnapshotRate, $resolveOriginalAmount) {
                foreach ($invoices as $invoice) {
                    $snapshotData = $inferSnapshot((float) ($invoice->total_usd ?? 0), (float) ($invoice->total_bs ?? 0));
                    $snapshot = $snapshotData['snapshot'];
                    $invoiceIssues = $snapshotData['issues'];
                    $documentCurrency = (string) ($invoice->currency_code ?: 'USD');

                    if (! $invoice->currency_code) {
                        $invoiceIssues[] = 'document_currency_defaulted_to_usd';
                    }

                    $documentRate = $resolveSnapshotRate($documentCurrency, $snapshot, $invoiceIssues);

                    $invoice->forceFill([
                        'currency_code' => $documentCurrency,
                        'base_currency_code' => $snapshot['base_currency'] ?? 'USD',
                        'exchange_rate_snapshot' => $documentRate,
                        'exchange_rate_source' => $adminMoneyService->resolveCurrencyRateSource($documentCurrency, $settings) ?? 'legacy_backfill',
                        'monetary_totals_json' => [
                            'original_currency' => $documentCurrency,
                            'original_amount' => $documentCurrency === ($snapshot['base_currency'] ?? 'USD')
                                ? round((float) ($invoice->total_usd ?? 0), 2)
                                : round((float) ($invoice->total_bs ?? $invoice->total_usd ?? 0), 2),
                            ...$adminMoneyService->buildDocumentTotals((float) ($invoice->total_usd ?? 0), $settings, $snapshot),
                        ],
                    ])->save();

                    $registerIssues('invoice', $invoice->id, $invoiceIssues, [
                        'number' => $invoice->number,
                        'currency_code' => $documentCurrency,
                    ]);

                    foreach ($invoice->items as $item) {
                        $itemIssues = [];
                        $itemRate = $resolveSnapshotRate($documentCurrency, $snapshot, $itemIssues);

                        $item->forceFill([
                            'unit_currency_code' => $documentCurrency,
                            'unit_price_original' => $resolveOriginalAmount((float) ($item->price_usd ?? 0), $documentCurrency, $snapshot, $itemIssues),
                            'subtotal_original' => $resolveOriginalAmount((float) ($item->subtotal_usd ?? 0), $documentCurrency, $snapshot, $itemIssues),
                            'exchange_rate_snapshot' => $itemRate,
                            'monetary_breakdown_json' => $adminMoneyService->buildDocumentTotals((float) ($item->subtotal_usd ?? 0), $settings, $snapshot),
                        ])->save();

                        $registerIssues('invoice_item', $item->id, $itemIssues, [
                            'invoice_id' => $invoice->id,
                            'currency_code' => $documentCurrency,
                        ]);
                    }

                    foreach ($invoice->payments as $payment) {
                        $paymentIssues = [];
                        $paymentCurrency = (string) ($payment->payment_currency_code ?: $documentCurrency);

                        if (! $payment->payment_currency_code) {
                            $paymentIssues[] = 'payment_currency_inferred_from_document';
                        }

                        $paymentRate = $resolveSnapshotRate($paymentCurrency, $snapshot, $paymentIssues);
                        $payment->forceFill([
                            'payment_currency_code' => $paymentCurrency,
                            'amount_original' => $paymentCurrency === ($snapshot['base_currency'] ?? 'USD')
                                ? round((float) ($payment->amount_usd ?? 0), 2)
                                : round((float) ($payment->amount_bs ?? $payment->amount_usd ?? 0), 2),
                            'amount_base' => (float) ($payment->amount_usd ?? 0),
                            'exchange_rate_snapshot' => $paymentRate,
                            'exchange_rate_source' => $adminMoneyService->resolveCurrencyRateSource($paymentCurrency, $settings) ?? 'legacy_backfill',
                        ])->save();

                        $registerIssues('invoice_payment', $payment->id, $paymentIssues, [
                            'invoice_id' => $invoice->id,
                            'payment_currency_code' => $paymentCurrency,
                        ]);
                    }

                    $updated++;
                }
            });

        return $updated;
    };

    $backfillLayaways = function () use ($adminMoneyService, $settings, $inferSnapshot, $registerIssues) {
        $updated = 0;

        Layaway::query()
            ->where(function ($query) {
                $query->whereNull('monetary_totals_json')
                    ->orWhereNull('currency_code')
                    ->orWhereNull('base_currency_code');
            })
            ->with('items')
            ->chunkById(100, function ($layaways) use (&$updated, $adminMoneyService, $settings, $inferSnapshot, $registerIssues) {
                foreach ($layaways as $layaway) {
                    $snapshotData = $inferSnapshot((float) ($layaway->total_usd ?? 0), (float) ($layaway->total_bs ?? 0));
                    $snapshot = $snapshotData['snapshot'];

                    $layaway->forceFill([
                        'currency_code' => 'USD',
                        'base_currency_code' => $snapshot['base_currency'] ?? 'USD',
                        'exchange_rate_snapshot' => 1,
                        'exchange_rate_source' => 'legacy_backfill',
                        'monetary_totals_json' => [
                            'original_currency' => 'USD',
                            'original_amount' => round((float) ($layaway->total_usd ?? 0), 2),
                            ...$adminMoneyService->buildDocumentTotals((float) ($layaway->total_usd ?? 0), $settings, $snapshot),
                        ],
                    ])->save();

                    $registerIssues('layaway', $layaway->id, $snapshotData['issues'], [
                        'number' => $layaway->number,
                    ]);

                    foreach ($layaway->items as $item) {
                        $item->forceFill([
                            'unit_currency_code' => 'USD',
                            'unit_price_original' => (float) ($item->unit_price_usd ?? 0),
                            'subtotal_original' => (float) ($item->subtotal_usd ?? 0),
                            'exchange_rate_snapshot' => 1,
                            'monetary_breakdown_json' => $adminMoneyService->buildDocumentTotals((float) ($item->subtotal_usd ?? 0), $settings, $snapshot),
                        ])->save();
                    }

                    $updated++;
                }
            });

        return $updated;
    };

    $backfillRmas = function () use ($adminMoneyService, $settings, $inferSnapshot, $registerIssues) {
        $updated = 0;

        Rma::query()
            ->where(function ($query) {
                $query->whereNull('monetary_totals_json')
                    ->orWhereNull('currency_code')
                    ->orWhereNull('base_currency_code');
            })
            ->with('items')
            ->chunkById(100, function ($rmas) use (&$updated, $adminMoneyService, $settings, $inferSnapshot, $registerIssues) {
                foreach ($rmas as $rma) {
                    $snapshotData = $inferSnapshot((float) ($rma->total_usd ?? 0), (float) ($rma->total_bs ?? 0));
                    $snapshot = $snapshotData['snapshot'];

                    $rma->forceFill([
                        'currency_code' => 'USD',
                        'base_currency_code' => $snapshot['base_currency'] ?? 'USD',
                        'exchange_rate_snapshot' => 1,
                        'exchange_rate_source' => 'legacy_backfill',
                        'monetary_totals_json' => [
                            'original_currency' => 'USD',
                            'original_amount' => round((float) ($rma->total_usd ?? 0), 2),
                            ...$adminMoneyService->buildDocumentTotals((float) ($rma->total_usd ?? 0), $settings, $snapshot),
                        ],
                    ])->save();

                    $registerIssues('rma', $rma->id, $snapshotData['issues'], [
                        'number' => $rma->number,
                    ]);

                    foreach ($rma->items as $item) {
                        $item->forceFill([
                            'unit_currency_code' => 'USD',
                            'unit_price_original' => (float) ($item->unit_price_usd ?? 0),
                            'subtotal_original' => (float) ($item->subtotal_usd ?? 0),
                            'exchange_rate_snapshot' => 1,
                            'monetary_breakdown_json' => $adminMoneyService->buildDocumentTotals((float) ($item->subtotal_usd ?? 0), $settings, $snapshot),
                        ])->save();
                    }

                    $updated++;
                }
            });

        return $updated;
    };

    $resolveInvoiceSnapshot = function (?Invoice $invoice) use ($inferSnapshot): array {
        if ($invoice && is_array($invoice->monetary_totals_json['rates'] ?? null)) {
            return [
                'snapshot' => [
                    'base_currency' => (string) ($invoice->base_currency_code ?: 'USD'),
                    'captured_at' => $invoice->monetary_totals_json['captured_at'] ?? null,
                    'rates' => $invoice->monetary_totals_json['rates'],
                ],
                'issues' => [],
            ];
        }

        return $inferSnapshot(
            (float) ($invoice?->total_usd ?? 0),
            (float) ($invoice?->total_bs ?? 0),
        );
    };

    $backfillCreditMovements = function () use ($adminMoneyService, $settings, $inferSnapshot, $resolveInvoiceSnapshot, $registerIssues, $resolveSnapshotRate, $resolveOriginalAmount) {
        $updated = 0;

        CreditMovement::query()
            ->where(function ($query) {
                $query->whereNull('monetary_totals_json')
                    ->orWhereNull('currency_code')
                    ->orWhereNull('base_currency_code')
                    ->orWhereNull('amount_original');
            })
            ->with('invoice:id,total_usd,total_bs,currency_code,base_currency_code,exchange_rate_snapshot,exchange_rate_source,monetary_totals_json')
            ->chunkById(100, function ($movements) use (&$updated, $adminMoneyService, $settings, $inferSnapshot, $resolveInvoiceSnapshot, $registerIssues, $resolveSnapshotRate, $resolveOriginalAmount) {
                foreach ($movements as $movement) {
                    $snapshotData = $movement->invoice
                        ? $resolveInvoiceSnapshot($movement->invoice)
                        : $inferSnapshot((float) ($movement->amount_usd ?? 0), null);
                    $snapshot = $snapshotData['snapshot'];
                    $movementIssues = $snapshotData['issues'];

                    $currencyCode = (string) ($movement->currency_code
                        ?: $movement->invoice?->currency_code
                        ?: 'USD');

                    if (! $movement->currency_code) {
                        $movementIssues[] = $movement->invoice?->currency_code
                            ? 'movement_currency_inferred_from_invoice'
                            : 'movement_currency_defaulted_to_usd';
                    }

                    $originalAmount = $movement->amount_original;
                    if (! is_numeric($originalAmount)) {
                        $originalAmount = $resolveOriginalAmount((float) ($movement->amount_usd ?? 0), $currencyCode, $snapshot, $movementIssues);
                    }

                    $movementRate = $resolveSnapshotRate($currencyCode, $snapshot, $movementIssues);

                    $movement->forceFill([
                        'currency_code' => $currencyCode,
                        'base_currency_code' => $snapshot['base_currency'] ?? 'USD',
                        'amount_original' => round((float) $originalAmount, 2),
                        'exchange_rate_snapshot' => $movementRate,
                        'exchange_rate_source' => $movement->invoice?->exchange_rate_source
                            ?: ($adminMoneyService->resolveCurrencyRateSource($currencyCode, $settings) ?? 'legacy_backfill'),
                        'monetary_totals_json' => [
                            'original_currency' => $currencyCode,
                            'original_amount' => round((float) $originalAmount, 2),
                            ...$adminMoneyService->buildDocumentTotals((float) ($movement->amount_usd ?? 0), $settings, $snapshot),
                        ],
                    ])->save();

                    $registerIssues('credit_movement', $movement->id, $movementIssues, [
                        'invoice_id' => $movement->invoice_id,
                        'currency_code' => $currencyCode,
                        'type' => $movement->type,
                    ]);

                    $updated++;
                }
            });

        return $updated;
    };

    $backfillInvoiceAdjustments = function () use ($adminMoneyService, $settings, $inferSnapshot, $resolveInvoiceSnapshot, $registerIssues, $resolveSnapshotRate, $resolveOriginalAmount) {
        $updated = 0;

        InvoiceAdjustment::query()
            ->where(function ($query) {
                $query->whereNull('monetary_totals_json')
                    ->orWhereNull('currency_code')
                    ->orWhereNull('base_currency_code')
                    ->orWhereNull('amount_original');
            })
            ->with('invoice:id,total_usd,total_bs,currency_code,base_currency_code,exchange_rate_snapshot,exchange_rate_source,monetary_totals_json')
            ->chunkById(100, function ($adjustments) use (&$updated, $adminMoneyService, $settings, $inferSnapshot, $resolveInvoiceSnapshot, $registerIssues, $resolveSnapshotRate, $resolveOriginalAmount) {
                foreach ($adjustments as $adjustment) {
                    $snapshotData = $adjustment->invoice
                        ? $resolveInvoiceSnapshot($adjustment->invoice)
                        : $inferSnapshot((float) ($adjustment->amount_usd ?? 0), null);
                    $snapshot = $snapshotData['snapshot'];
                    $adjustmentIssues = $snapshotData['issues'];

                    $currencyCode = (string) ($adjustment->currency_code
                        ?: $adjustment->invoice?->currency_code
                        ?: 'USD');

                    if (! $adjustment->currency_code) {
                        $adjustmentIssues[] = $adjustment->invoice?->currency_code
                            ? 'adjustment_currency_inferred_from_invoice'
                            : 'adjustment_currency_defaulted_to_usd';
                    }

                    $originalAmount = $adjustment->amount_original;
                    if (! is_numeric($originalAmount)) {
                        $originalAmount = $resolveOriginalAmount((float) ($adjustment->amount_usd ?? 0), $currencyCode, $snapshot, $adjustmentIssues);
                    }

                    $adjustmentRate = $resolveSnapshotRate($currencyCode, $snapshot, $adjustmentIssues);

                    $adjustment->forceFill([
                        'currency_code' => $currencyCode,
                        'base_currency_code' => $snapshot['base_currency'] ?? 'USD',
                        'amount_original' => round((float) $originalAmount, 2),
                        'exchange_rate_snapshot' => $adjustmentRate,
                        'exchange_rate_source' => $adjustment->invoice?->exchange_rate_source
                            ?: ($adminMoneyService->resolveCurrencyRateSource($currencyCode, $settings) ?? 'legacy_backfill'),
                        'monetary_totals_json' => [
                            'original_currency' => $currencyCode,
                            'original_amount' => round((float) $originalAmount, 2),
                            ...$adminMoneyService->buildDocumentTotals((float) ($adjustment->amount_usd ?? 0), $settings, $snapshot),
                        ],
                    ])->save();

                    $registerIssues('invoice_adjustment', $adjustment->id, $adjustmentIssues, [
                        'invoice_id' => $adjustment->invoice_id,
                        'currency_code' => $currencyCode,
                        'type' => $adjustment->type,
                    ]);

                    $updated++;
                }
            });

        return $updated;
    };

    $invoiceCount = $backfillInvoices();
    $layawayCount = $backfillLayaways();
    $rmaCount = $backfillRmas();
    $creditMovementCount = $backfillCreditMovements();
    $invoiceAdjustmentCount = $backfillInvoiceAdjustments();

    $this->info("Invoices backfilled: {$invoiceCount}");
    $this->info("Layaways backfilled: {$layawayCount}");
    $this->info("RMAs backfilled: {$rmaCount}");
    $this->info("Credit movements backfilled: {$creditMovementCount}");
    $this->info("Invoice adjustments backfilled: {$invoiceAdjustmentCount}");

    $report['summary'] = [
        'invoices' => $invoiceCount,
        'layaways' => $layawayCount,
        'rmas' => $rmaCount,
        'credit_movements' => $creditMovementCount,
        'invoice_adjustments' => $invoiceAdjustmentCount,
        'issues' => count($report['issues']),
    ];

    $reportPath = 'backfills/currency-backfill-report-'.$reportTimestamp->format('Ymd_His').'.json';
    Storage::disk('local')->put(
        $reportPath,
        json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
    );
    $reportFullPath = Storage::disk('local')->path($reportPath);

    if (($report['summary']['issues'] ?? 0) > 0) {
        $this->warn('Backfill inconsistencies detected: '.$report['summary']['issues']);
    } else {
        $this->info('Backfill completed without inconsistencies requiring manual review.');
    }

    $this->info('Backfill report saved to '.$reportFullPath);
})->purpose('Backfill monetary snapshots for legacy documents, credit movements, and invoice adjustments');

Schedule::command('currency:sync-configured-rates')->hourly();
