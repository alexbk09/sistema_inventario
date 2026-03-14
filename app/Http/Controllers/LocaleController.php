<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LocaleController extends Controller
{
    public function switch(string $locale, Request $request): RedirectResponse
    {
        if (!in_array($locale, ['es', 'en'], true)) {
            $locale = config('app.locale');
        }

        session(['locale' => $locale]);

        return back();
    }
}
