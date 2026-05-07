<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\{Category, Product, Provider, Customer, User};
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $adminConfig = config('demo.users.admin');
        $clientConfig = config('demo.users.client');

        // Usuario admin demo
        $admin = User::firstOrCreate(
            ['email' => $adminConfig['email']],
            [
                'name' => $adminConfig['name'],
                'password' => $adminConfig['password'],
                'type' => $adminConfig['type'],
            ]
        );
        $admin->forceFill([
            'name' => $adminConfig['name'],
            'password' => $adminConfig['password'],
            'type' => $adminConfig['type'],
        ])->save();
        if (method_exists($admin, 'assignRole')) {
            $admin->syncRoles([$adminConfig['role']]);
        }

        // Usuario cliente demo
        $client = User::firstOrCreate(
            ['email' => $clientConfig['email']],
            [
                'name' => $clientConfig['name'],
                'password' => $clientConfig['password'],
                'type' => $clientConfig['type'],
            ]
        );
        $client->forceFill([
            'name' => $clientConfig['name'],
            'password' => $clientConfig['password'],
            'type' => $clientConfig['type'],
        ])->save();
        if (method_exists($client, 'assignRole')) {
            $client->syncRoles([$clientConfig['role']]);
        }

        Customer::updateOrCreate(
            ['user_id' => $client->id],
            [
                'name' => $client->name,
                'email' => $client->email,
                'phone' => $clientConfig['phone'],
                'address' => $clientConfig['address'],
            ]
        );

        // Categorías
        $cats = collect(['Electrónica', 'Hogar', 'Deportes', 'Moda'])->map(function ($n) {
            return Category::firstOrCreate([
                'slug' => Str::slug($n)
            ], [
                'name' => $n,
                'description' => $n . ' y más',
            ]);
        });

        // Proveedor
        $prov = Provider::firstOrCreate([
            'name' => 'Proveedor Demo'
        ], [
            'contact_name' => 'Juan Pérez',
            'phone' => '+58 412-0000000',
            'email' => 'proveedor@example.com',
            'address' => 'Caracas',
        ]);

        // Productos
        foreach (range(1, 8) as $i) {
            Product::firstOrCreate([
                'sku' => 'SKU-' . str_pad((string)$i, 4, '0', STR_PAD_LEFT)
            ], [
                'name' => 'Producto ' . $i,
                'category_id' => $cats->random()->id,
                'description' => 'Descripción del producto ' . $i,
                'price_usd' => rand(10, 120),
                'image_url' => null,
                'stock' => rand(5, 50),
                'is_featured' => $i <= 4,
            ]);
        }
    }
}
