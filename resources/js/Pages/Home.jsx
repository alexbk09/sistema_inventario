import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout.jsx';
import Hero from '@/Pages/Home/Components/Hero.jsx';
import FeaturedProducts from '@/Pages/Home/Components/FeatureProducts.jsx';
import LocationContact from '@/Pages/Home/Components/LocationContact.jsx';
import { useI18n } from '@/Hooks/useI18n';

function Carousel() {
  return (
    <div className="w-full overflow-hidden rounded-xl shadow">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1,2,3].map((i) => (
          <div key={i} className="h-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg"/>
        ))}
      </div>
    </div>
  );
}


export default function Home({ products = [], store = null, company = null }) {
  const { t } = useI18n();
  const { props } = usePage();
  const settings = props.settings || {};
  const effectiveStore = store || settings.store || {};
  const effectiveCompany = company || settings.general || {};
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
          <main className="flex flex-col min-h-screen bg-background">
            
                <div className="flex-1">
                    <div className="max-w-7xl mx-auto px-4 py-8">
                    {/* Bienvenida */}
                    <section className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 text-balance">
                          {effectiveStore.home_title || t('home.title_fallback', 'Bienvenido a la Tienda')}
                        </h1>
                        {effectiveStore.home_subtitle && (
                          <p className="text-lg text-slate-600 max-w-2xl">
                            {effectiveStore.home_subtitle}
                          </p>
                        )}
                        <Hero />
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
                    <LocationContact company={effectiveCompany} location={settings.location} store={effectiveStore} />
                    </div>
                </div>


            </main>
    </GuestLayout>
  );
}
