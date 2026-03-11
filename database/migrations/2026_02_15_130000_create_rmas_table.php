<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('rmas', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('status')->default('pending'); // pending, approved, rejected, completed
            $table->string('reason_type')->nullable(); // defective, warranty, other
            $table->text('reason')->nullable();
            $table->string('resolution_type')->nullable(); // refund, replace, credit_note
            $table->decimal('total_usd', 12, 2)->default(0);
            $table->decimal('total_bs', 14, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rmas');
    }
};
