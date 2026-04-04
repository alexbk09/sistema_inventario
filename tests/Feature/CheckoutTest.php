<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_screen_can_be_rendered(): void
    {
        $response = $this->get('/checkout');
        $response->assertStatus(200);
    }

    public function test_guest_can_make_checkout(): void
    {
        $category = \App\Models\Category::factory()->create();
        $product = Product::factory()->create([
            'stock' => 10,
            'price_usd' => 100,
            'category_id' => $category->id,
        ]);

        $payload = [
            'fullName' => 'Cliente Prueba',
            'identification_type_id' => 1, // Debe existir en la tabla
            'identification' => 'V12345678',
            'email' => 'cliente@prueba.com',
            'phone' => '04141234567',
            'address' => 'Calle Falsa 123',
            'city' => 'Ciudad',
            'zipCode' => '1000',
            'paymentMethod' => 'transferencia',
            'bank' => 'Banco A',
            'originBank' => 'Banco B',
            'reference' => 'REF123',
            'date' => now()->toDateString(),
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                    'price_usd' => 100,
                ]
            ],
        ];

        // Crear tipo de identificación si no existe
        \App\Models\IdentificationType::factory()->create(['id' => 1]);

        $response = $this->post('/checkout', $payload);
        $response->assertRedirect(route('checkout.confirmation', absolute: false));
        $this->assertDatabaseHas('invoices', [
            'total_usd' => 200.0 + 200.0 + 0.0 + 30.0, // items + shipping + paymentFee + tax
        ]);
    }
}
