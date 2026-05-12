<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('currency_code', 10)->nullable()->after('total_bs');
            $table->string('base_currency_code', 10)->nullable()->after('currency_code');
            $table->decimal('exchange_rate_snapshot', 18, 6)->nullable()->after('base_currency_code');
            $table->string('exchange_rate_source', 50)->nullable()->after('exchange_rate_snapshot');
            $table->json('monetary_totals_json')->nullable()->after('exchange_rate_source');
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->string('unit_currency_code', 10)->nullable()->after('subtotal_bs');
            $table->decimal('unit_price_original', 12, 2)->nullable()->after('unit_currency_code');
            $table->decimal('subtotal_original', 12, 2)->nullable()->after('unit_price_original');
            $table->decimal('exchange_rate_snapshot', 18, 6)->nullable()->after('subtotal_original');
            $table->json('monetary_breakdown_json')->nullable()->after('exchange_rate_snapshot');
        });

        Schema::table('invoice_payments', function (Blueprint $table) {
            $table->string('payment_currency_code', 10)->nullable()->after('amount_bs');
            $table->decimal('amount_original', 12, 2)->nullable()->after('payment_currency_code');
            $table->decimal('amount_base', 12, 2)->nullable()->after('amount_original');
            $table->decimal('exchange_rate_snapshot', 18, 6)->nullable()->after('amount_base');
            $table->string('exchange_rate_source', 50)->nullable()->after('exchange_rate_snapshot');
        });
    }

    public function down(): void
    {
        Schema::table('invoice_payments', function (Blueprint $table) {
            $table->dropColumn([
                'payment_currency_code',
                'amount_original',
                'amount_base',
                'exchange_rate_snapshot',
                'exchange_rate_source',
            ]);
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropColumn([
                'unit_currency_code',
                'unit_price_original',
                'subtotal_original',
                'exchange_rate_snapshot',
                'monetary_breakdown_json',
            ]);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn([
                'currency_code',
                'base_currency_code',
                'exchange_rate_snapshot',
                'exchange_rate_source',
                'monetary_totals_json',
            ]);
        });
    }
};
