<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Customer;
use App\Models\IdentificationType;

class CustomerProfileController extends Controller
{
    public function update(Request $request)
    {
        $user = Auth::user();
        $customer = Customer::where('user_id', $user->id)->firstOrFail();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'identification' => 'nullable|string|max:50',
            'identification_type_id' => 'nullable|exists:identification_types,id',
        ]);

        $customer->update($validated);

        return back()->with('success', __('app.profile.customer.notifications.updated'));
    }

    public function identificationTypes()
    {
        return IdentificationType::all(['id', 'name', 'code']);
    }
}
