import { RoomCurrency } from '@/types'
import { cn } from '@/lib/utils'

interface CurrencyDisplayProps {
  amount: number
  currency: RoomCurrency
  className?: string
  showSign?: boolean
}

const currencySymbols = {
  PKR: '₨',
  USD: '$',
  EUR: '€'
}

export function CurrencyDisplay({
  amount,
  currency,
  className,
  showSign = false
}: CurrencyDisplayProps) {
  const symbol = currencySymbols[currency]
  const formattedAmount = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  const sign = showSign && amount !== 0 ? (amount > 0 ? '+' : '-') : ''

  const colorClass = showSign
    ? amount > 0
      ? 'text-green-600'
      : amount < 0
        ? 'text-red-600'
        : 'text-muted-foreground'
    : ''

  return (
    <span className={cn('font-medium', colorClass, className)}>
      {sign}{symbol}{formattedAmount}
    </span>
  )
}