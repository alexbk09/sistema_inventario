<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->foreignId('identification_type_id')
                ->nullable()
                ->after('user_id')
                ->constrained('identification_types')
                ->nullOnDelete();
            $table->string('identification')->nullable()->after('identification_type_id');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('identification_type_id');
            $table->dropColumn('identification');
        });
    }
};
