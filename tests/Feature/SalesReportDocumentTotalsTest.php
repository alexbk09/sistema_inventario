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

class SalesReportDocumentTotalsTest extends TestCase
{
    use RefreshDatabase;

    public function test_sales_report_uses_document_totals_for_metrics_and_rows(): void
    {
        $user = $this->createAdminUserWithPermission('view invoices');
        $this->seedCurrencySettings();

        $identificationType = IdentificationType::create([
            'code' => 'V',
            'name' => 'Venezolano',
        ]);

        $customer = Customer::factory()->create([
            'identification_type_id' => $identificationType->id,
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
            'created_at' => now()->subDay(),
            'updated_at' => now()->subDay(),
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
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($user)->get(route('admin.reports.sales.index'), [
            'X-Inertia' => 'true',
            'X-Requested-With' => 'XMLHttpRequest',
        ]);

        $response->assertOk();

        $payload = $response->json();

        $this->assertSame('Admin/Reports/Sales/Index', $payload['component']);
        $this->assertSame(['USD', 'EUR'], $payload['props']['adminCurrencyContext']['codes']);
        $this->assertEquals(150.0, $payload['props']['metricsByCurrency']['USD']);
        $this->assertEquals(135.0, $payload['props']['metricsByCurrency']['EUR']);
        $this->assertEquals(75.0, $payload['props']['metrics']['avg_ticket_admin_totals']['USD']);
        $this->assertEquals(67.5, $payload['props']['metrics']['avg_ticket_admin_totals']['EUR']);

        $rowsByNumber = collect($payload['props']['invoices']['data'])->keyBy('number');
        $this->assertEquals(90.0, $rowsByNumber['F-0001']['admin_totals']['EUR']);
        $this->assertEquals(45.0, $rowsByNumber['F-0002']['admin_totals']['EUR']);
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
                    'manual_rate' => 0.5,
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
