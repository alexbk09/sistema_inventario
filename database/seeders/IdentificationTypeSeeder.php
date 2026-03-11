<?php

namespace Database\Seeders;

use App\Models\IdentificationType;
use Illuminate\Database\Seeder;

class IdentificationTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['code' => 'J', 'name' => 'Jurídica'],
            ['code' => 'N', 'name' => 'Natural'],
            ['code' => 'E', 'name' => 'Extranjero'],
        ];

        foreach ($types as $type) {
            IdentificationType::firstOrCreate(['code' => $type['code']], $type);
        }
    }
}
