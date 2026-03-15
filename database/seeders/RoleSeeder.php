<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'view products', 'manage products', 'view inventory', 'manage inventory',
            'view invoices', 'manage invoices', 'view orders', 'manage orders',
            'view providers', 'manage providers',
            'view customers', 'manage customers',
            'view users', 'manage users',
            'view rmas', 'manage rmas',
            'view warehouses', 'manage warehouses',
            'view credits', 'manage credits',
            'manage settings',
            'view audit logs',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate([
                'name' => $name,
                'guard_name' => 'web',
            ]);
        }

        $admin = Role::firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'web',
        ]);
        $user = Role::firstOrCreate([
            'name' => 'user',
            'guard_name' => 'web',
        ]);

        $cashier = Role::firstOrCreate([
            'name' => 'cashier',
            'guard_name' => 'web',
        ]);

        $warehouse = Role::firstOrCreate([
            'name' => 'warehouse',
            'guard_name' => 'web',
        ]);

        $supervisor = Role::firstOrCreate([
            'name' => 'supervisor',
            'guard_name' => 'web',
        ]);

        $admin->givePermissionTo($permissions);
        $user->givePermissionTo(['view products', 'view invoices']);

        // Cajero: foco en ventas, clientes y créditos
        $cashier->givePermissionTo([
            'view products',
            'view inventory',
            'view invoices', 'manage invoices',
            'view orders', 'manage orders',
            'view customers', 'manage customers',
            'view providers',
            'view credits', 'manage credits',
        ]);

        // Almacenista: foco en inventario, productos, proveedores y bodegas
        $warehouse->givePermissionTo([
            'view products', 'manage products',
            'view inventory', 'manage inventory',
            'view providers', 'manage providers',
            'view warehouses', 'manage warehouses',
        ]);

        // Supervisor: visión amplia operativa sin gestión de usuarios/roles ni configuración
        $supervisorPermissions = collect($permissions)
            ->reject(fn ($name) => in_array($name, ['manage users', 'manage settings'], true))
            ->values()
            ->all();

        $supervisor->givePermissionTo($supervisorPermissions);
    }
}
