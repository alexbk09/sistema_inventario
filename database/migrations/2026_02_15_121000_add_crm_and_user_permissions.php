<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration {
    public function up(): void
    {
        // Crear permisos si no existen
        $permissions = [
            'view customers',
            'manage customers',
            'view users',
            'manage users',
        ];

        $created = [];
        foreach ($permissions as $name) {
            $perm = Permission::firstOrCreate([
                'name' => $name,
                'guard_name' => 'web',
            ]);
            $created[] = $perm;
        }

        // Asignar al rol admin por defecto
        $admin = Role::where('name', 'admin')->first();
        if ($admin) {
            $admin->givePermissionTo($created);
        }
    }

    public function down(): void
    {
        // Opcional: eliminar sólo estos permisos
        $names = [
            'view customers',
            'manage customers',
            'view users',
            'manage users',
        ];

        Permission::whereIn('name', $names)->delete();
    }
};
