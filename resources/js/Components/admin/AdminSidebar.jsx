import { Link, router, usePage } from '@inertiajs/react';
import { useState, useMemo, useEffect, useRef } from 'react';
import {
    LayoutDashboard, Package, Tag, BarChart2, ShoppingCart,
    Users, Truck, RotateCcw, Wallet, BookOpen, Warehouse,
    ArrowLeftRight, FileText, Settings, QrCode, Bell,
    ChevronDown, ChevronRight, Menu, X, LogOut, User,
    Sun, Moon, TrendingUp, Shield, ClipboardList, AlertCircle, Calculator,
} from 'lucide-react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import LanguageSwitcher from '@/Components/i18n/LanguageSwitcher';
import { useI18n } from '@/Hooks/useI18n';

function useDarkMode() {
    const [dark, setDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (dark) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [dark]);

    return [dark, setDark];
}

function NavItem({ icon: Icon, label, href, active, collapsed, badge, onClick }) {
    const base = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative`;
    const activeClass = `bg-primary text-primary-foreground shadow-sm`;
    const inactiveClass = `text-white hover:bg-sidebar-accent/30 hover:text-slate-900 dark:hover:text-white dark:bg-sidebar-accent/50 dark:hover:bg-slate-700 dark:shadow-sm dark:shadow-white/10`;
    const inlineStyle = { color: 'white !important' };

    const content = (
        <>
            <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-primary-foreground' : 'text-white group-hover:text-slate-800 dark:group-hover:text-white'}`} />
            {!collapsed && (
                <span className="flex-1 truncate">{label}</span>
            )}
            {!collapsed && badge != null && (
                typeof badge === 'string' ? (
                    <span className="ml-auto inline-flex items-center justify-center h-5 px-1.5 rounded bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wide">
                        {badge}
                    </span>
                ) : badge > 0 ? (
                    <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-white text-[10px] font-bold">
                        {badge > 99 ? '99+' : badge}
                    </span>
                ) : null
            )}
            {collapsed && badge != null && typeof badge === 'number' && badge > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
            )}
            {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-foreground text-background text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                    {label}
                </div>
            )}
        </>
    );

    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={`${base} w-full ${active ? activeClass : inactiveClass}`} style={inlineStyle}>
                {content}
            </button>
        );
    }

    return (
        <Link href={href} className={`${base} ${active ? activeClass : inactiveClass}`} style={inlineStyle}>
            {content}
        </Link>
    );
}

function NavGroup({ icon: Icon, label, collapsed, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    const hasActive = children?.some?.(c => c?.props?.active);
    const inlineStyle = { color: 'white !important' };

    useEffect(() => {
        if (hasActive) setOpen(true);
    }, [hasActive]);

    if (collapsed) {
        return (
            <div className="relative group">
                <button
                    type="button"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-white hover:bg-sidebar-accent/30 hover:text-slate-900 dark:hover:text-white dark:bg-sidebar-accent/50 dark:hover:bg-slate-700 dark:shadow-sm dark:shadow-white/10 transition-all duration-150 relative"
                    style={inlineStyle}
                >
                    <Icon className="w-[18px] h-[18px] shrink-0 text-white group-hover:text-slate-800 dark:group-hover:text-white" />
                    <div className="absolute left-full ml-2 top-0 min-w-[180px] rounded-xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-black/5 z-50 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-150 py-1.5">
                        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border mb-1">
                            {label}
                        </div>
                        {children}
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-150
                    ${hasActive ? 'text-primary' : 'text-white hover:text-slate-900 dark:hover:text-white'}
                    hover:bg-sidebar-accent/30 dark:bg-sidebar-accent/50 dark:hover:bg-slate-700 dark:shadow-sm dark:shadow-white/10`}
                style={inlineStyle}
            >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${hasActive ? 'text-primary' : 'text-white'}`} />
                <span className="flex-1 text-left truncate">{label}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="ml-4 mt-0.5 pl-3 border-l-2 border-border space-y-0.5">
                    {children}
                </div>
            )}
        </div>
    );
}

function SectionLabel({ label, collapsed }) {
    if (collapsed) return <div className="my-1 border-t border-border" />;
    return (
        <div className="px-3 pt-4 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        </div>
    );
}

