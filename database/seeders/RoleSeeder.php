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

        $admin->givePermissionTo($permissions);
        $user->givePermissionTo(['view products', 'view invoices']);
    }
}
