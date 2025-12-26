'use client'

import { useEffect, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { format } from 'date-fns'
import useExpenseStore from '@/lib/expenseStore'

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return '$0'
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

const renderPercentLabel = (props: { name?: string; percent?: number }) => {
  const safePercent = Number.isFinite(props.percent) ? (props.percent as number) : 0
  return `${props.name ?? ''} ${(safePercent * 100).toFixed(1)}%`
}

const inflowSources = new Set(['dylan', 'thomas', 'revenue'])

export default function ExpenseAnalysis() {
  const { expenses, categories, paidByOptions, hasLoadedFromServer, isLoading, loadFromServer } = useExpenseStore()

  useEffect(() => {
    if (!hasLoadedFromServer && !isLoading) {
      loadFromServer().catch(() => undefined)
    }
  }, [hasLoadedFromServer, isLoading, loadFromServer])

  const expensesOnly = useMemo(
    () => expenses.filter((expense) => expense.costCents < 0),
    [expenses]
  )

  const timeSeries = useMemo(() => {
    const buckets = new Map<string, number>()
    expensesOnly.forEach((expense) => {
      const date = expense.date ? new Date(expense.date) : new Date(expense.createdAt)
      const key = format(date, 'yyyy-MM')
      const total = buckets.get(key) ?? 0
      buckets.set(key, total + Math.abs(expense.costCents))
    })

    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, total]) => ({
        label: format(new Date(`${key}-01T12:00:00`), 'MMM yyyy'),
        total: Math.round(total / 100),
      }))
  }, [expensesOnly])

  const inflowBySource = useMemo(() => {
    const totals = new Map<string, number>()
    expenses.forEach((expense) => {
      if (expense.costCents <= 0) return
      const paidBy = expense.paidBy?.trim()
      if (!paidBy) return
      if (!inflowSources.has(paidBy.toLowerCase())) return
      totals.set(paidBy, (totals.get(paidBy) ?? 0) + expense.costCents)
    })

    return Array.from(totals.entries()).map(([name, total]) => {
      const option = paidByOptions.find(item => item.name === name)
      return {
        name,
        value: total,
        color: option?.color || '#4A9B4E',
      }
    })
  }, [expenses, paidByOptions])

  const expensesByCategory = useMemo(() => {
    const totals = new Map<string, number>()
    expensesOnly.forEach((expense) => {
      const category = expense.category?.trim()
      if (!category) return
      const key = category.toLowerCase()
      if (key === 'transfer' || key === 'revenue') return
      totals.set(category, (totals.get(category) ?? 0) + Math.abs(expense.costCents))
    })

    return Array.from(totals.entries()).map(([name, total]) => {
      const option = categories.find(item => item.name === name)
      return {
        name,
        value: total,
        color: option?.color || '#F7901E',
      }
    })
  }, [expensesOnly, categories])

  if (!hasLoadedFromServer || isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-white/70">
        Loading expense analysis...
      </div>
    )
  }

  if (expensesOnly.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-white/70">
        No expense data yet.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/80 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-squarage-black mb-4">Expenses Over Time</h3>
        {timeSeries.length === 0 ? (
          <div className="text-sm text-gray-500">No dated expenses to chart.</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d8" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="total" stroke="#4A9B4E" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-squarage-black mb-4">Money In by Source</h3>
          {inflowBySource.length === 0 ? (
            <div className="text-sm text-gray-500">No inflow data yet.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inflowBySource}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label={renderPercentLabel}
                    labelLine={false}
                  >
                    {inflowBySource.map(entry => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(Math.round(value / 100))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white/80 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-squarage-black mb-4">Expenses by Category</h3>
          {expensesByCategory.length === 0 ? (
            <div className="text-sm text-gray-500">No category expense data yet.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label={renderPercentLabel}
                    labelLine={false}
                  >
                    {expensesByCategory.map(entry => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(Math.round(value / 100))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
