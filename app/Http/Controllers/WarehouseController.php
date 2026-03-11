<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WarehouseController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user() || !$request->user()->can('view warehouses')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para acceder al módulo de sucursales.');
        }

        $warehouses = Warehouse::orderBy('name')->paginate(20)->withQueryString();

        return Inertia::render('Admin/Warehouse/Index', [
            'warehouses' => $warehouses,
        ]);
    }

    public function store(Request $request)
    {
        if (!$request->user() || !$request->user()->can('manage warehouses')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para crear o editar sucursales.');
        }

        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'code' => ['required','string','max:50','unique:warehouses,code'],
            'address' => ['nullable','string','max:255'],
        ]);

        Warehouse::create($data);

        return redirect()->route('admin.warehouses.index')->with('success', 'Sucursal creada correctamente.');
    }
}
