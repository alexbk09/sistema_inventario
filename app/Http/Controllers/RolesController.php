<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesController extends Controller
{
    public function index()
    {
        $roles = Role::with('permissions')->get();
        $permissions = Permission::orderBy('name')->get();
        return Inertia::render('Admin/Security/Roles/Index', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function edit(Role $role)
    {
        $permissions = Permission::orderBy('name')->get();
        $role->load('permissions');
        return Inertia::render('Admin/Security/Roles/Edit', [
            'role' => $role,
            'permissions' => $permissions,
        ]);
    }

    public function update(Request $request, Role $role)
    {
        $data = $request->validate([
            'permission_ids' => ['array'],
            'permission_ids.*' => ['integer','exists:permissions,id'],
        ]);
        $ids = $data['permission_ids'] ?? [];
        $role->syncPermissions(Permission::whereIn('id', $ids)->get());
        return redirect()->route('admin.roles.index');
    }
}
