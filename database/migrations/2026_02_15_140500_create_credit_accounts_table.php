<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('credit_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->decimal('balance_usd', 12, 2)->default(0);
            $table->decimal('credit_limit_usd', 12, 2)->nullable();
            $table->string('status')->default('active'); // active, suspended, closed
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_accounts');
    }
};
