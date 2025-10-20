'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  type PieLabelRenderProps,
} from 'recharts'
import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isValid,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import useSalesStore from '@/lib/salesStore'
import type { Product, Sale } from '@/lib/salesTypes'
import { CalendarDays, CircleDollarSign, Layers, TrendingUp } from 'lucide-react'

type TimePreset =
  | 'all_time'
  | 'current_month'
  | 'three_months'
  | 'six_months'
  | 'twelve_months'

type PresetOption = {
  id: TimePreset
  label: string
}

type Granularity = 'day' | 'week' | 'month'

const PRESETS: PresetOption[] = [
  { id: 'all_time', label: 'All Time' },
  { id: 'current_month', label: 'This Month' },
  { id: 'three_months', label: '3 Months' },
  { id: 'six_months', label: '6 Months' },
  { id: 'twelve_months', label: '12 Months' },
]

const formatCurrency = (valueInCents: number) =>
  `$${(valueInCents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`

const toDate = (value: Sale['placementDate']) => {
  if (value instanceof Date) {
    return value
  }
  const parsed = new Date(value)
  return isValid(parsed) ? parsed : new Date()
}

const getSaleRevenue = (sale: Sale, products: Product[]) => {
  if (typeof sale.revenue === 'number' && sale.revenue >= 0) {
    return sale.revenue
  }
  if (sale.productId) {
    const product = products.find(p => p.id === sale.productId)
    if (product && typeof product.revenue === 'number') {
      return product.revenue
    }
  }
  return 0
}

const getPresetRange = (
  preset: TimePreset,
  boundaries?: { start: Date; end: Date }
) => {
  const today = new Date()
  switch (preset) {
    case 'all_time': {
      if (boundaries) {
        return {
          start: startOfDay(boundaries.start),
          end: endOfDay(boundaries.end),
        }
      }
      return {
        start: startOfDay(startOfMonth(today)),
        end: endOfDay(today),
      }
    }
    case 'current_month': {
      return {
        start: startOfDay(startOfMonth(today)),
        end: endOfDay(endOfMonth(today)),
      }
    }
    case 'three_months': {
      return {
        start: startOfDay(startOfMonth(subMonths(today, 2))),
        end: endOfDay(today),
      }
    }
    case 'six_months': {
      return {
        start: startOfDay(startOfMonth(subMonths(today, 5))),
        end: endOfDay(today),
      }
    }
    case 'twelve_months': {
      return {
        start: startOfDay(startOfMonth(subMonths(today, 11))),
        end: endOfDay(today),
      }
    }
    default: {
      return {
        start: startOfDay(startOfMonth(today)),
        end: endOfDay(today),
      }
    }
  }
}

const getGranularity = (
  preset: TimePreset | 'custom',
  start: Date,
  end: Date
): Granularity => {
  if (preset === 'current_month') return 'day'
  if (preset === 'three_months' || preset === 'six_months') return 'week'
  if (preset === 'twelve_months' || preset === 'all_time') return 'month'

  const spanInDays = Math.max(differenceInCalendarDays(end, start), 1)
  if (spanInDays <= 31) return 'day'
  if (spanInDays <= 210) return 'week'
  return 'month'
}

const getBucketStart = (date: Date, granularity: Granularity) => {
  switch (granularity) {
    case 'week':
      return startOfWeek(date, { weekStartsOn: 0 })
    case 'month':
      return startOfMonth(date)
    case 'day':
    default:
      return startOfDay(date)
  }
}

const getNextBucket = (date: Date, granularity: Granularity) => {
  switch (granularity) {
    case 'week':
      return addWeeks(date, 1)
    case 'month':
      return addMonths(date, 1)
    case 'day':
    default:
      return addDays(date, 1)
  }
}

const formatBucketLabel = (date: Date, granularity: Granularity) => {
  switch (granularity) {
    case 'day':
      return format(date, 'MMM d')
    case 'week':
      return `Week of ${format(date, 'MMM d')}`
    case 'month':
    default:
      return format(date, 'MMM yyyy')
  }
}

interface TimelinePoint {
  label: string
  date: Date
  revenue: number
  salesCount: number
}

