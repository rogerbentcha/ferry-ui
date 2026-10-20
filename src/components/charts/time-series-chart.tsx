import * as React from 'react'
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import { cn } from '../../lib/utils'

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, chartColor } from './chart'
import {
  type TimeSeriesRow,
  type TimeSeriesUnit,
  formatChartTick,
  formatChartValue,
  formatPointTime,
  formatTimeTick,
  hasValues,
  maxStacked,
  maxValue,
  niceTicks,
  quarterTicks,
  timeTickInterval,
  timeTicks,
  withGaps,
} from './time-series'

/** One line (or stacked area) of a {@link TimeSeriesChart}. */
export interface TimeSeriesSeries {
  /** Key of the values in the rows. CSS-safe (letters, digits, `-`, `_`): it names a `--color-<key>` variable. */
  key: string
  /** Name in the tooltip and the legend ("CPU", "p95", "2xx"). */
  label: string
  /** CSS color of the line. Defaults to `chartColor(index)`: `var(--chart-1)` for the first series… */
  color?: string
}

/** Props of {@link TimeSeriesChart}. Extra `<div>` props go to the root. */
export interface TimeSeriesChartProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /**
   * The points, sorted by time: `{ t, <series key>: value }` with `t` in milliseconds since the epoch.
   * A `null` value stops the line of its series.
   */
  data: readonly TimeSeriesRow[]
  /** The lines, the most important first (its color is the brand). */
  series: readonly TimeSeriesSeries[]
  /** How the values read: tooltip format, axis format, round steps of the axis. Defaults to `number`. */
  unit?: TimeSeriesUnit
  /** Draws the series as areas stacked on each other (parts of a total: requests by status) instead of lines. */
  stacked?: boolean
  /** Start of the time axis (ms). Defaults to the time of the first point. */
  from?: number
  /** End of the time axis (ms). Defaults to the time of the last point. */
  to?: number
  /**
   * Time between two points (ms). When set, the lines break where points are missing for more than
   * `gapSteps` steps (a time nothing was measured) instead of joining both sides.
   */
  step?: number
  /** How many steps without a point break the lines. Defaults to 2: one missing point does not. */
  gapSteps?: number
  /**
   * Fixed top of the value axis (`100` for a percentage, a memory limit): the axis ticks its quarters
   * and higher values are cut. Defaults to a round value above the highest point.
   */
  max?: number
  /** Formats a value in the tooltip. Defaults to the `unit` format (`37.5%`, `1.5 GiB`). */
  formatValue?: (value: number) => string
  /** Formats a tick of the value axis. Defaults to the `unit` format (`25%`, `2 MiB/s`). */
  formatTick?: (value: number) => string
  /** Header of the tooltip, from the time of the hovered point. Defaults to `Oct 17, 14:05:30`. */
  formatTime?: (t: number) => React.ReactNode
  /** Shown instead of the chart when no series has a value. Defaults to "No data". */
  empty?: React.ReactNode
}

/**
 * Line chart of values over time (CPU, memory, requests per second, latency…): a round time axis in
 * local time, a value axis on round values of the unit, a tooltip with every series at the hovered
 * time, breaks where nothing was measured, and an empty text when there is no value.
 *
 * Put it in a `MetricCard` (label, info, a `ChartLegendList` as `aside` for several series), in a
 * grid of two columns. Size it with `className` (defaults to `h-44 w-full`) and name it with
 * `aria-label` ("CPU over time"). Do NOT use it for categories (use `ChartContainer` with a recharts
 * `BarChart`) nor for one current value (use `MetricCard` + `UsageBar`). Requires the optional peer
 * dependency `recharts`; import it from `ferry-ui/charts`.
 */
export function TimeSeriesChart({
  data,
  series,
  unit = 'number',
  stacked = false,
  from,
  to,
  step,
  gapSteps = 2,
  max,
  formatValue,
  formatTick,
  formatTime = formatPointTime,
  empty = 'No data',
  className,
  ...props
}: TimeSeriesChartProps) {
  const lines = series.map((s, i) => ({ ...s, color: s.color ?? chartColor(i) }))
  const keys = lines.map((l) => l.key)
  const config = Object.fromEntries(lines.map((l) => [l.key, { label: l.label, color: l.color }])) satisfies ChartConfig
  const rows = step === undefined ? [...data] : withGaps(data, keys, step, gapSteps)
  const start = from ?? data[0]?.t ?? 0
  const end = to ?? data[data.length - 1]?.t ?? start
  const valueTicks = max === undefined ? niceTicks((stacked ? maxStacked : maxValue)(rows, keys), unit) : quarterTicks(max)
  const top = valueTicks?.[valueTicks.length - 1]
  const interval = timeTickInterval(start, end)
  const value = (v: number) => (formatValue ? formatValue(v) : formatChartValue(v, unit))

  if (!hasValues(rows, keys)) {
    return (
      <div
        data-slot="time-series-chart-empty"
        className={cn(
          'flex h-44 w-full items-center justify-center px-4 text-center text-[13px] text-foreground-lighter',
          className,
        )}
        {...props}
      >
        {empty}
      </div>
    )
  }

  const Chart = stacked ? AreaChart : LineChart
  return (
    <ChartContainer
      data-slot="time-series-chart"
      config={config}
      className={cn('aspect-auto h-44 w-full', className)}
      {...props}
    >
      <Chart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={[start, end]}
          ticks={timeTicks(start, end)}
          tickFormatter={(t: number) => formatTimeTick(t, interval)}
          tickLine={false}
          axisLine={false}
          minTickGap={40}
          tickMargin={6}
        />
        <YAxis
          domain={[0, top ?? 'auto']}
          ticks={valueTicks}
          tickFormatter={(v: number) => (formatTick ? formatTick(v) : formatChartTick(v, unit))}
          tickLine={false}
          axisLine={false}
          width={64}
          allowDataOverflow={max !== undefined}
        />
        <ChartTooltip
          isAnimationActive={false}
          content={
            <ChartTooltipContent
              className="min-w-44"
              labelFormatter={(_, payload) => {
                const t: unknown = payload?.[0]?.payload?.t
                return typeof t === 'number' ? formatTime(t) : null
              }}
              formatter={(v, name, item) => (
                <TooltipRow
                  color={item.color ?? chartColor(0)}
                  label={config[String(name)]?.label ?? String(name)}
                  value={typeof v === 'number' ? value(v) : formatChartValue(null)}
                />
              )}
            />
          }
        />
        {lines.map((l) =>
          stacked ? (
            <Area
              key={l.key}
              dataKey={l.key}
              name={l.key}
              type="linear"
              stackId="stack"
              stroke={`var(--color-${l.key})`}
              fill={`var(--color-${l.key})`}
              fillOpacity={0.35}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ) : (
            <Line
              key={l.key}
              dataKey={l.key}
              name={l.key}
              type="linear"
              stroke={`var(--color-${l.key})`}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ),
        )}
      </Chart>
    </ChartContainer>
  )
}

/** A row of the tooltip: the series color, its name, its formatted value. */
function TooltipRow({ color, label, value }: { color: string; label: React.ReactNode; value: string }) {
  return (
    <div className="flex w-full items-center gap-2">
      <span aria-hidden="true" className="size-2 shrink-0 rounded-[2px]" style={{ background: color }} />
      <span className="min-w-0 flex-1 truncate text-foreground-lighter">{label}</span>
      <span className="font-mono font-medium text-foreground tabular-nums">{value}</span>
    </div>
  )
}
