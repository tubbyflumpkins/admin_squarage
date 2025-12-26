export interface ExpenseSignContext {
  paidBy: string
  category: string
  name: string
  vendor?: string
}

const incomeNamePattern = /(interest deposit|refund|account verification credit)/i

export const isIncomeEntry = (context: ExpenseSignContext) => {
  const paidBy = context.paidBy?.trim()
  if (paidBy && paidBy.toLowerCase() !== 'squarage') {
    return true
  }

  if (context.category?.toLowerCase() === 'revenue') {
    return true
  }

  return incomeNamePattern.test(context.name || '')
}

export const applyCostSign = (rawCents: number, context: ExpenseSignContext) => {
  const normalized = Math.abs(rawCents)
  return isIncomeEntry(context) ? normalized : -normalized
}
