<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->only(['module', 'action', 'user_id', 'date_from', 'date_to']);

        $query = AuditLog::with('user')->latest();

        if (!empty($filters['module'])) {
            $query->where('module', $filters['module']);
        }
        if (!empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }
        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }
        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        $logs = $query->paginate(20)->withQueryString();

        $users = User::orderBy('name')->get(['id','name']);

        return Inertia::render('Admin/Security/Audit/Index', [
            'logs' => $logs,
            'filters' => $filters,
            'users' => $users,
        ]);
    }
}
