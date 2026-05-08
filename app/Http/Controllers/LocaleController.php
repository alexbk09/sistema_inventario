<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LocaleController extends Controller
{
    public function switch(string $locale, Request $request): RedirectResponse
    {
        $supportedLocales = array_keys(config('locales.supported', []));

        if (!in_array($locale, $supportedLocales, true)) {
            $locale = config('app.locale');
        }

        session(['locale' => $locale]);

        return back();
    }
}
