<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('rma_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rma_id')->constrained('rmas')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->foreignId('invoice_item_id')->nullable()->constrained('invoice_items')->nullOnDelete();
            $table->integer('quantity');
            $table->decimal('unit_price_usd', 12, 2)->default(0);
            $table->decimal('subtotal_usd', 12, 2)->default(0);
            $table->decimal('subtotal_bs', 14, 2)->default(0);
            $table->text('reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rma_items');
    }
};
