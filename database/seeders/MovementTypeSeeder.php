<?php

namespace Database\Seeders;

use App\Models\MovementType;
use Illuminate\Database\Seeder;

class MovementTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['code' => 'purchase', 'name' => 'Compra'],
            ['code' => 'sale', 'name' => 'Venta'],
            ['code' => 'adjustment', 'name' => 'Ajuste'],
            ['code' => 'return', 'name' => 'Devolución'],
            ['code' => 'loss', 'name' => 'Pérdida'],
            ['code' => 'waste', 'name' => 'Merma / Descarte'],
            ['code' => 'transfer_out', 'name' => 'Traslado - Salida'],
            ['code' => 'transfer_in', 'name' => 'Traslado - Entrada'],
        ];

        foreach ($types as $type) {
            MovementType::updateOrCreate(
                ['code' => $type['code']],
                ['name' => $type['name']]
            );
        }
    }
}
