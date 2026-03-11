<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\{Category, Product, Provider, Customer, User};
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // Usuario admin demo
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Administrador', 'password' => 'admin12345', 'type' => 'admin']
        );
        // Asegura que la contraseña sea la correcta (evita doble hash)
        $admin->forceFill(['password' => 'admin12345'])->save();
        if (method_exists($admin, 'assignRole')) {
            $admin->assignRole('admin');
        }

        // Usuario cliente demo
        $client = User::firstOrCreate(
            ['email' => 'cliente@example.com'],
            ['name' => 'Cliente Demo', 'password' => 'cliente12345', 'type' => 'client']
        );
        $client->forceFill(['password' => 'cliente12345'])->save();
        if (method_exists($client, 'assignRole')) {
            $client->assignRole('user');
        }

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
