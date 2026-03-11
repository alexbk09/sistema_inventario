
import { Link } from '@inertiajs/react';
import { useState } from 'react'
import { ShoppingCart as ShoppingCartIcon, Menu, X } from 'lucide-react'
import ShoppingCartModal from '@/Components/shop/ShoppingCart'
import { useCart } from '@/Hooks/useCart'

export default function NavLayout() {
      const [isOpen, setIsOpen] = useState(false)
      const [isCartOpen, setIsCartOpen] = useState(false)
      const { cart } = useCart()
    return (
<>
<nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold">⚡</span>
          </div>
          <span className="font-bold text-lg text-primary">Inventario</span>
        </Link>

        {/* Menu desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-foreground hover:text-primary transition">
            Inicio
          </Link>
          <Link href={route('shop.index')} className="text-foreground hover:text-primary transition">
            Tienda
          </Link>
        </div>

        {/* Carrito y Auth */}
        <div className="flex items-center gap-4">
          <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-muted rounded-lg transition">
            <ShoppingCartIcon className="w-6 h-6 text-foreground" />
            <span className="absolute top-1 right-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cart?.items?.length ?? 0}
            </span>
          </button>

          <div className="hidden md:flex gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-primary hover:bg-secondary rounded-lg transition"
            >
              Login
            </Link>
            <Link
              href="/registro"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
            >
              Registro
            </Link>
          </div>

          {/* Menu móvil */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition"
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Menu móvil expandido */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-border">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4">
            <Link href="/" className="text-foreground hover:text-primary transition">
              Inicio
            </Link>
            <Link  href={route('shop.index')} className="text-foreground hover:text-primary transition">
              Tienda
            </Link>
            <div className="flex gap-2 pt-2">
              <Link
                href="/login"
                className="flex-1 px-4 py-2 text-center text-primary border border-primary rounded-lg hover:bg-secondary transition"
              >
                Login
              </Link>
              <Link
                href="/registro"
                className="flex-1 px-4 py-2 text-center bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                Registro
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
    <ShoppingCartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
    );
}
