import { Head, Link } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout.jsx';
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


export default function Home({ products = [] }) {
  return (
    <GuestLayout>
      <Head title="Inicio" />
          <main className="flex flex-col min-h-screen bg-background">
            
                <div className="flex-1">
                    <div className="max-w-7xl mx-auto px-4 py-8">
                    {/* Bienvenida */}
                    <section className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8 text-balance">
                        Bienvenido a la Tienda
                        </h1>
                        <Hero />
                    </section>

                    {/* Productos destacados */}
                    <FeaturedProducts products={products} />

                    {/* Ubicación y Contacto */}
                    <LocationContact />
                    </div>
                </div>


            </main>
    </GuestLayout>
  );
}
