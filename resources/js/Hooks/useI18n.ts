import { usePage } from '@inertiajs/react'

function get(obj: any, path: string, fallback?: string): string {
  if (!obj) return fallback ?? path
  const parts = path.split('.')
  let current: any = obj
  for (const key of parts) {
    if (current && Object.prototype.hasOwnProperty.call(current, key)) {
      current = current[key]
    } else {
      return fallback ?? path
    }
  }
  if (typeof current === 'string') return current
  return fallback ?? path
}

export function useI18n() {
  const page = usePage<any>()
  const locale: string = page.props?.locale ?? 'es'
  const translations = (page.props?.translations?.app ?? {}) as Record<string, any>

  const t = (key: string, fallback?: string): string => {
    return get(translations, key, fallback)
  }

  return { t, locale }
}
