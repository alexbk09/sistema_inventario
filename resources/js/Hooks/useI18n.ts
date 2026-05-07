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

function interpolate(template: string, replacements?: Record<string, unknown>): string {
  if (!replacements) return template

  return Object.entries(replacements).reduce((result, [key, value]) => {
    const normalized = String(value ?? '')
    return result
      .replaceAll(`{${key}}`, normalized)
      .replaceAll(`:${key}`, normalized)
  }, template)
}

function choosePluralVariant(template: string, replacements?: Record<string, unknown>): string {
  if (!template.includes('|')) return template

  const count = Number(replacements?.count)
  const [singular, plural] = template.split('|')

  if (Number.isNaN(count)) {
    return singular
  }

  return count === 1 ? singular : (plural ?? singular)
}

export function useI18n() {
  const page = usePage<any>()
  const locale: string = page.props?.locale ?? 'es'
  const translations = (page.props?.translations?.app ?? {}) as Record<string, any>

  const t = (key: string, fallback?: string, replacements?: Record<string, unknown>): string => {
    const raw = get(translations, key, fallback)
    const withPlural = choosePluralVariant(raw, replacements)
    return interpolate(withPlural, replacements)
  }

  return { t, locale }
}
