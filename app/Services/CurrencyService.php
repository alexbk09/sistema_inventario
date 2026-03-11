<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class CurrencyService
{
    public function usdToBs(float $amountUsd): float
    {
        $promedio = $this->getPromedio('oficial');
        $rate = $promedio !== null ? (float) $promedio : (float) config('currency.bs_rate', (float) env('BS_RATE', 0));
        return round($amountUsd * ($rate ?: 0), 2);
    }

    public function fetchRateFromApi(?string $apiUrl = null): ?float
    {
        // Mantiene compatibilidad pero ahora intenta leer "promedio" del API público.
        $promedio = $this->getPromedio('oficial', $apiUrl);
        return $promedio !== null ? (float) $promedio : null;
    }

    /**
     * Obtiene los promedios por fuente desde la API.
     * Devuelve un arreglo asociativo: ['oficial' => float, 'paralelo' => float]
     */
    public function getPromedios(?string $apiUrl = null): array
    {
        $url = 'https://ve.dolarapi.com/v1/dolares';
        try {
            $resp = Http::timeout(8)->get($url);
      
            if (!$resp->ok()) {
                return [];
            }
            $json = $resp->json();
            // La API devuelve un array de objetos con claves: fuente, promedio
            if (!is_array($json)) {
                return [];
            }
            $out = [];
            foreach ($json as $item) {
                if (is_array($item) && isset($item['fuente']) && array_key_exists('promedio', $item)) {
                    $fuente = (string) $item['fuente'];
                    $out[$fuente] = $item['promedio'] !== null ? (float) $item['promedio'] : null;
                }
            }
            return $out;
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Obtiene el promedio para una fuente específica (por defecto: 'oficial').
     */
    public function getPromedio(string $fuente = 'oficial', ?string $apiUrl = null): ?float
    {
        $all = $this->getPromedios($apiUrl);
        if (!array_key_exists($fuente, $all)) {
            return null;
        }
        $val = $all[$fuente];
        return $val !== null ? (float) $val : null;
    }
}
