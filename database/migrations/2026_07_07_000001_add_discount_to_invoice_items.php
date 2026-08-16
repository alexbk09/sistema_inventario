<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            if (!Schema::hasColumn('invoice_items', 'discount_usd')) {
                $table->decimal('discount_usd', 12, 2)->default(0)->after('subtotal_usd');
            }
        });

        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'discount_usd')) {
                $table->decimal('discount_usd', 12, 2)->default(0)->after('total_bs');
            }
        });
    }

    public function down(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            if (Schema::hasColumn('invoice_items', 'discount_usd')) {
                $table->dropColumn('discount_usd');
            }
        });

        Schema::table('invoices', function (Blueprint $table) {
            if (Schema::hasColumn('invoices', 'discount_usd')) {
                $table->dropColumn('discount_usd');
            }
        });
    }
};
