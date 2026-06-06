import { useState, useEffect } from 'react'
import { useI18n } from '@/Hooks/useI18n'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const gradients = [
  'from-slate-950 via-slate-900 to-sky-700',
  'from-sky-900 via-cyan-700 to-slate-900',
  'from-indigo-900 via-slate-900 to-fuchsia-700',
  'from-emerald-900 via-slate-900 to-cyan-700',
  'from-slate-900 via-violet-900 to-blue-700',
]

export default function Hero({ banners = [], systemName = 'Inventario' }) {
  const { t } = useI18n()
  const slides = banners.length > 0 ? banners : [
    {
      title: t('home.hero.banners.0.title', 'Productos destacados'),
      description: t('home.hero.banners.0.description', 'Presenta tu propuesta comercial con un banner claro y editable.'),
      image_url: '',
    },
  ]
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) {
      return undefined
    }

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)
  const next = () => setCurrent((prev) => (prev + 1) % slides.length)

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-[28px] border border-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
      <div className="flex h-full">
        {slides.map((banner, index) => (
          <div
            key={`${banner.title}-${index}`}
            className={`absolute w-full h-full transition-opacity duration-500 ${
              index === current ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className={`relative flex h-full w-full flex-col justify-end p-6 md:p-8 ${banner.image_url || banner.background_color ? '' : `bg-gradient-to-br ${gradients[index % gradients.length]}`} ${banner.image_url ? 'text-white' : banner.background_color ? '' : 'text-white'}`}
              style={banner.image_url ? {
                backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.72), rgba(15,23,42,0.42)), url(${banner.image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: banner.text_color || undefined,
              } : banner.background_color ? {
                backgroundColor: banner.background_color,
                color: banner.text_color || undefined,
              } : undefined}
            >
              <div className="absolute left-6 top-6 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur md:left-8 md:top-8">
                {systemName}
              </div>
              <div className="relative z-10 max-w-md rounded-[24px] border border-white/10 bg-black/20 p-5 backdrop-blur-sm md:p-6">
              <h2 className="text-3xl font-bold text-balance md:text-4xl">
                {banner.title}
              </h2>
              <p className="mt-3 text-base leading-7 text-white/85 md:text-lg">
                {banner.description}
              </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={prev}
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white transition hover:bg-white/35"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white transition hover:bg-white/35"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-2 h-2 rounded-full transition ${
              index === current ? 'bg-white w-8' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}