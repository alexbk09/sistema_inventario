<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('movement_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->timestamps();
        });

        DB::table('movement_types')->insert([
            ['name' => 'Purchase', 'code' => 'purchase', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Sale', 'code' => 'sale', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Adjustment', 'code' => 'adjustment', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Return', 'code' => 'return', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('movement_types');
    }
};
