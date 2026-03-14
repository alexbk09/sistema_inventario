<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->enum('type', ['percent', 'fixed'])->default('percent');
            $table->decimal('value', 10, 2); // porcentaje (0-100) o monto fijo en USD
            $table->boolean('active')->default(true);
            $table->unsignedInteger('uses')->default(0);
            $table->unsignedInteger('max_uses')->nullable();
            $table->decimal('min_amount_usd', 12, 2)->nullable();
            $table->timestamp('valid_from')->nullable();
            $table->timestamp('valid_until')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupons');
    }
};
