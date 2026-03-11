<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            DemoSeeder::class,
            IdentificationTypeSeeder::class,
        ]);

        // User::factory(10)->create();
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                // Si no usas factory aquí, asegúrate de tener un password por defecto
                'password' => bcrypt('password'),
            ]
        );
    }
}
