import { AdvanceBillCalculation, AdvanceBillSuggestedTransfer } from '@/types'

const MIN_SETTLEMENT_PAISA = 100

interface BalanceParticipant {
  userId: string
  amount: number
}

export function deriveSuggestedTransfersFromCalculations(
  calculations: AdvanceBillCalculation[],
  billId?: string
): AdvanceBillSuggestedTransfer[] {
  if (!calculations || calculations.length === 0) {
    return []
  }

  const calculationMap = new Map(calculations.map(calc => [calc.user_id, calc]))
  const debtors: BalanceParticipant[] = []
  const creditors: BalanceParticipant[] = []

  for (const calc of calculations) {
    const remaining = Math.round(Number(calc.remaining_paisa) || 0)

    if (Math.abs(remaining) <= MIN_SETTLEMENT_PAISA) {
      continue
    }

    if (remaining < 0) {
      debtors.push({ userId: calc.user_id, amount: Math.abs(remaining) })
    } else if (remaining > 0) {
      creditors.push({ userId: calc.user_id, amount: remaining })
    }
  }

  if (debtors.length === 0 || creditors.length === 0) {
    return []
  }

  debtors.sort((a, b) => b.amount - a.amount || a.userId.localeCompare(b.userId))
  creditors.sort((a, b) => b.amount - a.amount || a.userId.localeCompare(b.userId))

  const transfers: AdvanceBillSuggestedTransfer[] = []
  let debtorIndex = 0
  let creditorIndex = 0

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex]
    const creditor = creditors[creditorIndex]

    const transferAmount = Math.min(debtor.amount, creditor.amount)

    if (transferAmount > MIN_SETTLEMENT_PAISA) {
      const fromCalc = calculationMap.get(debtor.userId)
      const toCalc = calculationMap.get(creditor.userId)

      transfers.push({
        bill_id: billId,
        from_user_id: debtor.userId,
        to_user_id: creditor.userId,
        amount_paisa: transferAmount,
        from_profile: fromCalc?.profile,
        to_profile: toCalc?.profile
      })
    }

    debtor.amount -= transferAmount
    creditor.amount -= transferAmount

    if (debtor.amount <= MIN_SETTLEMENT_PAISA) {
      debtorIndex += 1
    }

    if (creditor.amount <= MIN_SETTLEMENT_PAISA) {
      creditorIndex += 1
    }
  }

  return transfers
}
