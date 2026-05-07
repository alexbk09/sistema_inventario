<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payment_gateway_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider', 50);
            $table->string('payment_method', 50);
            $table->string('event_type', 50);
            $table->string('status', 50)->nullable();
            $table->string('external_order_id')->nullable()->index();
            $table->string('external_capture_id')->nullable()->index();
            $table->string('external_transaction_id')->nullable()->index();
            $table->string('currency', 10)->nullable();
            $table->decimal('amount', 12, 2)->default(0);
            $table->json('payload')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();

            $table->unique(['provider', 'external_capture_id'], 'payment_gateway_transactions_provider_capture_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_gateway_transactions');
    }
};