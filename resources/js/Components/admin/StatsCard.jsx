import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Mini sparkline SVG inline — muestra tendencia de últimos valores
 */
function Sparkline({ data = [], color = 'currentColor', height = 32 }) {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 80;
    const h = height;
    const pad = 2;
    const points = data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2);
        const y = h - pad - ((v - min) / range) * (h - pad * 2);
        return `${x},${y}`;
    });
    const pathD = `M ${points.join(' L ')}`;
    const areaD = `M ${points[0]} L ${points.join(' L ')} L ${points[points.length - 1].split(',')[0]},${h} L ${points[0].split(',')[0]},${h} Z`;

    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="overflow-visible">
            <defs>
                <linearGradient id={`grad-${color.replace(/[^a-z]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#grad-${color.replace(/[^a-z]/gi, '')})`} />
            <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/**
 * StatsCard — Tarjeta de KPI con sparkline y tendencia
 *
 * @param {string}   label        - Nombre del KPI
 * @param {string}   value        - Valor principal formateado
 * @param {string}   subvalue     - Valor secundario (ej: en otra moneda)
 * @param {number}   trend        - Porcentaje de cambio (+/-)
 * @param {string}   trendLabel   - Label de tendencia (ej: "vs mes anterior")
 * @param {Array}    sparkData    - Array de números para sparkline
 * @param {node}     icon         - Ícono lucide
 * @param {string}   iconColor    - Clase de color para el ícono (tailwind)
 * @param {string}   iconBg       - Clase de fondo para el ícono (tailwind)
 * @param {string}   sparkColor   - Color del sparkline (hex/rgb)
 */
export default function StatsCard({
    label,
    value,
    subvalue,
    trend,
    trendLabel,
    sparkData,
    icon: Icon,
    iconColor = 'text-primary',
    iconBg = 'bg-primary/10',
    sparkColor = '#4F46E5',
}) {
    const hasTrend = trend !== undefined && trend !== null;
    const positive = trend > 0;
    const neutral = trend === 0;

    return (
        <div className="relative bg-card border border-border rounded-xl p-4 flex flex-col gap-3 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                    {Icon && (
                        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-4 h-4 ${iconColor}`} />
                        </div>
                    )}
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                        {label}
                    </span>
                </div>
                {sparkData && sparkData.length > 1 && (
                    <div className="shrink-0 opacity-70">
                        <Sparkline data={sparkData} color={sparkColor} height={28} />
                    </div>
                )}
            </div>

            <div className="flex items-end justify-between gap-2">
                <div>
                    <div className="text-2xl font-bold text-foreground tracking-tight leading-none">
                        {value}
                    </div>
                    {subvalue && (
                        <div className="text-xs text-muted-foreground mt-1">{subvalue}</div>
                    )}
                </div>

                {hasTrend && (
                    <div
                        className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full shrink-0
                            ${positive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : neutral ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                            : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}
                    >
                        {positive ? <TrendingUp className="w-3 h-3" />
                            : neutral ? <Minus className="w-3 h-3" />
                            : <TrendingDown className="w-3 h-3" />}
                        <span>{positive ? '+' : ''}{trend?.toFixed(1)}%</span>
                    </div>
                )}
            </div>

            {trendLabel && (
                <p className="text-[11px] text-muted-foreground -mt-1">{trendLabel}</p>
            )}
        </div>
    );
}
