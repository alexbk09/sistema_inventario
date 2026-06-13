<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('invoice_contacts', function (Blueprint $table) {
            if (!Schema::hasColumn('invoice_contacts', 'operation_type')) {
                $table->string('operation_type', 50)->nullable()->after('origin_bank');
            }
        });
    }

    public function down(): void
    {
        Schema::table('invoice_contacts', function (Blueprint $table) {
            if (Schema::hasColumn('invoice_contacts', 'operation_type')) {
                $table->dropColumn('operation_type');
            }
        });
    }
};
