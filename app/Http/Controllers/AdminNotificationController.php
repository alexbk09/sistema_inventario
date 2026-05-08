<?php

namespace App\Http\Controllers;

use App\Models\AdminNotification;
use App\Services\AdminNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    public function markRead(Request $request, AdminNotification $notification, AdminNotificationService $notificationService): RedirectResponse
    {
        $notificationService->markAsRead($notification, $request->user());

        return back();
    }

    public function markAllRead(Request $request, AdminNotificationService $notificationService): RedirectResponse
    {
        $notificationService->markAllAsRead($request->user());

        return back();
    }

    public function destroy(Request $request, AdminNotification $notification, AdminNotificationService $notificationService): RedirectResponse
    {
        $notificationService->delete($notification, $request->user());

        return back();
    }
}