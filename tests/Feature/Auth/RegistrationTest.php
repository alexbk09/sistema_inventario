<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        // Asegura que el rol 'cliente' exista antes del registro
        \Spatie\Permission\Models\Role::firstOrCreate([
            'name' => 'cliente',
            'guard_name' => 'web',
        ]);
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response = $this->followingRedirects()->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'phone' => '04141234567',
            'address' => 'Calle Falsa 123',
        ]);
        $user = \App\Models\User::where('email', 'test@example.com')->first();
        if ($user) {
            $user->syncPermissions($user->getPermissionsViaRoles());
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        }
        $response->assertSee('panel'); // Ajustar según contenido real del dashboard
    }
}
