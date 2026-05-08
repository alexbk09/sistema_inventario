<?php

namespace App\Http\Controllers;

use App\Services\CurrencyService;
use Illuminate\Http\Request;

class CurrencyController extends Controller
{
    public function promedio(Request $request, CurrencyService $service)
    {
        $fuente = $request->query('fuente', 'oficial');
        $apiUrl = $request->query('api');
        $valor = $service->getPromedio($fuente, $apiUrl);
        if ($valor === null) {
            return response()->json([
                'ok' => false,
                'message' => __('app.currency.average_unavailable'),
                'fuente' => $fuente,
            ], 502)
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate')
            ->header('Pragma', 'no-cache');
        }
        return response()->json([
            'ok' => true,
            'fuente' => $fuente,
            'promedio' => $valor,
        ])
        ->header('Cache-Control', 'no-store, no-cache, must-revalidate')
        ->header('Pragma', 'no-cache');
    }

    public function promedios(Request $request, CurrencyService $service)
    {
        $apiUrl = $request->query('api');
        $legacy = $request->boolean('legacy', false);

        if ($legacy) {
            $data = $service->getPromedios($apiUrl);
            return response()->json([
                'ok' => true,
                'data' => $data,
            ])
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate')
            ->header('Pragma', 'no-cache');
        }

        $data = $service->getConfiguredExchangeRates();
        return response()->json([
            'ok' => true,
            'data' => $data,
        ])
        ->header('Cache-Control', 'no-store, no-cache, must-revalidate')
        ->header('Pragma', 'no-cache');
    }
}
