
import { Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react'
import { ShoppingCart as ShoppingCartIcon, Menu, X } from 'lucide-react'
import ShoppingCartModal from '@/Components/shop/ShoppingCart'
import ApplicationLogo from '@/Components/ApplicationLogo'
import { useCart } from '@/Hooks/useCart'
import { useDisplayCurrency } from '@/Hooks/useDisplayCurrency'
import { useI18n } from '@/Hooks/useI18n'
import LanguageSwitcher from '@/Components/i18n/LanguageSwitcher'

export default function NavLayout() {
    const [isOpen, setIsOpen] = useState(false)
    const [isCartOpen, setIsCartOpen] = useState(false)
    const { cart } = useCart()
  const { displayCurrency, setDisplayCurrency, availableCurrencies } = useDisplayCurrency()
    const page = usePage()
    const { t } = useI18n()
    const settings = page.props?.settings || {}
    const general = settings.general || {}
    const brandName = general.trade_name || general.company_name || t('nav.brand', 'Inventario')
    const isAuthenticated = !!page.props?.auth?.user;
    const userRoles = page.props?.auth?.roles || [];
    const isCliente = userRoles.includes('cliente');
    const handleLogout = (e) => {
      e.preventDefault();
      router.post(route('logout'));
    };
    return (
<>
<nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <ApplicationLogo className="h-9 w-auto max-w-[140px] object-contain" />
          <span className="font-bold text-lg text-primary">{brandName}</span>
        </Link>

        {/* Menu desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-foreground hover:text-primary transition">
            {t('nav.home', 'Inicio')}
          </Link>
          <Link href={route('shop.index')} className="text-foreground hover:text-primary transition">
            {t('nav.shop', 'Tienda')}
          </Link>
          {isAuthenticated && (
            <Link
              href={isCliente ? '/mi-panel' : '/dashboard'}
              className="text-foreground hover:text-primary transition"
            >
              {t(isCliente ? 'nav.dashboard_client' : 'nav.dashboard_admin', isCliente ? 'Mi Panel' : 'Dashboard')}
            </Link>
          )}
        </div>

        {/* Selector de idioma + moneda + Carrito y Auth */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher className="hidden md:block" />
          {availableCurrencies.length > 1 && (
            <div className="hidden md:flex items-center gap-1 text-xs border border-border rounded-full px-2 py-1 bg-muted/60">
              {availableCurrencies.map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setDisplayCurrency(cur)}
                  className={`px-1.5 py-0.5 rounded-full transition text-[11px] ${
                    displayCurrency === cur
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground/70 hover:bg-background'
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>
          )}

          <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-muted rounded-lg transition">
            <ShoppingCartIcon className="w-6 h-6 text-foreground" />
            <span className="absolute top-1 right-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cart?.items?.length ?? 0}
            </span>
          </button>

          {!isAuthenticated && (
            <div className="hidden md:flex gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-primary hover:bg-secondary rounded-lg transition"
              >
                {t('nav.login', 'Login')}
              </Link>
              <Link
                href="/registro"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                {t('nav.register', 'Registro')}
              </Link>
            </div>
          )}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition"
            >
              {t('nav.logout', 'Cerrar sesión')}
            </button>
          )}

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
              {t('nav.home', 'Inicio')}
            </Link>
            <Link  href={route('shop.index')} className="text-foreground hover:text-primary transition">
              {t('nav.shop', 'Tienda')}
            </Link>
            {isAuthenticated && (
              <Link
                href={isCliente ? '/mi-panel' : '/dashboard'}
                className="text-foreground hover:text-primary transition"
              >
                {t(isCliente ? 'nav.dashboard_client' : 'nav.dashboard_admin', isCliente ? 'Mi Panel' : 'Dashboard')}
              </Link>
            )}
            <LanguageSwitcher mobile />
            {!isAuthenticated && (
              <div className="flex gap-2 pt-2">
                <Link
                  href="/login"
                  className="flex-1 px-4 py-2 text-center text-primary border border-primary rounded-lg hover:bg-secondary transition"
                >
                  {t('nav.login', 'Login')}
                </Link>
                <Link
                  href="/registro"
                  className="flex-1 px-4 py-2 text-center bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                >
                  {t('nav.register', 'Registro')}
                </Link>
              </div>
            )}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="w-full mt-2 px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition"
              >
                {t('nav.logout', 'Cerrar sesión')}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
    <ShoppingCartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
    );
}
