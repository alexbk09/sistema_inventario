import { Link } from '@inertiajs/react'
import { ChevronRight, Home } from 'lucide-react'

export default function Breadcrumb({ items = [] }) {
  if (!items.length) return null

  return (
    <nav aria-label="breadcrumb" className="py-3 px-4 md:px-0">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <li className="flex items-center gap-1">
          <Link
            href={route('home')}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only">Inicio</span>
          </Link>
        </li>

        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={i} className="flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />
              {isLast || !item.href ? (
                <span className={`${isLast ? 'text-foreground font-medium' : ''} truncate max-w-[200px]`}>
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors truncate max-w-[200px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
