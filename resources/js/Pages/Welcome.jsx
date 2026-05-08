import { Head, Link } from '@inertiajs/react';
import LanguageSwitcher from '@/Components/i18n/LanguageSwitcher';
import { useI18n } from '@/Hooks/useI18n';

export default function Welcome({ auth }) {
    const { t } = useI18n();

    return (
        <>
            <Head title={t('welcome.page_title', 'Bienvenido')} />
            <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.14),_transparent_38%),linear-gradient(180deg,#f8fafc_0%,#ecfeff_100%)] text-slate-900">
                <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
                    <header className="flex items-center justify-between gap-4">
                        <Link href={route('home')} className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold">I</div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t('welcome.eyebrow', 'Sistema')}</p>
                                <h1 className="text-lg font-semibold text-slate-900">{t('nav.brand', 'Inventario')}</h1>
                            </div>
                        </Link>
                        <div className="flex items-center gap-3">
                            <LanguageSwitcher />
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                                >
                                    {t('nav.dashboard_admin', 'Dashboard')}
                                </Link>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={route('login')}
                                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                    >
                                        {t('nav.login', 'Login')}
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                                    >
                                        {t('nav.register', 'Registro')}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </header>

                    <main className="flex flex-1 items-center py-16">
                        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                            <section>
                                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-700">{t('welcome.badge', 'Operacion centralizada')}</p>
                                <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                                    {t('welcome.title', 'Gestiona inventario, ventas y clientes desde una sola experiencia multilenguaje.')}
                                </h2>
                                <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                                    {t('welcome.description', 'Este acceso de respaldo mantiene una entrada coherente al sistema mientras la tienda, el panel administrativo y el area del cliente comparten el mismo idioma activo.')}
                                </p>
                                <div className="mt-8 flex flex-wrap items-center gap-3">
                                    <Link
                                        href={route('home')}
                                        className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                                    >
                                        {t('welcome.primary_cta', 'Ir al inicio')}
                                    </Link>
                                    {auth.user ? (
                                        <Link
                                            href={route('dashboard')}
                                            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                        >
                                            {t('welcome.secondary_cta_authenticated', 'Abrir panel')}
                                        </Link>
                                    ) : (
                                        <Link
                                            href={route('login')}
                                            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                        >
                                            {t('welcome.secondary_cta_guest', 'Acceder al sistema')}
                                        </Link>
                                    )}
                                </div>
                            </section>

                            <aside className="rounded-[32px] border border-white/70 bg-white/80 p-7 shadow-[0_24px_90px_rgba(15,23,42,0.08)] backdrop-blur">
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('welcome.panel_title', 'Estado de acceso')}</p>
                                <p className="mt-3 text-2xl font-semibold text-slate-950">{auth.user ? t('welcome.authenticated_title', 'Sesion activa') : t('welcome.guest_title', 'Sesion no iniciada')}</p>
                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                    {auth.user
                                        ? t('welcome.authenticated_description', 'Tu cuenta ya puede entrar al panel correspondiente con el idioma que selecciones arriba.')
                                        : t('welcome.guest_description', 'Inicia sesion o crea una cuenta para continuar hacia la tienda, el panel de cliente o la administracion.')}
                                </p>
                                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl bg-slate-100 px-4 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('welcome.card_one_label', 'Idiomas')}</p>
                                        <p className="mt-2 text-sm text-slate-700">{t('welcome.card_one_value', 'Espanol, English, Portugues, Francais e Italiano')}</p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-100 px-4 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('welcome.card_two_label', 'Cobertura')}</p>
                                        <p className="mt-2 text-sm text-slate-700">{t('welcome.card_two_value', 'Tienda, cliente y administracion alineados')}</p>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
