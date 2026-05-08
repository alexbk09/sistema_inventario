import { useEffect, useState } from 'react'
import { usePage } from '@inertiajs/react'

interface CurrencySettings {
  base_currency?: string
  secondary_currency?: string | null
  default_display_currency?: string
  available_currencies?: string[]
  supported_currencies?: Array<{
    code?: string
    enabled?: boolean
    visible_in_store?: boolean
  }>
}

export function useDisplayCurrency() {
  const page = usePage<any>()
  const settingsCurrency: CurrencySettings = page.props?.settings?.currency ?? {}
  const base = settingsCurrency.base_currency || 'USD'
  const secondary = settingsCurrency.secondary_currency || null
  const derivedAvailable = Array.isArray(settingsCurrency.supported_currencies)
    ? settingsCurrency.supported_currencies
        .filter((currency) => currency?.enabled && currency?.visible_in_store !== false && typeof currency?.code === 'string')
        .map((currency) => String(currency.code))
    : []
  const available = derivedAvailable.length > 0
    ? derivedAvailable
    : [base, secondary, ...(Array.isArray(settingsCurrency.available_currencies) ? settingsCurrency.available_currencies : [])].filter(Boolean) as string[]
  const uniqueAvailable = [...new Set(available)]
  const normalizedSecondary = secondary && uniqueAvailable.includes(secondary)
    ? secondary
    : null
  const defaultDisplay = uniqueAvailable.includes(settingsCurrency.default_display_currency || '')
    ? String(settingsCurrency.default_display_currency)
    : base

  const getInitial = (): string => {
    if (typeof window === 'undefined') return defaultDisplay
    try {
      const saved = window.localStorage.getItem('displayCurrency')
      if (saved && uniqueAvailable.includes(saved)) {
        return saved
      }
    } catch {
      // ignore
    }
    return defaultDisplay
  }

  const [displayCurrency, setDisplayCurrencyState] = useState<string>(getInitial)

  useEffect(() => {
    if (!uniqueAvailable.includes(displayCurrency)) {
      setDisplayCurrencyState(defaultDisplay)
    }
  }, [defaultDisplay, displayCurrency, uniqueAvailable])

  // Sincronizar con localStorage y emitir evento global
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('displayCurrency', displayCurrency)
      window.dispatchEvent(
        new CustomEvent('displayCurrency:changed', { detail: displayCurrency }),
      )
    } catch {
      // ignore
    }
  }, [displayCurrency])

  // Escuchar cambios desde otros componentes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handler = (e: Event) => {
      const ce = e as CustomEvent
      const value = ce.detail
      if (typeof value === 'string') {
        setDisplayCurrencyState(value)
      }
    }

    window.addEventListener('displayCurrency:changed', handler as EventListener)
    return () => {
      window.removeEventListener('displayCurrency:changed', handler as EventListener)
    }
  }, [])

  const setDisplayCurrency = (value: string) => {
    if (!uniqueAvailable.includes(value)) return
    setDisplayCurrencyState(value)
  }

  return {
    displayCurrency,
    setDisplayCurrency,
    baseCurrency: base,
    secondaryCurrency: normalizedSecondary,
    availableCurrencies: uniqueAvailable,
  }
}
