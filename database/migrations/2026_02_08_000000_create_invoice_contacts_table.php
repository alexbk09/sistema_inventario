<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('invoice_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');
            $table->string('full_name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('address');
            $table->string('city')->nullable();
            $table->string('zip_code')->nullable();
            $table->string('payment_method');
            $table->string('bank');
            $table->string('origin_bank');
            $table->string('reference');
            $table->date('payment_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_contacts');
    }
};
