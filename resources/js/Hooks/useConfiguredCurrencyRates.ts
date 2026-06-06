import { useEffect, useMemo, useState } from 'react'
import { usePage } from '@inertiajs/react'
import { useDisplayCurrency } from '@/Hooks/useDisplayCurrency'
import { useLocaleFormat } from '@/Hooks/useLocaleFormat'

interface SupportedCurrency {
  code?: string
  enabled?: boolean
  resolved_rate?: number | null
  manual_rate?: number | null
  last_rate?: number | null
  rate_mode?: string | null
  last_synced_at?: string | null
}

export function useConfiguredCurrencyRates() {
  const page = usePage<any>()
  const settingsCurrency = page.props?.settings?.currency ?? {}
  const supportedCurrencies: SupportedCurrency[] = Array.isArray(settingsCurrency.supported_currencies)
    ? settingsCurrency.supported_currencies
    : []
  const { displayCurrency, baseCurrency, secondaryCurrency, availableCurrencies } = useDisplayCurrency()
  const { formatCurrency } = useLocaleFormat()
  const [remoteRates, setRemoteRates] = useState<Record<string, number>>({ [baseCurrency]: 1 })

  const hasFreshRate = (currency: SupportedCurrency): boolean => {
    if (!currency || !currency.last_rate || !currency.last_synced_at) {
      return false
    }

    const lastSynced = Date.parse(currency.last_synced_at)
    if (Number.isNaN(lastSynced)) {
      return false
    }

    const FOUR_HOURS_MS = 4 * 60 * 60 * 1000
    return Date.now() - lastSynced <= FOUR_HOURS_MS
  }

  const shouldFetchRemoteRates = useMemo(() => {
    if (baseCurrency === displayCurrency) {
      return false
    }

    return supportedCurrencies.some((currency) => {
      if (String(currency.code) === baseCurrency) {
        return false
      }
      if (!currency.enabled) {
        return false
      }
      if ((String(currency.rate_mode ?? 'auto')) !== 'auto') {
        return false
      }
      return !hasFreshRate(currency)
    })
  }, [baseCurrency, displayCurrency, supportedCurrencies])

  useEffect(() => {
    if (!shouldFetchRemoteRates) {
      setRemoteRates({ [baseCurrency]: 1 })
      return
    }

    let active = true

    fetch('/api/currency/promedios', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : Promise.reject(response)))
      .then((payload) => {
        if (!active) return
        const nextRates = payload?.data?.rates
        if (nextRates && typeof nextRates === 'object') {
          setRemoteRates({ [baseCurrency]: 1, ...nextRates })
        }
      })
      .catch(() => {
        if (!active) return
        setRemoteRates((current) => ({ [baseCurrency]: 1, ...current }))
      })

    return () => {
      active = false
    }
  }, [baseCurrency, shouldFetchRemoteRates])

  const fallbackRates = useMemo(() => {
    const entries = supportedCurrencies
      .filter((currency) => typeof currency?.code === 'string')
      .map((currency) => {
        const code = String(currency.code)
        const fallbackRate = currency.resolved_rate ?? currency.manual_rate ?? currency.last_rate ?? null
        return [code, typeof fallbackRate === 'number' ? fallbackRate : null] as const
      })

    return Object.fromEntries(entries)
  }, [supportedCurrencies])

  const ratesByCode = useMemo(
    () => ({
      [baseCurrency]: 1,
      ...fallbackRates,
      ...remoteRates,
    }),
    [baseCurrency, fallbackRates, remoteRates],
  )

  const convertFromUsd = (amount: number, currency = displayCurrency) => {
    const numericAmount = Number(amount || 0)
    if (currency === baseCurrency) {
      return numericAmount
    }

    const rate = Number(ratesByCode[currency] ?? 0)
    if (!rate) {
      return numericAmount
    }

    return numericAmount * rate
  }

  const hasRateForCurrency = (currency?: string | null) => {
    if (!currency) return false
    if (currency === baseCurrency) return true
    return Number(ratesByCode[currency] ?? 0) > 0
  }

  const formatPriceFromUsd = (amount: number, currency = displayCurrency) => {
    const targetCurrency = currency || baseCurrency
    const converted = convertFromUsd(amount, targetCurrency)
    return formatCurrency(converted, targetCurrency)
  }

  const comparisonCurrency = useMemo(() => {
    if (secondaryCurrency && secondaryCurrency !== displayCurrency && hasRateForCurrency(secondaryCurrency)) {
      return secondaryCurrency
    }

    if (displayCurrency !== baseCurrency) {
      return baseCurrency
    }

    const alternative = availableCurrencies.find((currency: string) => currency !== displayCurrency && hasRateForCurrency(currency))
    return alternative ?? null
  }, [availableCurrencies, baseCurrency, displayCurrency, secondaryCurrency, ratesByCode])

  return {
    displayCurrency,
    baseCurrency,
    secondaryCurrency,
    availableCurrencies,
    comparisonCurrency,
    ratesByCode,
    convertFromUsd,
    formatPriceFromUsd,
    hasRateForCurrency,
  }
}
