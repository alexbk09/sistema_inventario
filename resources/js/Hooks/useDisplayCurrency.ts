import { useEffect, useState } from 'react'
import { usePage } from '@inertiajs/react'

interface CurrencySettings {
  base_currency?: string
  secondary_currency?: string | null
}

export function useDisplayCurrency() {
  const page = usePage<any>()
  const settingsCurrency: CurrencySettings = page.props?.settings?.currency ?? {}
  const base = settingsCurrency.base_currency || 'USD'
  const secondary = settingsCurrency.secondary_currency || null

  const getInitial = (): string => {
    if (typeof window === 'undefined') return base
    try {
      const saved = window.localStorage.getItem('displayCurrency')
      if (saved && (saved === base || saved === secondary)) {
        return saved
      }
    } catch {
      // ignore
    }
    return base
  }

  const [displayCurrency, setDisplayCurrencyState] = useState<string>(getInitial)

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
    const allowed = [base, secondary].filter(Boolean) as string[]
    if (!allowed.includes(value)) return
    setDisplayCurrencyState(value)
  }

  return {
    displayCurrency,
    setDisplayCurrency,
    baseCurrency: base,
    secondaryCurrency: secondary,
  }
}
