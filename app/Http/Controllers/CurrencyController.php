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
                'message' => 'No se pudo obtener el promedio',
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
        $data = $service->getPromedios($apiUrl);
        return response()->json([
            'ok' => true,
            'data' => $data,
        ])
        ->header('Cache-Control', 'no-store, no-cache, must-revalidate')
        ->header('Pragma', 'no-cache');
    }
}
