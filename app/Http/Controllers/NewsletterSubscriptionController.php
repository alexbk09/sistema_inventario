<?php

namespace App\Http\Controllers;

use App\Models\NewsletterSubscription;
use Illuminate\Http\Request;

class NewsletterSubscriptionController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => ['nullable', 'email', 'max:255'],
            'whatsapp' => ['nullable', 'string', 'max:30'],
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        if (empty($validated['email']) && empty($validated['whatsapp'])) {
            return back()->withErrors([
                'newsletter' => 'Debes indicar al menos un email o número de WhatsApp.',
            ])->withInput();
        }

        NewsletterSubscription::create([
            'email' => $validated['email'] ?? null,
            'whatsapp' => $validated['whatsapp'] ?? null,
            'name' => $validated['name'] ?? null,
            'source' => 'home',
            'ip_address' => $request->ip(),
        ]);

        return back()->with('newsletter_subscribed', true);
    }
}
