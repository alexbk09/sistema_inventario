import { Link } from '@inertiajs/react';
import { Mail, Phone, Facebook, Instagram, Twitter } from 'lucide-react'
export default function FooterLayout() {
    const currentYear = new Date().getFullYear()
    return (
   <footer className="bg-primary text-primary-foreground mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Empresa */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⚡</span>
              <h3 className="font-bold text-lg">Inventario</h3>
            </div>
            <p className="text-sm text-primary-foreground/80">
              Tu tienda en línea de productos eléctricos y de iluminación.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Navegación</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-accent transition">
                  Inicio
                </Link>
              </li>
              <li>
                <li>
                  <Link href={route('shop.index')} className="hover:text-accent transition">
                    Tienda
                  </Link>
                </li>
                <Link href="#" className="hover:text-accent transition">
                  Sobre nosotros
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-accent transition">
                  Términos de servicio
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-accent transition">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-accent transition">
                  Política de devoluciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto y Redes */}
          <div>
            <h4 className="font-semibold mb-4">Síguenos</h4>
            <div className="flex gap-3 mb-6">
              <a
                href="#"
                className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center hover:bg-primary-foreground/30 transition"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center hover:bg-primary-foreground/30 transition"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center hover:bg-primary-foreground/30 transition"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Divisor */}
        <div className="border-t border-primary-foreground/20 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-primary-foreground/70">
          <p>&copy; {currentYear} Inventario. Todos los derechos reservados.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/" className="hover:text-accent transition">
              <Link href={route('shop.index')} className="hover:text-accent transition">
                Tienda
              </Link>
              Tienda
            </Link>
          </div>
        </div>
      </div>

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/584124000000"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition hover:scale-110 z-40"
      >
        <span className="text-2xl">💬</span>
      </a>
    </footer>
    );
}
