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

  useEffect(() => {
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
  }, [baseCurrency])

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
    comparisonCurrency,
    ratesByCode,
    convertFromUsd,
    formatPriceFromUsd,
    hasRateForCurrency,
  }
}