const buildTimeline = (
  sales: Sale[],
  products: Product[],
  start: Date,
  end: Date,
  granularity: Granularity
) => {
  const relevantSales = sales.filter(sale => {
    const placementDate = toDate(sale.placementDate)
    return placementDate >= start && placementDate <= end && sale.status !== 'dead'
  })

  const buckets = new Map<number, TimelinePoint>()

  relevantSales.forEach(sale => {
    const placementDate = toDate(sale.placementDate)
    const bucketStart = getBucketStart(placementDate, granularity)
    const bucketKey = bucketStart.getTime()
    const revenue = getSaleRevenue(sale, products) / 100

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, {
        label: formatBucketLabel(bucketStart, granularity),
        date: bucketStart,
        revenue,
        salesCount: 1,
      })
    } else {
      const bucket = buckets.get(bucketKey)!
      bucket.revenue += revenue
      bucket.salesCount += 1
    }
  })

  const timeline: TimelinePoint[] = []

  for (
    let cursor = getBucketStart(start, granularity);
    cursor <= end;
    cursor = getNextBucket(cursor, granularity)
  ) {
    const bucketKey = cursor.getTime()
    if (buckets.has(bucketKey)) {
      timeline.push(buckets.get(bucketKey)!)
    } else {
      timeline.push({
        label: formatBucketLabel(cursor, granularity),
        date: cursor,
        revenue: 0,
        salesCount: 0,
      })
    }
  }

  return timeline.sort((a, b) => a.date.getTime() - b.date.getTime())
}

const PIE_COLORS = [
  '#0ea5e9',
  '#f97316',
  '#22c55e',
  '#6366f1',
  '#ef4444',
  '#14b8a6',
  '#a855f7',
  '#facc15',
  '#f43f5e',
  '#0284c7',
]

const RADIAN = Math.PI / 180

