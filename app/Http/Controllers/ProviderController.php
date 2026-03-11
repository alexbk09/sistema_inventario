<?php

namespace App\Http\Controllers;

use App\Models\Provider;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProviderController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->input('search', ''));

        $providers = Provider::query()
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                        ->orWhere('contact_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Admin/Provider/Index', [
            'providers' => $providers,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Provider/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'contact_name' => ['nullable','string','max:255'],
            'phone' => ['nullable','string','max:64'],
            'email' => ['nullable','email','max:255'],
            'address' => ['nullable','string','max:255'],
        ]);
        Provider::create($data);
        return redirect()->route('admin.providers.index');
    }

    public function edit(Provider $provider)
    {
        return Inertia::render('Admin/Provider/Edit', [
            'provider' => $provider,
        ]);
    }

    public function update(Request $request, Provider $provider)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'contact_name' => ['nullable','string','max:255'],
            'phone' => ['nullable','string','max:64'],
            'email' => ['nullable','email','max:255'],
            'address' => ['nullable','string','max:255'],
        ]);
        $provider->update($data);
        return redirect()->route('admin.providers.index');
    }

    public function destroy(Provider $provider)
    {
        $provider->delete();
        return redirect()->route('admin.providers.index');
    }
}
