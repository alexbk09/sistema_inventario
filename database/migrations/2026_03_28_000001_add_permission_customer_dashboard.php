<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration {
    public function up(): void
    {
        $perm = Permission::firstOrCreate([
            'name' => 'view customer dashboard',
            'guard_name' => 'web',
        ]);
        $cliente = Role::where('name', 'cliente')->first();
        if ($cliente) {
            $cliente->givePermissionTo($perm);
        }
    }

    public function down(): void
    {
        Permission::where('name', 'view customer dashboard')->delete();
    }
};