export default function SalesAnalysis() {
  const {
    sales,
    products,
    channels,
    isLoading,
    hasLoadedFromServer,
    loadFromServer,
  } = useSalesStore()

  const initialRange = getPresetRange('current_month')
  const [selectedPreset, setSelectedPreset] = useState<TimePreset | 'custom'>(
    'current_month'
  )
  const [startDate, setStartDate] = useState<Date>(initialRange.start)
  const [endDate, setEndDate] = useState<Date>(initialRange.end)

  useEffect(() => {
    if (!hasLoadedFromServer) {
      loadFromServer()
    }
  }, [hasLoadedFromServer, loadFromServer])

  const dateBoundaries = useMemo(() => {
    const relevantSales = sales.filter(sale => sale.status !== 'dead')
    if (relevantSales.length === 0) return null

    let earliest = toDate(relevantSales[0].placementDate)
    let latest = earliest

    relevantSales.forEach(sale => {
      const placementDate = toDate(sale.placementDate)
      if (placementDate < earliest) {
        earliest = placementDate
      }
      if (placementDate > latest) {
        latest = placementDate
      }
    })

    return {
      start: startOfDay(earliest),
      end: endOfDay(latest),
    }
  }, [sales])

  useEffect(() => {
    if (selectedPreset === 'custom') return
    if (selectedPreset === 'all_time' && !dateBoundaries) return

    const range = getPresetRange(selectedPreset, dateBoundaries ?? undefined)
    setStartDate(range.start)
    setEndDate(range.end)
  }, [selectedPreset, dateBoundaries])

  const onPresetChange = (preset: TimePreset) => {
    setSelectedPreset(preset)
  }

  const onStartDateChange = (value: string) => {
    const newDate = new Date(value)
    if (isValid(newDate)) {
      setStartDate(startOfDay(newDate))
      if (isAfter(startOfDay(newDate), endDate)) {
        setEndDate(endOfDay(newDate))
      }
      setSelectedPreset('custom')
    }
  }

  const onEndDateChange = (value: string) => {
    const newDate = new Date(value)
    if (isValid(newDate)) {
      setEndDate(endOfDay(newDate))
      if (isBefore(endOfDay(newDate), startDate)) {
        setStartDate(startOfDay(newDate))
      }
      setSelectedPreset('custom')
    }
  }

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const placementDate = toDate(sale.placementDate)
      return placementDate >= startDate && placementDate <= endDate
    })
  }, [sales, startDate, endDate])

  const analysis = useMemo(() => {
    const validSales = filteredSales.filter(sale => sale.status !== 'dead')
    const totalRevenueCents = validSales.reduce(
      (sum, sale) => sum + getSaleRevenue(sale, products),
      0
    )

    return {
      totalSales: validSales.length,
      totalRevenue: totalRevenueCents,
      averageSale:
        validSales.length > 0 ? totalRevenueCents / validSales.length : 0,
    }
  }, [filteredSales, products])

  const granularity = useMemo(
    () => getGranularity(selectedPreset, startDate, endDate),
    [selectedPreset, startDate, endDate]
  )

  const timelineData = useMemo(() => {
    if (!hasLoadedFromServer) return []
    return buildTimeline(sales, products, startDate, endDate, granularity).map(
      point => ({
        ...point,
        revenue: Number(point.revenue.toFixed(2)),
      })
    )
  }, [sales, products, startDate, endDate, granularity, hasLoadedFromServer])

  const revenueByChannel = useMemo(() => {
    if (!hasLoadedFromServer) return []

    const totals = new Map<string, { revenueCents: number; salesCount: number }>()
    filteredSales.forEach(sale => {
      if (sale.status === 'dead') return
      const revenueCents = getSaleRevenue(sale, products)
      if (revenueCents <= 0) return
      const key = sale.channelId ?? 'unassigned'
      const current = totals.get(key) ?? { revenueCents: 0, salesCount: 0 }
      current.revenueCents += revenueCents
      current.salesCount += 1
      totals.set(key, current)
    })

    return Array.from(totals.entries())
      .map(([channelId, aggregate]) => ({
        channelId,
        name:
          channelId === 'unassigned'
            ? 'Unassigned'
            : channels.find(channel => channel.id === channelId)?.name ?? 'Unknown',
        revenueCents: aggregate.revenueCents,
        revenue: Number((aggregate.revenueCents / 100).toFixed(2)),
        salesCount: aggregate.salesCount,
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [filteredSales, products, channels, hasLoadedFromServer])

  type ChannelTooltipPayload = {
    name: string
    revenueCents: number
    revenue: number
    salesCount: number
  }

  const renderRevenueTooltip = useCallback(
    (tooltip: { active?: boolean; payload?: { payload?: ChannelTooltipPayload }[] }) => {
      const { active, payload } = tooltip
      if (!active || !payload || payload.length === 0) return null
      const dataPoint = payload[0]?.payload as ChannelTooltipPayload

      return (
        <div className="rounded-xl border border-white/10 bg-slate-900/90 px-4 py-3 text-white shadow-xl backdrop-blur-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Channel
          </div>
          <div className="text-sm font-semibold">{dataPoint.name}</div>
          <div className="mt-2 text-xs text-white/70">Revenue</div>
          <div className="text-sm font-semibold">
            {formatCurrency(dataPoint.revenueCents)}
          </div>
          <div className="mt-2 text-xs text-white/70">Sales</div>
          <div className="text-sm font-semibold">{dataPoint.salesCount}</div>
        </div>
      )
    },
    []
  )

  const renderRevenueLabel = useCallback(
    ({
      cx,
      cy,
      midAngle = 0,
      innerRadius = 0,
      outerRadius = 0,
      payload,
    }: PieLabelRenderProps) => {
      if (typeof cx !== 'number' || typeof cy !== 'number') return null

      const safeOuter = typeof outerRadius === 'number' ? outerRadius : 0
      const safeMid = typeof midAngle === 'number' ? midAngle : 0
      const radius = safeOuter + 18
      const x = cx + radius * Math.cos(-safeMid * RADIAN)
      const y = cy + radius * Math.sin(-safeMid * RADIAN)
      const textAnchor = x > cx ? 'start' : 'end'

      const channelName = (payload as { name?: string })?.name ?? ''
      const revenueCents = (payload as { revenueCents?: number }).revenueCents

      if (!channelName || typeof revenueCents !== 'number') return null

      return (
        <text
          x={x}
          y={y}
          fill="#0f172a"
          textAnchor={textAnchor}
          dominantBaseline="central"
          className="text-xs"
        >
          <tspan x={x} dy="-0.35em" fontWeight="600">
            {channelName}
          </tspan>
          <tspan x={x} dy="1.2em" fill="rgba(15,23,42,0.7)">
            {formatCurrency(revenueCents)}
          </tspan>
        </text>
      )
    },
    []
  )

  const renderSalesLabel = useCallback(
    ({
      cx,
      cy,
      midAngle = 0,
      innerRadius = 0,
      outerRadius = 0,
      payload,
    }: PieLabelRenderProps) => {
      if (typeof cx !== 'number' || typeof cy !== 'number') return null

      const safeOuter = typeof outerRadius === 'number' ? outerRadius : 0
      const safeMid = typeof midAngle === 'number' ? midAngle : 0
      const radius = safeOuter + 18
      const x = cx + radius * Math.cos(-safeMid * RADIAN)
      const y = cy + radius * Math.sin(-safeMid * RADIAN)
      const textAnchor = x > cx ? 'start' : 'end'

      const channelName = (payload as { name?: string })?.name ?? ''
      const salesCount = (payload as { salesCount?: number }).salesCount

      if (!channelName || typeof salesCount !== 'number') return null

      return (
        <text
          x={x}
          y={y}
          fill="#0f172a"
          textAnchor={textAnchor}
          dominantBaseline="central"
          className="text-xs"
        >
          <tspan x={x} dy="-0.35em" fontWeight="600">
            {channelName}
          </tspan>
          <tspan x={x} dy="1.2em" fill="rgba(15,23,42,0.7)">
            {salesCount} sale{salesCount === 1 ? '' : 's'}
          </tspan>
        </text>
      )
    },
    []
  )

  const renderCountTooltip = useCallback(
    (tooltip: { active?: boolean; payload?: { payload?: ChannelTooltipPayload }[] }) => {
      const { active, payload } = tooltip
      if (!active || !payload || payload.length === 0) return null
      const dataPoint = payload[0]?.payload as ChannelTooltipPayload

      return (
        <div className="rounded-xl border border-white/10 bg-slate-900/90 px-4 py-3 text-white shadow-xl backdrop-blur-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Channel
          </div>
          <div className="text-sm font-semibold">{dataPoint.name}</div>
          <div className="mt-2 text-xs text-white/70">Sales</div>
          <div className="text-sm font-semibold">{dataPoint.salesCount}</div>
          <div className="mt-2 text-xs text-white/70">Revenue</div>
          <div className="text-sm font-semibold">
            {formatCurrency(dataPoint.revenueCents)}
          </div>
        </div>
      )
    },
    []
  )

  const isBusy = isLoading && !hasLoadedFromServer

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map(option => {
            const isActive = selectedPreset === option.id
            return (
              <button
                key={option.id}
                onClick={() => onPresetChange(option.id)}
                className={`px-4 py-2 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? 'backdrop-blur-md bg-white/85 border-white/70 text-squarage-black shadow-lg'
                    : 'backdrop-blur-md bg-white/50 border-white/60 text-squarage-black/80 hover:bg-white/70'
                }`}
              >
                <div className="text-sm font-semibold">{option.label}</div>
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-3 bg-white/60 border border-white/70 rounded-xl px-4 py-2">
          <CalendarDays size={18} className="text-squarage-black/70" />
          <label className="flex items-center gap-2 text-sm text-squarage-black/80">
            Start
            <input
              type="date"
              value={format(startDate, 'yyyy-MM-dd')}
              onChange={event => onStartDateChange(event.target.value)}
              className="rounded-lg bg-white text-squarage-black px-2 py-1 text-sm focus:outline-none"
            />
          </label>
          <span className="text-squarage-black/50">—</span>
          <label className="flex items-center gap-2 text-sm text-squarage-black/80">
            End
            <input
              type="date"
              value={format(endDate, 'yyyy-MM-dd')}
              onChange={event => onEndDateChange(event.target.value)}
              className="rounded-lg bg-white text-squarage-black px-2 py-1 text-sm focus:outline-none"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="backdrop-blur-md bg-white/65 border border-white/70 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-squarage-black/70 text-sm">
            Total Sales
            <Layers size={18} className="text-squarage-black/80" />
          </div>
          <div className="text-3xl font-semibold text-squarage-black">
            {analysis.totalSales}
          </div>
        </div>
        <div className="backdrop-blur-md bg-white/65 border border-white/70 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-squarage-black/70 text-sm">
            Total Revenue
            <CircleDollarSign size={18} className="text-squarage-black/80" />
          </div>
          <div className="text-3xl font-semibold text-squarage-black">
            {formatCurrency(analysis.totalRevenue)}
          </div>
        </div>
        <div className="backdrop-blur-md bg-white/65 border border-white/70 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-squarage-black/70 text-sm">
            Average Sale
            <TrendingUp size={18} className="text-squarage-black/80" />
          </div>
          <div className="text-3xl font-semibold text-squarage-black">
            {formatCurrency(analysis.averageSale)}
          </div>
        </div>
      </div>

      <div className="backdrop-blur-md bg-white/70 border border-white/70 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-squarage-black">Sales Over Time</h3>
            <p className="text-sm text-squarage-black/70">
              {granularity === 'day'
                ? 'Daily performance for the selected window'
                : granularity === 'week'
                ? 'Weekly aggregated revenue'
                : 'Monthly aggregated revenue'}
            </p>
          </div>
          <div className="text-sm text-squarage-black/60">
            Showing {timelineData.length} data point
            {timelineData.length === 1 ? '' : 's'}
          </div>
        </div>
        <div className="h-72">
          {isBusy ? (
            <div className="h-full flex items-center justify-center text-squarage-black/70">
              Loading sales analysis...
            </div>
          ) : timelineData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-squarage-black/60 text-sm">
              No sales data for the selected range.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'rgba(15,23,42,0.7)', fontSize: 12 }}
                  stroke="rgba(15,23,42,0.15)"
                />
                <YAxis
                  yAxisId={0}
                  tickFormatter={value => `$${value}`}
                  tick={{ fill: 'rgba(15,23,42,0.7)', fontSize: 12 }}
                  stroke="rgba(15,23,42,0.15)"
                  width={80}
                />
                <YAxis
                  yAxisId={1}
                  orientation="right"
                  tick={{ fill: 'rgba(15,23,42,0.55)', fontSize: 11 }}
                  stroke="rgba(15,23,42,0.15)"
                  width={60}
                  allowDecimals={false}
                  label={{
                    value: 'Sales',
                    angle: 90,
                    position: 'insideRight',
                    offset: -10,
                    fill: 'rgba(15,23,42,0.55)',
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.85)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                  }}
                  formatter={(value: number, name: string, props) => {
                    if (name === 'revenue') {
                      return [`$${value.toLocaleString()}`, 'Revenue']
                    }
                    if (name === 'salesCount') {
                      return [value, 'Sales']
                    }
                    return [value, name]
                  }}
                  labelFormatter={label => label}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#15803d"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#bbf7d0' }}
                  activeDot={{ r: 6 }}
                  yAxisId={0}
                />
                <Line
                  type="monotone"
                  dataKey="salesCount"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  dot={false}
                  yAxisId={1}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          <div className="backdrop-blur-md bg-white/70 border border-white/70 rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-semibold text-squarage-black">Revenue by Channel</h3>
            <div className="h-72 mt-4">
              {isBusy ? (
                <div className="h-full flex items-center justify-center text-squarage-black/70">
                  Loading channel data...
                </div>
              ) : revenueByChannel.length === 0 ? (
                <div className="h-full flex items-center justify-center text-squarage-black/60 text-sm">
                  No channel revenue for the selected range.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByChannel}
                      dataKey="revenue"
                      nameKey="name"
                      innerRadius="55%"
                      outerRadius="80%"
                      paddingAngle={2}
                      stroke="rgba(15,23,42,0.15)"
                      labelLine={false}
                      label={renderRevenueLabel}
                    >
                      {revenueByChannel.map((entry, index) => (
                        <Cell
                          key={entry.channelId}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                          stroke="rgba(255,255,255,0.6)"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={renderRevenueTooltip} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ paddingTop: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2">
          <div className="backdrop-blur-md bg-white/70 border border-white/70 rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-semibold text-squarage-black">Sales Volume by Channel</h3>
            <div className="h-72 mt-4">
              {isBusy ? (
                <div className="h-full flex items-center justify-center text-squarage-black/70">
                  Loading channel data...
                </div>
              ) : revenueByChannel.length === 0 ? (
                <div className="h-full flex items-center justify-center text-squarage-black/60 text-sm">
                  No channel sales for the selected range.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByChannel}
                      dataKey="salesCount"
                      nameKey="name"
                      innerRadius="55%"
                      outerRadius="80%"
                      paddingAngle={2}
                      stroke="rgba(15,23,42,0.15)"
                      labelLine={false}
                      label={renderSalesLabel}
                    >
                      {revenueByChannel.map((entry, index) => (
                        <Cell
                          key={entry.channelId}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                          stroke="rgba(255,255,255,0.6)"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={renderCountTooltip} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ paddingTop: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
