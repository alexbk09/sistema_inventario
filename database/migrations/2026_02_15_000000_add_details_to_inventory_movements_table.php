<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('inventory_movements', function (Blueprint $table) {
            $table->enum('source', ['purchase', 'sale', 'adjustment', 'return'])
                ->default('adjustment')
                ->after('type');
            $table->string('reference')->nullable()->after('source');
            $table->decimal('unit_price_usd', 12, 2)->default(0)->after('quantity');
            $table->decimal('total_value_usd', 12, 2)->default(0)->after('unit_price_usd');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_movements', function (Blueprint $table) {
            $table->dropColumn(['source', 'reference', 'unit_price_usd', 'total_value_usd']);
        });
    }
};
