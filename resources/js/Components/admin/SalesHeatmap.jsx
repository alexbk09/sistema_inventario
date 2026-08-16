import { useMemo } from 'react'

const DAYS   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const HOURS  = Array.from({ length: 24 }, (_, i) => i)

function cellColor(value, max) {
  if (!value || max === 0) return 'bg-muted/40 dark:bg-muted/20'
  const ratio = value / max
  if (ratio < 0.15) return 'bg-blue-100 dark:bg-blue-900/30'
  if (ratio < 0.35) return 'bg-blue-300 dark:bg-blue-700/50'
  if (ratio < 0.55) return 'bg-blue-500 dark:bg-blue-600/70'
  if (ratio < 0.75) return 'bg-blue-600 dark:bg-blue-500'
  return 'bg-blue-700 dark:bg-blue-400'
}

function textColor(value, max) {
  if (!value || max === 0) return 'text-transparent'
  const ratio = value / max
  return ratio >= 0.55 ? 'text-white' : 'text-blue-900 dark:text-blue-200'
}

export default function SalesHeatmap({ heatmap = [] }) {
  const matrix = useMemo(() => {
    if (!Array.isArray(heatmap) || heatmap.length === 0) {
      return Array.from({ length: 7 }, () => Array(24).fill(0))
    }
    return heatmap
  }, [heatmap])

  const max = useMemo(() => Math.max(...matrix.flat(), 1), [matrix])

  const colTotals = useMemo(
    () => HOURS.map(h => matrix.reduce((s, row) => s + (row[h] ?? 0), 0)),
    [matrix]
  )
  const peakHour = colTotals.indexOf(Math.max(...colTotals))

  const rowTotals = useMemo(
    () => matrix.map(row => row.reduce((s, v) => s + (v ?? 0), 0)),
    [matrix]
  )
  const peakDay = rowTotals.indexOf(Math.max(...rowTotals))

  const totalSales = rowTotals.reduce((s, v) => s + v, 0)

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-foreground text-sm">Mapa de calor de ventas</h3>
          <p className="text-xs text-muted-foreground">
            Últimos 90 días · {totalSales} ventas ·{' '}
            {totalSales > 0 && (
              <>Pico: <strong>{DAYS[peakDay]}</strong> a las <strong>{peakHour}:00h</strong></>
            )}
            {totalSales === 0 && 'Sin datos'}
          </p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>Menos</span>
          {['bg-muted/40','bg-blue-100','bg-blue-300','bg-blue-500','bg-blue-700'].map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>Más</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: '600px' }}>
          {/* Hour labels */}
          <div className="flex mb-1 ml-9">
            {HOURS.map(h => (
              <div
                key={h}
                className="flex-1 text-center text-[9px] text-muted-foreground font-mono"
              >
                {h % 3 === 0 ? `${h}h` : ''}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {DAYS.map((day, dow) => (
            <div key={dow} className="flex items-center gap-0.5 mb-0.5">
              <div className="w-8 text-[10px] text-muted-foreground font-medium text-right pr-1.5 shrink-0">
                {day}
              </div>
              {HOURS.map(h => {
                const val = matrix[dow]?.[h] ?? 0
                return (
                  <div
                    key={h}
                    className={`flex-1 aspect-square rounded-sm flex items-center justify-center transition-all hover:ring-1 hover:ring-blue-400 cursor-default ${cellColor(val, max)}`}
                    title={`${day} ${h}:00h — ${val} venta${val !== 1 ? 's' : ''}`}
                  >
                    <span className={`text-[8px] font-bold leading-none ${textColor(val, max)}`}>
                      {val > 0 ? val : ''}
                    </span>
                  </div>
                )
              })}
              <div className="w-6 text-[9px] text-muted-foreground text-right pl-1 shrink-0">
                {rowTotals[dow] > 0 ? rowTotals[dow] : ''}
              </div>
            </div>
          ))}

          {/* Column totals */}
          <div className="flex mt-1 ml-9">
            {HOURS.map(h => (
              <div key={h} className="flex-1 text-center text-[9px] text-muted-foreground">
                {colTotals[h] > 0 ? colTotals[h] : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
