<?php

namespace Database\Factories;

use App\Models\IdentificationType;
use Illuminate\Database\Eloquent\Factories\Factory;

class IdentificationTypeFactory extends Factory
{
    protected $model = IdentificationType::class;

    public function definition(): array
    {
        return [
            'code' => $this->faker->unique()->randomElement(['J', 'N', 'E']),
            'name' => $this->faker->word(),
        ];
    }
}