export default function AdminSidebar() {
    const { props } = usePage();
    const { t } = useI18n();
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sidebar_collapsed') === 'true';
        }
        return false;
    });
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dark, setDark] = useDarkMode();

    const user = props.auth?.user;
    const userRoles = useMemo(
        () => user?.roles?.map?.((r) => (typeof r === 'string' ? r : r?.name)).filter(Boolean) ?? [],
        [user],
    );
    const isAdmin = user?.type === 'admin' || userRoles.includes('admin');
    const isCliente = userRoles.includes('cliente');
    const permissions = useMemo(() => user?.permissions ?? [], [user]);

    const can = (perm) => isAdmin || permissions.includes(perm);
    const isAnyBackoffice = !isCliente && (isAdmin || ['supervisor', 'cashier', 'warehouse'].some(r => userRoles.includes(r)));

    const notifications = props.notifications || { unread_count: 0 };
    const totalNotifications = notifications.unread_count || 0;

    const toggleCollapsed = () => {
        setCollapsed(v => {
            const next = !v;
            localStorage.setItem('sidebar_collapsed', String(next));
            return next;
        });
    };

    const handleLogout = () => router.post(route('logout'));

    const isActive = (routeName, params) => {
        try { return route().current(routeName, params); } catch { return false; }
    };

    const dashboardRoute = isCliente ? '/mi-panel' : route('dashboard');

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className={`flex items-center h-16 px-4 border-b border-sidebar-border shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
                {!collapsed && (
                    <Link href="/" className="flex items-center gap-2 min-w-0">
                        <ApplicationLogo className="h-7 w-auto shrink-0" />
                        <span className="font-bold text-sm text-sidebar-foreground truncate">
                            {props.settings?.general?.trade_name || props.settings?.general?.company_name || 'Inventario'}
                        </span>
                    </Link>
                )}
                {collapsed && (
                    <Link href="/">
                        <ApplicationLogo className="h-7 w-auto" />
                    </Link>
                )}
                {!collapsed && (
                    <button
                        type="button"
                        onClick={toggleCollapsed}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-sidebar-accent/30 hover:text-sidebar-foreground transition-colors shrink-0"
                        title="Colapsar menú"
                    >
                        <Menu className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Collapsed expand button */}
            {collapsed && (
                <button
                    type="button"
                    onClick={toggleCollapsed}
                    className="mx-auto mt-3 p-1.5 rounded-lg text-muted-foreground hover:bg-sidebar-accent/30 transition-colors"
                    title="Expandir menú"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            )}

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">

                {/* Principal */}
                <NavItem
                    icon={LayoutDashboard}
                    label={t(isCliente ? 'nav.dashboard_client' : 'nav.dashboard_admin', isCliente ? 'Mi Panel' : 'Dashboard')}
                    href={dashboardRoute}
                    active={isActive('dashboard') || window.location.pathname === '/mi-panel'}
                    collapsed={collapsed}
                />

                {isAnyBackoffice && (
                    <>
                        {/* CATÁLOGO */}
                        {(isAdmin || can('view products')) && (
                            <>
                                <SectionLabel label={t('admin.nav.section.catalog', 'Catálogo')} collapsed={collapsed} />

                                <NavGroup
                                    icon={Package}
                                    label={t('admin.nav.products', 'Productos')}
                                    collapsed={collapsed}
                                    defaultOpen={isActive('admin.products.*') || isActive('admin.categories.*')}
                                >
                                    <NavItem
                                        icon={Package}
                                        label={t('admin.nav.products', 'Productos')}
                                        href={route('admin.products.index')}
                                        active={isActive('admin.products.*')}
                                        collapsed={false}
                                    />
                                    <NavItem
                                        icon={Tag}
                                        label={t('admin.nav.categories', 'Categorías')}
                                        href={route('admin.categories.index')}
                                        active={isActive('admin.categories.*')}
                                        collapsed={false}
                                    />
                                </NavGroup>
                            </>
                        )}

                        {/* VENTAS */}
                        {(isAdmin || can('view invoices') || can('view rmas') || can('view credits')) && (
                            <>
                                <SectionLabel label={t('admin.nav.section.sales', 'Ventas')} collapsed={collapsed} />

                                <NavItem
                                    icon={ShoppingCart}
                                    label={t('admin.nav.invoices', 'Facturas')}
                                    href={route('admin.invoices.index')}
                                    active={isActive('admin.invoices.*')}
                                    collapsed={collapsed}
                                />

                                {can('create invoices') && (
                                    <NavItem
                                        icon={Calculator}
                                        label={t('admin.nav.pos', 'Punto de Venta')}
                                        href={route('admin.invoices.pos')}
                                        active={isActive('admin.invoices.pos')}
                                        collapsed={collapsed}
                                        badge="POS"
                                    />
                                )}

                                {can('view rmas') && (
                                    <NavItem
                                        icon={RotateCcw}
                                        label={t('admin.nav.returns', 'Devoluciones')}
                                        href={route('admin.rmas.index')}
                                        active={isActive('admin.rmas.*')}
                                        collapsed={collapsed}
                                    />
                                )}

                                {can('view credits') && (
                                    <NavGroup
                                        icon={Wallet}
                                        label={t('admin.nav.finance', 'Financiero')}
                                        collapsed={collapsed}
                                        defaultOpen={isActive('admin.credits.*') || isActive('admin.layaways.*')}
                                    >
                                        <NavItem
                                            icon={Wallet}
                                            label={t('admin.nav.credits', 'Créditos')}
                                            href={route('admin.credits.index')}
                                            active={isActive('admin.credits.*')}
                                            collapsed={false}
                                        />
                                        <NavItem
                                            icon={BookOpen}
                                            label={t('admin.nav.layaways', 'Apartados')}
                                            href={route('admin.layaways.index')}
                                            active={isActive('admin.layaways.*')}
                                            collapsed={false}
                                        />
                                    </NavGroup>
                                )}
                            </>
                        )}

                        {/* INVENTARIO */}
                        {(isAdmin || can('view products') || can('view warehouses')) && (
                            <>
                                <SectionLabel label={t('admin.nav.section.inventory', 'Inventario')} collapsed={collapsed} />

                                {can('view warehouses') && (
                                    <NavItem
                                        icon={Warehouse}
                                        label={t('admin.nav.warehouses', 'Sucursales')}
                                        href={route('admin.warehouses.index')}
                                        active={isActive('admin.warehouses.*')}
                                        collapsed={collapsed}
                                    />
                                )}

                                <NavItem
                                    icon={ArrowLeftRight}
                                    label={t('admin.nav.transfers', 'Transferencias')}
                                    href={route('admin.transfers.index')}
                                    active={isActive('admin.transfers.*')}
                                    collapsed={collapsed}
                                />
                            </>
                        )}

                        {/* PERSONAS */}
                        {(isAdmin || can('view customers')) && (
                            <>
                                <SectionLabel label={t('admin.nav.section.people', 'Personas')} collapsed={collapsed} />

                                {can('view customers') && (
                                    <NavItem
                                        icon={Users}
                                        label={t('admin.nav.customers', 'Clientes')}
                                        href={route('admin.customers.index')}
                                        active={isActive('admin.customers.*')}
                                        collapsed={collapsed}
                                    />
                                )}

                                <NavItem
                                    icon={Truck}
                                    label={t('admin.nav.providers', 'Proveedores')}
                                    href={route('admin.providers.index')}
                                    active={isActive('admin.providers.*')}
                                    collapsed={collapsed}
                                />
                            </>
                        )}

                        {/* REPORTES */}
                        {(isAdmin || can('view invoices') || can('view products') || can('view credits')) && (
                            <>
                                <SectionLabel label={t('admin.nav.section.reports', 'Reportes')} collapsed={collapsed} />

                                <NavGroup
                                    icon={BarChart2}
                                    label={t('admin.nav.reports', 'Reportes')}
                                    collapsed={collapsed}
                                    defaultOpen={isActive('admin.reports.*')}
                                >
                                    {can('view invoices') && (
                                        <NavItem
                                            icon={TrendingUp}
                                            label={t('admin.nav.sales', 'Ventas')}
                                            href={route('admin.reports.sales.index')}
                                            active={isActive('admin.reports.sales.*')}
                                            collapsed={false}
                                        />
                                    )}
                                    {can('view products') && (
                                        <NavItem
                                            icon={Package}
                                            label={t('admin.nav.inventory', 'Inventario')}
                                            href={route('admin.reports.inventory.index')}
                                            active={isActive('admin.reports.inventory.*')}
                                            collapsed={false}
                                        />
                                    )}
                                    {can('view credits') && (
                                        <NavItem
                                            icon={Wallet}
                                            label={t('admin.nav.credits', 'Créditos')}
                                            href={route('admin.reports.credits.index')}
                                            active={isActive('admin.reports.credits.*')}
                                            collapsed={false}
                                        />
                                    )}
                                    <NavItem
                                        icon={BookOpen}
                                        label={t('admin.nav.layaways', 'Apartados')}
                                        href={route('admin.reports.layaways.index')}
                                        active={isActive('admin.reports.layaways.*')}
                                        collapsed={false}
                                    />
                                </NavGroup>
                            </>
                        )}

                        {/* ADMIN */}
                        {(isAdmin || can('view users') || can('view audit logs') || can('manage settings')) && (
                            <>
                                <SectionLabel label={t('admin.nav.section.admin', 'Administración')} collapsed={collapsed} />

                                {(isAdmin || can('view users')) && (
                                    <NavGroup
                                        icon={Shield}
                                        label={t('admin.nav.users', 'Usuarios')}
                                        collapsed={collapsed}
                                        defaultOpen={isActive('admin.users.*') || isActive('admin.roles.*')}
                                    >
                                        <NavItem
                                            icon={Users}
                                            label={t('admin.nav.users', 'Usuarios')}
                                            href={route('admin.users.index')}
                                            active={isActive('admin.users.*')}
                                            collapsed={false}
                                        />
                                        <NavItem
                                            icon={Shield}
                                            label={t('admin.nav.roles_permissions', 'Roles y permisos')}
                                            href={route('admin.roles.index')}
                                            active={isActive('admin.roles.*')}
                                            collapsed={false}
                                        />
                                        {can('view audit logs') && (
                                            <NavItem
                                                icon={ClipboardList}
                                                label={t('admin.nav.audit', 'Auditoría')}
                                                href={route('admin.audit.index')}
                                                active={isActive('admin.audit.*')}
                                                collapsed={false}
                                            />
                                        )}
                                    </NavGroup>
                                )}

                                <NavItem
                                    icon={QrCode}
                                    label={t('admin.nav.qr', 'QR')}
                                    href={route('admin.qr')}
                                    active={isActive('admin.qr')}
                                    collapsed={collapsed}
                                />

                                {can('manage settings') && (
                                    <NavItem
                                        icon={Settings}
                                        label={t('admin.nav.settings', 'Configuración')}
                                        href={route('admin.settings.index')}
                                        active={isActive('admin.settings.*')}
                                        collapsed={collapsed}
                                    />
                                )}
                            </>
                        )}
                    </>
                )}
            </nav>

            {/* Footer */}
            <div className={`shrink-0 border-t border-sidebar-border p-2 space-y-1`}>
                {/* Notificaciones */}
                {isAnyBackoffice && (
                    <NavItem
                        icon={Bell}
                        label={t('admin.notifications.title', 'Notificaciones')}
                        href={route('admin.notifications.index')}
                        active={isActive('admin.notifications.*')}
                        collapsed={collapsed}
                        badge={totalNotifications}
                    />
                )}

                {/* Dark mode */}
                <button
                    type="button"
                    onClick={() => setDark(d => !d)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-150
                        text-white hover:bg-sidebar-accent/30 hover:text-slate-900 dark:hover:text-white dark:bg-sidebar-accent/50 dark:hover:bg-slate-700 dark:shadow-sm dark:shadow-white/10 relative group`}
                    style={{ color: 'white !important' }}
                >
                    {dark ? <Sun className="w-[18px] h-[18px] shrink-0 text-amber-400" /> : <Moon className="w-[18px] h-[18px] shrink-0 text-white" />}
                    {!collapsed && (
                        <span className="flex-1 text-left">{dark ? t('nav.light_mode', 'Modo claro') : t('nav.dark_mode', 'Modo oscuro')}</span>
                    )}
                    {collapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-foreground text-background text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                            {dark ? t('nav.light_mode', 'Modo claro') : t('nav.dark_mode', 'Modo oscuro')}
                        </div>
                    )}
                </button>

                {/* Language switcher */}
                {!collapsed && (
                    <div className="px-2 py-1 scale-90 origin-left">
                        <LanguageSwitcher align="left" />
                    </div>
                )}

                {/* User profile */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${collapsed ? 'justify-center' : ''}`}>
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-primary" />
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{userRoles[0] || 'admin'}</p>
                        </div>
                    )}
                    {!collapsed && (
                        <button
                            type="button"
                            onClick={handleLogout}
                            title={t('nav.logout', 'Cerrar sesión')}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile toggle button */}
            <button
                type="button"
                onClick={() => setMobileOpen(v => !v)}
                className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white dark:bg-gray-900 shadow-md border border-border text-foreground"
            >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:hidden
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {sidebarContent}
            </aside>

            {/* Desktop sidebar */}
            <aside
                className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out
                    ${collapsed ? 'w-16' : 'w-64'}`}
            >
                {sidebarContent}
            </aside>

            {/* Spacer para el layout */}
            <div className={`hidden lg:block shrink-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`} aria-hidden="true" />
        </>
    );
}
