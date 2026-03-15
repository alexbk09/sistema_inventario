<?php

namespace App\Support;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class Audit
{
    /**
     * Registrar una acción de auditoría básica.
     */
    public static function log(string $action, string $module, $model = null, array $changes = []): void
    {
        try {
            AuditLog::create([
                'user_id' => Auth::id(),
                'action' => $action,
                'module' => $module,
                'auditable_type' => $model ? get_class($model) : null,
                'auditable_id' => $model?->getKey(),
                'changes' => !empty($changes) ? $changes : null,
                'ip_address' => Request::ip(),
                'user_agent' => Request::userAgent(),
            ]);
        } catch (\Throwable $e) {
            // Nunca romper el flujo de la app por fallos de auditoría
        }
    }
}
