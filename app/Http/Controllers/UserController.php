<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user() || !$request->user()->can('view users')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para acceder al módulo de usuarios.');
        }

        $search = trim((string) $request->input('search', ''));

        $users = User::query()
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->with('roles')
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Admin/User/Index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function show(Request $request, User $user)
    {
        if (!$request->user() || !$request->user()->can('view users')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para acceder al módulo de usuarios.');
        }

        $user->load('roles');

        return Inertia::render('Admin/User/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'type' => $user->type,
                'created_at' => $user->created_at,
                'roles' => $user->roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                    ];
                }),
            ],
        ]);
    }
}
