<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_cliente_puede_ver_su_panel(): void
    {
        $role = \Spatie\Permission\Models\Role::firstOrCreate([
            'name' => 'cliente',
            'guard_name' => 'web',
        ]);
        $user = User::factory()->create();
        $user->assignRole($role);
        // Refrescar permisos en la sesión (Spatie bug en tests)
        $user->syncPermissions($user->getPermissionsViaRoles());
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        // Crear tipo de identificación requerido
        \App\Models\IdentificationType::factory()->create(['id' => 1]);
        Customer::factory()->create(['user_id' => $user->id, 'identification_type_id' => 1]);

        $response = $this->actingAs($user)->get('/mi-panel');
        $response->assertStatus(200);
        $response->assertSee('panel'); // Ajustar según contenido real
    }

    public function test_no_cliente_no_puede_ver_panel(): void
    {
        $role = \Spatie\Permission\Models\Role::firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'web',
        ]);
        $user = User::factory()->create();
        $user->assignRole($role);
        $response = $this->actingAs($user)->get('/mi-panel');
        $response->assertStatus(403);
    }
}
