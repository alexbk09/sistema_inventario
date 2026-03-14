import { Head, Link } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout.jsx';
import { usePage } from '@inertiajs/react';
import Hero from '@/Pages/Home/Components/Hero.jsx';
import FeaturedProducts from '@/Pages/Home/Components/FeatureProducts.jsx';
import LocationContact from '@/Pages/Home/Components/LocationContact.jsx';

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
  const { props } = usePage();
  const settings = props.settings || {};
  const effectiveStore = store || settings.store || {};
  const effectiveCompany = company || settings.general || {};

  return (
    <GuestLayout>
      <Head title={effectiveStore.home_title || 'Inicio'} />
          <main className="flex flex-col min-h-screen bg-background">
            
                <div className="flex-1">
                    <div className="max-w-7xl mx-auto px-4 py-8">
                    {/* Bienvenida */}
                    <section className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 text-balance">
                          {effectiveStore.home_title || 'Bienvenido a la Tienda'}
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

                    {/* Ubicación y Contacto */}
                    <LocationContact company={effectiveCompany} location={settings.location} store={effectiveStore} />
                    </div>
                </div>


            </main>
    </GuestLayout>
  );
}
