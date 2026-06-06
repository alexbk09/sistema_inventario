import React, { useEffect, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { toast } from 'react-hot-toast';

const buildDefaultPayments = (t) => ({
    methods: {
        manual: {
            enabled: true,
            label: t('admin.settings.commerce.tabs.manual.label', 'Transferencia bancaria'),
            description: t('admin.settings.commerce.manual.defaults.description', 'Pago por transferencia o deposito con referencia manual.'),
            instructions: t('admin.settings.commerce.manual.defaults.instructions', 'Realiza tu transferencia y comparte los datos del pago durante el checkout.'),
            fee_percent: 0,
        },
        paypal: {
            enabled: false,
            label: t('admin.settings.commerce.tabs.paypal.title', 'PayPal'),
            description: t('admin.settings.commerce.paypal.defaults.description', 'Habilita PayPal cuando tengas tus credenciales listas.'),
            client_id: '',
            client_secret: '',
            environment: 'sandbox',
            instructions: t('admin.settings.commerce.paypal.defaults.instructions', 'Configura Client ID y Secret para activarlo.'),
            fee_percent: 0,
        },
        stripe: {
            enabled: false,
            label: t('admin.settings.commerce.tabs.stripe.title', 'Stripe'),
            description: t('admin.settings.commerce.stripe.defaults.description', 'Acepta pagos con tarjeta mediante Stripe.'),
            publishable_key: '',
            secret_key: '',
            environment: 'test',
            instructions: t('admin.settings.commerce.stripe.defaults.instructions', 'Configura Publishable Key y Secret Key para activar el cobro con tarjeta.'),
            fee_percent: 0,
        },
    },
    bank_accounts: [],
    origin_banks: [],
});

const buildDefaultStore = (t) => ({
    home_title: t('admin.settings.commerce.store.defaults.home_title', 'Tienda'),
    home_subtitle: '',
    hero_badge: t('admin.settings.commerce.store.defaults.hero_badge', 'Compra con confianza'),
    hero_description: '',
    hero_primary_cta_label: t('admin.settings.commerce.store.defaults.hero_primary_cta_label', 'Ir a la tienda'),
    hero_primary_cta_url: '/shop',
    hero_secondary_cta_label: t('admin.settings.commerce.store.defaults.hero_secondary_cta_label', 'Contáctanos'),
    hero_secondary_cta_url: '#contacto',
    contact_text: '',
    hero_banners: [
        {
            title: t('admin.settings.commerce.store.defaults.banner_one_title', 'Productos destacados'),
            description: t('admin.settings.commerce.store.defaults.banner_one_description', 'Presenta promociones, categorias o nuevas llegadas desde el panel.'),
            image_url: '',
            background_color: '',
            text_color: '',
        },
        {
            title: t('admin.settings.commerce.store.defaults.banner_two_title', 'Tu catalogo siempre visible'),
            description: t('admin.settings.commerce.store.defaults.banner_two_description', 'Muestra beneficios, disponibilidad y ofertas desde la portada.'),
            image_url: '',
            background_color: '',
            text_color: '',
        },
        {
            title: t('admin.settings.commerce.store.defaults.banner_three_title', 'Informacion clara desde el inicio'),
            description: t('admin.settings.commerce.store.defaults.banner_three_description', 'Refuerza confianza con mensajes utiles y llamados a la accion concretos.'),
            image_url: '',
            background_color: '',
            text_color: '',
        },
    ],
    home_highlights: [
        {
            eyebrow: t('admin.settings.commerce.store.defaults.highlight_one_eyebrow', 'Catalogo'),
            title: t('admin.settings.commerce.store.defaults.highlight_one_title', 'Productos organizados'),
            description: t('admin.settings.commerce.store.defaults.highlight_one_description', 'Expone lo mejor de tu inventario con categorias claras y acceso directo.'),
            image_url: '',
            background_color: '',
            text_color: '',
        },
        {
            eyebrow: t('admin.settings.commerce.store.defaults.highlight_two_eyebrow', 'Confianza'),
            title: t('admin.settings.commerce.store.defaults.highlight_two_title', 'Informacion y contacto visibles'),
            description: t('admin.settings.commerce.store.defaults.highlight_two_description', 'Facilita la decision de compra mostrando marca, ubicacion y canales de atencion.'),
            image_url: '',
            background_color: '',
            text_color: '',
        },
        {
            eyebrow: t('admin.settings.commerce.store.defaults.highlight_three_eyebrow', 'Accion'),
            title: t('admin.settings.commerce.store.defaults.highlight_three_title', 'Llamados a la accion utiles'),
            description: t('admin.settings.commerce.store.defaults.highlight_three_description', 'Lleva al cliente rapido a la tienda, ofertas o medios de contacto.'),
            image_url: '',
            background_color: '',
            text_color: '',
        },
    ],
});

const currencyProviderOptions = [
    { value: 'dolarapi', label: 'DolarApi' },
    { value: 'frankfurter', label: 'Frankfurter' },
    { value: 'exchangeratehost', label: 'ExchangeRate.host' },
    { value: 'manual', labelKey: 'admin.settings.commerce.tabs.manual.title', defaultLabel: 'Manual' },
];

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
    const { t } = useI18n();
    const page = usePage();
    const flash = page.props?.flash ?? {};
    const defaultPayments = buildDefaultPayments(t);
    const defaultStore = buildDefaultStore(t);
    const { data, setData, put, processing, errors } = useForm({
        general: general ?? {},
        location: location ?? {},
        branding: branding ?? {},
        billing: billing ?? {},
        currency: currency ?? {},
        store: {
            ...defaultStore,
            ...(store ?? {}),
            hero_banners: Array.isArray(store?.hero_banners) && store.hero_banners.length > 0 ? store.hero_banners : defaultStore.hero_banners,
            home_highlights: Array.isArray(store?.home_highlights) && store.home_highlights.length > 0 ? store.home_highlights : defaultStore.home_highlights,
            hero_banner_files: [],
        },
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
    const [syncingCurrencyRates, setSyncingCurrencyRates] = useState(false);
    const supportedCurrencies = Array.isArray(data.currency?.supported_currencies) ? data.currency.supported_currencies : [];
    const enabledCurrencies = supportedCurrencies.filter((item) => item?.enabled);

    useEffect(() => {
        if (flash.success) {
            toast.success(flash.success);
        }

        if (flash.error) {
            toast.error(flash.error);
        }
    }, [flash.error, flash.success]);

    const handleChange = (section, field) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setData(section, {
            ...data[section],
            [field]: value,
        });
    };

    const submit = (e) => {
        e.preventDefault();
        router.post(route('admin.settings.update'), {
            ...data,
            _method: 'put',
        }, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const updateBrandingFile = (field, file) => {
        setData('branding', {
            ...data.branding,
            [field]: file || null,
        });
    };

    const syncCurrencyRates = () => {
        setSyncingCurrencyRates(true);
        router.post(route('admin.settings.currency.sync'), {}, {
            preserveScroll: true,
            onFinish: () => setSyncingCurrencyRates(false),
        });
    };

    const updateSupportedCurrency = (index, field, value) => {
        const nextCurrencies = [...supportedCurrencies];
        const current = nextCurrencies[index] ?? {};
        const nextValue = field === 'code' || field === 'rate_provider' || field === 'rate_mode'
            ? String(value || '').toUpperCase().replace('EXCHANGERATEHOST', 'exchangeratehost').replace('DOLARAPI', 'dolarapi').replace('FRANKFURTER', 'frankfurter').replace('MANUAL', 'manual')
            : value;

        nextCurrencies[index] = {
            ...current,
            [field]: nextValue,
        };

        if (field === 'enabled' && !value && data.currency.default_display_currency === current.code) {
            const fallbackCurrency = nextCurrencies.find((item) => item?.enabled && item?.code !== current.code)?.code || data.currency.base_currency || 'USD';
            setData('currency', {
                ...data.currency,
                default_display_currency: fallbackCurrency,
                supported_currencies: nextCurrencies,
            });
            return;
        }

        setData('currency', {
            ...data.currency,
            supported_currencies: nextCurrencies,
        });
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
            account_type: '',
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

    const updateStoreBanner = (index, field, value) => {
        const banners = Array.isArray(data.store?.hero_banners) ? [...data.store.hero_banners] : [];
        banners[index] = {
            ...(banners[index] ?? {}),
            [field]: value,
        };

        setData('store', {
            ...data.store,
            hero_banners: banners,
        });
    };

    const updateStoreBannerFile = (index, file) => {
        const bannerFiles = Array.isArray(data.store?.hero_banner_files) ? [...data.store.hero_banner_files] : [];
        bannerFiles[index] = file || null;

        setData('store', {
            ...data.store,
            hero_banner_files: bannerFiles,
        });
    };

    const addStoreBanner = () => {
        const banners = Array.isArray(data.store?.hero_banners) ? [...data.store.hero_banners] : [];
        if (banners.length >= 5) {
            return;
        }

        banners.push({ title: '', description: '', image_url: '', background_color: '', text_color: '' });

        setData('store', {
            ...data.store,
            hero_banners: banners,
        });
    };

    const removeStoreBanner = (index) => {
        const banners = (data.store?.hero_banners ?? []).filter((_, currentIndex) => currentIndex !== index);
        setData('store', {
            ...data.store,
            hero_banners: banners.length > 0 ? banners : defaultStore.hero_banners,
        });
    };

    const updateStoreHighlight = (index, field, value) => {
        const highlights = Array.isArray(data.store?.home_highlights) ? [...data.store.home_highlights] : [];
        highlights[index] = {
            ...(highlights[index] ?? {}),
            [field]: value,
        };

        setData('store', {
            ...data.store,
            home_highlights: highlights,
        });
    };

    const addStoreHighlight = () => {
        const highlights = Array.isArray(data.store?.home_highlights) ? [...data.store.home_highlights] : [];
        if (highlights.length >= 6) {
            return;
        }

        highlights.push({ eyebrow: '', title: '', description: '', image_url: '', background_color: '', text_color: '' });

        setData('store', {
            ...data.store,
            home_highlights: highlights,
        });
    };

    const removeStoreHighlight = (index) => {
        const highlights = (data.store?.home_highlights ?? []).filter((_, currentIndex) => currentIndex !== index);
        setData('store', {
            ...data.store,
            home_highlights: highlights.length > 0 ? highlights : defaultStore.home_highlights,
        });
    };

    const bankAccounts = Array.isArray(data.payments?.bank_accounts) ? data.payments.bank_accounts : [];
    const originBanks = Array.isArray(data.payments?.origin_banks) ? data.payments.origin_banks : [];
    const heroBanners = Array.isArray(data.store?.hero_banners) ? data.store.hero_banners : [];
    const homeHighlights = Array.isArray(data.store?.home_highlights) ? data.store.home_highlights : [];
    const manualMethod = data.payments?.methods?.manual ?? defaultPayments.methods.manual;
    const paypalMethod = data.payments?.methods?.paypal ?? defaultPayments.methods.paypal;
    const stripeMethod = data.payments?.methods?.stripe ?? defaultPayments.methods.stripe;
    const visibleBankAccounts = bankAccounts.filter((account) => account?.enabled !== false).length;
    const visibleOriginBanks = originBanks.filter((bank) => bank?.enabled !== false).length;
    const activeMethods = [manualMethod, paypalMethod, stripeMethod].filter((method) => method?.enabled).length;
    const paymentTabs = [
        {
            key: 'manual',
            title: t('admin.settings.commerce.tabs.manual.title', 'Manual'),
            eyebrow: t('admin.settings.commerce.tabs.manual.eyebrow', 'Transferencias'),
            description: manualMethod.description || t('admin.settings.commerce.tabs.manual.description', 'Cuentas bancarias y referencias manuales.'),
            enabled: !!manualMethod.enabled,
            readiness: t('admin.settings.commerce.tabs.manual.readiness', '{count} cuentas activas', { count: visibleBankAccounts }),
            accent: 'from-emerald-500/20 via-emerald-500/10 to-white',
            ring: 'border-emerald-200',
            badge: 'text-emerald-700 bg-emerald-100',
        },
        {
            key: 'paypal',
            title: t('admin.settings.commerce.tabs.paypal.title', 'PayPal'),
            eyebrow: t('admin.settings.commerce.tabs.paypal.eyebrow', 'Wallet'),
            description: paypalMethod.description || t('admin.settings.commerce.tabs.paypal.description', 'Cobros con PayPal para checkout.'),
            enabled: !!paypalMethod.enabled,
            readiness: paypalMethod.client_id ? t('admin.settings.commerce.tabs.paypal.ready', 'Credenciales listas') : t('admin.settings.commerce.tabs.paypal.pending', 'Faltan credenciales'),
            accent: 'from-sky-500/20 via-sky-500/10 to-white',
            ring: 'border-sky-200',
            badge: paypalMethod.client_id ? 'text-sky-700 bg-sky-100' : 'text-amber-700 bg-amber-100',
        },
        {
            key: 'stripe',
            title: t('admin.settings.commerce.tabs.stripe.title', 'Stripe'),
            eyebrow: t('admin.settings.commerce.tabs.stripe.eyebrow', 'Tarjetas'),
            description: stripeMethod.description || t('admin.settings.commerce.tabs.stripe.description', 'Cobros con tarjeta y formulario seguro.'),
            enabled: !!stripeMethod.enabled,
            readiness: stripeMethod.publishable_key ? t('admin.settings.commerce.tabs.stripe.ready', 'Llaves listas') : t('admin.settings.commerce.tabs.stripe.pending', 'Faltan llaves'),
            accent: 'from-fuchsia-500/20 via-fuchsia-500/10 to-white',
            ring: 'border-fuchsia-200',
            badge: stripeMethod.publishable_key ? 'text-fuchsia-700 bg-fuchsia-100' : 'text-amber-700 bg-amber-100',
        },
    ];
    const activePaymentTab = paymentTabs.find((tab) => tab.key === paymentTab) ?? paymentTabs[0];
    const settingsGroups = [
        {
            key: 'identity',
            eyebrow: t('admin.settings.groups.identity.eyebrow', 'Base'),
            title: t('admin.settings.groups.identity.title', 'Identidad'),
            description: t('admin.settings.groups.identity.description', 'Empresa, ubicacion y branding.'),
            sections: t('admin.settings.groups.identity.sections', '3 secciones'),
        },
        {
            key: 'operations',
            eyebrow: t('admin.settings.groups.operations.eyebrow', 'Core'),
            title: t('admin.settings.groups.operations.title', 'Operacion'),
            description: t('admin.settings.groups.operations.description', 'Inventario, sucursales, facturacion y moneda.'),
            sections: t('admin.settings.groups.operations.sections', '4 secciones'),
        },
        {
            key: 'commerce',
            eyebrow: t('admin.settings.groups.commerce.eyebrow', 'Venta'),
            title: t('admin.settings.groups.commerce.title', 'Comercio'),
            description: t('admin.settings.groups.commerce.description', 'Pagos, checkout y textos de tienda.'),
            sections: t('admin.settings.groups.commerce.sections', '2 secciones'),
        },
        {
            key: 'communication',
            eyebrow: t('admin.settings.groups.communication.eyebrow', 'Canales'),
            title: t('admin.settings.groups.communication.title', 'Comunicacion'),
            description: t('admin.settings.groups.communication.description', 'Seguridad, QR y correo transaccional.'),
            sections: t('admin.settings.groups.communication.sections', '3 secciones'),
        },
    ];
    const activeSettingsMeta = settingsGroups.find((group) => group.key === activeSettingsGroup) ?? settingsGroups[0];

    return (
        <AuthenticatedLayout>
            <Head title={t('admin.settings.shell.page_title', 'Configuración')} />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <form onSubmit={submit} className="space-y-8">
                    <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-[linear-gradient(135deg,_#f8fafc,_#e0f2fe_52%,_#fff7ed)] shadow-sm">
                        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-700">{t('admin.settings.shell.eyebrow', 'Configuracion')}</p>
                                <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                                    {t('admin.settings.shell.title', 'Ordena toda la administracion en bloques claros y faciles de operar.')}
                                </h1>
                                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                                    {t('admin.settings.shell.description', 'Esta vista ahora se divide por grupos funcionales para que el usuario no tenga que recorrer un formulario interminable. Edita solo el area que necesitas y mantén contexto con un resumen permanente.')}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                                <div className="rounded-[24px] border border-white/60 bg-white/70 px-4 py-4 backdrop-blur">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.settings.shell.stats.groups', 'Grupos')}</p>
                                    <p className="mt-2 text-3xl font-semibold text-slate-900">{settingsGroups.length}</p>
                                </div>
                                <div className="rounded-[24px] border border-white/60 bg-white/70 px-4 py-4 backdrop-blur">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.settings.shell.stats.active_methods', 'Metodos activos')}</p>
                                    <p className="mt-2 text-3xl font-semibold text-slate-900">{activeMethods}</p>
                                </div>
                                <div className="rounded-[24px] border border-white/60 bg-white/70 px-4 py-4 backdrop-blur">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.settings.shell.stats.current_section', 'Seccion actual')}</p>
                                    <p className="mt-2 text-lg font-semibold text-slate-900">{activeSettingsMeta.title}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                            <div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm">
                                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('admin.settings.shell.navigation', 'Navegacion')}</p>
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
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('admin.settings.shell.context', 'Contexto')}</p>
                                <h2 className="mt-2 text-xl font-semibold text-slate-900">{activeSettingsMeta.title}</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{activeSettingsMeta.description}</p>
                                <div className="mt-5 space-y-3 text-sm text-slate-600">
                                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                        <span>{t('admin.settings.shell.context_items.sections', 'Secciones')}</span>
                                        <strong className="text-slate-900">{activeSettingsMeta.sections}</strong>
                                    </div>
                                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                        <span>{t('admin.settings.shell.context_items.visible_accounts', 'Cuentas visibles')}</span>
                                        <strong className="text-slate-900">{visibleBankAccounts}</strong>
                                    </div>
                                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                        <span>{t('admin.settings.shell.context_items.origin_banks', 'Bancos origen')}</span>
                                        <strong className="text-slate-900">{visibleOriginBanks}</strong>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        <div className="space-y-6">
                            {activeSettingsGroup === 'identity' && (
                                <>
                                    <SettingsSection
                                        eyebrow={t('admin.settings.identity.company.eyebrow', 'Empresa')}
                                        title={t('admin.settings.identity.company.title', 'Datos de empresa')}
                                        description={t('admin.settings.identity.company.description', 'Define la identidad principal del negocio y los datos que se reutilizan en panel, documentos y contacto.')}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.company.fields.company_name', 'Nombre de la empresa')} *</label>
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
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.company.fields.trade_name', 'Nombre comercial')}</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={data.general.trade_name || ''}
                                                    onChange={handleChange('general', 'trade_name')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.company.fields.tax_id', 'RIF / NIT')}</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={data.general.tax_id || ''}
                                                    onChange={handleChange('general', 'tax_id')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.company.fields.email', 'Email')}</label>
                                                <input
                                                    type="email"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={data.general.email || ''}
                                                    onChange={handleChange('general', 'email')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.company.fields.phone', 'Teléfono')}</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={data.general.phone || ''}
                                                    onChange={handleChange('general', 'phone')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.company.fields.whatsapp', 'WhatsApp')}</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={data.general.whatsapp || ''}
                                                    onChange={handleChange('general', 'whatsapp')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.company.fields.facebook_url', 'URL de Facebook')}</label>
                                                <input
                                                    type="url"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={data.general.facebook_url || ''}
                                                    onChange={handleChange('general', 'facebook_url')}
                                                    placeholder="https://facebook.com/tu-marca"
                                                />
                                                {errors['general.facebook_url'] && (
                                                    <p className="mt-1 text-xs text-red-600">{errors['general.facebook_url']}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.company.fields.instagram_url', 'URL de Instagram')}</label>
                                                <input
                                                    type="url"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={data.general.instagram_url || ''}
                                                    onChange={handleChange('general', 'instagram_url')}
                                                    placeholder="https://instagram.com/tu-marca"
                                                />
                                                {errors['general.instagram_url'] && (
                                                    <p className="mt-1 text-xs text-red-600">{errors['general.instagram_url']}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.company.fields.twitter_url', 'URL de X / Twitter')}</label>
                                                <input
                                                    type="url"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={data.general.twitter_url || ''}
                                                    onChange={handleChange('general', 'twitter_url')}
                                                    placeholder="https://x.com/tu-marca"
                                                />
                                                {errors['general.twitter_url'] && (
                                                    <p className="mt-1 text-xs text-red-600">{errors['general.twitter_url']}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.company.fields.youtube_url', 'URL de YouTube')}</label>
                                                <input
                                                    type="url"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={data.general.youtube_url || ''}
                                                    onChange={handleChange('general', 'youtube_url')}
                                                    placeholder="https://youtube.com/@tu-marca"
                                                />
                                                {errors['general.youtube_url'] && (
                                                    <p className="mt-1 text-xs text-red-600">{errors['general.youtube_url']}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.company.fields.tiktok_url', 'URL de TikTok')}</label>
                                                <input
                                                    type="url"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={data.general.tiktok_url || ''}
                                                    onChange={handleChange('general', 'tiktok_url')}
                                                    placeholder="https://tiktok.com/@tu-marca"
                                                />
                                                {errors['general.tiktok_url'] && (
                                                    <p className="mt-1 text-xs text-red-600">{errors['general.tiktok_url']}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.company.fields.linkedin_url', 'URL de LinkedIn')}</label>
                                                <input
                                                    type="url"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={data.general.linkedin_url || ''}
                                                    onChange={handleChange('general', 'linkedin_url')}
                                                    placeholder="https://linkedin.com/company/tu-marca"
                                                />
                                                {errors['general.linkedin_url'] && (
                                                    <p className="mt-1 text-xs text-red-600">{errors['general.linkedin_url']}</p>
                                                )}
                                            </div>
                                        </div>
                                    </SettingsSection>

                                    <SettingsSection
                                        eyebrow={t('admin.settings.identity.location.eyebrow', 'Ubicacion')}
                                        title={t('admin.settings.identity.location.title', 'Ubicacion')}
                                        description={t('admin.settings.identity.location.description', 'Organiza la informacion geografica del negocio y los enlaces de referencia para contacto y mapa.')}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.location.fields.address', 'Dirección')}</label>
                                                <textarea
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    rows={2}
                                                    value={data.location.address || ''}
                                                    onChange={handleChange('location', 'address')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.location.fields.city', 'Ciudad')}</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={data.location.city || ''}
                                                    onChange={handleChange('location', 'city')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.location.fields.state', 'Estado / Región')}</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={data.location.state || ''}
                                                    onChange={handleChange('location', 'state')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.location.fields.country', 'País')}</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={data.location.country || ''}
                                                    onChange={handleChange('location', 'country')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.location.fields.google_maps_url', 'URL de Google Maps')}</label>
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
                                        eyebrow={t('admin.settings.identity.branding.eyebrow', 'Visual')}
                                        title={t('admin.settings.identity.branding.title', 'Branding')}
                                        description={t('admin.settings.identity.branding.description', 'Concentra logos, favicon y colores clave para mantener una identidad consistente en toda la experiencia.')}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.branding.fields.logo_url', 'Logo (URL)')}</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={data.branding.logo_url || ''}
                                                    onChange={handleChange('branding', 'logo_url')}
                                                />
                                                <label className="mt-3 block text-sm font-medium text-slate-700">{t('admin.settings.identity.branding.fields.logo_file', 'o subir logo')}</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="mt-1 block w-full text-sm text-slate-600"
                                                    onChange={(e) => updateBrandingFile('logo_file', e.target.files?.[0] ?? null)}
                                                />
                                                {data.branding.logo_url && (
                                                    <img src={data.branding.logo_url} alt="Logo" className="mt-3 h-12 w-auto max-w-[180px] rounded-lg border border-slate-200 bg-slate-50 p-2 object-contain" />
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.branding.fields.logo_dark_url', 'Logo oscuro (URL)')}</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={data.branding.logo_dark_url || ''}
                                                    onChange={handleChange('branding', 'logo_dark_url')}
                                                />
                                                <label className="mt-3 block text-sm font-medium text-slate-700">{t('admin.settings.identity.branding.fields.logo_dark_file', 'o subir logo oscuro')}</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="mt-1 block w-full text-sm text-slate-600"
                                                    onChange={(e) => updateBrandingFile('logo_dark_file', e.target.files?.[0] ?? null)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.branding.fields.favicon_url', 'Favicon (URL)')}</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={data.branding.favicon_url || ''}
                                                    onChange={handleChange('branding', 'favicon_url')}
                                                />
                                                <label className="mt-3 block text-sm font-medium text-slate-700">{t('admin.settings.identity.branding.fields.favicon_file', 'o subir favicon')}</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="mt-1 block w-full text-sm text-slate-600"
                                                    onChange={(e) => updateBrandingFile('favicon_file', e.target.files?.[0] ?? null)}
                                                />
                                            </div>
                                            <div className="flex gap-4 items-end">
                                                <div className="flex-1">
                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.branding.fields.primary_color', 'Color primario')}</label>
                                                    <input
                                                        type="text"
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                        value={data.branding.primary_color || ''}
                                                        onChange={handleChange('branding', 'primary_color')}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.identity.branding.fields.secondary_color', 'Color secundario')}</label>
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

                                    <SettingsSection
                                        eyebrow={t('admin.settings.commerce.store.eyebrow', 'Escaparate')}
                                        title={t('admin.settings.commerce.store.title', 'Tienda publica')}
                                        description={t('admin.settings.commerce.store.description', 'Edita titulo, descripciones, llamados a la accion, banners y bloques informativos del inicio desde el panel administrativo.')}
                                    >
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.fields.home_title', 'Título de inicio')}</label>
                                                    <input
                                                        type="text"
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                        value={data.store.home_title || ''}
                                                        onChange={handleChange('store', 'home_title')}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.fields.home_subtitle', 'Subtítulo')}</label>
                                                    <input
                                                        type="text"
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                        value={data.store.home_subtitle || ''}
                                                        onChange={handleChange('store', 'home_subtitle')}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.fields.hero_badge', 'Etiqueta superior')}</label>
                                                    <input
                                                        type="text"
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                        value={data.store.hero_badge || ''}
                                                        onChange={handleChange('store', 'hero_badge')}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.fields.hero_description', 'Descripción del home')}</label>
                                                    <input
                                                        type="text"
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                        value={data.store.hero_description || ''}
                                                        onChange={handleChange('store', 'hero_description')}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.fields.hero_primary_cta_label', 'Texto CTA primaria')}</label>
                                                    <input
                                                        type="text"
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                        value={data.store.hero_primary_cta_label || ''}
                                                        onChange={handleChange('store', 'hero_primary_cta_label')}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.fields.hero_primary_cta_url', 'URL CTA primaria')}</label>
                                                    <input
                                                        type="text"
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                        value={data.store.hero_primary_cta_url || ''}
                                                        onChange={handleChange('store', 'hero_primary_cta_url')}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.fields.hero_secondary_cta_label', 'Texto CTA secundaria')}</label>
                                                    <input
                                                        type="text"
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                        value={data.store.hero_secondary_cta_label || ''}
                                                        onChange={handleChange('store', 'hero_secondary_cta_label')}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.fields.hero_secondary_cta_url', 'URL CTA secundaria')}</label>
                                                    <input
                                                        type="text"
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                        value={data.store.hero_secondary_cta_url || ''}
                                                        onChange={handleChange('store', 'hero_secondary_cta_url')}
                                                    />
                                                </div>
                                            </div>

                                            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.settings.commerce.store.hero_banners.eyebrow', 'Carrusel principal')}</p>
                                                        <h3 className="mt-1 text-lg font-semibold text-slate-900">{t('admin.settings.commerce.store.hero_banners.title', 'Banners del inicio')}</h3>
                                                        <p className="mt-1 text-sm text-slate-600">{t('admin.settings.commerce.store.hero_banners.description', 'Configura hasta cinco slides con título, descripción e imagen opcional.')}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={addStoreBanner}
                                                        className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                                    >
                                                        {t('admin.settings.commerce.store.hero_banners.add', 'Agregar banner')}
                                                    </button>
                                                </div>
                                                <div className="mt-5 grid gap-4">
                                                    {heroBanners.map((banner, index) => (
                                                        <div key={`banner-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <p className="text-sm font-semibold text-slate-900">{t('admin.settings.commerce.store.hero_banners.item_title', 'Banner')} {index + 1}</p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeStoreBanner(index)}
                                                                    className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
                                                                >
                                                                    {t('admin.settings.commerce.store.hero_banners.remove', 'Eliminar')}
                                                                </button>
                                                            </div>
                                                            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.hero_banners.fields.title', 'Título')}</label>
                                                                    <input
                                                                        type="text"
                                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                        value={banner.title || ''}
                                                                        onChange={(e) => updateStoreBanner(index, 'title', e.target.value)}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.hero_banners.fields.image_url', 'Imagen o fondo (URL)')}</label>
                                                                    <input
                                                                        type="text"
                                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                        value={banner.image_url || ''}
                                                                        onChange={(e) => updateStoreBanner(index, 'image_url', e.target.value)}
                                                                    />
                                                                    <label className="mt-3 block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.hero_banners.fields.image_file', 'o subir imagen')}</label>
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        className="mt-1 block w-full text-sm text-slate-600"
                                                                        onChange={(e) => updateStoreBannerFile(index, e.target.files?.[0] ?? null)}
                                                                    />
                                                                    {banner.image_url && (
                                                                        <img src={banner.image_url} alt={banner.title || `Banner ${index + 1}`} className="mt-3 h-24 w-full rounded-xl border border-slate-200 object-cover" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.hero_banners.fields.background_color', 'Color de fondo')}</label>
                                                                    <input
                                                                        type="text"
                                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                        value={banner.background_color || ''}
                                                                        onChange={(e) => updateStoreBanner(index, 'background_color', e.target.value)}
                                                                        placeholder="#1f2937"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.hero_banners.fields.text_color', 'Color de texto')}</label>
                                                                    <input
                                                                        type="text"
                                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                        value={banner.text_color || ''}
                                                                        onChange={(e) => updateStoreBanner(index, 'text_color', e.target.value)}
                                                                        placeholder="#ffffff"
                                                                    />
                                                                </div>
                                                                <div className="md:col-span-2">
                                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.hero_banners.fields.description', 'Descripción')}</label>
                                                                    <textarea
                                                                        rows={2}
                                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                        value={banner.description || ''}
                                                                        onChange={(e) => updateStoreBanner(index, 'description', e.target.value)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('admin.settings.commerce.store.highlights.eyebrow', 'Bloques informativos')}</p>
                                                        <h3 className="mt-1 text-lg font-semibold text-slate-900">{t('admin.settings.commerce.store.highlights.title', 'Tarjetas de valor')}</h3>
                                                        <p className="mt-1 text-sm text-slate-600">{t('admin.settings.commerce.store.highlights.description', 'Agrega mensajes cortos para explicar beneficios, soporte, entregas, medios de pago o diferenciales de la tienda.')}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={addStoreHighlight}
                                                        className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                                    >
                                                        {t('admin.settings.commerce.store.highlights.add', 'Agregar bloque')}
                                                    </button>
                                                </div>
                                                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                    {homeHighlights.map((item, index) => (
                                                        <div key={`highlight-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <p className="text-sm font-semibold text-slate-900">{t('admin.settings.commerce.store.highlights.item_title', 'Bloque')} {index + 1}</p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeStoreHighlight(index)}
                                                                    className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
                                                                >
                                                                    {t('admin.settings.commerce.store.highlights.remove', 'Eliminar')}
                                                                </button>
                                                            </div>
                                                            <div className="mt-4 space-y-3">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.highlights.fields.eyebrow', 'Etiqueta')}</label>
                                                                    <input
                                                                        type="text"
                                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                        value={item.eyebrow || ''}
                                                                        onChange={(e) => updateStoreHighlight(index, 'eyebrow', e.target.value)}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.highlights.fields.title', 'Título')}</label>
                                                                    <input
                                                                        type="text"
                                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                        value={item.title || ''}
                                                                        onChange={(e) => updateStoreHighlight(index, 'title', e.target.value)}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.highlights.fields.description', 'Descripción')}</label>
                                                                    <textarea
                                                                        rows={3}
                                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                        value={item.description || ''}
                                                                        onChange={(e) => updateStoreHighlight(index, 'description', e.target.value)}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.highlights.fields.image_url', 'Imagen de fondo (URL)')}</label>
                                                                    <input
                                                                        type="text"
                                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                        value={item.image_url || ''}
                                                                        onChange={(e) => updateStoreHighlight(index, 'image_url', e.target.value)}
                                                                    />
                                                                    {item.image_url && (
                                                                        <img src={item.image_url} alt={item.title || `Bloque ${index + 1}`} className="mt-3 h-24 w-full rounded-xl border border-slate-200 object-cover" />
                                                                    )}
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.highlights.fields.background_color', 'Color de fondo')}</label>
                                                                        <input
                                                                            type="text"
                                                                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                            value={item.background_color || ''}
                                                                            onChange={(e) => updateStoreHighlight(index, 'background_color', e.target.value)}
                                                                            placeholder="#ffffff"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.store.highlights.fields.text_color', 'Color de texto')}</label>
                                                                        <input
                                                                            type="text"
                                                                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                            value={item.text_color || ''}
                                                                            onChange={(e) => updateStoreHighlight(index, 'text_color', e.target.value)}
                                                                            placeholder="#0f172a"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </SettingsSection>
                                </>
                            )}

                            {activeSettingsGroup === 'operations' && (
                                <>
                                    <SettingsSection
                                        eyebrow={t('admin.settings.operations.inventory.eyebrow', 'Inventario')}
                                        title={t('admin.settings.operations.inventory.title', 'Inventario')}
                                        description={t('admin.settings.operations.inventory.description', 'Configura reglas base de stock para evitar ajustes repetitivos y mantener el comportamiento esperado del sistema.')}
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
                                                    {t('admin.settings.operations.inventory.fields.allow_negative_stock', 'Permitir stock negativo')}
                                                </label>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.operations.inventory.fields.default_min_stock', 'Stock mínimo por defecto')}</label>
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
                                                        eyebrow={t('admin.settings.operations.warehouses.eyebrow', 'Sucursal')}
                                                        title={t('admin.settings.operations.warehouses.title', 'Multi-bodega y ventas')}
                                                        description={t('admin.settings.operations.warehouses.description', 'Define como se comportan las facturas respecto a la seleccion de bodegas y la operacion diaria de ventas.')}
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
                                                                {t('admin.settings.operations.warehouses.fields.require_warehouse_on_invoice', 'Requerir seleccionar bodega/sucursal en las facturas')}
                                                            </label>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700">{t('admin.settings.operations.warehouses.fields.default_warehouse_id', 'Bodega por defecto para ventas')}</label>
                                                            <select
                                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                value={data.warehouses.default_warehouse_id ?? ''}
                                                                onChange={handleChange('warehouses', 'default_warehouse_id')}
                                                            >
                                                                <option value="">{t('admin.settings.operations.warehouses.fields.default_warehouse_empty', 'Sin bodega por defecto')}</option>
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
                                        eyebrow={t('admin.settings.operations.billing.eyebrow', 'Documentos')}
                                        title={t('admin.settings.operations.billing.title', 'Facturacion')}
                                        description={t('admin.settings.operations.billing.description', 'Agrupa numeracion, impuestos y reglas contables generales para las facturas emitidas.')}
                                    >
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.operations.billing.fields.invoice_prefix', 'Prefijo de factura')}</label>
                                                    <input
                                                        type="text"
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                        value={data.billing.invoice_prefix || ''}
                                                        onChange={handleChange('billing', 'invoice_prefix')}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.operations.billing.fields.invoice_length', 'Longitud del número')}</label>
                                                    <input
                                                        type="number"
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                        value={data.billing.invoice_length || ''}
                                                        onChange={handleChange('billing', 'invoice_length')}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.operations.billing.fields.default_tax_percent', 'Impuesto por defecto (%)')}</label>
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
                                                    <label htmlFor="enable_igtf" className="text-sm text-slate-700">{t('admin.settings.operations.billing.fields.enable_igtf', 'Habilitar IGTF')}</label>
                                                </div>
                                            </div>
                                    </SettingsSection>

                                    <SettingsSection
                                        eyebrow={t('admin.settings.operations.currency.eyebrow', 'Moneda')}
                                        title={t('admin.settings.operations.currency.title', 'Moneda')}
                                        description={t('admin.settings.operations.currency.description', 'Centraliza la configuracion monetaria usada en toda la aplicacion y su fuente de tasa.')}
                                    >
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700">{t('admin.settings.operations.currency.fields.base_currency', 'Moneda base')}</label>
                                                        <input
                                                            type="text"
                                                            className="mt-1 block w-full rounded-md border-slate-300 bg-slate-50 shadow-sm text-sm"
                                                            value={data.currency.base_currency || 'USD'}
                                                            readOnly
                                                        />
                                                        <p className="mt-1 text-xs text-slate-500">{t('admin.settings.operations.currency.helpers.base_currency_fixed', 'USD permanece como moneda canónica interna del sistema.')}</p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700">{t('admin.settings.operations.currency.fields.default_display_currency', 'Moneda por defecto')}</label>
                                                        <select
                                                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                            value={data.currency.default_display_currency || data.currency.base_currency || 'USD'}
                                                            onChange={handleChange('currency', 'default_display_currency')}
                                                        >
                                                            {enabledCurrencies.map((item) => (
                                                                <option key={item.code} value={item.code}>{item.code}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700">{t('admin.settings.operations.currency.fields.rate_provider', 'Proveedor principal')}</label>
                                                        <select
                                                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                            value={data.currency.rate_provider || data.currency.rate_source || 'dolarapi'}
                                                            onChange={(e) => setData('currency', {
                                                                ...data.currency,
                                                                rate_provider: e.target.value,
                                                                rate_source: e.target.value,
                                                            })}
                                                        >
                                                            {currencyProviderOptions.map((provider) => (
                                                                <option key={provider.value} value={provider.value}>{provider.labelKey ? t(provider.labelKey, provider.defaultLabel) : provider.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700">{t('admin.settings.operations.currency.fields.auto_refresh_interval_minutes', 'Actualización automática (min)')}</label>
                                                        <input
                                                            type="number"
                                                            min={5}
                                                            max={1440}
                                                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                            value={data.currency.auto_refresh_interval_minutes ?? 60}
                                                            onChange={handleChange('currency', 'auto_refresh_interval_minutes')}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between">
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">{t('admin.settings.operations.currency.actions.sync_title', 'Sincronización de tasas')}</p>
                                                        <p className="mt-1 text-xs text-slate-500">{t('admin.settings.operations.currency.actions.sync_description', 'Actualiza las tasas automáticas guardadas y conserva la última tasa válida para cada moneda activa.')}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={syncCurrencyRates}
                                                        disabled={syncingCurrencyRates}
                                                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {syncingCurrencyRates
                                                            ? t('admin.settings.operations.currency.actions.syncing', 'Sincronizando...')
                                                            : t('admin.settings.operations.currency.actions.sync_now', 'Actualizar ahora')}
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <input
                                                        id="currency-auto-refresh"
                                                        type="checkbox"
                                                        className="rounded border-slate-300 text-sky-600 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                                        checked={!!data.currency.auto_refresh_enabled}
                                                        onChange={handleChange('currency', 'auto_refresh_enabled')}
                                                    />
                                                    <label htmlFor="currency-auto-refresh" className="text-sm text-slate-700">
                                                        {t('admin.settings.operations.currency.fields.auto_refresh_enabled', 'Actualizar tasas automáticamente')}
                                                    </label>
                                                </div>

                                                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                                                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-slate-900">{t('admin.settings.operations.currency.fields.supported_currencies', 'Monedas disponibles')}</h3>
                                                            <p className="text-xs text-slate-500">{t('admin.settings.operations.currency.helpers.enabled_currencies_count', 'Activa las monedas que el usuario podrá ver sin tener que programar.')}</p>
                                                        </div>
                                                        <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                                                            {enabledCurrencies.length} activas
                                                        </span>
                                                    </div>

                                                    <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                        {supportedCurrencies.map((item, index) => (
                                                            <div key={item.code || index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-slate-900">{item.code}</p>
                                                                        <p className="text-xs text-slate-500">{item.name}</p>
                                                                    </div>
                                                                    <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="rounded border-slate-300 text-sky-600 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                                                            checked={!!item.enabled}
                                                                            disabled={item.code === 'USD'}
                                                                            onChange={(e) => updateSupportedCurrency(index, 'enabled', e.target.checked)}
                                                                        />
                                                                        {t('admin.settings.operations.currency.fields.enabled', 'Activa')}
                                                                    </label>
                                                                </div>

                                                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-slate-600">{t('admin.settings.operations.currency.fields.symbol', 'Símbolo')}</label>
                                                                        <input
                                                                            type="text"
                                                                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                            value={item.symbol || ''}
                                                                            onChange={(e) => updateSupportedCurrency(index, 'symbol', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-slate-600">{t('admin.settings.operations.currency.fields.rate_mode', 'Modo de tasa')}</label>
                                                                        <select
                                                                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                            value={item.rate_mode || 'auto'}
                                                                            onChange={(e) => updateSupportedCurrency(index, 'rate_mode', e.target.value.toLowerCase())}
                                                                        >
                                                                            <option value="auto">{t('admin.settings.operations.currency.modes.auto', 'Automática')}</option>
                                                                            <option value="manual">{t('admin.settings.operations.currency.modes.manual', 'Manual')}</option>
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-slate-600">{t('admin.settings.operations.currency.fields.rate_provider', 'Proveedor')}</label>
                                                                        <select
                                                                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                            value={item.rate_provider || data.currency.rate_provider || 'dolarapi'}
                                                                            onChange={(e) => updateSupportedCurrency(index, 'rate_provider', e.target.value.toLowerCase())}
                                                                        >
                                                                            {currencyProviderOptions.map((provider) => (
                                                                                <option key={provider.value} value={provider.value}>{provider.labelKey ? t(provider.labelKey, provider.defaultLabel) : provider.label}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-slate-600">{t('admin.settings.operations.currency.fields.manual_rate', 'Tasa manual')}</label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.0001"
                                                                            min="0"
                                                                            disabled={(item.rate_mode || 'auto') !== 'manual'}
                                                                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm disabled:bg-slate-100"
                                                                            value={item.manual_rate ?? ''}
                                                                            onChange={(e) => updateSupportedCurrency(index, 'manual_rate', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-slate-600">{t('admin.settings.operations.currency.fields.markup_percent', 'Margen adicional (%)')}</label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            min="0"
                                                                            max="100"
                                                                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                            value={item.markup_percent ?? 0}
                                                                            onChange={(e) => updateSupportedCurrency(index, 'markup_percent', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                                                                    <label className="inline-flex items-center gap-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="rounded border-slate-300 text-sky-600 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                                                            checked={!!item.visible_in_store}
                                                                            onChange={(e) => updateSupportedCurrency(index, 'visible_in_store', e.target.checked)}
                                                                        />
                                                                        {t('admin.settings.operations.currency.fields.visible_in_store', 'Visible en tienda')}
                                                                    </label>
                                                                    <label className="inline-flex items-center gap-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="rounded border-slate-300 text-sky-600 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                                                            checked={!!item.visible_in_admin}
                                                                            onChange={(e) => updateSupportedCurrency(index, 'visible_in_admin', e.target.checked)}
                                                                        />
                                                                        {t('admin.settings.operations.currency.fields.visible_in_admin', 'Visible en admin')}
                                                                    </label>
                                                                    <label className="inline-flex items-center gap-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="rounded border-slate-300 text-sky-600 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                                                            checked={!!item.allow_checkout}
                                                                            onChange={(e) => updateSupportedCurrency(index, 'allow_checkout', e.target.checked)}
                                                                        />
                                                                        {t('admin.settings.operations.currency.fields.allow_checkout', 'Disponible en checkout')}
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                    </SettingsSection>
                                </>
                            )}

                            {activeSettingsGroup === 'communication' && (
                                <>
                                    <SettingsSection
                                        eyebrow={t('admin.settings.communication.security.eyebrow', 'Seguridad')}
                                        title={t('admin.settings.communication.security.title', 'Seguridad')}
                                        description={t('admin.settings.communication.security.description', 'Ajusta la dureza de acceso y prepara el sistema para futuros mecanismos de autenticacion reforzada.')}
                                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.communication.security.fields.min_password_length', 'Longitud mínima de contraseña')}</label>
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
                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.communication.security.fields.max_failed_logins', 'Intentos fallidos antes de bloqueo')}</label>
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
                                    {t('admin.settings.communication.security.fields.enable_two_factor', 'Habilitar 2FA (para futuros inicios de sesión)')}
                                </label>
                            </div>
                        </div>
                                    </SettingsSection>

                                    <SettingsSection
                                        eyebrow={t('admin.settings.communication.qr.eyebrow', 'Automatizacion')}
                                        title={t('admin.settings.communication.qr.title', 'QR y enlaces rapidos')}
                                        description={t('admin.settings.communication.qr.description', 'Concentra las bases de URL para documentos, productos y contacto, evitando configuraciones dispersas.')}
                                    >
                        <p className="text-sm text-slate-600">
                            {t('admin.settings.communication.qr.helper', 'Estas URLs se usarán como base para generar códigos QR de facturas, productos y contacto.')}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.communication.qr.fields.invoice_base_url', 'URL base para facturas')}</label>
                                <input
                                    type="url"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.qr.invoice_base_url || ''}
                                    onChange={handleChange('qr', 'invoice_base_url')}
                                    placeholder={t('admin.settings.communication.qr.placeholders.invoice_base_url', 'https://midominio.com/facturas/{numero}')}
                                />
                                {errors['qr.invoice_base_url'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['qr.invoice_base_url']}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.communication.qr.fields.product_base_url', 'URL base para productos')}</label>
                                <input
                                    type="url"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.qr.product_base_url || ''}
                                    onChange={handleChange('qr', 'product_base_url')}
                                    placeholder={t('admin.settings.communication.qr.placeholders.product_base_url', 'https://midominio.com/productos/{sku}')}
                                />
                                {errors['qr.product_base_url'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['qr.product_base_url']}</p>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.communication.qr.fields.whatsapp_contact_url', 'URL de contacto por WhatsApp')}</label>
                                <input
                                    type="url"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.qr.whatsapp_contact_url || ''}
                                    onChange={handleChange('qr', 'whatsapp_contact_url')}
                                    placeholder={t('admin.settings.communication.qr.placeholders.whatsapp_contact_url', 'https://wa.me/58XXXXXXXXXX?text=Hola%20tengo%20una%20consulta')}
                                />
                                {errors['qr.whatsapp_contact_url'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['qr.whatsapp_contact_url']}</p>
                                )}
                            </div>
                        </div>
                                    </SettingsSection>

                                    <SettingsSection
                                        eyebrow={t('admin.settings.communication.mail.eyebrow', 'Mensajeria')}
                                        title={t('admin.settings.communication.mail.title', 'Correo electronico')}
                                        description={t('admin.settings.communication.mail.description', 'Edita los textos base del correo transaccional sin salir de un panel dedicado a la comunicacion.')}
                                    >
                        <p className="text-sm text-slate-600">
                            {t('admin.settings.communication.mail.helper', 'Ajusta algunos textos base que se usarán en las plantillas de correo (por ejemplo, facturas).')}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.communication.mail.fields.invoice_subject_prefix', 'Prefijo de asunto para facturas')}</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.mail.invoice_subject_prefix || ''}
                                    onChange={handleChange('mail', 'invoice_subject_prefix')}
                                    placeholder={t('admin.settings.communication.mail.placeholders.invoice_subject_prefix', 'Ej: Factura, Comprobante, Pedido')}
                                />
                                {errors['mail.invoice_subject_prefix'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['mail.invoice_subject_prefix']}</p>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.communication.mail.fields.invoice_intro', 'Texto introductorio del correo de factura')}</label>
                                <textarea
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    rows={2}
                                    value={data.mail.invoice_intro || ''}
                                    onChange={handleChange('mail', 'invoice_intro')}
                                    placeholder={t('admin.settings.communication.mail.placeholders.invoice_intro', 'Ej: Gracias por tu compra. A continuación puedes revisar el detalle y estado de tu pedido.')}
                                />
                                {errors['mail.invoice_intro'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['mail.invoice_intro']}</p>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.communication.mail.fields.footer_text', 'Texto de pie de correo')}</label>
                                <textarea
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    rows={2}
                                    value={data.mail.footer_text || ''}
                                    onChange={handleChange('mail', 'footer_text')}
                                    placeholder={t('admin.settings.communication.mail.placeholders.footer_text', 'Ej: Gracias por confiar en nosotros. Este mensaje fue generado automáticamente.')}
                                />
                                {errors['mail.footer_text'] && (
                                    <p className="mt-1 text-xs text-red-600">{errors['mail.footer_text']}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.communication.mail.fields.invoice_button_text', 'Texto del botón en el correo de factura')}</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                    value={data.mail.invoice_button_text || ''}
                                    onChange={handleChange('mail', 'invoice_button_text')}
                                    placeholder={t('admin.settings.communication.mail.placeholders.invoice_button_text', 'Ej: Ver mi pedido, Ver detalle de la compra')}
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
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">{t('admin.settings.commerce.header.eyebrow', 'Pagos')}</p>
                                    <h2 className="mt-2 text-2xl font-semibold">{t('admin.settings.commerce.header.title', 'Metodos, pasarelas y cuentas bancarias')}</h2>
                                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                                        {t('admin.settings.commerce.header.description', 'Activa lo que quieras mostrar en checkout. Las pasarelas se habilitan aqui y las cuentas bancarias manuales quedan disponibles para transferencias.')}
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{t('admin.settings.commerce.header.stats.active_methods', 'Metodos activos')}</p>
                                        <p className="mt-1 text-2xl font-semibold text-white">{activeMethods}</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{t('admin.settings.commerce.header.stats.visible_accounts', 'Cuentas visibles')}</p>
                                        <p className="mt-1 text-2xl font-semibold text-white">{visibleBankAccounts}</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{t('admin.settings.commerce.header.stats.origin_banks', 'Bancos origen')}</p>
                                        <p className="mt-1 text-2xl font-semibold text-white">{visibleOriginBanks}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 p-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                            <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-3">
                                    <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('admin.settings.commerce.sidebar.channels', 'Canales')}</p>
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
                                                            {tab.enabled ? t('admin.settings.commerce.values.active', 'Activo') : t('admin.settings.commerce.values.paused', 'Pausado')}
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 text-sm leading-6 text-slate-600">{tab.description}</p>
                                                    <div className="mt-4 flex items-center justify-between gap-3">
                                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tab.badge}`}>
                                                            {tab.readiness}
                                                        </span>
                                                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                            {isActive ? t('admin.settings.commerce.values.editing', 'Editando') : t('admin.settings.commerce.values.open', 'Abrir')}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('admin.settings.commerce.sidebar.summary', 'Resumen')}</p>
                                    <h3 className="mt-2 text-lg font-semibold text-slate-900">{activePaymentTab.title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">{activePaymentTab.description}</p>
                                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                            <span>{t('admin.settings.commerce.sidebar.status', 'Estado')}</span>
                                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${activePaymentTab.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                {activePaymentTab.enabled ? t('admin.settings.commerce.values.visible_checkout', 'Visible en checkout') : t('admin.settings.commerce.values.hidden_checkout', 'Oculto en checkout')}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                            <span>{t('admin.settings.commerce.sidebar.readiness', 'Preparación')}</span>
                                            <span className="text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{activePaymentTab.readiness}</span>
                                        </div>
                                    </div>
                                </div>
                            </aside>

                            <div className="space-y-6 rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6">
                                <div className={`rounded-[24px] border bg-gradient-to-br p-5 ${activePaymentTab.ring} ${activePaymentTab.accent}`}>
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t('admin.settings.commerce.workspace.eyebrow', 'Workspace')}</p>
                                            <h3 className="mt-2 text-2xl font-semibold text-slate-900">{t('admin.settings.commerce.workspace.title_prefix', 'Configura')} {activePaymentTab.title} {t('admin.settings.commerce.workspace.title_suffix', 'sin ruido visual')}</h3>
                                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                                {t('admin.settings.commerce.workspace.description', 'Ajusta disponibilidad, mensaje visible en checkout y requisitos operativos en un solo panel. El contenido secundario queda resumido en la barra lateral.')}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">{t('admin.settings.commerce.workspace.chips.guided_checkout', 'Checkout guiado')}</span>
                                            <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">{t('admin.settings.commerce.workspace.chips.centralized_editing', 'Edición centralizada')}</span>
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
                                                        {t('admin.settings.commerce.manual.enable', 'Habilitar pago manual en checkout')}
                                                    </label>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.common.visible_name', 'Nombre visible')}</label>
                                                    <input
                                                        type="text"
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                        value={manualMethod.label || ''}
                                                        onChange={(e) => updatePaymentMethod('manual', 'label', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.common.fee_percent', 'Recargo (%)')}</label>
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
                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.common.description', 'Descripcion')}</label>
                                                    <input
                                                        type="text"
                                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                        value={manualMethod.description || ''}
                                                        onChange={(e) => updatePaymentMethod('manual', 'description', e.target.value)}
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.common.customer_instructions', 'Instrucciones al cliente')}</label>
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
                                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">{t('admin.settings.commerce.manual.experience.eyebrow', 'Experiencia')}</p>
                                                <h3 className="mt-2 text-lg font-semibold text-emerald-950">{t('admin.settings.commerce.manual.experience.title', 'Transferencias claras para el cliente')}</h3>
                                                <p className="mt-2 text-sm leading-6 text-emerald-900/80">
                                                    {t('admin.settings.commerce.manual.experience.description', 'El checkout mostrara tarjetas con las cuentas disponibles, datos del titular y un formulario corto para referencia, banco de origen y fecha.')}
                                                </p>
                                                <div className="mt-4 space-y-2 text-sm text-emerald-900/80">
                                                    <div className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3">
                                                        <span>{t('admin.settings.commerce.manual.experience.published_accounts', 'Cuentas publicadas')}</span>
                                                        <strong>{visibleBankAccounts}</strong>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3">
                                                        <span>{t('admin.settings.commerce.manual.experience.visible_origin_banks', 'Bancos origen visibles')}</span>
                                                        <strong>{visibleOriginBanks}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900">{t('admin.settings.commerce.manual.accounts.title', 'Cuentas bancarias disponibles')}</h3>
                                                <p className="text-sm text-slate-600">{t('admin.settings.commerce.manual.accounts.description', 'Estas son las cuentas que el cliente vera al pagar por transferencia.')}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addBankAccount}
                                                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                                            >
                                                {t('admin.settings.commerce.manual.accounts.add', 'Agregar cuenta bancaria')}
                                            </button>
                                        </div>

                                        <div className="mt-5 space-y-4">
                                            {bankAccounts.length === 0 ? (
                                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                                                    {t('admin.settings.commerce.manual.accounts.empty', 'No hay cuentas cargadas todavia.')}
                                                </div>
                                            ) : bankAccounts.map((account, index) => (
                                                <details key={`bank-account-${index}`} className="group overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 open:bg-white">
                                                    <summary className="flex cursor-pointer list-none flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-base font-semibold text-slate-900">{account?.bank_name || `${t('admin.settings.commerce.manual.accounts.account_fallback', 'Cuenta')} ${index + 1}`}</h4>
                                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${account?.enabled !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                                    {account?.enabled !== false ? t('admin.settings.commerce.values.visible', 'Visible') : t('admin.settings.commerce.values.hidden_female', 'Oculta')}
                                                                </span>
                                                            </div>
                                                            <p className="mt-1 text-sm text-slate-600">
                                                                {(account?.account_name || t('admin.settings.commerce.manual.accounts.no_holder', 'Sin titular'))} · {(account?.account_number || t('admin.settings.commerce.manual.accounts.no_number', 'Sin número'))}
                                                            </p>
                                                        </div>
                                                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 transition group-open:rotate-180">{t('admin.settings.commerce.values.open', 'Abrir')}</span>
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
                                                                    {t('admin.settings.commerce.manual.accounts.show_in_checkout', 'Mostrar esta cuenta en checkout')}
                                                                </label>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeBankAccount(index)}
                                                                className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                                                            >
                                                                {t('admin.settings.commerce.manual.accounts.delete', 'Eliminar cuenta')}
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.manual.accounts.fields.bank_name', 'Banco')}</label>
                                                            <input
                                                                type="text"
                                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                value={account?.bank_name || ''}
                                                                onChange={(e) => updateBankAccount(index, 'bank_name', e.target.value)}
                                                            />
                                                            {errors[`payments.bank_accounts.${index}.bank_name`] && <p className="mt-1 text-xs text-red-600">{errors[`payments.bank_accounts.${index}.bank_name`]}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.manual.accounts.fields.account_name', 'Titular')}</label>
                                                            <input
                                                                type="text"
                                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                value={account?.account_name || ''}
                                                                onChange={(e) => updateBankAccount(index, 'account_name', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.manual.accounts.fields.account_number', 'Numero de cuenta')}</label>
                                                            <input
                                                                type="text"
                                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                value={account?.account_number || ''}
                                                                onChange={(e) => updateBankAccount(index, 'account_number', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.manual.accounts.fields.account_type', 'Tipo de cuenta')}</label>
                                                            <input
                                                                type="text"
                                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                value={account?.account_type || ''}
                                                                onChange={(e) => updateBankAccount(index, 'account_type', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.manual.accounts.fields.identification', 'RIF / Cedula')}</label>
                                                            <input
                                                                type="text"
                                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                value={account?.identification || ''}
                                                                onChange={(e) => updateBankAccount(index, 'identification', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.manual.accounts.fields.phone', 'Telefono')}</label>
                                                            <input
                                                                type="text"
                                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                value={account?.phone || ''}
                                                                onChange={(e) => updateBankAccount(index, 'phone', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2 xl:col-span-1">
                                                            <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.manual.accounts.fields.email', 'Email')}</label>
                                                            <input
                                                                type="email"
                                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                                value={account?.email || ''}
                                                                onChange={(e) => updateBankAccount(index, 'email', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2 xl:col-span-2">
                                                            <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.manual.accounts.fields.notes', 'Nota visible')}</label>
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
                                                <h3 className="text-lg font-semibold text-slate-900">{t('admin.settings.commerce.manual.origin_banks.title', 'Bancos de origen para el formulario')}</h3>
                                                <p className="text-sm text-slate-600">{t('admin.settings.commerce.manual.origin_banks.description', 'El cliente podra elegir desde que banco hizo su transferencia.')}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addOriginBank}
                                                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                                            >
                                                {t('admin.settings.commerce.manual.origin_banks.add', 'Agregar banco origen')}
                                            </button>
                                        </div>

                                        <div className="mt-5 space-y-3">
                                            {originBanks.length === 0 ? (
                                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                                                    {t('admin.settings.commerce.manual.origin_banks.empty', 'No hay bancos de origen cargados todavia.')}
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
                                                            {t('admin.settings.commerce.values.visible', 'Visible')}
                                                        </label>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.manual.origin_banks.fields.name', 'Nombre del banco')}</label>
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
                                                        {t('admin.settings.commerce.values.delete', 'Eliminar')}
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
                                                    {t('admin.settings.commerce.paypal.enable', 'Habilitar PayPal en checkout')}
                                                </label>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.common.visible_name', 'Nombre visible')}</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={paypalMethod.label || ''}
                                                    onChange={(e) => updatePaymentMethod('paypal', 'label', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.paypal.environment', 'Entorno')}</label>
                                                <select
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={paypalMethod.environment || 'sandbox'}
                                                    onChange={(e) => updatePaymentMethod('paypal', 'environment', e.target.value)}
                                                >
                                                    <option value="sandbox">{t('admin.settings.commerce.paypal.options.sandbox', 'Sandbox')}</option>
                                                    <option value="live">{t('admin.settings.commerce.paypal.options.live', 'Live')}</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.paypal.client_id', 'Client ID')}</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={paypalMethod.client_id || ''}
                                                    onChange={(e) => updatePaymentMethod('paypal', 'client_id', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.paypal.client_secret', 'Client Secret')}</label>
                                                <input
                                                    type="password"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={paypalMethod.client_secret || ''}
                                                    onChange={(e) => updatePaymentMethod('paypal', 'client_secret', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.common.fee_percent', 'Recargo (%)')}</label>
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
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.common.description', 'Descripcion')}</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={paypalMethod.description || ''}
                                                    onChange={(e) => updatePaymentMethod('paypal', 'description', e.target.value)}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.common.customer_instructions', 'Instrucciones al cliente')}</label>
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
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">{t('admin.settings.commerce.paypal.card.eyebrow', 'Pasarela')}</p>
                                            <h3 className="mt-2 text-lg font-semibold text-sky-950">{t('admin.settings.commerce.paypal.card.title', 'Activacion controlada desde configuracion')}</h3>
                                            <p className="mt-2 text-sm leading-6 text-sky-900/80">
                                                {t('admin.settings.commerce.paypal.card.description', 'Cuando esta opcion esta activa, checkout mostrara PayPal como un metodo seleccionable. Las credenciales quedan centralizadas aqui para el equipo administrativo.')}
                                            </p>
                                            <div className="mt-4 space-y-2 text-sm text-sky-900/80">
                                                <div className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3">
                                                    <span>{t('admin.settings.commerce.paypal.client_id', 'Client ID')}</span>
                                                    <strong>{paypalMethod.client_id ? t('admin.settings.commerce.values.configured', 'Configurado') : t('admin.settings.commerce.values.pending', 'Pendiente')}</strong>
                                                </div>
                                                <div className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3">
                                                    <span>{t('admin.settings.commerce.paypal.client_secret', 'Client Secret')}</span>
                                                    <strong>{paypalMethod.client_secret ? t('admin.settings.commerce.values.configured', 'Configurado') : t('admin.settings.commerce.values.pending', 'Pendiente')}</strong>
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
                                                    {t('admin.settings.commerce.stripe.enable', 'Habilitar Stripe en checkout')}
                                                </label>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.common.visible_name', 'Nombre visible')}</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={stripeMethod.label || ''}
                                                    onChange={(e) => updatePaymentMethod('stripe', 'label', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.stripe.environment', 'Entorno')}</label>
                                                <select
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={stripeMethod.environment || 'test'}
                                                    onChange={(e) => updatePaymentMethod('stripe', 'environment', e.target.value)}
                                                >
                                                    <option value="test">{t('admin.settings.commerce.stripe.options.test', 'Test')}</option>
                                                    <option value="live">{t('admin.settings.commerce.stripe.options.live', 'Live')}</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.stripe.publishable_key', 'Publishable Key')}</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={stripeMethod.publishable_key || ''}
                                                    onChange={(e) => updatePaymentMethod('stripe', 'publishable_key', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.stripe.secret_key', 'Secret Key')}</label>
                                                <input
                                                    type="password"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={stripeMethod.secret_key || ''}
                                                    onChange={(e) => updatePaymentMethod('stripe', 'secret_key', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.common.fee_percent', 'Recargo (%)')}</label>
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
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.common.description', 'Descripcion')}</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm"
                                                    value={stripeMethod.description || ''}
                                                    onChange={(e) => updatePaymentMethod('stripe', 'description', e.target.value)}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700">{t('admin.settings.commerce.common.customer_instructions', 'Instrucciones al cliente')}</label>
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
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-700">{t('admin.settings.commerce.stripe.card.eyebrow', 'Tarjetas')}</p>
                                            <h3 className="mt-2 text-lg font-semibold text-fuchsia-950">{t('admin.settings.commerce.stripe.card.title', 'Formulario integrado en el checkout')}</h3>
                                            <p className="mt-2 text-sm leading-6 text-fuchsia-900/80">
                                                {t('admin.settings.commerce.stripe.card.description', 'Cuando esté activo, el checkout mostrara un formulario seguro de tarjeta solo si el cliente elige Stripe como metodo de pago.')}
                                            </p>
                                            <div className="mt-4 space-y-2 text-sm text-fuchsia-900/80">
                                                <div className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3">
                                                    <span>{t('admin.settings.commerce.stripe.publishable_key', 'Publishable Key')}</span>
                                                    <strong>{stripeMethod.publishable_key ? t('admin.settings.commerce.values.configured_female', 'Configurada') : t('admin.settings.commerce.values.pending', 'Pendiente')}</strong>
                                                </div>
                                                <div className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3">
                                                    <span>{t('admin.settings.commerce.stripe.secret_key', 'Secret Key')}</span>
                                                    <strong>{stripeMethod.secret_key ? t('admin.settings.commerce.values.configured_female', 'Configurada') : t('admin.settings.commerce.values.pending', 'Pendiente')}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <div className="sticky bottom-4 z-10">
                        <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white/95 px-5 py-4 shadow-lg shadow-slate-200/60 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t('admin.settings.footer.eyebrow', 'Guardado')}</p>
                                <p className="mt-1 text-sm text-slate-600">
                                    {t('admin.settings.footer.message_prefix', 'Estás editando')} <span className="font-semibold text-slate-900">{activeSettingsMeta.title}</span>. {t('admin.settings.footer.message_suffix', 'Guarda cuando termines este bloque.')}
                                </p>
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {processing ? t('admin.settings.footer.saving', 'Guardando...') : t('admin.settings.footer.save', 'Guardar cambios')}
                            </button>
                        </div>
                    </div>
                </>
            )}
                       </div>
            </div>
                </form>
            </div>
        </AuthenticatedLayout>
        
    );
}
