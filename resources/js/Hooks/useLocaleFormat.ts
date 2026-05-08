import { usePage } from '@inertiajs/react'

type FormatOptions = Intl.DateTimeFormatOptions | Intl.NumberFormatOptions

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function useLocaleFormat() {
  const page = usePage<any>()
  const locale = page.props?.locale ?? 'es'
  const localeConfig = page.props?.localeConfig ?? {
    regional: 'es-ES',
    numbering: 'es-VE',
  }

  const formatDate = (value: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) => {
    const date = toDate(value)
    if (!date) return ''
    return new Intl.DateTimeFormat(localeConfig.regional ?? locale, options ?? { dateStyle: 'medium' }).format(date)
  }

  const formatDateTime = (value: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) => {
    const date = toDate(value)
    if (!date) return ''
    return new Intl.DateTimeFormat(
      localeConfig.regional ?? locale,
      options ?? { dateStyle: 'medium', timeStyle: 'short' },
    ).format(date)
  }

  const formatNumber = (value: number | string | null | undefined, options?: Intl.NumberFormatOptions) => {
    const numeric = Number(value ?? 0)
    return new Intl.NumberFormat(localeConfig.numbering ?? localeConfig.regional ?? locale, options).format(numeric)
  }

  const formatCurrency = (
    value: number | string | null | undefined,
    currency = 'USD',
    options?: Intl.NumberFormatOptions,
  ) => {
    const numeric = Number(value ?? 0)
    return new Intl.NumberFormat(localeConfig.numbering ?? localeConfig.regional ?? locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      ...options,
    }).format(numeric)
  }

  return {
    locale,
    localeConfig,
    formatDate,
    formatDateTime,
    formatNumber,
    formatCurrency,
  }
}