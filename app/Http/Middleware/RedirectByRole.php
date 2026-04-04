<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RedirectByRole
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();
        if ($user) {
            if ($user->hasAnyRole(['admin', 'supervisor', 'cashier', 'warehouse'])) {
                return redirect()->route('dashboard');
            }
            // Si el usuario tiene otro rol, puedes agregar más redirecciones aquí
            // Fallback: si no tiene roles conocidos, redirigir a home
            return redirect()->route('home');
        }
        return $next($request);
    }
}