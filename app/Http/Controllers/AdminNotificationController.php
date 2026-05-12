<?php

namespace App\Http\Controllers;

use App\Models\AdminNotification;
use App\Services\AdminNotificationService;
use App\Support\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminNotificationController extends Controller
{
    public function index(Request $request, AdminNotificationService $notificationService): Response
    {
        $user = $request->user();
        $bellMutedTypes = $user->mutedNotificationTypes('bell');
        $historyMutedTypes = $user->mutedNotificationTypes('history');
        $filters = [
            'search' => trim((string) $request->input('search', '')),
            'status' => (string) $request->input('status', 'all'),
            'severity' => (string) $request->input('severity', ''),
            'type' => (string) $request->input('type', ''),
            'visibility' => (string) $request->input('visibility', 'visible'),
        ];

        $baseQuery = AdminNotification::query()->where('user_id', $user->id);

        $applyContentFilters = function ($notificationQuery) use ($filters) {
            return $notificationQuery
                ->when($filters['search'] !== '', function ($query) use ($filters) {
                    $query->where(function ($searchQuery) use ($filters) {
                        $searchQuery->where('title', 'like', '%'.$filters['search'].'%')
                            ->orWhere('message', 'like', '%'.$filters['search'].'%');
                    });
                })
                ->when($filters['status'] === 'unread', fn ($query) => $query->whereNull('read_at'))
                ->when($filters['status'] === 'read', fn ($query) => $query->whereNotNull('read_at'))
                ->when($filters['severity'] !== '', fn ($query) => $query->where('severity', $filters['severity']))
                ->when($filters['type'] !== '', fn ($query) => $query->where('type', $filters['type']));
        };

        $applyVisibilityFilter = function ($notificationQuery, string $visibility) use ($bellMutedTypes, $historyMutedTypes) {
            return $notificationQuery
                ->when($visibility === 'visible' && $historyMutedTypes !== [], fn ($query) => $query->whereNotIn('type', $historyMutedTypes))
                ->when($visibility === 'bell_muted', fn ($query) => $bellMutedTypes === [] ? $query->whereRaw('1 = 0') : $query->whereIn('type', $bellMutedTypes))
                ->when($visibility === 'history_muted', fn ($query) => $historyMutedTypes === [] ? $query->whereRaw('1 = 0') : $query->whereIn('type', $historyMutedTypes));
        };

        $visibilityQuery = $applyVisibilityFilter(clone $baseQuery, $filters['visibility']);

        $query = $applyContentFilters(clone $visibilityQuery)
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $notificationTypes = (clone $baseQuery)
            ->select('type')
            ->distinct()
            ->orderBy('type')
            ->pluck('type')
            ->values();

        $metrics = [
            'total' => $applyContentFilters(clone $visibilityQuery)->count(),
            'unread' => $applyContentFilters(clone $visibilityQuery)->whereNull('read_at')->count(),
            'critical' => $applyContentFilters(clone $visibilityQuery)->whereNull('read_at')->where('severity', 'danger')->count(),
            'warnings' => $applyContentFilters(clone $visibilityQuery)->whereNull('read_at')->where('severity', 'warning')->count(),
        ];

        $visibilityCounts = [
            'visible' => $applyContentFilters($applyVisibilityFilter(clone $baseQuery, 'visible'))->count(),
            'bell_muted' => $applyContentFilters($applyVisibilityFilter(clone $baseQuery, 'bell_muted'))->count(),
            'history_muted' => $applyContentFilters($applyVisibilityFilter(clone $baseQuery, 'history_muted'))->count(),
        ];

        return Inertia::render('Admin/Notification/Index', [
            'notifications' => $query,
            'filters' => $filters,
            'metrics' => $metrics,
            'visibilityCounts' => $visibilityCounts,
            'types' => $notificationTypes,
            'availableTypes' => $notificationService->availableTypes(),
            'bellMutedTypes' => $bellMutedTypes,
            'historyMutedTypes' => $historyMutedTypes,
            'preferenceType' => (string) $request->input('preference_type', ''),
        ]);
    }

    public function updatePreferences(Request $request, AdminNotificationService $notificationService): RedirectResponse
    {
        $availableTypes = $notificationService->availableTypes();
        $user = $request->user();
        $beforeBellMutedTypes = $user->mutedNotificationTypes('bell');
        $beforeHistoryMutedTypes = $user->mutedNotificationTypes('history');

        $data = $request->validate([
            'bell_muted_types' => ['nullable', 'array'],
            'bell_muted_types.*' => ['string', 'in:'.implode(',', $availableTypes)],
            'history_muted_types' => ['nullable', 'array'],
            'history_muted_types.*' => ['string', 'in:'.implode(',', $availableTypes)],
            'source' => ['nullable', 'string', 'max:100'],
            'context' => ['nullable', 'array'],
            'context.channel' => ['nullable', 'string', 'in:bell,history'],
            'context.type' => ['nullable', 'string', 'in:'.implode(',', $availableTypes)],
            'context.operation' => ['nullable', 'string', 'in:muted,unmuted,saved,reset'],
        ]);

        $notificationService->updatePreferences($user, [
            'bell' => $data['bell_muted_types'] ?? [],
            'history' => $data['history_muted_types'] ?? [],
        ]);
        $notificationService->syncSystemNotifications();

        $freshUser = $user->fresh();
        $afterBellMutedTypes = $freshUser->mutedNotificationTypes('bell');
        $afterHistoryMutedTypes = $freshUser->mutedNotificationTypes('history');

        Audit::log('notification_preferences_updated', 'notifications', $user, [
            'source' => $data['source'] ?? 'preferences_panel',
            'context' => $data['context'] ?? null,
            'has_changes' => $beforeBellMutedTypes !== $afterBellMutedTypes || $beforeHistoryMutedTypes !== $afterHistoryMutedTypes,
            'before' => [
                'bell_muted_types' => $beforeBellMutedTypes,
                'history_muted_types' => $beforeHistoryMutedTypes,
            ],
            'after' => [
                'bell_muted_types' => $afterBellMutedTypes,
                'history_muted_types' => $afterHistoryMutedTypes,
            ],
            'diff' => [
                'bell' => [
                    'added' => array_values(array_diff($afterBellMutedTypes, $beforeBellMutedTypes)),
                    'removed' => array_values(array_diff($beforeBellMutedTypes, $afterBellMutedTypes)),
                ],
                'history' => [
                    'added' => array_values(array_diff($afterHistoryMutedTypes, $beforeHistoryMutedTypes)),
                    'removed' => array_values(array_diff($beforeHistoryMutedTypes, $afterHistoryMutedTypes)),
                ],
            ],
        ]);

        return back()->with('success', __('app.admin.notifications.preferences_updated'));
    }

    public function markRead(Request $request, AdminNotification $notification, AdminNotificationService $notificationService): RedirectResponse
    {
        $user = $request->user();
        $wasUnread = $notification->read_at === null;
        $notificationService->markAsRead($notification, $request->user());

        Audit::log('notification_read', 'notifications', $notification, [
            'notification_id' => $notification->id,
            'type' => $notification->type,
            'title' => $notification->title,
            'was_unread' => $wasUnread,
            'user_id' => $user->id,
        ]);

        return back();
    }

    public function bulkUpdate(Request $request, AdminNotificationService $notificationService): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'action' => ['required', 'in:read,delete'],
            'notification_ids' => ['required', 'array', 'min:1'],
            'notification_ids.*' => ['integer', 'exists:admin_notifications,id'],
        ]);

        $notificationIds = array_values(array_unique(array_map('intval', $data['notification_ids'])));
        $targetNotifications = AdminNotification::query()
            ->where('user_id', $user->id)
            ->whereIn('id', $notificationIds)
            ->get(['id', 'type', 'read_at']);

        if ($data['action'] === 'read') {
            $notificationService->markSelectedAsRead($user, $notificationIds);

            Audit::log('notifications_bulk_read', 'notifications', $user, [
                'notification_ids' => $targetNotifications->pluck('id')->values()->all(),
                'types' => $targetNotifications->pluck('type')->unique()->values()->all(),
                'affected_unread_count' => $targetNotifications->whereNull('read_at')->count(),
                'requested_count' => count($notificationIds),
            ]);

            return back()->with('success', __('app.admin.notifications.selected_marked_read'));
        }

        $notificationService->deleteSelected($user, $notificationIds);

        Audit::log('notifications_bulk_deleted', 'notifications', $user, [
            'notification_ids' => $targetNotifications->pluck('id')->values()->all(),
            'types' => $targetNotifications->pluck('type')->unique()->values()->all(),
            'deleted_count' => $targetNotifications->count(),
            'requested_count' => count($notificationIds),
        ]);

        return back()->with('success', __('app.admin.notifications.selected_deleted'));
    }

    public function markAllRead(Request $request, AdminNotificationService $notificationService): RedirectResponse
    {
        $user = $request->user();
        $unreadNotifications = AdminNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->get(['id', 'type']);

        $notificationService->markAllAsRead($user);

        Audit::log('notifications_mark_all_read', 'notifications', $user, [
            'notification_ids' => $unreadNotifications->pluck('id')->values()->all(),
            'types' => $unreadNotifications->pluck('type')->unique()->values()->all(),
            'affected_count' => $unreadNotifications->count(),
        ]);

        return back();
    }

    public function destroy(Request $request, AdminNotification $notification, AdminNotificationService $notificationService): RedirectResponse
    {
        $snapshot = [
            'notification_id' => $notification->id,
            'type' => $notification->type,
            'title' => $notification->title,
            'read_at' => optional($notification->read_at)?->toIso8601String(),
        ];

        $notificationService->delete($notification, $request->user());

        Audit::log('notification_deleted', 'notifications', $request->user(), $snapshot);

        return back();
    }
}