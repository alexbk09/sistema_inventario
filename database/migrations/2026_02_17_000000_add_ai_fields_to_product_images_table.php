<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('product_images', function (Blueprint $table) {
            $table->text('caption')->nullable()->after('path');
            $table->json('tags')->nullable()->after('caption');
            $table->boolean('ai_processed')->default(false)->after('tags');
        });
    }

    public function down(): void
    {
        Schema::table('product_images', function (Blueprint $table) {
            $table->dropColumn(['caption','tags','ai_processed']);
        });
    }
};
