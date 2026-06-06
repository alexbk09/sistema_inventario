import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout.jsx';
import Hero from '@/Pages/Home/Components/Hero.jsx';
import FeaturedProducts from '@/Pages/Home/Components/FeatureProducts.jsx';
import LocationContact from '@/Pages/Home/Components/LocationContact.jsx';
import { useI18n } from '@/Hooks/useI18n';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

function ActionLink({ href, children, primary = false }) {
  if (!href || !children) {
    return null;
  }

  const className = primary
    ? 'inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800'
    : 'inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50';

  if (href.startsWith('#') || href.startsWith('http://') || href.startsWith('https://')) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function Home({ products = [], store = null, company = null }) {
  const { t } = useI18n();
  const { props } = usePage();
  const settings = props.settings || {};
  const effectiveStore = store || settings.store || {};
  const effectiveCompany = company || settings.general || {};
  const brandName = effectiveCompany.trade_name || effectiveCompany.company_name || t('nav.brand', 'Inventario');
  const heroBanners = Array.isArray(effectiveStore.hero_banners) && effectiveStore.hero_banners.length > 0
    ? effectiveStore.hero_banners
    : [
        {
          title: t('home.hero.banners.0.title', 'Productos destacados'),
          description: t('home.hero.banners.0.description', 'Configura promociones, nuevas llegadas o mensajes clave desde el panel.'),
          image_url: '',
        },
      ];
  const homeHighlights = Array.isArray(effectiveStore.home_highlights) && effectiveStore.home_highlights.length > 0
    ? effectiveStore.home_highlights
    : [
        {
          eyebrow: t('home.highlights.defaults.0.eyebrow', 'Catalogo'),
          title: t('home.highlights.defaults.0.title', 'Productos organizados'),
          description: t('home.highlights.defaults.0.description', 'Expone lo mejor de tu inventario con categorias claras y acceso directo.'),
        },
        {
          eyebrow: t('home.highlights.defaults.1.eyebrow', 'Confianza'),
          title: t('home.highlights.defaults.1.title', 'Informacion clara desde el inicio'),
          description: t('home.highlights.defaults.1.description', 'Muestra contacto, ubicacion y mensajes comerciales utiles desde la portada.'),
        },
        {
          eyebrow: t('home.highlights.defaults.2.eyebrow', 'Accion'),
          title: t('home.highlights.defaults.2.title', 'Llamados concretos'),
          description: t('home.highlights.defaults.2.description', 'Lleva al cliente rapido a la tienda, a promociones o al canal de contacto.'),
        },
      ];
  const { data, setData, post, processing, reset, errors, recentlySuccessful } = useForm({
    email: '',
    whatsapp: '',
    name: '',
  });
  const [justSubscribed, setJustSubscribed] = useState(false);

  useEffect(() => {
    if (props.flash?.newsletter_subscribed) {
      setJustSubscribed(true);
      reset();
    }
  }, [props.flash?.newsletter_subscribed, reset]);

  return (
    <GuestLayout>
      <Head title={effectiveStore.home_title || t('home.title_fallback', 'Inicio')} />
          <main className="flex min-h-screen flex-col bg-background">
                <div className="flex-1">
                    <div className="mx-auto max-w-7xl px-4 py-8">
                    <section className="mb-14 overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.06),_transparent_34%),linear-gradient(135deg,_#ffffff,_#f8fafc_55%,_#e2e8f0)] p-6 shadow-sm md:p-8">
                        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
                          <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                              <Sparkles className="h-3.5 w-3.5" />
                              {effectiveStore.hero_badge || t('home.hero_badge_fallback', 'Compra con confianza')}
                            </div>
                            <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 md:text-5xl xl:text-6xl">
                              {effectiveStore.home_title || t('home.title_fallback', 'Bienvenido a la Tienda')}
                            </h1>
                            <p className="mt-3 text-lg font-medium text-slate-700 md:text-xl">
                              {effectiveStore.home_subtitle || brandName}
                            </p>
                            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                              {effectiveStore.hero_description
                                || effectiveStore.contact_text
                                || t('home.hero_description_fallback', 'Presenta tu propuesta de valor, beneficios, promociones y formas de contacto desde un inicio más claro y útil para el cliente.')}
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3">
                              <ActionLink href={effectiveStore.hero_primary_cta_url || '/shop'} primary>
                                {effectiveStore.hero_primary_cta_label || t('home.hero_primary_cta_fallback', 'Ir a la tienda')}
                                <ArrowRight className="h-4 w-4" />
                              </ActionLink>
                              <ActionLink href={effectiveStore.hero_secondary_cta_url || '#contacto'}>
                                {effectiveStore.hero_secondary_cta_label || t('home.hero_secondary_cta_fallback', 'Contáctanos')}
                              </ActionLink>
                            </div>

                            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                              {homeHighlights.slice(0, 3).map((item, index) => (
                                <article
                                  key={`highlight-${index}`}
                                  className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur"
                                  style={{
                                    backgroundColor: item.background_color || undefined,
                                    color: item.text_color || undefined,
                                    backgroundImage: item.image_url ? `linear-gradient(rgba(255,255,255,0.82), rgba(255,255,255,0.82)), url(${item.image_url})` : undefined,
                                    backgroundSize: item.image_url ? 'cover' : undefined,
                                    backgroundPosition: item.image_url ? 'center' : undefined,
                                  }}
                                >
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{item.eyebrow || t('home.highlight_eyebrow_fallback', 'Detalle')}</p>
                                  <h2 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h2>
                                  {item.description && (
                                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                                  )}
                                </article>
                              ))}
                            </div>

                            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-600">
                              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                {t('home.trust_badge', 'Información clara, contacto visible y acceso rápido a compra')}
                              </div>
                            </div>
                          </div>

                          <Hero banners={heroBanners} systemName={brandName} />
                        </div>
                    </section>

                    {/* Productos destacados */}
                    <FeaturedProducts products={products} />

                    {/* Testimonios simples */}
                    <section className="mt-16">
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                        {t('home.testimonials_title', 'Lo que dicen nuestros clientes')}
                      </h2>
                      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
                        {t(
                          'home.testimonials_subtitle',
                          'Un vistazo rápido a la experiencia real de quienes ya compran con nosotros.'
                        )}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(t('home.testimonials', []) || []).map((item, idx) => (
                          <article
                            key={idx}
                            className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between h-full"
                          >
                            <p className="text-sm text-muted-foreground mb-4">
                              {`“${item.text}”`}
                            </p>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.role}</p>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>

                    {/* Newsletter */}
                    <section className="mt-16">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        <div className="md:col-span-2">
                          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                            {t('home.newsletter_title', 'Recibe novedades y ofertas')}
                          </h2>
                          <p className="text-sm text-muted-foreground max-w-xl">
                            {t(
                              'home.newsletter_description',
                              'Déjanos tu email o número de WhatsApp y te avisaremos cuando tengamos nuevas ofertas, productos destacados o promociones especiales.'
                            )}
                          </p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5 shadow-sm w-full">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              post(route('newsletter.subscribe'));
                            }}
                            className="space-y-3"
                          >
                            {errors.newsletter && (
                              <p className="text-xs text-destructive mb-1">{errors.newsletter}</p>
                            )}
                            {justSubscribed && !errors.newsletter && (
                              <p className="text-xs text-emerald-600 mb-1">
                                {t(
                                  'home.newsletter_success',
                                  '¡Gracias! Te hemos suscrito a nuestras novedades.'
                                )}
                              </p>
                            )}
                            <div>
                              <label className="block text-xs font-semibold text-foreground mb-1">
                                {t('home.newsletter_name_label', 'Nombre (opcional)')}
                              </label>
                              <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                                placeholder={t('home.newsletter_name_placeholder', 'Cómo te llamas')}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-foreground mb-1">
                                {t('home.newsletter_email_label', 'Email')}
                              </label>
                              <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                                placeholder={t('home.newsletter_email_placeholder', 'tu@correo.com')}
                              />
                              {errors.email && (
                                <p className="text-xs text-destructive mt-1">{errors.email}</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-foreground mb-1">
                                {t('home.newsletter_whatsapp_label', 'WhatsApp')}
                              </label>
                              <input
                                type="text"
                                value={data.whatsapp}
                                onChange={(e) => setData('whatsapp', e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                                placeholder={t(
                                  'home.newsletter_whatsapp_placeholder',
                                  'Ej: +58 412 000 0000'
                                )}
                              />
                              {errors.whatsapp && (
                                <p className="text-xs text-destructive mt-1">{errors.whatsapp}</p>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {t(
                                'home.newsletter_privacy_note',
                                'Puedes darte de baja en cualquier momento. No enviamos spam.'
                              )}
                            </p>
                            <button
                              type="submit"
                              disabled={processing}
                              className="w-full mt-1 inline-flex items-center justify-center px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
                            >
                              {processing
                                ? t('home.newsletter_button_processing', 'Guardando...')
                                : t('home.newsletter_button_idle', 'Quiero recibir novedades')}
                            </button>
                          </form>
                        </div>
                      </div>
                    </section>

                    {/* Ubicación y Contacto */}
                    <section id="contacto">
                      <LocationContact company={effectiveCompany} location={settings.location} store={effectiveStore} />
                    </section>
                    </div>
                </div>
            </main>
    </GuestLayout>
  );
}
