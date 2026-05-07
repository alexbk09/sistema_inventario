import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';

const defaultPayments = {
    methods: {
        manual: {
            enabled: true,
            label: 'Transferencia bancaria',
            description: 'Pago por transferencia o deposito con referencia manual.',
            instructions: 'Realiza tu transferencia y comparte los datos del pago durante el checkout.',
            fee_percent: 0,
        },
        paypal: {
            enabled: false,
            label: 'PayPal',
            description: 'Habilita PayPal cuando tengas tus credenciales listas.',
            client_id: '',
            client_secret: '',
            environment: 'sandbox',
            instructions: 'Configura Client ID y Secret para activarlo.',
            fee_percent: 0,
        },
        stripe: {
            enabled: false,
            label: 'Stripe',
            description: 'Acepta pagos con tarjeta mediante Stripe.',
            publishable_key: '',
            secret_key: '',
            environment: 'test',
            instructions: 'Configura Publishable Key y Secret Key para activar el cobro con tarjeta.',
            fee_percent: 0,
        },
    },
    bank_accounts: [],
    origin_banks: [],
};

function SettingsSection({ eyebrow, title, description, children, contentClassName = 'p-6' }) {
    return (
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{eyebrow}</p>
                <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
                    </div>
                </div>
            </div>
            <div className={contentClassName}>{children}</div>
        </section>
    );
}

