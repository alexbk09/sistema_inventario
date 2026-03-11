<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('invoice_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->timestamps();
        });

        DB::table('invoice_statuses')->insert([
            ['name' => 'Pendiente', 'code' => 'pending', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Pagado', 'code' => 'paid', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Enviado', 'code' => 'shipped', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Entregado', 'code' => 'delivered', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Cancelado', 'code' => 'cancelled', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_statuses');
    }
};
