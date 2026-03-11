import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const banners = [
  {
    id: 1,
    title: 'Iluminación LED Moderna',
    description: 'Descubre nuestras luces LED de alta eficiencia',
    gradient: 'from-blue-600 to-cyan-500',
  },
  {
    id: 2,
    title: 'Bombillos Inteligentes',
    description: 'Control total desde tu dispositivo móvil',
    gradient: 'from-blue-700 to-blue-500',
  },
  {
    id: 3,
    title: 'Lámparas Decorativas',
    description: 'Estilo y funcionalidad para tu hogar',
    gradient: 'from-indigo-600 to-blue-600',
  },
]

export default function Hero() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const prev = () => setCurrent((prev) => (prev - 1 + banners.length) % banners.length)
  const next = () => setCurrent((prev) => (prev + 1) % banners.length)

  return (
    <div className="relative w-full h-96 overflow-hidden rounded-2xl">
      {/* Banners */}
      <div className="flex h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute w-full h-full transition-opacity duration-500 ${
              index === current ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className={`w-full h-full bg-gradient-to-r ${banner.gradient} flex flex-col items-center justify-center text-white p-4`}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-balance">
                {banner.title}
              </h2>
              <p className="text-lg md:text-xl text-center text-white/90">
                {banner.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Controles */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-2 rounded-full transition z-10"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-2 rounded-full transition z-10"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Indicadores */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {banners.map((_, index) => (
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