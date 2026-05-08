import ApplicationLogo from '@/Components/ApplicationLogo';
import LanguageSwitcher from '@/Components/i18n/LanguageSwitcher';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { useI18n } from '@/Hooks/useI18n';
import { useLocaleFormat } from '@/Hooks/useLocaleFormat';
import { Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function AutenticateNav() {
    const { props } = usePage();
    const { t } = useI18n();
    const { formatDate } = useLocaleFormat();
    const user = props.auth.user;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [showingNotifications, setShowingNotifications] = useState(false);
    const userRoles = useMemo(
        () => user?.roles?.map?.((role) => (typeof role === 'string' ? role : role?.name)).filter(Boolean) ?? [],
        [user],
    );
    const isAdmin = user?.type === 'admin' || userRoles.includes('admin');
    const isCliente = userRoles.includes('cliente');
    const isBackofficeUser = !isCliente && (
        ['admin', 'supervisor', 'cashier', 'warehouse'].includes(user?.type)
        || userRoles.some((role) => ['admin', 'supervisor', 'cashier', 'warehouse'].includes(role))
    );
    const permissions = useMemo(() => user?.permissions ?? [], [user]);
    const canViewCustomers = permissions.includes('view customers');
    const canViewUsers = permissions.includes('view users');
    const canViewRmas = permissions.includes('view rmas');
    const canViewWarehouses = permissions.includes('view warehouses');
    const canViewCredits = permissions.includes('view credits');
    const canManageSettings = isAdmin || permissions.includes('manage settings');
    const canViewAuditLogs = permissions.includes('view audit logs');
    const canViewSalesReports = permissions.includes('view invoices');
    const canViewInventoryReports = permissions.includes('view products');

    const notifications = props.notifications || { unread_count: 0, items: [] };
    const notificationItems = notifications.items || [];
    const totalNotifications = notifications.unread_count || 0;
    const dashboardRoute = isCliente ? '/mi-panel' : route('dashboard');

    const notificationTone = (severity) => {
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

    const handleMarkNotificationAsRead = (notificationId, onSuccess) => {
        router.post(route('admin.notifications.read', notificationId), {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess,
        });
    };

    const handleDeleteNotification = (notificationId) => {
        router.delete(route('admin.notifications.destroy', notificationId), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleOpenNotification = (notification) => {
        if (!notification.action_url) {
            return;
        }

        handleMarkNotificationAsRead(notification.id, () => {
            setShowingNotifications(false);
            router.visit(notification.action_url);
        });
    };

    return (
        <nav className="border-b border-gray-100 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                    <div className="flex">
                        <div className="flex shrink-0 items-center">
                            <Link href="/">
                                <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
                            </Link>
                        </div>

                        <div className="hidden space-x-6 sm:-my-px sm:ms-10 sm:flex items-center">
                                <NavLink
                                    href={dashboardRoute}
                                    active={isCliente ? window.location.pathname === '/mi-panel' : route().current('dashboard')}
                                >
                                    {t(isCliente ? 'nav.dashboard_client' : 'nav.dashboard_admin', isCliente ? 'Mi Panel' : 'Dashboard')}
                                </NavLink>
                                {/* Menú de administración según permisos */}
                                {(canViewCustomers || canViewUsers || canViewRmas || canViewWarehouses || canViewCredits || canManageSettings || canViewAuditLogs || canViewSalesReports || canViewInventoryReports || userRoles.includes('admin')) && (
                                    <>
                                        {/* Grupo Productos: Productos + Categorías */}
                                        {(userRoles.includes('admin') || canViewInventoryReports) && (
                                            <div className="relative group">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent group-hover:border-gray-300"
                                                >
                                                    {t('admin.nav.products', 'Productos')}
                                                    <svg
                                                        className="ms-1 h-4 w-4"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.854a.75.75 0 111.08 1.04l-4.25 4.417a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                                <div className="absolute left-0 mt-0 w-44 rounded-md bg-white shadow-lg ring-1 ring-black/5 z-20 hidden group-hover:block">
                                                    <div className="py-1 text-sm text-gray-700">
                                                        <Link
                                                            href={route('admin.products.index')}
                                                            className="block px-3 py-1.5 hover:bg-gray-100"
                                                        >
                                                            {t('admin.nav.products', 'Productos')}
                                                        </Link>
                                                        <Link
                                                            href={route('admin.categories.index')}
                                                            className="block px-3 py-1.5 hover:bg-gray-100"
                                                        >
                                                            {t('admin.nav.categories', 'Categorías')}
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Grupo Ventas: Facturas, Devoluciones, Créditos */}
                                        {(userRoles.includes('admin') || canViewSalesReports || canViewRmas || canViewCredits) && (
                                            <div className="relative group">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent group-hover:border-gray-300"
                                                >
                                                    {t('admin.nav.sales', 'Ventas')}
                                                    <svg
                                                        className="ms-1 h-4 w-4"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.854a.75.75 0 111.08 1.04l-4.25 4.417a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                                <div className="absolute left-0 mt-0 w-48 rounded-md bg-white shadow-lg ring-1 ring-black/5 z-20 hidden group-hover:block">
                                                    <div className="py-1 text-sm text-gray-700">
                                                        <Link
                                                            href={route('admin.invoices.index')}
                                                            className="block px-3 py-1.5 hover:bg-gray-100"
                                                        >
                                                            {t('admin.nav.invoices', 'Facturas')}
                                                        </Link>
                                                        {canViewRmas && (
                                                            <Link
                                                                href={route('admin.rmas.index')}
                                                                className="block px-3 py-1.5 hover:bg-gray-100"
                                                            >
                                                                {t('admin.nav.returns', 'Devoluciones')}
                                                            </Link>
                                                        )}
                                                        {canViewCredits && (
                                                            <Link
                                                                href={route('admin.credits.index')}
                                                                className="block px-3 py-1.5 hover:bg-gray-100"
                                                            >
                                                                {t('admin.nav.credits', 'Créditos')}
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Grupo Personas: Clientes + Proveedores */}
                                        {(userRoles.includes('admin') || canViewCustomers) && (
                                            <div className="relative group">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent group-hover:border-gray-300"
                                                >
                                                    {t('admin.nav.relationships', 'Relaciones')}
                                                    <svg
                                                        className="ms-1 h-4 w-4"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.854a.75.75 0 111.08 1.04l-4.25 4.417a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                                <div className="absolute left-0 mt-0 w-52 rounded-md bg-white shadow-lg ring-1 ring-black/5 z-20 hidden group-hover:block">
                                                    <div className="py-1 text-sm text-gray-700">
                                                        {canViewCustomers && (
                                                            <Link
                                                                href={route('admin.customers.index')}
                                                                className="block px-3 py-1.5 hover:bg-gray-100"
                                                            >
                                                                {t('admin.nav.customers', 'Clientes')}
                                                            </Link>
                                                        )}
                                                        <Link
                                                            href={route('admin.providers.index')}
                                                            className="block px-3 py-1.5 hover:bg-gray-100"
                                                        >
                                                            {t('admin.nav.providers', 'Proveedores')}
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Grupo Usuarios: Roles + Usuarios */}
                                        {(userRoles.includes('admin') || canViewUsers || canViewAuditLogs) && (
                                            <div className="relative group">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent group-hover:border-gray-300"
                                                >
                                                    {t('admin.nav.users', 'Usuarios')}
                                                    <svg
                                                        className="ms-1 h-4 w-4"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.854a.75.75 0 111.08 1.04l-4.25 4.417a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                                <div className="absolute left-0 mt-0 w-44 rounded-md bg-white shadow-lg ring-1 ring-black/5 z-20 hidden group-hover:block">
                                                    <div className="py-1 text-sm text-gray-700">
                                                        <Link
                                                            href={route('admin.roles.index')}
                                                            className="block px-3 py-1.5 hover:bg-gray-100"
                                                        >
                                                            {t('admin.nav.roles_permissions', 'Roles y permisos')}
                                                        </Link>
                                                        {canViewAuditLogs && (
                                                            <Link
                                                                href={route('admin.audit.index')}
                                                                className="block px-3 py-1.5 hover:bg-gray-100"
                                                            >
                                                                {t('admin.nav.audit', 'Auditoría')}
                                                            </Link>
                                                        )}
                                                        {canViewUsers && (
                                                            <Link
                                                                href={route('admin.users.index')}
                                                                className="block px-3 py-1.5 hover:bg-gray-100"
                                                            >
                                                                {t('admin.nav.users', 'Usuarios')}
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Grupo Reportes */}
                                        {(canViewSalesReports || canViewInventoryReports || canViewCredits) && (
                                            <div className="relative group">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent group-hover:border-gray-300"
                                                >
                                                    {t('admin.nav.reports', 'Reportes')}
                                                    <svg
                                                        className="ms-1 h-4 w-4"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.854a.75.75 0 111.08 1.04l-4.25 4.417a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                                <div className="absolute left-0 mt-0 w-48 rounded-md bg-white shadow-lg ring-1 ring-black/5 z-20 hidden group-hover:block">
                                                    <div className="py-1 text-sm text-gray-700">
                                                        {canViewSalesReports && (
                                                            <Link
                                                                href={route('admin.reports.sales.index')}
                                                                className="block px-3 py-1.5 hover:bg-gray-100"
                                                            >
                                                                {t('admin.nav.sales', 'Ventas')}
                                                            </Link>
                                                        )}
                                                        {canViewInventoryReports && (
                                                            <Link
                                                                href={route('admin.reports.inventory.index')}
                                                                className="block px-3 py-1.5 hover:bg-gray-100"
                                                            >
                                                                {t('admin.nav.inventory', 'Inventario')}
                                                            </Link>
                                                        )}
                                                        {canViewCredits && (
                                                            <Link
                                                                href={route('admin.reports.credits.index')}
                                                                className="block px-3 py-1.5 hover:bg-gray-100"
                                                            >
                                                                {t('admin.nav.credits', 'Créditos')}
                                                            </Link>
                                                        )}
                                                           <Link
                                                               href={route('admin.reports.layaways.index')}
                                                               className="block px-3 py-1.5 hover:bg-gray-100"
                                                           >
                                                               {t('admin.nav.layaways', 'Apartados')}
                                                           </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {canViewWarehouses && (
                                            <NavLink
                                                href={route('admin.warehouses.index')}
                                                active={route().current('admin.warehouses.*')}
                                            >
                                                {t('admin.nav.warehouses', 'Sucursales')}
                                            </NavLink>
                                        )}
                                        {canManageSettings && (
                                            <NavLink
                                                href={route('admin.settings.index')}
                                                active={route().current('admin.settings.*')}
                                            >
                                                {t('admin.nav.settings', 'Configuración')}
                                            </NavLink>
                                        )}
                                        <NavLink
                                            href={route('admin.qr')}
                                            active={route().current('admin.qr')}
                                        >
                                            {t('admin.nav.qr', 'QR')}
                                        </NavLink>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center gap-4">
                            <LanguageSwitcher />
                            {isBackofficeUser && (
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowingNotifications((prev) => !prev)}
                                        className="relative inline-flex items-center justify-center rounded-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
                                    >
                                        {/* Icono de campana */}
                                        <svg
                                            className="h-5 w-5"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path d="M10 2a6 6 0 00-6 6v2.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 10.586V8a6 6 0 00-6-6z" />
                                            <path d="M10 18a2.5 2.5 0 002.45-2H7.55A2.5 2.5 0 0010 18z" />
                                        </svg>
                                        {totalNotifications > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] h-4 min-w-[16px] px-1">
                                                {totalNotifications > 99 ? '99+' : totalNotifications}
                                            </span>
                                        )}
                                    </button>

                                    {showingNotifications && (
                                        <div className="absolute right-0 mt-2 w-96 max-h-[32rem] overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black/5 z-30 text-sm">
                                            <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                                                <span className="font-semibold text-gray-700">{t('admin.notifications.title', 'Notificaciones')}</span>
                                                {totalNotifications > 0 ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-500">{t('admin.notifications.unread_count', '{count} sin leer|{count} sin leer', { count: totalNotifications })}</span>
                                                        <button
                                                            type="button"
                                                            className="text-[11px] font-medium text-gray-600 hover:text-gray-900"
                                                            onClick={() => router.post(route('admin.notifications.read_all'), {}, {
                                                                preserveScroll: true,
                                                                preserveState: true,
                                                            })}
                                                        >
                                                            {t('admin.notifications.mark_all_read', 'Marcar todas')}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">{t('admin.notifications.no_alerts', 'Sin alertas')}</span>
                                                )}
                                            </div>
                                            <div className="py-2">
                                                {notificationItems.map((notification) => (
                                                    <div key={notification.id} className="border-b border-gray-100 px-3 py-3 last:border-b-0">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0 flex-1">
                                                                <div className="mb-1 flex items-center gap-2">
                                                                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${notificationTone(notification.severity)}`}>
                                                                        {t(`admin.notifications.types.${notification.type}`, notification.title)}
                                                                    </span>
                                                                    <span className="text-[11px] text-gray-400">
                                                                        {formatDate(notification.created_at, { dateStyle: 'short', timeStyle: 'short' })}
                                                                    </span>
                                                                </div>
                                                                <p className="truncate text-sm font-semibold text-gray-800">{notification.title}</p>
                                                                <p className="mt-1 text-xs leading-5 text-gray-600">{notification.message}</p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="text-xs font-medium text-gray-400 hover:text-red-600"
                                                                onClick={() => handleDeleteNotification(notification.id)}
                                                            >
                                                                {t('admin.notifications.delete', 'Eliminar')}
                                                            </button>
                                                        </div>
                                                        <div className="mt-3 flex items-center justify-end gap-3 text-[11px] font-medium">
                                                            <button
                                                                type="button"
                                                                className="text-gray-500 hover:text-gray-900"
                                                                onClick={() => handleMarkNotificationAsRead(notification.id)}
                                                            >
                                                                {t('admin.notifications.mark_read', 'Marcar leida')}
                                                            </button>
                                                            {notification.action_url && (
                                                                <button
                                                                    type="button"
                                                                    className="text-sky-700 hover:text-sky-900"
                                                                    onClick={() => handleOpenNotification(notification)}
                                                                >
                                                                    {notification.action_label || t('admin.notifications.open', 'Abrir')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}

                                                {totalNotifications === 0 && (
                                                    <div className="px-3 py-4 text-xs text-gray-500 text-center">
                                                        {t('admin.notifications.empty', 'No hay notificaciones pendientes por ahora.')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none"
                                            >
                                                {user.name}

                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                        >
                                            {t('admin.user_menu.profile', 'Perfil')}
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            {t('nav.logout', 'Cerrar sesión')}
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        (showingNavigationDropdown ? 'block' : 'hidden') +
                        ' sm:hidden'
                    }
                >
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink
                            href={dashboardRoute}
                            active={isCliente ? window.location.pathname === '/mi-panel' : route().current('dashboard')}
                        >
                            {t(isCliente ? 'nav.dashboard_client' : 'nav.dashboard_admin', isCliente ? 'Mi Panel' : 'Dashboard')}
                        </ResponsiveNavLink>
                        <div className="px-4 pt-3">
                            <LanguageSwitcher mobile />
                        </div>
                        {isAdmin && (
                            <>
                                {/* Grupo Productos */}
                                <div className="px-4 pt-1 text-xs font-semibold text-gray-500 uppercase">
                                    {t('admin.nav.products', 'Productos')}
                                </div>
                                <ResponsiveNavLink
                                    href={route('admin.products.index')}
                                    active={route().current('admin.products.*')}
                                >
                                    {t('admin.nav.products', 'Productos')}
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={route('admin.categories.index')}
                                    active={route().current('admin.categories.*')}
                                >
                                    {t('admin.nav.categories', 'Categorías')}
                                </ResponsiveNavLink>

                                {/* Grupo Ventas */}
                                <div className="px-4 pt-3 text-xs font-semibold text-gray-500 uppercase">
                                    {t('admin.nav.sales', 'Ventas')}
                                </div>
                                <ResponsiveNavLink
                                    href={route('admin.invoices.index')}
                                    active={route().current('admin.invoices.*')}
                                >
                                    {t('admin.nav.invoices', 'Facturas')}
                                </ResponsiveNavLink>
                                {canViewRmas && (
                                    <ResponsiveNavLink
                                        href={route('admin.rmas.index')}
                                        active={route().current('admin.rmas.*')}
                                    >
                                        {t('admin.nav.returns', 'Devoluciones')}
                                    </ResponsiveNavLink>
                                )}
                                {canViewCredits && (
                                    <ResponsiveNavLink
                                        href={route('admin.credits.index')}
                                        active={route().current('admin.credits.*')}
                                    >
                                        {t('admin.nav.credits', 'Créditos')}
                                    </ResponsiveNavLink>
                                )}

                                {/* Grupo Relaciones (Clientes / Proveedores) */}
                                <div className="px-4 pt-3 text-xs font-semibold text-gray-500 uppercase">
                                    {t('admin.nav.relationships', 'Relaciones')}
                                </div>
                                {canViewCustomers && (
                                    <ResponsiveNavLink
                                        href={route('admin.customers.index')}
                                        active={route().current('admin.customers.*')}
                                    >
                                        {t('admin.nav.customers', 'Clientes')}
                                    </ResponsiveNavLink>
                                )}
                                <ResponsiveNavLink
                                    href={route('admin.providers.index')}
                                    active={route().current('admin.providers.*')}
                                >
                                    {t('admin.nav.providers', 'Proveedores')}
                                </ResponsiveNavLink>

                                {/* Grupo Usuarios */}
                                <div className="px-4 pt-3 text-xs font-semibold text-gray-500 uppercase">
                                    {t('admin.nav.users', 'Usuarios')}
                                </div>
                                <ResponsiveNavLink
                                    href={route('admin.roles.index')}
                                    active={route().current('admin.roles.*')}
                                >
                                    {t('admin.nav.roles_permissions', 'Roles y permisos')}
                                </ResponsiveNavLink>
                                {canViewAuditLogs && (
                                    <ResponsiveNavLink
                                        href={route('admin.audit.index')}
                                        active={route().current('admin.audit.*')}
                                    >
                                        {t('admin.nav.audit', 'Auditoría')}
                                    </ResponsiveNavLink>
                                )}

                                {/* Grupo Reportes */}
                                {(canViewSalesReports || canViewInventoryReports || canViewCredits) && (
                                    <>
                                        <div className="px-4 pt-3 text-xs font-semibold text-gray-500 uppercase">
                                            {t('admin.nav.reports', 'Reportes')}
                                        </div>
                                        {canViewSalesReports && (
                                            <ResponsiveNavLink
                                                href={route('admin.reports.sales.index')}
                                                active={route().current('admin.reports.sales.*')}
                                            >
                                                {t('admin.nav.sales', 'Ventas')}
                                            </ResponsiveNavLink>
                                        )}
                                        {canViewInventoryReports && (
                                            <ResponsiveNavLink
                                                href={route('admin.reports.inventory.index')}
                                                active={route().current('admin.reports.inventory.*')}
                                            >
                                                {t('admin.nav.inventory', 'Inventario')}
                                            </ResponsiveNavLink>
                                        )}
                                        {canViewCredits && (
                                            <ResponsiveNavLink
                                                href={route('admin.reports.credits.index')}
                                                active={route().current('admin.reports.credits.*')}
                                            >
                                                Créditos
                                            </ResponsiveNavLink>
                                        )}
                                    </>
                                )}
                                {canViewUsers && (
                                    <ResponsiveNavLink
                                        href={route('admin.users.index')}
                                        active={route().current('admin.users.*')}
                                    >
                                        Usuarios
                                    </ResponsiveNavLink>
                                )}

                                {/* Otros */}
                                {canViewWarehouses && (
                                    <ResponsiveNavLink
                                        href={route('admin.warehouses.index')}
                                        active={route().current('admin.warehouses.*')}
                                    >
                                        Sucursales
                                    </ResponsiveNavLink>
                                )}
                                {canManageSettings && (
                                    <ResponsiveNavLink
                                        href={route('admin.settings.index')}
                                        active={route().current('admin.settings.*')}
                                    >
                                        Configuración
                                    </ResponsiveNavLink>
                                )}
                                <ResponsiveNavLink
                                    href={route('admin.qr')}
                                    active={route().current('admin.qr')}
                                >
                                    QR
                                </ResponsiveNavLink>
                            </>
                        )}
                    </div>

                    <div className="border-t border-gray-200 pb-1 pt-4">
                        <div className="px-4">
                            <div className="text-base font-medium text-gray-800">
                                {user.name}
                            </div>
                            <div className="text-sm font-medium text-gray-500">
                                {user.email}
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>
                                Profile
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                            >
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>
    );
}
