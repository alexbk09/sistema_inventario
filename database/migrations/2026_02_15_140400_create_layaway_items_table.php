<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('layaway_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('layaway_id')->constrained('layaways')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->integer('quantity');
            $table->decimal('unit_price_usd', 12, 2)->default(0);
            $table->decimal('subtotal_usd', 12, 2)->default(0);
            $table->decimal('subtotal_bs', 14, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('layaway_items');
    }
};
