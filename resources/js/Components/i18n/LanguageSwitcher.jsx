import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, usePage } from '@inertiajs/react'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { useI18n } from '@/Hooks/useI18n'

export default function LanguageSwitcher({ className = '', align = 'right', mobile = false }) {
  const { locale, supportedLocales, t } = useI18n()
  const { post, processing } = useForm({})
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const page = usePage()

  const locales = useMemo(() => {
    return supportedLocales.length > 0
      ? supportedLocales
      : [
          { code: 'es', native_name: 'Español', regional: 'es-ES' },
          { code: 'en', native_name: 'English', regional: 'en-US' },
          { code: 'pt', native_name: 'Português', regional: 'pt-BR' },
          { code: 'fr', native_name: 'Français', regional: 'fr-FR' },
          { code: 'it', native_name: 'Italiano', regional: 'it-IT' },
        ]
  }, [supportedLocales])

  const currentLocale = locales.find((item) => item.code === locale) ?? locales[0]

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const switchLocale = (nextLocale) => {
    if (!nextLocale || nextLocale === locale || processing) return
    setOpen(false)
    post(route('locale.switch', nextLocale), {
      preserveScroll: true,
      preserveState: false,
      onSuccess: () => {
        window.location.assign(page.url || window.location.href)
      },
    })
  }

  if (mobile) {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm ${className}`}>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          <Globe className="h-4 w-4" />
          <span>{t('locale.switcher.title', 'Idioma')}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {locales.map((item) => {
            const active = item.code === locale
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => switchLocale(item.code)}
                disabled={processing}
                className={`rounded-2xl border px-3 py-2 text-left text-sm transition ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/15'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="font-semibold">{item.native_name}</div>
                <div className={`text-xs ${active ? 'text-white/70' : 'text-slate-500'}`}>{item.code.toUpperCase()}</div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="flex min-w-[156px] items-center justify-between gap-3 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-white"
        aria-expanded={open}
        aria-label={t('locale.switcher.aria', 'Cambiar idioma')}
      >
        <span className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">
            <Globe className="h-4 w-4" />
          </span>
          <span className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {t('locale.switcher.title', 'Idioma')}
            </span>
            <span className="font-semibold text-slate-900">{currentLocale?.native_name ?? 'Español'}</span>
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} z-40 mt-3 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-2xl shadow-slate-900/10 backdrop-blur`}
        >
          <div className="border-b border-slate-100 px-3 pb-3 pt-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              {t('locale.switcher.subtitle', 'Selecciona el idioma de la interfaz')}
            </div>
          </div>
          <div className="mt-2 space-y-1">
            {locales.map((item) => {
              const active = item.code === locale
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => switchLocale(item.code)}
                  disabled={processing}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition ${
                    active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">{item.native_name}</span>
                    <span className={`block text-xs ${active ? 'text-white/70' : 'text-slate-400'}`}>
                      {item.code.toUpperCase()} · {item.name}
                    </span>
                  </span>
                  <span className={`rounded-full p-1 ${active ? 'bg-white/10' : 'bg-slate-100 text-slate-400'}`}>
                    <Check className="h-4 w-4" />
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}