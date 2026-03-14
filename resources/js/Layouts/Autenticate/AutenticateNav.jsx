import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function AutenticateNav() {
    const user = usePage().props.auth.user;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const isAdmin = user?.type === 'admin' || (user?.roles?.some?.((r) => r.name === 'admin'));
    const permissions = useMemo(() => user?.permissions ?? [], [user]);
    const canViewCustomers = permissions.includes('view customers');
    const canViewUsers = permissions.includes('view users');
    const canViewRmas = permissions.includes('view rmas');
    const canViewWarehouses = permissions.includes('view warehouses');
    const canViewCredits = permissions.includes('view credits');
    const canManageSettings = isAdmin || permissions.includes('manage settings');
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
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                >
                                    Dashboard
                                </NavLink>
                                {isAdmin && (
                                    <>
                                        {/* Grupo Productos: Productos + Categorías */}
                                        <div className="relative group">
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent group-hover:border-gray-300"
                                            >
                                                Productos
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
                                                        Productos
                                                    </Link>
                                                    <Link
                                                        href={route('admin.categories.index')}
                                                        className="block px-3 py-1.5 hover:bg-gray-100"
                                                    >
                                                        Categorías
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Grupo Ventas: Facturas, Devoluciones, Créditos */}
                                        <div className="relative group">
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent group-hover:border-gray-300"
                                            >
                                                Ventas
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
                                                        Facturas
                                                    </Link>
                                                    {canViewRmas && (
                                                        <Link
                                                            href={route('admin.rmas.index')}
                                                            className="block px-3 py-1.5 hover:bg-gray-100"
                                                        >
                                                            Devoluciones
                                                        </Link>
                                                    )}
                                                    {canViewCredits && (
                                                        <Link
                                                            href={route('admin.credits.index')}
                                                            className="block px-3 py-1.5 hover:bg-gray-100"
                                                        >
                                                            Créditos
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Grupo Personas: Clientes + Proveedores */}
                                        <div className="relative group">
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent group-hover:border-gray-300"
                                            >
                                                Relaciones
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
                                                            Clientes
                                                        </Link>
                                                    )}
                                                    <Link
                                                        href={route('admin.providers.index')}
                                                        className="block px-3 py-1.5 hover:bg-gray-100"
                                                    >
                                                        Proveedores
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Grupo Usuarios: Roles + Usuarios */}
                                        <div className="relative group">
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent group-hover:border-gray-300"
                                            >
                                                Usuarios
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
                                                        Roles y permisos
                                                    </Link>
                                                    {canViewUsers && (
                                                        <Link
                                                            href={route('admin.users.index')}
                                                            className="block px-3 py-1.5 hover:bg-gray-100"
                                                        >
                                                            Usuarios
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {canViewWarehouses && (
                                            <NavLink
                                                href={route('admin.warehouses.index')}
                                                active={route().current('admin.warehouses.*')}
                                            >
                                                Sucursales
                                            </NavLink>
                                        )}
                                        {canManageSettings && (
                                            <NavLink
                                                href={route('admin.settings.index')}
                                                active={route().current('admin.settings.*')}
                                            >
                                                Configuración
                                            </NavLink>
                                        )}
                                        <NavLink
                                            href={route('admin.qr')}
                                            active={route().current('admin.qr')}
                                        >
                                            QR
                                        </NavLink>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center">
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
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            Log Out
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
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                        >
                            Dashboard
                        </ResponsiveNavLink>
                        {isAdmin && (
                            <>
                                {/* Grupo Productos */}
                                <div className="px-4 pt-1 text-xs font-semibold text-gray-500 uppercase">
                                    Productos
                                </div>
                                <ResponsiveNavLink
                                    href={route('admin.products.index')}
                                    active={route().current('admin.products.*')}
                                >
                                    Productos
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={route('admin.categories.index')}
                                    active={route().current('admin.categories.*')}
                                >
                                    Categorías
                                </ResponsiveNavLink>

                                {/* Grupo Ventas */}
                                <div className="px-4 pt-3 text-xs font-semibold text-gray-500 uppercase">
                                    Ventas
                                </div>
                                <ResponsiveNavLink
                                    href={route('admin.invoices.index')}
                                    active={route().current('admin.invoices.*')}
                                >
                                    Facturas
                                </ResponsiveNavLink>
                                {canViewRmas && (
                                    <ResponsiveNavLink
                                        href={route('admin.rmas.index')}
                                        active={route().current('admin.rmas.*')}
                                    >
                                        Devoluciones
                                    </ResponsiveNavLink>
                                )}
                                {canViewCredits && (
                                    <ResponsiveNavLink
                                        href={route('admin.credits.index')}
                                        active={route().current('admin.credits.*')}
                                    >
                                        Créditos
                                    </ResponsiveNavLink>
                                )}

                                {/* Grupo Relaciones (Clientes / Proveedores) */}
                                <div className="px-4 pt-3 text-xs font-semibold text-gray-500 uppercase">
                                    Relaciones
                                </div>
                                {canViewCustomers && (
                                    <ResponsiveNavLink
                                        href={route('admin.customers.index')}
                                        active={route().current('admin.customers.*')}
                                    >
                                        Clientes
                                    </ResponsiveNavLink>
                                )}
                                <ResponsiveNavLink
                                    href={route('admin.providers.index')}
                                    active={route().current('admin.providers.*')}
                                >
                                    Proveedores
                                </ResponsiveNavLink>

                                {/* Grupo Usuarios */}
                                <div className="px-4 pt-3 text-xs font-semibold text-gray-500 uppercase">
                                    Usuarios
                                </div>
                                <ResponsiveNavLink
                                    href={route('admin.roles.index')}
                                    active={route().current('admin.roles.*')}
                                >
                                    Roles y permisos
                                </ResponsiveNavLink>
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
