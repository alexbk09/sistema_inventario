<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('credit_movements', function (Blueprint $table) {
            $table->string('currency_code', 10)->nullable()->after('amount_usd');
            $table->string('base_currency_code', 10)->nullable()->after('currency_code');
            $table->decimal('amount_original', 12, 2)->nullable()->after('base_currency_code');
            $table->decimal('exchange_rate_snapshot', 18, 8)->nullable()->after('amount_original');
            $table->string('exchange_rate_source', 50)->nullable()->after('exchange_rate_snapshot');
            $table->json('monetary_totals_json')->nullable()->after('exchange_rate_source');
        });
    }

    public function down(): void
    {
        Schema::table('credit_movements', function (Blueprint $table) {
            $table->dropColumn([
                'currency_code',
                'base_currency_code',
                'amount_original',
                'exchange_rate_snapshot',
                'exchange_rate_source',
                'monetary_totals_json',
            ]);
        });
    }
};