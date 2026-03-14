<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('credit_account_id')->nullable()->after('customer_id')->constrained('credit_accounts')->nullOnDelete();
            $table->foreignId('layaway_id')->nullable()->after('credit_account_id')->constrained('layaways')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['credit_account_id']);
            $table->dropForeign(['layaway_id']);
            $table->dropColumn(['credit_account_id', 'layaway_id']);
        });
    }
};
