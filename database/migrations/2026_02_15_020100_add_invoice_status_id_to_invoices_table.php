<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('invoice_status_id')
                ->nullable()
                ->after('status')
                ->constrained('invoice_statuses')
                ->nullOnDelete();
        });

        // Backfill existing invoices based on current status text
        $statuses = DB::table('invoice_statuses')->pluck('id', 'code');
        foreach ($statuses as $code => $id) {
            DB::table('invoices')
                ->where('status', $code)
                ->update(['invoice_status_id' => $id]);
        }
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('invoice_status_id');
        });
    }
};
