import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import AdminIndexShell from '@/Components/admin/AdminIndexShell.jsx';
import AdminPagination from '@/Components/admin/AdminPagination.jsx';
import ConfirmDialog from '@/Components/common/ConfirmDialog.jsx';
import toast from 'react-hot-toast';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';

export default function NotificationIndex({ notifications, filters = {}, metrics = {}, visibilityCounts = {}, types = [], availableTypes = [], bellMutedTypes = [], historyMutedTypes = [], preferenceType = '' }) {
    const { t } = useI18n();
    const { formatDateTime } = useLocaleFormat();
    const [localFilters, setLocalFilters] = useState({
        search: filters.search || '',
        status: filters.status || 'all',
        severity: filters.severity || '',
        type: filters.type || '',
        visibility: filters.visibility || 'visible',
    });
    const [selectedIds, setSelectedIds] = useState([]);
    const [confirmState, setConfirmState] = useState({ open: false, mode: null, ids: [] });
    const [confirmBusy, setConfirmBusy] = useState(false);
    const [actionBusy, setActionBusy] = useState(false);
    const [localBellMutedTypes, setLocalBellMutedTypes] = useState(bellMutedTypes);
    const [localHistoryMutedTypes, setLocalHistoryMutedTypes] = useState(historyMutedTypes);

    const page = notifications.current_page ?? notifications?.meta?.current_page ?? 1;
    const totalPages = notifications.last_page ?? notifications?.meta?.last_page ?? 1;
    const activeFilters = Object.values(filters || {}).filter((value) => value !== null && value !== undefined && value !== '' && value !== 'all').length;
    const notificationRows = notifications.data || [];
    const filterTypes = availableTypes.length > 0 ? availableTypes : types;
    const preferenceTargetType = preferenceType || '';
    const allSelected = notificationRows.length > 0 && notificationRows.every((notification) => selectedIds.includes(notification.id));
    const selectedCount = selectedIds.length;
    const bellMutedCount = localBellMutedTypes.length;
    const historyMutedCount = localHistoryMutedTypes.length;
    const selectedUnreadCount = useMemo(
        () => notificationRows.filter((notification) => selectedIds.includes(notification.id) && !notification.read_at).length,
        [notificationRows, selectedIds],
    );
    const visibilityMeta = useMemo(() => ({
        visible: {
            title: t('admin.notifications.visibility_notice.visible_title', 'Historial visible activo'),
            description: t('admin.notifications.visibility_notice.visible_description', 'Estas viendo solo las notificaciones que siguen visibles en tu historial personal.'),
            tone: 'border-sky-200 bg-sky-50 text-sky-800',
        },
        bell_muted: {
            title: t('admin.notifications.visibility_notice.bell_muted_title', 'Ocultas en campana'),
            description: t('admin.notifications.visibility_notice.bell_muted_description', 'Esta vista muestra tipos silenciados en la campana. Puedes reactivarlos o mantenerlos fuera del dropdown sin borrar el historial.'),
            tone: 'border-amber-200 bg-amber-50 text-amber-800',
        },
        history_muted: {
            title: t('admin.notifications.visibility_notice.history_muted_title', 'Ocultas en historial'),
            description: t('admin.notifications.visibility_notice.history_muted_description', 'Estas revisando notificaciones que tu historial normalmente oculta por preferencia. Desde aqui puedes reactivarlas rapidamente.'),
            tone: 'border-violet-200 bg-violet-50 text-violet-800',
        },
    }), [t]);

    useEffect(() => {
        setLocalBellMutedTypes(bellMutedTypes);
    }, [bellMutedTypes]);

    useEffect(() => {
        setLocalHistoryMutedTypes(historyMutedTypes);
    }, [historyMutedTypes]);

    useEffect(() => {
        setLocalFilters({
            search: filters.search || '',
            status: filters.status || 'all',
            severity: filters.severity || '',
            type: filters.type || '',
            visibility: filters.visibility || 'visible',
        });
    }, [filters.search, filters.severity, filters.status, filters.type, filters.visibility]);

    useEffect(() => {
        if (!preferenceTargetType) {
            return;
        }

        const targetCard = document.querySelector(`[data-preference-type="${preferenceTargetType}"]`);

        if (!targetCard) {
            return;
        }

        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [preferenceTargetType]);

    const severityTone = (severity) => {
        switch (severity) {
            case 'danger':
                return 'border-red-200 bg-red-50 text-red-700';
            case 'warning':
                return 'border-amber-200 bg-amber-50 text-amber-700';
            case 'success':
                return 'border-emerald-200 bg-emerald-50 text-emerald-700';
            default:
                return 'border-sky-200 bg-sky-50 text-sky-700';
        }
    };

    const translateType = (type) => {
        const fallback = String(type || '')
            .split('_')
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');

        return t(`admin.notifications.types.${type}`, fallback || t('admin.notifications.generic_type', 'Notificación'));
    };

    const translateStatus = (status) => t(`admin.notifications.filters.statuses.${status}`, status);

    const resolveNotificationContent = (notification) => {
        if (notification.type !== 'low_stock') {
            return {
                title: notification.title,
                message: notification.message,
                actionLabel: notification.action_label,
            };
        }

        const data = notification.data || {};

        if (!data.product_name && data.stock === undefined && !data.sku && data.min_stock === undefined) {
            return {
                title: notification.title,
                message: notification.message,
                actionLabel: notification.action_label,
            };
        }

        const messageParts = [
            t('admin.notifications.generated.low_stock.current_stock', 'Stock actual: :stock', {
                stock: data.stock ?? t('admin.common.table.values.empty_dash', '—'),
            }),
        ];

        if (data.min_stock !== null && data.min_stock !== undefined && Number(data.min_stock) > 0) {
            messageParts.push(t('admin.notifications.generated.low_stock.min_stock', 'Mínimo: :min_stock', {
                min_stock: data.min_stock,
            }));
        }

        if (data.sku) {
            messageParts.push(t('admin.notifications.generated.low_stock.sku', 'SKU: :sku', {
                sku: data.sku,
            }));
        }

        return {
            title: t('admin.notifications.generated.low_stock.title', 'Producto con stock bajo: :product', {
                product: data.product_name ?? notification.title,
            }),
            message: messageParts.join(' / '),
            actionLabel: t('admin.notifications.generated.low_stock.action', 'Revisar inventario'),
        };
    };

    const withActionToast = (loadingMessage, executor) => {
        if (actionBusy) {
            return;
        }

        const loadingId = `notifications-action-${Date.now()}`;
        setActionBusy(true);

        toast.loading(loadingMessage, { id: loadingId, position: 'top-center' });

        executor({
            onError: () => {
                toast.error(t('admin.notifications.action_error', 'No se pudo completar la accion.'), { id: loadingId, position: 'top-center' });
            },
            onFinish: () => {
                setActionBusy(false);
                setTimeout(() => toast.dismiss(loadingId), 800);
            },
        });
    };

    const submitFilters = () => {
        if (actionBusy) {
            return;
        }

        router.get(route('admin.notifications.index'), {
            ...localFilters,
            page: 1,
        }, { preserveScroll: true, replace: true });
    };

    const applyQuickVisibility = (visibility) => {
        if (actionBusy) {
            return;
        }

        const nextFilters = {
            ...localFilters,
            visibility,
        };

        setLocalFilters(nextFilters);
        router.get(route('admin.notifications.index'), {
            ...nextFilters,
            page: 1,
        }, { preserveScroll: true, replace: true });
    };

    const handlePageChange = (nextPage) => {
        if (actionBusy || nextPage < 1 || nextPage > totalPages) {
            return;
        }

        router.get(route('admin.notifications.index'), {
            ...filters,
            page: nextPage,
        }, { preserveScroll: true, replace: true });
    };

    const handleMarkRead = (notificationId) => {
        withActionToast(t('admin.notifications.loading_mark_read', 'Marcando notificacion como leida...'), (callbacks) => {
            router.post(route('admin.notifications.read', notificationId), {}, {
                preserveScroll: true,
                preserveState: true,
                ...callbacks,
            });
        });
    };

    const handleDelete = (notificationId) => {
        if (actionBusy) {
            return;
        }

        setConfirmState({ open: true, mode: 'single-delete', ids: [notificationId] });
    };

    const closeConfirm = () => {
        if (confirmBusy) {
            return;
        }

        setConfirmState({ open: false, mode: null, ids: [] });
    };

    const confirmDelete = () => {
        if (confirmState.ids.length === 0) {
            closeConfirm();
            return;
        }

        const notificationId = confirmState.ids[0];

        setConfirmBusy(true);

        if (confirmState.mode === 'bulk-delete') {
            withActionToast(t('admin.notifications.loading_delete_selected', 'Eliminando notificaciones seleccionadas...'), (callbacks) => {
                router.post(route('admin.notifications.bulk'), {
                    action: 'delete',
                    notification_ids: confirmState.ids,
                }, {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        setSelectedIds([]);
                        setConfirmState({ open: false, mode: null, ids: [] });
                    },
                    onFinish: () => {
                        setConfirmBusy(false);
                        callbacks.onFinish();
                    },
                    onError: callbacks.onError,
                });
            });

            return;
        }

        withActionToast(t('admin.notifications.loading_delete_single', 'Eliminando notificacion...'), (callbacks) => {
            router.delete(route('admin.notifications.destroy', notificationId), {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setConfirmState({ open: false, mode: null, ids: [] }),
                onFinish: () => {
                    setConfirmBusy(false);
                    callbacks.onFinish();
                },
                onError: callbacks.onError,
            });
        });
    };

    const toggleSelection = (notificationId) => {
        if (actionBusy || confirmBusy) {
            return;
        }

        setSelectedIds((current) => current.includes(notificationId)
            ? current.filter((id) => id !== notificationId)
            : [...current, notificationId]);
    };

    const toggleSelectAll = () => {
        if (actionBusy || confirmBusy) {
            return;
        }

        setSelectedIds(allSelected ? [] : notificationRows.map((notification) => notification.id));
    };

    const runBulkAction = (action) => {
        if (selectedIds.length === 0) {
            return;
        }

        if (action === 'delete') {
            setConfirmState({ open: true, mode: 'bulk-delete', ids: selectedIds });

            return;
        }

        withActionToast(t('admin.notifications.loading_mark_selected', 'Marcando notificaciones seleccionadas...'), (callbacks) => {
            router.post(route('admin.notifications.bulk'), {
                action,
                notification_ids: selectedIds,
            }, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setSelectedIds([]),
                ...callbacks,
            });
        });
    };

    const toggleMutedType = (channel, type) => {
        if (actionBusy || confirmBusy) {
            return;
        }

        const setter = channel === 'bell' ? setLocalBellMutedTypes : setLocalHistoryMutedTypes;

        setter((current) => current.includes(type)
            ? current.filter((item) => item !== type)
            : [...current, type]);
    };

    const savePreferences = () => {
        withActionToast(t('admin.notifications.loading_save_preferences', 'Guardando preferencias de notificaciones...'), (callbacks) => {
            router.put(route('admin.notifications.preferences'), {
                bell_muted_types: localBellMutedTypes,
                history_muted_types: localHistoryMutedTypes,
                source: 'preferences_panel',
                context: {
                    operation: bellMutedCount === 0 && historyMutedCount === 0 ? 'reset' : 'saved',
                },
            }, {
                preserveScroll: true,
                preserveState: true,
                ...callbacks,
            });
        });
    };

    const persistPreferences = (nextBellMutedTypes, nextHistoryMutedTypes, loadingMessage, rollback, auditContext = {}) => {
        withActionToast(loadingMessage, (callbacks) => {
            router.put(route('admin.notifications.preferences'), {
                bell_muted_types: nextBellMutedTypes,
                history_muted_types: nextHistoryMutedTypes,
                source: auditContext.source || 'history_row_quick_action',
                context: auditContext.context || null,
            }, {
                preserveScroll: true,
                preserveState: true,
                onError: () => {
                    rollback();
                    callbacks.onError();
                },
                onFinish: callbacks.onFinish,
            });
        });
    };

    const toggleQuickMute = (channel, type) => {
        if (actionBusy || confirmBusy) {
            return;
        }

        const currentBellMutedTypes = [...localBellMutedTypes];
        const currentHistoryMutedTypes = [...localHistoryMutedTypes];
        const source = channel === 'bell' ? currentBellMutedTypes : currentHistoryMutedTypes;
        const nextSource = source.includes(type)
            ? source.filter((item) => item !== type)
            : [...source, type];
        const nextBellMutedTypes = channel === 'bell' ? nextSource : currentBellMutedTypes;
        const nextHistoryMutedTypes = channel === 'history' ? nextSource : currentHistoryMutedTypes;

        setLocalBellMutedTypes(nextBellMutedTypes);
        setLocalHistoryMutedTypes(nextHistoryMutedTypes);

        persistPreferences(
            nextBellMutedTypes,
            nextHistoryMutedTypes,
            channel === 'bell'
                ? t('admin.notifications.loading_toggle_bell', 'Actualizando silencio en campana...')
                : t('admin.notifications.loading_toggle_history', 'Actualizando visibilidad en historial...'),
            () => {
                setLocalBellMutedTypes(currentBellMutedTypes);
                setLocalHistoryMutedTypes(currentHistoryMutedTypes);
            },
            {
                source: 'history_row_quick_action',
                context: {
                    channel,
                    type,
                    operation: source.includes(type) ? 'unmuted' : 'muted',
                },
            },
        );
    };

    const currentVisibilityMeta = visibilityMeta[localFilters.visibility] ?? visibilityMeta.visible;

    return (
        <AuthenticatedLayout>
            <Head title={t('admin.notifications.page_title', 'Historial de notificaciones')} />
            <AdminIndexShell
                title={t('admin.notifications.history_title', 'Historial de notificaciones operativas')}
                description={t('admin.notifications.history_description', 'Consulta alertas pendientes y leídas, filtra por severidad o tipo y vuelve al detalle de cada incidencia sin depender del dropdown de la campana.')}
                stats={[
                    { label: t('admin.notifications.stats.total', 'Total'), value: metrics.total ?? 0 },
                    { label: t('admin.notifications.stats.unread', 'Sin leer'), value: metrics.unread ?? 0 },
                    { label: t('admin.notifications.stats.critical', 'Criticas'), value: metrics.critical ?? 0 },
                    { label: t('admin.notifications.stats.warnings', 'Advertencias'), value: metrics.warnings ?? 0 },
                ]}
                contextTitle={t('admin.notifications.context_title', 'Centro de alertas')}
                contextDescription={t('admin.notifications.context_description', 'Usa esta vista para procesar la cola personal de alertas, revisar prioridades y mantener limpio el historial con lectura y borrado puntual.')}
                contextItems={[
                    { label: t('admin.notifications.context_items.active_filters', 'Filtros activos'), value: activeFilters },
                    { label: t('admin.notifications.context_items.page', 'Pagina'), value: `${page}/${totalPages}` },
                    { label: t('admin.notifications.context_items.scope', 'Alcance'), value: t('admin.notifications.context_items.personal', 'Solo mis notificaciones') },
                ]}
                primaryAction={(
                    <button
                        type="button"
                        disabled={actionBusy || confirmBusy}
                        className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => withActionToast(t('admin.notifications.loading_mark_all', 'Marcando todas las notificaciones...'), (callbacks) => {
                            router.post(route('admin.notifications.read_all'), {}, { preserveScroll: true, preserveState: true, ...callbacks });
                        })}
                    >
                        {t('admin.notifications.mark_all_read', 'Marcar todas')}
                    </button>
                )}
                secondaryActions={(
                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                            {t('admin.notifications.selected_count', ':count seleccionadas', { count: selectedCount })}
                        </span>
                        <button
                            type="button"
                            disabled={actionBusy || confirmBusy || selectedUnreadCount === 0}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => runBulkAction('read')}
                        >
                            {t('admin.notifications.mark_selected_read', 'Marcar seleccionadas')}
                        </button>
                        <button
                            type="button"
                            disabled={actionBusy || confirmBusy || selectedCount === 0}
                            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => runBulkAction('delete')}
                        >
                            {t('admin.notifications.delete_selected', 'Eliminar seleccionadas')}
                        </button>
                    </div>
                )}
                filters={(
                    <div className="space-y-4 text-sm">
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 space-y-3">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('admin.notifications.filters.search', 'Buscar')}</label>
                                    <input
                                        type="text"
                                            disabled={actionBusy}
                                        className="w-full rounded border border-border bg-background px-2 py-1"
                                        placeholder={t('admin.notifications.filters.search_placeholder', 'Titulo o mensaje')}
                                        value={localFilters.search}
                                        onChange={(event) => setLocalFilters((current) => ({ ...current, search: event.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('admin.notifications.filters.status', 'Estado')}</label>
                                    <select
                                        disabled={actionBusy}
                                        className="w-full rounded border border-border bg-background px-2 py-1"
                                        value={localFilters.status}
                                        onChange={(event) => setLocalFilters((current) => ({ ...current, status: event.target.value }))}
                                    >
                                        {['all', 'unread', 'read'].map((status) => (
                                            <option key={status} value={status}>{translateStatus(status)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('admin.notifications.filters.severity', 'Severidad')}</label>
                                    <select
                                        disabled={actionBusy}
                                        className="w-full rounded border border-border bg-background px-2 py-1"
                                        value={localFilters.severity}
                                        onChange={(event) => setLocalFilters((current) => ({ ...current, severity: event.target.value }))}
                                    >
                                        <option value="">{t('admin.notifications.filters.all_severities', 'Todas')}</option>
                                        <option value="danger">{t('admin.notifications.groups.danger', 'Criticas')}</option>
                                        <option value="warning">{t('admin.notifications.groups.warning', 'Atencion')}</option>
                                        <option value="success">{t('admin.notifications.groups.success', 'Seguimiento')}</option>
                                        <option value="info">{t('admin.notifications.groups.info', 'Informativas')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('admin.notifications.filters.type', 'Tipo')}</label>
                                    <select
                                        disabled={actionBusy}
                                        className="w-full rounded border border-border bg-background px-2 py-1"
                                        value={localFilters.type}
                                        onChange={(event) => setLocalFilters((current) => ({ ...current, type: event.target.value }))}
                                    >
                                        <option value="">{t('admin.notifications.filters.all_types', 'Todos')}</option>
                                        {filterTypes.map((type) => (
                                            <option key={type} value={type}>{translateType(type)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {[
                                    { value: 'visible', label: t('admin.notifications.quick_filters.visible', 'Visibles en historial') },
                                    { value: 'bell_muted', label: t('admin.notifications.quick_filters.bell_muted', 'Ocultas en campana') },
                                    { value: 'history_muted', label: t('admin.notifications.quick_filters.history_muted', 'Ocultas en historial') },
                                ].map((option) => {
                                    const active = localFilters.visibility === option.value;
                                    const count = visibilityCounts[option.value] ?? 0;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            disabled={actionBusy}
                                            className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${active ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'} disabled:cursor-not-allowed disabled:opacity-50`}
                                            onClick={() => applyQuickVisibility(option.value)}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <span>{option.label}</span>
                                                <span className={`rounded-full px-2 py-0.5 text-[11px] ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                    {count}
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className={`rounded-2xl border px-4 py-3 text-xs ${currentVisibilityMeta.tone}`}>
                                <p className="font-semibold">{currentVisibilityMeta.title}</p>
                                <p className="mt-1 leading-5 opacity-90">
                                    {currentVisibilityMeta.description}{' '}
                                    {t('admin.notifications.visibility_notice.count', 'Coincidencias actuales: :count', {
                                        count: visibilityCounts[localFilters.visibility] ?? 0,
                                    })}
                                </p>
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    disabled={actionBusy}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    onClick={() => {
                                        setLocalFilters({ search: '', status: 'all', severity: '', type: '', visibility: 'visible' });
                                        router.get(route('admin.notifications.index'), {}, { replace: true });
                                    }}
                                >
                                    {t('admin.notifications.clear_filters', 'Limpiar filtros')}
                                </button>
                                <button
                                    type="button"
                                    disabled={actionBusy}
                                    className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    onClick={submitFilters}
                                >
                                    {t('admin.notifications.apply_filters', 'Aplicar filtros')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            >
                <div className="space-y-4 p-6">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 space-y-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-slate-900">{t('admin.notifications.preferences_title', 'Preferencias personales')}</h3>
                                <p className="text-xs text-slate-600">
                                    {t('admin.notifications.preferences_description', 'Configura por separado qué tipos ocultar en la campana y cuáles sacar del historial, sin perder la persistencia de la alerta.')}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                                    {t('admin.notifications.muted_bell_count', 'Campana: :count', { count: bellMutedCount })}
                                </div>
                                <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                                    {t('admin.notifications.muted_history_count', 'Historial: :count', { count: historyMutedCount })}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                            {filterTypes.map((type) => {
                                const bellChecked = localBellMutedTypes.includes(type);
                                const historyChecked = localHistoryMutedTypes.includes(type);
                                const isPreferenceTarget = preferenceTargetType === type;

                                return (
                                    <div
                                        key={type}
                                        data-preference-type={type}
                                        className={`rounded-2xl border px-3 py-3 text-sm transition ${isPreferenceTarget ? 'border-sky-400 bg-sky-50 shadow-sm' : (bellChecked || historyChecked) ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="block font-semibold text-slate-900">{translateType(type)}</span>
                                                {isPreferenceTarget && (
                                                    <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                                                        {t('admin.notifications.preference_target', 'Ajustando este tipo')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-2 text-xs text-slate-600">
                                                <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                                    <span>{t('admin.notifications.preference_bell', 'Ocultar en campana')}</span>
                                                    <input
                                                        type="checkbox"
                                                        disabled={actionBusy || confirmBusy}
                                                        className="rounded border-border text-primary focus:ring-primary"
                                                        checked={bellChecked}
                                                        onChange={() => toggleMutedType('bell', type)}
                                                    />
                                                </label>
                                                <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                                    <span>{t('admin.notifications.preference_history', 'Ocultar en historial')}</span>
                                                    <input
                                                        type="checkbox"
                                                        disabled={actionBusy || confirmBusy}
                                                        className="rounded border-border text-primary focus:ring-primary"
                                                        checked={historyChecked}
                                                        onChange={() => toggleMutedType('history', type)}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                            <button
                                type="button"
                                disabled={actionBusy || confirmBusy}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => {
                                    setLocalBellMutedTypes([]);
                                    setLocalHistoryMutedTypes([]);
                                }}
                            >
                                {t('admin.notifications.unmute_all', 'Reactivar ambos canales')}
                            </button>
                            <button
                                type="button"
                                disabled={actionBusy || confirmBusy}
                                className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={savePreferences}
                            >
                                {t('admin.notifications.save_preferences', 'Guardar preferencias')}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-border bg-white">
                        <table className="w-full text-sm">
                            <thead className="border-b border-border bg-muted">
                                <tr>
                                    <th className="px-3 py-2 text-left font-semibold">
                                        <input
                                            type="checkbox"
                                            disabled={actionBusy || confirmBusy}
                                            className="rounded border-border text-primary focus:ring-primary"
                                            checked={allSelected}
                                            onChange={toggleSelectAll}
                                            aria-label={t('admin.notifications.table.select_all', 'Seleccionar todas')}
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold">{t('admin.notifications.table.date', 'Fecha')}</th>
                                    <th className="px-3 py-2 text-left font-semibold">{t('admin.notifications.table.severity', 'Severidad')}</th>
                                    <th className="px-3 py-2 text-left font-semibold">{t('admin.notifications.table.type', 'Tipo')}</th>
                                    <th className="px-3 py-2 text-left font-semibold">{t('admin.notifications.table.title', 'Titulo')}</th>
                                    <th className="px-3 py-2 text-left font-semibold">{t('admin.notifications.table.message', 'Mensaje')}</th>
                                    <th className="px-3 py-2 text-left font-semibold">{t('admin.notifications.table.status', 'Estado')}</th>
                                    <th className="px-3 py-2 text-right font-semibold">{t('admin.notifications.table.actions', 'Acciones')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notificationRows.map((notification) => {
                                    const notificationContent = resolveNotificationContent(notification);

                                    return (
                                    <tr key={notification.id} className="border-b border-border hover:bg-muted/40">
                                        <td className="px-3 py-2 text-xs">
                                            <input
                                                type="checkbox"
                                                disabled={actionBusy || confirmBusy}
                                                className="rounded border-border text-primary focus:ring-primary"
                                                checked={selectedIds.includes(notification.id)}
                                                onChange={() => toggleSelection(notification.id)}
                                                aria-label={t('admin.notifications.table.select_row', 'Seleccionar notificacion')}
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-xs">{formatDateTime(notification.created_at)}</td>
                                        <td className="px-3 py-2 text-xs">
                                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${severityTone(notification.severity)}`}>
                                                {t(`admin.notifications.groups.${notification.severity}`, notification.severity)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-xs">{translateType(notification.type)}</td>
                                        <td className="px-3 py-2 text-xs font-semibold text-slate-900">{notificationContent.title}</td>
                                        <td className="max-w-[340px] px-3 py-2 text-xs text-slate-600">{notificationContent.message}</td>
                                        <td className="px-3 py-2 text-xs">
                                            {notification.read_at
                                                ? t('admin.notifications.filters.statuses.read', 'Leida')
                                                : t('admin.notifications.filters.statuses.unread', 'Sin leer')}
                                        </td>
                                        <td className="px-3 py-2 text-right text-xs">
                                            <div className="flex flex-wrap justify-end gap-2">
                                                <button
                                                    type="button"
                                                    disabled={actionBusy || confirmBusy}
                                                    className={`inline-flex items-center rounded border px-2 py-1 ${localBellMutedTypes.includes(notification.type) ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-border hover:bg-muted'} disabled:cursor-not-allowed disabled:opacity-50`}
                                                    onClick={() => toggleQuickMute('bell', notification.type)}
                                                >
                                                    {localBellMutedTypes.includes(notification.type)
                                                        ? t('admin.notifications.unmute_bell', 'Mostrar en campana')
                                                        : t('admin.notifications.mute_bell', 'Ocultar en campana')}
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={actionBusy || confirmBusy}
                                                    className={`inline-flex items-center rounded border px-2 py-1 ${localHistoryMutedTypes.includes(notification.type) ? 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100' : 'border-border hover:bg-muted'} disabled:cursor-not-allowed disabled:opacity-50`}
                                                    onClick={() => toggleQuickMute('history', notification.type)}
                                                >
                                                    {localHistoryMutedTypes.includes(notification.type)
                                                        ? t('admin.notifications.unmute_history', 'Mostrar en historial')
                                                        : t('admin.notifications.mute_history', 'Ocultar en historial')}
                                                </button>
                                                {!notification.read_at && (
                                                    <button
                                                        type="button"
                                                        disabled={actionBusy || confirmBusy}
                                                        className="inline-flex items-center rounded border border-border px-2 py-1 hover:bg-muted"
                                                        onClick={() => handleMarkRead(notification.id)}
                                                    >
                                                        {t('admin.notifications.mark_read', 'Marcar leida')}
                                                    </button>
                                                )}
                                                {notification.action_url && (
                                                    <Link
                                                        href={notification.action_url}
                                                        className="inline-flex items-center rounded border border-border px-2 py-1 hover:bg-muted"
                                                    >
                                                        {notificationContent.actionLabel || t('admin.notifications.open', 'Abrir')}
                                                    </Link>
                                                )}
                                                <button
                                                    type="button"
                                                    disabled={actionBusy || confirmBusy}
                                                    className="inline-flex items-center rounded border border-border px-2 py-1 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    onClick={() => handleDelete(notification.id)}
                                                >
                                                    {t('admin.notifications.delete', 'Eliminar')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })}
                                {notifications.data.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-3 py-6 text-center text-sm text-muted-foreground">
                                            {t('admin.notifications.empty_history', 'No hay notificaciones para los filtros seleccionados.')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <AdminPagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>
            </AdminIndexShell>

            <ConfirmDialog
                isOpen={confirmState.open}
                title={t('admin.notifications.confirm_delete_title', 'Confirmar eliminación')}
                message={confirmState.mode === 'bulk-delete'
                    ? t('admin.notifications.confirm_delete_bulk', '¿Eliminar las notificaciones seleccionadas? Esta acción no se puede deshacer.')
                    : t('admin.notifications.confirm_delete_single', '¿Eliminar esta notificación? Esta acción no se puede deshacer.')}
                confirmText={t('admin.notifications.delete', 'Eliminar')}
                cancelText={t('admin.notifications.cancel', 'Cancelar')}
                onConfirm={confirmDelete}
                onCancel={closeConfirm}
                busy={confirmBusy}
            />
        </AuthenticatedLayout>
    );
}