export default function SettingsIndex({ general, location, branding, billing, currency, store, inventory, warehouses, security, qr, mail, payments, warehouseOptions = [] }) {
    const { data, setData, put, processing, errors } = useForm({
        general: general ?? {},
        location: location ?? {},
        branding: branding ?? {},
        billing: billing ?? {},
        currency: currency ?? {},
        store: store ?? {},
        inventory: inventory ?? {},
        warehouses: warehouses ?? {},
        security: security ?? {},
        qr: qr ?? {},
        mail: mail ?? {},
        payments: {
            ...defaultPayments,
            ...(payments ?? {}),
            methods: {
                ...defaultPayments.methods,
                ...(payments?.methods ?? {}),
            },
            bank_accounts: Array.isArray(payments?.bank_accounts) ? payments.bank_accounts : [],
        },
    });
    const [paymentTab, setPaymentTab] = useState('manual');
    const [activeSettingsGroup, setActiveSettingsGroup] = useState('identity');

    const handleChange = (section, field) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setData(section, {
            ...data[section],
            [field]: value,
        });
    };

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.settings.update'));
    };

    const updatePaymentMethod = (methodKey, field, value) => {
        setData('payments', {
            ...data.payments,
            methods: {
                ...(data.payments?.methods ?? {}),
                [methodKey]: {
                    ...(data.payments?.methods?.[methodKey] ?? {}),
                    [field]: value,
                },
            },
        });
    };

    const updateBankAccount = (index, field, value) => {
        const accounts = Array.isArray(data.payments?.bank_accounts) ? [...data.payments.bank_accounts] : [];
        accounts[index] = {
            ...(accounts[index] ?? {}),
            [field]: value,
        };

        setData('payments', {
            ...data.payments,
            bank_accounts: accounts,
        });
    };

    const addBankAccount = () => {
        const accounts = Array.isArray(data.payments?.bank_accounts) ? [...data.payments.bank_accounts] : [];
        accounts.push({
            bank_name: '',
            account_name: '',
            account_number: '',
            account_type: 'Corriente',
            identification: '',
            email: '',
            phone: '',
            notes: '',
            enabled: true,
        });

        setData('payments', {
            ...data.payments,
            bank_accounts: accounts,
        });
    };

    const removeBankAccount = (index) => {
        const accounts = (data.payments?.bank_accounts ?? []).filter((_, currentIndex) => currentIndex !== index);
        setData('payments', {
            ...data.payments,
            bank_accounts: accounts,
        });
    };

    const updateOriginBank = (index, field, value) => {
        const originBanks = Array.isArray(data.payments?.origin_banks) ? [...data.payments.origin_banks] : [];
        originBanks[index] = {
            ...(originBanks[index] ?? {}),
            [field]: value,
        };

        setData('payments', {
            ...data.payments,
            origin_banks: originBanks,
        });
    };

    const addOriginBank = () => {
        const originBanks = Array.isArray(data.payments?.origin_banks) ? [...data.payments.origin_banks] : [];
        originBanks.push({
            name: '',
            enabled: true,
        });

        setData('payments', {
            ...data.payments,
            origin_banks: originBanks,
        });
    };

    const removeOriginBank = (index) => {
        const originBanks = (data.payments?.origin_banks ?? []).filter((_, currentIndex) => currentIndex !== index);
        setData('payments', {
            ...data.payments,
            origin_banks: originBanks,
        });
    };

    const bankAccounts = Array.isArray(data.payments?.bank_accounts) ? data.payments.bank_accounts : [];
    const originBanks = Array.isArray(data.payments?.origin_banks) ? data.payments.origin_banks : [];
    const manualMethod = data.payments?.methods?.manual ?? defaultPayments.methods.manual;
    const paypalMethod = data.payments?.methods?.paypal ?? defaultPayments.methods.paypal;
    const stripeMethod = data.payments?.methods?.stripe ?? defaultPayments.methods.stripe;
    const visibleBankAccounts = bankAccounts.filter((account) => account?.enabled !== false).length;
    const visibleOriginBanks = originBanks.filter((bank) => bank?.enabled !== false).length;
    const activeMethods = [manualMethod, paypalMethod, stripeMethod].filter((method) => method?.enabled).length;
    const paymentTabs = [
        {
            key: 'manual',
            title: 'Manual',
            eyebrow: 'Transferencias',
            description: manualMethod.description || 'Cuentas bancarias y referencias manuales.',
            enabled: !!manualMethod.enabled,
            readiness: `${visibleBankAccounts} cuentas activas`,
            accent: 'from-emerald-500/20 via-emerald-500/10 to-white',
            ring: 'border-emerald-200',
            badge: 'text-emerald-700 bg-emerald-100',
        },
        {
            key: 'paypal',
            title: 'PayPal',
            eyebrow: 'Wallet',
            description: paypalMethod.description || 'Cobros con PayPal para checkout.',
            enabled: !!paypalMethod.enabled,
            readiness: paypalMethod.client_id ? 'Credenciales listas' : 'Faltan credenciales',
            accent: 'from-sky-500/20 via-sky-500/10 to-white',
            ring: 'border-sky-200',
            badge: paypalMethod.client_id ? 'text-sky-700 bg-sky-100' : 'text-amber-700 bg-amber-100',
        },
        {
            key: 'stripe',
            title: 'Stripe',
            eyebrow: 'Tarjetas',
            description: stripeMethod.description || 'Cobros con tarjeta y formulario seguro.',
            enabled: !!stripeMethod.enabled,
            readiness: stripeMethod.publishable_key ? 'Llaves listas' : 'Faltan llaves',
            accent: 'from-fuchsia-500/20 via-fuchsia-500/10 to-white',
            ring: 'border-fuchsia-200',
            badge: stripeMethod.publishable_key ? 'text-fuchsia-700 bg-fuchsia-100' : 'text-amber-700 bg-amber-100',
        },
    ];
    const activePaymentTab = paymentTabs.find((tab) => tab.key === paymentTab) ?? paymentTabs[0];
    const settingsGroups = [
        {
            key: 'identity',
            eyebrow: 'Base',
            title: 'Identidad',
            description: 'Empresa, ubicacion y branding.',
            sections: '3 secciones',
        },
        {
            key: 'operations',
            eyebrow: 'Core',
            title: 'Operacion',
            description: 'Inventario, sucursales, facturacion y moneda.',
            sections: '4 secciones',
        },
        {
            key: 'commerce',
            eyebrow: 'Venta',
            title: 'Comercio',
            description: 'Pagos, checkout y textos de tienda.',
            sections: '2 secciones',
        },
        {
            key: 'communication',
            eyebrow: 'Canales',
            title: 'Comunicacion',
            description: 'Seguridad, QR y correo transaccional.',
            sections: '3 secciones',
        },
    ];
    const activeSettingsMeta = settingsGroups.find((group) => group.key === activeSettingsGroup) ?? settingsGroups[0];

    return (
        <AuthenticatedLayout>
            <Head title="Configuración" />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <form onSubmit={submit} className="space-y-8">
                    <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-[linear-gradient(135deg,_#f8fafc,_#e0f2fe_52%,_#fff7ed)] shadow-sm">
                        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-700">Configuracion</p>
                                <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                                    Ordena toda la administracion en bloques claros y faciles de operar.
                                </h1>
                                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                                    Esta vista ahora se divide por grupos funcionales para que el usuario no tenga que recorrer un formulario interminable. Edita solo el area que necesitas y mantén contexto con un resumen permanente.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                                <div className="rounded-[24px] border border-white/60 bg-white/70 px-4 py-4 backdrop-blur">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Grupos</p>
                                    <p className="mt-2 text-3xl font-semibold text-slate-900">{settingsGroups.length}</p>
                                </div>
                                <div className="rounded-[24px] border border-white/60 bg-white/70 px-4 py-4 backdrop-blur">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Metodos activos</p>
                                    <p className="mt-2 text-3xl font-semibold text-slate-900">{activeMethods}</p>
                                </div>
                                <div className="rounded-[24px] border border-white/60 bg-white/70 px-4 py-4 backdrop-blur">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Seccion actual</p>
                                    <p className="mt-2 text-lg font-semibold text-slate-900">{activeSettingsMeta.title}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                            <div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm">
                                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Navegacion</p>
                                <div className="space-y-3">
                                    {settingsGroups.map((group) => {
                                        const isActive = activeSettingsGroup === group.key;

                                        return (
                                            <button
                                                key={group.key}
                                                type="button"
                                                onClick={() => setActiveSettingsGroup(group.key)}
                                                className={`w-full rounded-[24px] border p-4 text-left transition ${isActive ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-white'}`}
                                            >
                                                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isActive ? 'text-sky-200' : 'text-slate-500'}`}>{group.eyebrow}</p>
                                                <div className="mt-2 flex items-start justify-between gap-3">
                                                    <div>
                                                        <h2 className="text-base font-semibold">{group.title}</h2>
                                                        <p className={`mt-2 text-sm leading-6 ${isActive ? 'text-slate-200' : 'text-slate-600'}`}>{group.description}</p>
                                                    </div>
                                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isActive ? 'bg-white/10 text-white' : 'bg-white text-slate-600'}`}>
                                                        {group.sections}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Contexto</p>
                                <h2 className="mt-2 text-xl font-semibold text-slate-900">{activeSettingsMeta.title}</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{activeSettingsMeta.description}</p>
                                <div className="mt-5 space-y-3 text-sm text-slate-600">
                                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                        <span>Secciones</span>
                                        <strong className="text-slate-900">{activeSettingsMeta.sections}</strong>
                                    </div>
                                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                        <span>Cuentas visibles</span>
                                        <strong className="text-slate-900">{visibleBankAccounts}</strong>
                                    </div>
                                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                        <span>Bancos origen</span>
                                        <strong className="text-slate-900">{visibleOriginBanks}</strong>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        <div className="space-y-6">
                            {activeSettingsGroup === 'identity' && (
                                <>
                                    <SettingsSection
                                        eyebrow="Empresa"
                                        title="Datos de empresa"
                                        description="Define la identidad principal del negocio y los datos que se reutilizan en panel, documentos y contacto."
                                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Nombre de la empresa *</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.general.company_name || ''}
                                    onChange={handleChange('general', 'company_name')}
                                />
                                {errors['general.company_name'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['general.company_name']}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Nombre comercial</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.general.trade_name || ''}
                                    onChange={handleChange('general', 'trade_name')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">RIF / NIT</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.general.tax_id || ''}
                                    onChange={handleChange('general', 'tax_id')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Email</label>
                                <input
                                    type="email"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.general.email || ''}
                                    onChange={handleChange('general', 'email')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Teléfono</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.general.phone || ''}
                                    onChange={handleChange('general', 'phone')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">WhatsApp</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.general.whatsapp || ''}
                                    onChange={handleChange('general', 'whatsapp')}
                                />
                            </div>
                        </div>
                                    </SettingsSection>

                                    <SettingsSection
                                        eyebrow="Ubicacion"
                                        title="Ubicacion"
                                        description="Organiza la informacion geografica del negocio y los enlaces de referencia para contacto y mapa."
                                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Dirección</label>
                                <textarea
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    rows={2}
                                    value={data.location.address || ''}
                                    onChange={handleChange('location', 'address')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Ciudad</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.location.city || ''}
                                    onChange={handleChange('location', 'city')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Estado / Región</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.location.state || ''}
                                    onChange={handleChange('location', 'state')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">País</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.location.country || ''}
                                    onChange={handleChange('location', 'country')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">URL de Google Maps</label>
                                <input
                                    type="url"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.location.google_maps_url || ''}
                                    onChange={handleChange('location', 'google_maps_url')}
                                />
                            </div>
                        </div>
                                    </SettingsSection>

                                    <SettingsSection
                                        eyebrow="Visual"
                                        title="Branding"
                                        description="Concentra logos, favicon y colores clave para mantener una identidad consistente en toda la experiencia."
                                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Logo (URL)</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.branding.logo_url || ''}
                                    onChange={handleChange('branding', 'logo_url')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Logo oscuro (URL)</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.branding.logo_dark_url || ''}
                                    onChange={handleChange('branding', 'logo_dark_url')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Favicon (URL)</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.branding.favicon_url || ''}
                                    onChange={handleChange('branding', 'favicon_url')}
                                />
                            </div>
                            <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700">Color primario</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                        value={data.branding.primary_color || ''}
                                        onChange={handleChange('branding', 'primary_color')}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700">Color secundario</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                        value={data.branding.secondary_color || ''}
                                        onChange={handleChange('branding', 'secondary_color')}
                                    />
                                </div>
                            </div>
                        </div>
                                    </SettingsSection>
                                </>
                            )}

                            {activeSettingsGroup === 'operations' && (
                                <>
                                    <SettingsSection
                                        eyebrow="Inventario"
                                        title="Inventario"
                                        description="Configura reglas base de stock para evitar ajustes repetitivos y mantener el comportamiento esperado del sistema."
                                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    id="allow_negative_stock"
                                    type="checkbox"
                                    className="rounded border-slate-300 text-sky-600 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                    checked={!!data.inventory.allow_negative_stock}
                                    onChange={handleChange('inventory', 'allow_negative_stock')}
                                />
                                <label htmlFor="allow_negative_stock" className="text-sm text-slate-700">
                                    Permitir stock negativo
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Stock mínimo por defecto</label>
                                <input
                                    type="number"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.inventory.default_min_stock ?? 0}
                                    onChange={handleChange('inventory', 'default_min_stock')}
                                />
                                {errors['inventory.default_min_stock'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['inventory.default_min_stock']}</p>
                                )}
                            </div>
                        </div>
                                    </SettingsSection>

                                    <SettingsSection
                                        eyebrow="Sucursal"
                                        title="Multi-bodega y ventas"
                                        description="Define como se comportan las facturas respecto a la seleccion de bodegas y la operacion diaria de ventas."
                                    >
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    id="require_warehouse_on_invoice"
                                    type="checkbox"
                                    className="rounded border-slate-300 text-sky-600 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                    checked={!!data.warehouses.require_warehouse_on_invoice}
                                    onChange={handleChange('warehouses', 'require_warehouse_on_invoice')}
                                />
                                <label htmlFor="require_warehouse_on_invoice" className="text-sm text-slate-700">
                                    Requerir seleccionar bodega/sucursal en las facturas
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Bodega por defecto para ventas</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.warehouses.default_warehouse_id ?? ''}
                                    onChange={handleChange('warehouses', 'default_warehouse_id')}
                                >
                                    <option value="">Sin bodega por defecto</option>
                                    {(warehouseOptions || []).map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.name} ({w.code})
                                        </option>
                                    ))}
                                </select>
                                {errors['warehouses.default_warehouse_id'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['warehouses.default_warehouse_id']}</p>
                                )}
                            </div>
                        </div>
                                    </SettingsSection>

                                    <SettingsSection
                                        eyebrow="Documentos"
                                        title="Facturacion"
                                        description="Agrupa numeracion, impuestos y reglas contables generales para las facturas emitidas."
                                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Prefijo de factura</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.billing.invoice_prefix || ''}
                                    onChange={handleChange('billing', 'invoice_prefix')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Longitud del número</label>
                                <input
                                    type="number"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.billing.invoice_length || ''}
                                    onChange={handleChange('billing', 'invoice_length')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Impuesto por defecto (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.billing.default_tax_percent || 0}
                                    onChange={handleChange('billing', 'default_tax_percent')}
                                />
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    id="enable_igtf"
                                    type="checkbox"
                                    className="rounded border-slate-300 text-sky-600 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                    checked={!!data.billing.enable_igtf}
                                    onChange={handleChange('billing', 'enable_igtf')}
                                />
                                <label htmlFor="enable_igtf" className="text-sm text-slate-700">Habilitar IGTF</label>
                            </div>
                        </div>
                                    </SettingsSection>

                                    <SettingsSection
                                        eyebrow="Moneda"
                                        title="Moneda"
                                        description="Centraliza la configuracion monetaria usada en toda la aplicacion y su fuente de tasa."
                                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Moneda base</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.currency.base_currency || ''}
                                    onChange={handleChange('currency', 'base_currency')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Segunda moneda</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.currency.secondary_currency || ''}
                                    onChange={handleChange('currency', 'secondary_currency')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Fuente de tasa</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.currency.rate_source || ''}
                                    onChange={handleChange('currency', 'rate_source')}
                                />
                            </div>
                        </div>
                                    </SettingsSection>
                                </>
                            )}

                            {activeSettingsGroup === 'communication' && (
                                <>
                                    <SettingsSection
                                        eyebrow="Seguridad"
                                        title="Seguridad"
                                        description="Ajusta la dureza de acceso y prepara el sistema para futuros mecanismos de autenticacion reforzada."
                                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Longitud mínima de contraseña</label>
                                <input
                                    type="number"
                                    min={6}
                                    max={64}
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.security.min_password_length ?? 8}
                                    onChange={handleChange('security', 'min_password_length')}
                                />
                                {errors['security.min_password_length'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['security.min_password_length']}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Intentos fallidos antes de bloqueo</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.security.max_failed_logins ?? 5}
                                    onChange={handleChange('security', 'max_failed_logins')}
                                />
                                {errors['security.max_failed_logins'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['security.max_failed_logins']}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-6">
                                <input
                                    id="enable_two_factor"
                                    type="checkbox"
                                    className="rounded border-slate-300 text-sky-600 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                    checked={!!data.security.enable_two_factor}
                                    onChange={handleChange('security', 'enable_two_factor')}
                                />
                                <label htmlFor="enable_two_factor" className="text-sm text-slate-700">
                                    Habilitar 2FA (para futuros inicios de sesión)
                                </label>
                            </div>
                        </div>
                                    </SettingsSection>

                                    <SettingsSection
                                        eyebrow="Automatizacion"
                                        title="QR y enlaces rapidos"
                                        description="Concentra las bases de URL para documentos, productos y contacto, evitando configuraciones dispersas."
                                    >
                        <p className="text-sm text-slate-600">
                            Estas URLs se usarán como base para generar códigos QR de facturas, productos y contacto.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">URL base para facturas</label>
                                <input
                                    type="url"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.qr.invoice_base_url || ''}
                                    onChange={handleChange('qr', 'invoice_base_url')}
                                    placeholder="https://midominio.com/facturas/{numero}"
                                />
                                {errors['qr.invoice_base_url'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['qr.invoice_base_url']}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">URL base para productos</label>
                                <input
                                    type="url"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.qr.product_base_url || ''}
                                    onChange={handleChange('qr', 'product_base_url')}
                                    placeholder="https://midominio.com/productos/{sku}"
                                />
                                {errors['qr.product_base_url'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['qr.product_base_url']}</p>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">URL de contacto por WhatsApp</label>
                                <input
                                    type="url"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.qr.whatsapp_contact_url || ''}
                                    onChange={handleChange('qr', 'whatsapp_contact_url')}
                                    placeholder="https://wa.me/58XXXXXXXXXX?text=Hola%20tengo%20una%20consulta"
                                />
                                {errors['qr.whatsapp_contact_url'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['qr.whatsapp_contact_url']}</p>
                                )}
                            </div>
                        </div>
                                    </SettingsSection>

                                    <SettingsSection
                                        eyebrow="Mensajeria"
                                        title="Correo electronico"
                                        description="Edita los textos base del correo transaccional sin salir de un panel dedicado a la comunicacion."
                                    >
                        <p className="text-sm text-slate-600">
                            Ajusta algunos textos base que se usarán en las plantillas de correo (por ejemplo, facturas).
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Prefijo de asunto para facturas</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.mail.invoice_subject_prefix || ''}
                                    onChange={handleChange('mail', 'invoice_subject_prefix')}
                                    placeholder="Ej: Factura, Comprobante, Pedido"
                                />
                                {errors['mail.invoice_subject_prefix'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['mail.invoice_subject_prefix']}</p>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Texto introductorio del correo de factura</label>
                                <textarea
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    rows={2}
                                    value={data.mail.invoice_intro || ''}
                                    onChange={handleChange('mail', 'invoice_intro')}
                                    placeholder="Ej: Gracias por tu compra. A continuación puedes revisar el detalle y estado de tu pedido."
                                />
                                {errors['mail.invoice_intro'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['mail.invoice_intro']}</p>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Texto de pie de correo</label>
                                <textarea
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    rows={2}
                                    value={data.mail.footer_text || ''}
                                    onChange={handleChange('mail', 'footer_text')}
                                    placeholder="Ej: Gracias por confiar en nosotros. Este mensaje fue generado automáticamente."
                                />
                                {errors['mail.footer_text'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['mail.footer_text']}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Texto del botón en el correo de factura</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.mail.invoice_button_text || ''}
                                    onChange={handleChange('mail', 'invoice_button_text')}
                                    placeholder="Ej: Ver mi pedido, Ver detalle de la compra"
                                />
                                {errors['mail.invoice_button_text'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['mail.invoice_button_text']}</p>
                                )}
                            </div>
                        </div>
                                    </SettingsSection>
                                </>
                            )}

                            {activeSettingsGroup === 'commerce' && (
                                <>
                    <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 bg-[linear-gradient(135deg,_#0f172a,_#1e293b)] px-6 py-6 text-white">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Pagos</p>
                                    <h2 className="mt-2 text-2xl font-semibold">Metodos, pasarelas y cuentas bancarias</h2>
                                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                                        Activa lo que quieras mostrar en checkout. Las pasarelas se habilitan aqui y las cuentas bancarias manuales quedan disponibles para transferencias.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Metodos activos</p>
                                        <p className="mt-1 text-2xl font-semibold text-white">{activeMethods}</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Cuentas visibles</p>
                                        <p className="mt-1 text-2xl font-semibold text-white">{visibleBankAccounts}</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Bancos origen</p>
                                        <p className="mt-1 text-2xl font-semibold text-white">{visibleOriginBanks}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 p-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                            <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-3">
                                    <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Canales</p>
                                    <div className="space-y-3">
                                        {paymentTabs.map((tab) => {
                                            const isActive = paymentTab === tab.key;

                                            return (
                                                <button
                                                    key={tab.key}
                                                    type="button"
                                                    onClick={() => setPaymentTab(tab.key)}
                                                    className={`w-full rounded-[24px] border p-4 text-left transition ${isActive ? `bg-gradient-to-br ${tab.accent} ${tab.ring} shadow-sm` : 'border-transparent bg-white hover:border-slate-200 hover:bg-slate-50'}`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{tab.eyebrow}</p>
                                                            <h3 className="mt-2 text-base font-semibold text-slate-900">{tab.title}</h3>
                                                        </div>
                                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tab.enabled ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                            {tab.enabled ? 'Activo' : 'Pausado'}
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 text-sm leading-6 text-slate-600">{tab.description}</p>
                                                    <div className="mt-4 flex items-center justify-between gap-3">
                                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tab.badge}`}>
                                                            {tab.readiness}
                                                        </span>
                                                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                            {isActive ? 'Editando' : 'Abrir'}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Resumen</p>
                                    <h3 className="mt-2 text-lg font-semibold text-slate-900">{activePaymentTab.title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">{activePaymentTab.description}</p>
                                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                            <span>Estado</span>
                                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${activePaymentTab.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                {activePaymentTab.enabled ? 'Visible en checkout' : 'Oculto en checkout'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                            <span>Preparación</span>
                                            <span className="text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{activePaymentTab.readiness}</span>
                                        </div>
                                    </div>
                                </div>
                            </aside>

                            <div className="space-y-6 rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6">
                                <div className={`rounded-[24px] border bg-gradient-to-br p-5 ${activePaymentTab.ring} ${activePaymentTab.accent}`}>
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace</p>
                                            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Configura {activePaymentTab.title} sin ruido visual</h3>
                                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                                Ajusta disponibilidad, mensaje visible en checkout y requisitos operativos en un solo panel. El contenido secundario queda resumido en la barra lateral.
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">Checkout guiado</span>
                                            <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">Edición centralizada</span>
                                        </div>
                                    </div>
                                </div>

                                {paymentTab === 'manual' ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                                            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div className="md:col-span-2 flex items-center gap-2">
                                                    <input
                                                        id="payments_manual_enabled"
                                                        type="checkbox"
                                                        className="rounded border-slate-300 text-sky-600 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                                        checked={!!manualMethod.enabled}
                                                        onChange={(e) => updatePaymentMethod('manual', 'enabled', e.target.checked)}
                                                    />
                                                    <label htmlFor="payments_manual_enabled" className="text-sm font-medium text-slate-700">
                                                        Habilitar pago manual en checkout
                                                    </label>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700">Nombre visible</label>
                                                    <input
                                                        type="text"
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                        value={manualMethod.label || ''}
                                                        onChange={(e) => updatePaymentMethod('manual', 'label', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700">Recargo (%)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min={0}
                                                        max={100}
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                        value={manualMethod.fee_percent ?? 0}
                                                        onChange={(e) => updatePaymentMethod('manual', 'fee_percent', e.target.value)}
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-slate-700">Descripcion</label>
                                                    <input
                                                        type="text"
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                        value={manualMethod.description || ''}
                                                        onChange={(e) => updatePaymentMethod('manual', 'description', e.target.value)}
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-slate-700">Instrucciones al cliente</label>
                                                    <textarea
                                                        rows={3}
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                        value={manualMethod.instructions || ''}
                                                        onChange={(e) => updatePaymentMethod('manual', 'instructions', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            </div>

                                            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
                                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Experiencia</p>
                                                <h3 className="mt-2 text-lg font-semibold text-emerald-950">Transferencias claras para el cliente</h3>
                                                <p className="mt-2 text-sm leading-6 text-emerald-900/80">
                                                    El checkout mostrara tarjetas con las cuentas disponibles, datos del titular y un formulario corto para referencia, banco de origen y fecha.
                                                </p>
                                                <div className="mt-4 space-y-2 text-sm text-emerald-900/80">
                                                    <div className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3">
                                                        <span>Cuentas publicadas</span>
                                                        <strong>{visibleBankAccounts}</strong>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3">
                                                        <span>Bancos origen visibles</span>
                                                        <strong>{visibleOriginBanks}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900">Cuentas bancarias disponibles</h3>
                                                <p className="text-sm text-slate-600">Estas son las cuentas que el cliente vera al pagar por transferencia.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addBankAccount}
                                                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                                            >
                                                Agregar cuenta bancaria
                                            </button>
                                        </div>

                                        <div className="mt-5 space-y-4">
                                            {bankAccounts.length === 0 ? (
                                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                                                    No hay cuentas cargadas todavia.
                                                </div>
                                            ) : bankAccounts.map((account, index) => (
                                                <details key={`bank-account-${index}`} className="group overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 open:bg-white">
                                                    <summary className="flex cursor-pointer list-none flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-base font-semibold text-slate-900">{account?.bank_name || `Cuenta ${index + 1}`}</h4>
                                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${account?.enabled !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                                    {account?.enabled !== false ? 'Visible' : 'Oculta'}
                                                                </span>
                                                            </div>
                                                            <p className="mt-1 text-sm text-slate-600">
                                                                {(account?.account_name || 'Sin titular')} · {(account?.account_number || 'Sin número')}
                                                            </p>
                                                        </div>
                                                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 transition group-open:rotate-180">Abrir</span>
                                                    </summary>

                                                    <div className="border-t border-slate-200 px-4 py-4">
                                                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    id={`bank_account_enabled_${index}`}
                                                                    type="checkbox"
                                                                    className="rounded border-slate-300 text-sky-600 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                                                    checked={account?.enabled !== false}
                                                                    onChange={(e) => updateBankAccount(index, 'enabled', e.target.checked)}
                                                                />
                                                                <label htmlFor={`bank_account_enabled_${index}`} className="text-sm font-medium text-slate-700">
                                                                    Mostrar esta cuenta en checkout
                                                                </label>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeBankAccount(index)}
                                                                className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                                                            >
                                                                Eliminar cuenta
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700">Banco</label>
                                                            <input
                                                                type="text"
                                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                value={account?.bank_name || ''}
                                                                onChange={(e) => updateBankAccount(index, 'bank_name', e.target.value)}
                                                            />
                                                            {errors[`payments.bank_accounts.${index}.bank_name`] && <p className="mt-1 text-xs text-red-600">{errors[`payments.bank_accounts.${index}.bank_name`]}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700">Titular</label>
                                                            <input
                                                                type="text"
                                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                value={account?.account_name || ''}
                                                                onChange={(e) => updateBankAccount(index, 'account_name', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700">Numero de cuenta</label>
                                                            <input
                                                                type="text"
                                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                value={account?.account_number || ''}
                                                                onChange={(e) => updateBankAccount(index, 'account_number', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700">Tipo de cuenta</label>
                                                            <input
                                                                type="text"
                                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                value={account?.account_type || ''}
                                                                onChange={(e) => updateBankAccount(index, 'account_type', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700">RIF / Cedula</label>
                                                            <input
                                                                type="text"
                                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                value={account?.identification || ''}
                                                                onChange={(e) => updateBankAccount(index, 'identification', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700">Telefono</label>
                                                            <input
                                                                type="text"
                                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                value={account?.phone || ''}
                                                                onChange={(e) => updateBankAccount(index, 'phone', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2 xl:col-span-1">
                                                            <label className="block text-sm font-medium text-slate-700">Email</label>
                                                            <input
                                                                type="email"
                                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                value={account?.email || ''}
                                                                onChange={(e) => updateBankAccount(index, 'email', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2 xl:col-span-2">
                                                            <label className="block text-sm font-medium text-slate-700">Nota visible</label>
                                                            <input
                                                                type="text"
                                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                value={account?.notes || ''}
                                                                onChange={(e) => updateBankAccount(index, 'notes', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    </div>
                                                </details>
                                            ))}
                                        </div>
                                        </div>

                                        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900">Bancos de origen para el formulario</h3>
                                                <p className="text-sm text-slate-600">El cliente podra elegir desde que banco hizo su transferencia.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addOriginBank}
                                                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                                            >
                                                Agregar banco origen
                                            </button>
                                        </div>

                                        <div className="mt-5 space-y-3">
                                            {originBanks.length === 0 ? (
                                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                                                    No hay bancos de origen cargados todavia.
                                                </div>
                                            ) : originBanks.map((bank, index) => (
                                                <div key={`origin-bank-${index}`} className="flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center">
                                                    <div className="flex items-center gap-2 md:w-40">
                                                        <input
                                                            id={`origin_bank_enabled_${index}`}
                                                            type="checkbox"
                                                            className="rounded border-slate-300 text-sky-600 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                                            checked={bank?.enabled !== false}
                                                            onChange={(e) => updateOriginBank(index, 'enabled', e.target.checked)}
                                                        />
                                                        <label htmlFor={`origin_bank_enabled_${index}`} className="text-sm font-medium text-slate-700">
                                                            Visible
                                                        </label>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-slate-700">Nombre del banco</label>
                                                        <input
                                                            type="text"
                                                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                            value={bank?.name || ''}
                                                            onChange={(e) => updateOriginBank(index, 'name', e.target.value)}
                                                        />
                                                        {errors[`payments.origin_banks.${index}.name`] && <p className="mt-1 text-xs text-red-600">{errors[`payments.origin_banks.${index}.name`]}</p>}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOriginBank(index)}
                                                        className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        </div>
                                    </div>
                                ) : paymentTab === 'paypal' ? (
                                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                                        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="md:col-span-2 flex items-center gap-2">
                                                <input
                                                    id="payments_paypal_enabled"
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-sky-600 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                                    checked={!!paypalMethod.enabled}
                                                    onChange={(e) => updatePaymentMethod('paypal', 'enabled', e.target.checked)}
                                                />
                                                <label htmlFor="payments_paypal_enabled" className="text-sm font-medium text-slate-700">
                                                    Habilitar PayPal en checkout
                                                </label>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Nombre visible</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={paypalMethod.label || ''}
                                                    onChange={(e) => updatePaymentMethod('paypal', 'label', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Entorno</label>
                                                <select
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={paypalMethod.environment || 'sandbox'}
                                                    onChange={(e) => updatePaymentMethod('paypal', 'environment', e.target.value)}
                                                >
                                                    <option value="sandbox">Sandbox</option>
                                                    <option value="live">Live</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Client ID</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={paypalMethod.client_id || ''}
                                                    onChange={(e) => updatePaymentMethod('paypal', 'client_id', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Client Secret</label>
                                                <input
                                                    type="password"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={paypalMethod.client_secret || ''}
                                                    onChange={(e) => updatePaymentMethod('paypal', 'client_secret', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Recargo (%)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min={0}
                                                    max={100}
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={paypalMethod.fee_percent ?? 0}
                                                    onChange={(e) => updatePaymentMethod('paypal', 'fee_percent', e.target.value)}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700">Descripcion</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={paypalMethod.description || ''}
                                                    onChange={(e) => updatePaymentMethod('paypal', 'description', e.target.value)}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700">Instrucciones al cliente</label>
                                                <textarea
                                                    rows={3}
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={paypalMethod.instructions || ''}
                                                    onChange={(e) => updatePaymentMethod('paypal', 'instructions', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        </div>

                                        <div className="rounded-[24px] border border-sky-200 bg-sky-50 p-5">
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Pasarela</p>
                                            <h3 className="mt-2 text-lg font-semibold text-sky-950">Activacion controlada desde configuracion</h3>
                                            <p className="mt-2 text-sm leading-6 text-sky-900/80">
                                                Cuando esta opcion esta activa, checkout mostrara PayPal como un metodo seleccionable. Las credenciales quedan centralizadas aqui para el equipo administrativo.
                                            </p>
                                            <div className="mt-4 space-y-2 text-sm text-sky-900/80">
                                                <div className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3">
                                                    <span>Client ID</span>
                                                    <strong>{paypalMethod.client_id ? 'Configurado' : 'Pendiente'}</strong>
                                                </div>
                                                <div className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3">
                                                    <span>Client Secret</span>
                                                    <strong>{paypalMethod.client_secret ? 'Configurado' : 'Pendiente'}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                                        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="md:col-span-2 flex items-center gap-2">
                                                <input
                                                    id="payments_stripe_enabled"
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-sky-600 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                                    checked={!!stripeMethod.enabled}
                                                    onChange={(e) => updatePaymentMethod('stripe', 'enabled', e.target.checked)}
                                                />
                                                <label htmlFor="payments_stripe_enabled" className="text-sm font-medium text-slate-700">
                                                    Habilitar Stripe en checkout
                                                </label>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Nombre visible</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={stripeMethod.label || ''}
                                                    onChange={(e) => updatePaymentMethod('stripe', 'label', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Entorno</label>
                                                <select
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={stripeMethod.environment || 'test'}
                                                    onChange={(e) => updatePaymentMethod('stripe', 'environment', e.target.value)}
                                                >
                                                    <option value="test">Test</option>
                                                    <option value="live">Live</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Publishable Key</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={stripeMethod.publishable_key || ''}
                                                    onChange={(e) => updatePaymentMethod('stripe', 'publishable_key', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Secret Key</label>
                                                <input
                                                    type="password"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={stripeMethod.secret_key || ''}
                                                    onChange={(e) => updatePaymentMethod('stripe', 'secret_key', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Recargo (%)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min={0}
                                                    max={100}
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={stripeMethod.fee_percent ?? 0}
                                                    onChange={(e) => updatePaymentMethod('stripe', 'fee_percent', e.target.value)}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700">Descripcion</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={stripeMethod.description || ''}
                                                    onChange={(e) => updatePaymentMethod('stripe', 'description', e.target.value)}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700">Instrucciones al cliente</label>
                                                <textarea
                                                    rows={3}
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={stripeMethod.instructions || ''}
                                                    onChange={(e) => updatePaymentMethod('stripe', 'instructions', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        </div>

                                        <div className="rounded-[24px] border border-fuchsia-200 bg-fuchsia-50 p-5">
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-700">Tarjetas</p>
                                            <h3 className="mt-2 text-lg font-semibold text-fuchsia-950">Formulario integrado en el checkout</h3>
                                            <p className="mt-2 text-sm leading-6 text-fuchsia-900/80">
                                                Cuando esté activo, el checkout mostrara un formulario seguro de tarjeta solo si el cliente elige Stripe como metodo de pago.
                                            </p>
                                            <div className="mt-4 space-y-2 text-sm text-fuchsia-900/80">
                                                <div className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3">
                                                    <span>Publishable Key</span>
                                                    <strong>{stripeMethod.publishable_key ? 'Configurada' : 'Pendiente'}</strong>
                                                </div>
                                                <div className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3">
                                                    <span>Secret Key</span>
                                                    <strong>{stripeMethod.secret_key ? 'Configurada' : 'Pendiente'}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                                    <SettingsSection
                                        eyebrow="Escaparate"
                                        title="Tienda publica"
                                        description="Mantiene reunidos los textos principales de la experiencia publica para que el equipo los pueda actualizar sin friccion."
                                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Título de inicio</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.store.home_title || ''}
                                    onChange={handleChange('store', 'home_title')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Subtítulo</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.store.home_subtitle || ''}
                                    onChange={handleChange('store', 'home_subtitle')}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Texto de contacto</label>
                                <textarea
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    rows={2}
                                    value={data.store.contact_text || ''}
                                    onChange={handleChange('store', 'contact_text')}
                                />
                            </div>
                        </div>
                                    </SettingsSection>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="sticky bottom-4 z-10">
                        <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white/95 px-5 py-4 shadow-lg shadow-slate-200/60 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Guardado</p>
                                <p className="mt-1 text-sm text-slate-600">
                                    Estás editando <span className="font-semibold text-slate-900">{activeSettingsMeta.title}</span>. Guarda cuando termines este bloque.
                                </p>
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {processing ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
