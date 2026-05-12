<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\IdentificationType;
use App\Models\Invoice;
use App\Models\User;
use App\Support\Settings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class CustomerCurrencyTotalsTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_show_uses_document_totals_for_lifetime_spent(): void
    {
        $user = $this->createAdminUserWithPermission('view customers');
        $this->seedCurrencySettings();

        $identificationType = IdentificationType::create([
            'code' => 'V',
            'name' => 'Venezolano',
        ]);

        $customer = Customer::factory()->create([
            'identification_type_id' => $identificationType->id,
            'lifetime_spent_usd' => 999,
        ]);

        Invoice::create([
            'number' => 'F-0001',
            'document_type' => 'invoice',
            'customer_id' => $customer->id,
            'status' => 'paid',
            'total_usd' => 100,
            'total_bs' => 3600,
            'currency_code' => 'USD',
            'base_currency_code' => 'USD',
            'exchange_rate_snapshot' => 1,
            'exchange_rate_source' => 'manual',
            'monetary_totals_json' => [
                'totals' => [
                    'USD' => 100.0,
                    'EUR' => 90.0,
                ],
                'rates' => [
                    'USD' => 1,
                    'EUR' => 0.9,
                ],
            ],
        ]);

        Invoice::create([
            'number' => 'F-0002',
            'document_type' => 'invoice',
            'customer_id' => $customer->id,
            'status' => 'paid',
            'total_usd' => 50,
            'total_bs' => 1800,
            'currency_code' => 'USD',
            'base_currency_code' => 'USD',
            'exchange_rate_snapshot' => 1,
            'exchange_rate_source' => 'manual',
            'monetary_totals_json' => [
                'totals' => [
                    'USD' => 50.0,
                    'EUR' => 45.0,
                ],
                'rates' => [
                    'USD' => 1,
                    'EUR' => 0.9,
                ],
            ],
        ]);

        $response = $this->actingAs($user)->get(route('admin.customers.show', $customer), [
            'X-Inertia' => 'true',
            'X-Requested-With' => 'XMLHttpRequest',
        ]);

        $response->assertOk();

        $payload = $response->json();

        $this->assertSame('Admin/Customer/Show', $payload['component']);
        $this->assertSame(['USD', 'EUR'], $payload['props']['adminCurrencyContext']['codes']);
        $this->assertEquals(150.0, $payload['props']['customerMoney']['lifetime_spent']['totals']['USD']);
        $this->assertEquals(135.0, $payload['props']['customerMoney']['lifetime_spent']['totals']['EUR']);
        $this->assertEquals(999.0, $payload['props']['customer']['lifetime_spent_usd']);
    }

    protected function createAdminUserWithPermission(string $permissionName): User
    {
        $role = Role::firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'web',
        ]);

        $permission = Permission::firstOrCreate([
            'name' => $permissionName,
            'guard_name' => 'web',
        ]);

        $role->givePermissionTo($permission);

        $user = User::factory()->create();
        $user->assignRole($role);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    protected function seedCurrencySettings(): void
    {
        Settings::set('currency', [
            'base_currency' => 'USD',
            'default_display_currency' => 'USD',
            'supported_currencies' => [
                [
                    'code' => 'USD',
                    'name' => 'US Dollar',
                    'symbol' => '$',
                    'enabled' => true,
                    'visible_in_store' => true,
                    'visible_in_admin' => true,
                    'allow_checkout' => true,
                    'rate_mode' => 'manual',
                    'rate_provider' => 'manual',
                    'manual_rate' => 1,
                ],
                [
                    'code' => 'EUR',
                    'name' => 'Euro',
                    'symbol' => 'EUR',
                    'enabled' => true,
                    'visible_in_store' => true,
                    'visible_in_admin' => true,
                    'allow_checkout' => true,
                    'rate_mode' => 'manual',
                    'rate_provider' => 'manual',
                    'manual_rate' => 0.9,
                ],
                [
                    'code' => 'VES',
                    'name' => 'Bolivar',
                    'symbol' => 'Bs.',
                    'enabled' => true,
                    'visible_in_store' => true,
                    'visible_in_admin' => false,
                    'allow_checkout' => true,
                    'rate_mode' => 'manual',
                    'rate_provider' => 'manual',
                    'manual_rate' => 36,
                ],
            ],
        ]);
    }
}
