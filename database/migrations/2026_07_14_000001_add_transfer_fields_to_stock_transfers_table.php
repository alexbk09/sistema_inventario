<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->timestamp('sent_at')->nullable()->after('status');
            $table->timestamp('received_at')->nullable()->after('sent_at');
            $table->string('qr_code')->nullable()->after('received_at');
        });
    }

    public function down(): void
    {
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->dropColumn(['sent_at', 'received_at', 'qr_code']);
        });
    }
};
