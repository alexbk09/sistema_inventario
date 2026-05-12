<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\User;
use App\Models\Warehouse;
use App\Support\Settings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class InventoryReportCurrencyVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_inventory_report_exposes_only_admin_visible_currencies(): void
    {
        $user = $this->createAdminUserWithPermission('view products');
        $this->seedInventoryCurrencyFixture();

        $response = $this->actingAs($user)->get(route('admin.reports.inventory.index'), [
            'X-Inertia' => 'true',
            'X-Requested-With' => 'XMLHttpRequest',
        ]);

        $response->assertOk();

        $payload = $response->json();

        $this->assertSame('Admin/Reports/Inventory/Index', $payload['component']);
        $this->assertSame(['USD', 'EUR'], $payload['props']['adminCurrencyContext']['codes']);
        $this->assertArrayNotHasKey('VES', $payload['props']['valuation']['total_cost_admin_totals']);
        $this->assertEquals(50.0, $payload['props']['valuation']['total_cost_admin_totals']['USD']);
        $this->assertEquals(45.0, $payload['props']['valuation']['total_cost_admin_totals']['EUR']);
        $this->assertEquals(100.0, $payload['props']['products']['data'][0]['value_price_admin_totals']['USD']);
        $this->assertEquals(90.0, $payload['props']['products']['data'][0]['value_price_admin_totals']['EUR']);
    }

    public function test_inventory_csv_export_uses_visible_currency_columns(): void
    {
        $user = $this->createAdminUserWithPermission('view products');
        $this->seedInventoryCurrencyFixture();

        $response = $this->actingAs($user)->get(route('admin.reports.inventory.export'));

        $response->assertOk();
        $content = $response->streamedContent();

        $this->assertStringContainsString(__('app.report_exports.inventory.columns.avg_cost_usd').' USD', $content);
        $this->assertStringContainsString(__('app.report_exports.inventory.columns.value_cost_usd').' EUR', $content);
        $this->assertStringNotContainsString(__('app.report_exports.inventory.columns.value_cost_usd').' VES', $content);
    }

    public function test_inventory_kardex_exposes_visible_currency_totals_per_movement(): void
    {
        $user = $this->createAdminUserWithPermission('view products');
        $product = $this->seedInventoryCurrencyFixture();
        $warehouse = Warehouse::create([
            'name' => 'Central',
            'code' => 'CEN',
        ]);

        InventoryMovement::create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'entry',
            'quantity' => 3,
            'unit_price_usd' => 12,
            'cost_usd' => 12,
            'total_value_usd' => 36,
            'notes' => 'Ingreso inicial',
        ]);

        $response = $this->actingAs($user)->get(route('admin.reports.inventory.kardex', [
            'product_id' => $product->id,
        ]), [
            'X-Inertia' => 'true',
            'X-Requested-With' => 'XMLHttpRequest',
        ]);

        $response->assertOk();

        $payload = $response->json();

        $this->assertSame('Admin/Reports/Inventory/Kardex', $payload['component']);
        $this->assertSame(['USD', 'EUR'], $payload['props']['adminCurrencyContext']['codes']);
        $this->assertEquals(12.0, $payload['props']['movements']['data'][0]['unit_price_admin_totals']['USD']);
        $this->assertEquals(10.8, $payload['props']['movements']['data'][0]['unit_price_admin_totals']['EUR']);
        $this->assertArrayNotHasKey('VES', $payload['props']['movements']['data'][0]['unit_price_admin_totals']);
        $this->assertEquals(36.0, $payload['props']['movements']['data'][0]['total_value_admin_totals']['USD']);
        $this->assertEquals(32.4, $payload['props']['movements']['data'][0]['total_value_admin_totals']['EUR']);
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

    protected function seedInventoryCurrencyFixture(): Product
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

        $category = Category::create([
            'name' => 'Categoria prueba',
            'slug' => 'categoria-prueba',
        ]);

        $product = Product::factory()->create([
            'category_id' => $category->id,
            'stock' => 5,
            'average_cost_usd' => 10,
            'price_usd' => 20,
        ]);

        $product->categories()->attach($category->id);

        return $product;
    }
}