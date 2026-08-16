import { useState, useEffect, useCallback, useRef } from 'react'
import { TrendingUp, TrendingDown, Minus, RefreshCw, Clock, Wifi, WifiOff } from 'lucide-react'

const REFRESH_INTERVAL_SECONDS = 300 // 5 minutos

export default function CurrencyWidget({ initialRate = null }) {
  const [rate, setRate]             = useState(initialRate ? parseFloat(initialRate) : null)
  const [prevRate, setPrevRate]     = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(false)
  const [lastUpdated, setLastUpdated] = useState(initialRate ? new Date() : null)
  const [countdown, setCountdown]   = useState(REFRESH_INTERVAL_SECONDS)
  const countdownRef                = useRef(null)
  const fetchRef                    = useRef(null)

  const fetchRate = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      const res  = await fetch('/currency/rate?fuente=oficial', { headers: { Accept: 'application/json' } })
      const json = await res.json()
      if (json.ok && json.valor) {
        const newRate = parseFloat(json.valor)
        setRate(prev => {
          setPrevRate(prev)
          return newRate
        })
        setLastUpdated(new Date())
        setCountdown(REFRESH_INTERVAL_SECONDS)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // Fetch inicial si no hay tasa
  useEffect(() => {
    if (!initialRate) fetchRate(false)
  }, [fetchRate, initialRate])

  // Countdown ticker
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchRate(true)
          return REFRESH_INTERVAL_SECONDS
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(countdownRef.current)
  }, [fetchRate])

  const trend = prevRate === null ? null
    : rate > prevRate ? 'up'
    : rate < prevRate ? 'down'
    : 'flat'

  const trendColor = trend === 'up'   ? 'text-emerald-500'
    : trend === 'down' ? 'text-red-500'
    : 'text-slate-400'

  const TrendIcon = trend === 'up'   ? TrendingUp
    : trend === 'down' ? TrendingDown
    : Minus

  const minutes  = Math.floor(countdown / 60)
  const seconds  = countdown % 60
  const progress = ((REFRESH_INTERVAL_SECONDS - countdown) / REFRESH_INTERVAL_SECONDS) * 100

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden">
      {/* Progress bar en el tope */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-border">
        <div
          className="h-full bg-teal-500 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
            <span className="text-base">🇻🇪</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">USD / BS</p>
            <p className="text-[10px] text-muted-foreground">Promedio oficial</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error
            ? <WifiOff className="w-3.5 h-3.5 text-red-400" />
            : <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          }
          <button
            onClick={() => fetchRate(false)}
            disabled={loading}
            className="p-1 rounded-md hover:bg-muted transition-colors disabled:opacity-40"
            title="Actualizar ahora"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Rate */}
      <div className="flex items-end gap-2">
        {loading && !rate ? (
          <div className="h-8 w-28 bg-muted animate-pulse rounded" />
        ) : (
          <>
            <span className="text-2xl font-bold text-foreground tabular-nums">
              Bs. {rate ? rate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
            </span>
            {trend && (
              <div className={`flex items-center gap-0.5 pb-0.5 ${trendColor}`}>
                <TrendIcon className="w-4 h-4" />
                {prevRate && (
                  <span className="text-xs font-medium">
                    {Math.abs(rate - prevRate).toFixed(2)}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer: última actualización + countdown */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {lastUpdated
            ? `Actualizado: ${lastUpdated.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`
            : 'Sin datos aún'
          }
        </div>
        <span className="font-mono">
          {error ? '⚠ Error' : `Próx: ${minutes}:${String(seconds).padStart(2, '0')}`}
        </span>
      </div>
    </div>
  )
}
