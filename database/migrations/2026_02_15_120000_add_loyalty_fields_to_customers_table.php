<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->unsignedBigInteger('loyalty_points')->default(0)->after('address');
            $table->decimal('lifetime_spent_usd', 12, 2)->default(0)->after('loyalty_points');
            $table->timestamp('last_purchase_at')->nullable()->after('lifetime_spent_usd');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['loyalty_points', 'lifetime_spent_usd', 'last_purchase_at']);
        });
    }
};
