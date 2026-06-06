import { Link, usePage } from '@inertiajs/react';
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react'
import { useI18n } from '@/Hooks/useI18n';
import ApplicationLogo from '@/Components/ApplicationLogo';

function TikTokIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.12v13.18a2.67 2.67 0 1 1-2.67-2.67c.22 0 .43.03.63.08V9.44a5.8 5.8 0 0 0-.63-.03A5.79 5.79 0 1 0 15.82 15V8.34a7.93 7.93 0 0 0 4.63 1.49V6.69h-.86Z" />
    </svg>
  );
}

export default function FooterLayout() {
    const currentYear = new Date().getFullYear()
      const { props } = usePage();
      const settings = props.settings || {};
      const general = settings.general || {};
      const store = settings.store || {};
        const brandName = general.trade_name || general.company_name || 'Inventario';
  const { t } = useI18n();
  const socialLinks = [
    {
      href: general.facebook_url,
      label: t('footer.social_facebook', 'Facebook'),
      Icon: Facebook,
    },
    {
      href: general.instagram_url,
      label: t('footer.social_instagram', 'Instagram'),
      Icon: Instagram,
    },
    {
      href: general.twitter_url,
      label: t('footer.social_twitter', 'Twitter'),
      Icon: Twitter,
    },
    {
      href: general.youtube_url,
      label: t('footer.social_youtube', 'YouTube'),
      Icon: Youtube,
    },
    {
      href: general.tiktok_url,
      label: t('footer.social_tiktok', 'TikTok'),
      Icon: TikTokIcon,
    },
    {
      href: general.linkedin_url,
      label: t('footer.social_linkedin', 'LinkedIn'),
      Icon: Linkedin,
    },
  ].filter((item) => Boolean(item.href));

    return (
   <footer className="bg-primary text-primary-foreground mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Empresa */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ApplicationLogo className="h-10 w-auto max-w-[140px] object-contain" />
                <h3 className="font-bold text-lg">{brandName}</h3>
            </div>
            <p className="text-sm text-primary-foreground/80">
              {store.contact_text || t('footer.company_tagline', 'Tu tienda en línea de productos.')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">
              {t('footer.navigation_title', 'Navegación')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-accent transition">
                  {t('footer.navigation_home', 'Inicio')}
                </Link>
              </li>
              <li>
                <Link href={route('shop.index')} className="hover:text-accent transition">
                  {t('footer.navigation_shop', 'Tienda')}
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-accent transition">
                  {t('footer.navigation_about', 'Sobre nosotros')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">
              {t('footer.legal_title', 'Legal')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-accent transition">
                  {t('footer.legal_terms', 'Términos de servicio')}
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-accent transition">
                  {t('footer.legal_privacy', 'Política de privacidad')}
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-accent transition">
                  {t('footer.legal_returns', 'Política de devoluciones')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto y Redes */}
          <div>
            <h4 className="font-semibold mb-4">
              {t('footer.follow_us_title', 'Síguenos')}
            </h4>
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6">
                {socialLinks.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center hover:bg-primary-foreground/30 transition"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Divisor */}
        <div className="border-t border-primary-foreground/20 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-primary-foreground/70">
            <p>
              &copy; {currentYear} {brandName}. {t(
                'footer.rights',
                'Todos los derechos reservados.'
              )}
            </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href={route('shop.index')} className="hover:text-accent transition">
              {t('footer.navigation_shop', 'Tienda')}
            </Link>
          </div>
        </div>
      </div>

      {/* WhatsApp Button */}
      <a
          href={general.whatsapp ? `https://wa.me/${general.whatsapp.replace(/[^0-9]/g, '')}` : 'https://wa.me/584124000000'}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition hover:scale-110 z-40"
      >
        <span className="text-2xl">💬</span>
      </a>
    </footer>
    );
}
