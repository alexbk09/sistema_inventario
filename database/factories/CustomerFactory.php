<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'identification_type_id' => 1,
            'identification' => $this->faker->unique()->numerify('V########'),
            'name' => $this->faker->name(),
            'phone' => $this->faker->phoneNumber(),
            'email' => $this->faker->unique()->safeEmail(),
            'address' => $this->faker->address(),
            'loyalty_points' => 0,
            'lifetime_spent_usd' => 0,
            'last_purchase_at' => null,
        ];
    }
}
