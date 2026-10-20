/**
 * Pure helpers of {@link TimeSeriesChart}: rows with breaks, round axis ticks, value and time
 * formats. They hold no React, so apps can reuse them for their own charts and tables.
 */

/**
 * One point in time of a chart: its time `t` (milliseconds since the epoch) and one value per
 * series, by series key. `null` (or a missing key) is an unknown value: the line stops there.
 */
export type TimeSeriesRow = { t: number } & Record<string, number | null | undefined>

/** Every {@link TimeSeriesUnit}, in order (handy for controls and tests). */
export const TIME_SERIES_UNITS = ['number', 'percent', 'bytes', 'bytes-per-second', 'per-second', 'milliseconds'] as const

/**
 * How the values of a chart read. It picks the tooltip format, the axis format and the round steps
 * of the value axis:
 *
 * | Unit | Tooltip | Axis | Steps |
 * | --- | --- | --- | --- |
 * | `number` | `1,284` | `1,284` | 1, 2, 5, 10… |
 * | `percent` | `37.5%` | `25%` | 1, 2, 5, 10, 25, 50, 100… |
 * | `bytes` | `1.5 GiB` | `1.5 GiB` | powers of 2 |
 * | `bytes-per-second` | `2.0 MiB/s` | `2 MiB/s` | powers of 2 |
 * | `per-second` | `12.5/s` | `0.5/s` | 0.01, 0.02, 0.05… |
 * | `milliseconds` | `180 ms`, `1.8 s` | `250 ms`, `2 s` | 0.01, 0.02, 0.05… |
 */
export type TimeSeriesUnit = (typeof TIME_SERIES_UNITS)[number]

const EM_DASH = '—'

const isKnown = (value: number | null | undefined): value is number =>
  value !== null && value !== undefined && Number.isFinite(value)

/* -------------------------------------------------------------------------------------------------
 * Values
 * -----------------------------------------------------------------------------------------------*/

const BYTE_UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']

/** `512 B`, `1.5 KiB`, `120 MiB` (binary units). */
function formatBytes(value: number): string {
  let v = value
  let i = 0
  while (v >= 1024 && i < BYTE_UNITS.length - 1) {
    v /= 1024
    i++
  }
  const fixed = i === 0 ? String(Math.round(v)) : v.toFixed(v >= 100 ? 0 : 1)
  return `${fixed} ${BYTE_UNITS[i]}`
}

/** `12.5`, `0.25`, `<0.01` (a few events over a long time). */
function formatRate(value: number): string {
  if (value === 0) return '0'
  if (value < 0.01) return '<0.01'
  if (value < 10) return value.toFixed(2)
  if (value < 100) return value.toFixed(1)
  return String(Math.round(value))
}

/** `4.2 ms`, `180 ms`, `1.8 s`, `12 s`. */
function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(ms >= 10_000 ? 0 : 1)} s`
  return `${ms < 10 ? ms.toFixed(1) : Math.round(ms)} ms`
}

/**
 * A value as the tooltip of a chart shows it: `1,284`, `37.5%`, `1.5 GiB`, `2.0 MiB/s`, `12.5/s`,
 * `180 ms`. `—` when the value is unknown (`null`, `undefined`, `NaN`) or negative where it cannot be.
 */
export function formatChartValue(value: number | null | undefined, unit: TimeSeriesUnit = 'number'): string {
  if (!isKnown(value)) return EM_DASH
  if (value < 0 && unit !== 'number' && unit !== 'percent') return EM_DASH
  switch (unit) {
    case 'number':
      return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'bytes':
      return formatBytes(value)
    case 'bytes-per-second':
      return `${formatBytes(value)}/s`
    case 'per-second':
      return `${formatRate(value)}/s`
    case 'milliseconds':
      return formatDuration(value)
  }
}

/** A round number without trailing zeros: `0.25`, `2`, `1.5`. */
const short = (value: number) => String(Number(value.toFixed(2)))

/** A tick of the value axis: `1,284`, `25%`, `1.5 GiB`, `2 MiB/s`, `0.5/s`, `250 ms`, `2 s`. */
export function formatChartTick(value: number, unit: TimeSeriesUnit = 'number'): string {
  switch (unit) {
    case 'percent':
      return `${Math.round(value)}%`
    case 'per-second':
      return `${short(value)}/s`
    case 'milliseconds':
      return value >= 1000 ? `${short(value / 1000)} s` : `${short(value)} ms`
    default:
      return formatChartValue(value, unit).replace(/\.0 /, ' ')
  }
}

/* -------------------------------------------------------------------------------------------------
 * Value axis
 * -----------------------------------------------------------------------------------------------*/

/** 0.01, 0.02, 0.05, 0.1 … 5 000 000 000: the steps of a decimal axis. */
const DECIMAL_STEPS = Array.from({ length: 36 }, (_, k) => [1, 2, 5][k % 3]! * 10 ** (Math.floor(k / 3) - 2))

/** Round percents: a usage axis reads 25%, 50%, 75%, 100%. Above 100% for a usage of several cores. */
const PERCENT_STEPS = [1, 2, 5, 10, 25, 50, 100, 200, 400, 800, 1600, 3200]

/** 1 B to 1 PiB: an axis of bytes reads 128 MiB, 256 MiB, 512 MiB. */
const BINARY_STEPS = Array.from({ length: 51 }, (_, k) => 2 ** k)

/**
 * The ticks of a value axis from 0 to at least `max`, 4 steps at most, on round values of the unit
 * (see {@link TimeSeriesUnit}). `undefined` when `max` is not above 0 (nothing to scale).
 */
export function niceTicks(max: number, unit: TimeSeriesUnit = 'number'): number[] | undefined {
  if (!(max > 0) || !Number.isFinite(max)) return undefined
  const steps =
    unit === 'percent' ? PERCENT_STEPS : unit === 'bytes' || unit === 'bytes-per-second' ? BINARY_STEPS : DECIMAL_STEPS
  const step = steps.find((s) => Math.ceil(max / s) <= 4) ?? max / 4
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => Number((i * step).toPrecision(12)))
}

/** The ticks of a value axis with a fixed top (`100` for a percentage, a memory limit): its quarters. */
export function quarterTicks(max: number): number[] {
  return [0, max / 4, max / 2, (max * 3) / 4, max]
}

/** The highest value of `keys` in the rows (0 when none). */
export function maxValue(rows: readonly TimeSeriesRow[], keys: readonly string[]): number {
  let max = 0
  for (const row of rows) {
    for (const key of keys) {
      const value = row[key]
      if (isKnown(value) && value > max) max = value
    }
  }
  return max
}

/** The highest total of `keys` in one row: the top of a stacked chart (0 when none). */
export function maxStacked(rows: readonly TimeSeriesRow[], keys: readonly string[]): number {
  let max = 0
  for (const row of rows) {
    let total = 0
    for (const key of keys) {
      const value = row[key]
      if (isKnown(value)) total += value
    }
    if (total > max) max = total
  }
  return max
}

/** Whether any row has a known value of `keys` (a chart of nothing shows its empty text). */
export function hasValues(rows: readonly TimeSeriesRow[], keys: readonly string[]): boolean {
  return rows.some((row) => keys.some((key) => isKnown(row[key])))
}

/* -------------------------------------------------------------------------------------------------
 * Time axis
 * -----------------------------------------------------------------------------------------------*/

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** The intervals a time axis may tick at, the shortest first. */
const TIME_INTERVALS = [
  MINUTE,
  5 * MINUTE,
  15 * MINUTE,
  30 * MINUTE,
  HOUR,
  2 * HOUR,
  4 * HOUR,
  6 * HOUR,
  12 * HOUR,
  DAY,
  2 * DAY,
  7 * DAY,
]

/** The most ticks a time axis shows. */
const MAX_TIME_TICKS = 7

/** The interval between two ticks of a time axis from `from` to `to` (ms): 7 ticks at most. */
export function timeTickInterval(from: number, to: number): number {
  const span = Math.max(0, to - from)
  return TIME_INTERVALS.find((every) => span / every < MAX_TIME_TICKS) ?? TIME_INTERVALS[TIME_INTERVALS.length - 1]!
}

/**
 * The ticks of a time axis from `from` to `to` (ms): round local times (`14:00`, `14:15`…, or
 * local midnights for a span of days), 7 at most.
 */
export function timeTicks(from: number, to: number): number[] {
  const every = timeTickInterval(from, to)
  // Local time = UTC - offset: the ticks fall on local multiples of `every`.
  const offset = new Date(from).getTimezoneOffset() * MINUTE
  const ticks: number[] = []
  for (let t = Math.ceil((from - offset) / every) * every + offset; t <= to; t += every) ticks.push(t)
  return ticks
}

const pad = (n: number) => String(n).padStart(2, '0')

/** A tick of a time axis, in local time: `14:05`, or `Oct 17` when the ticks are days apart. */
export function formatTimeTick(t: number, interval = HOUR): string {
  const d = new Date(t)
  if (interval >= DAY) return d.toLocaleString('en-US', { month: 'short', day: 'numeric' })
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** The time of a point in a tooltip, in local time: `Oct 17, 14:05:30`. */
export function formatPointTime(t: number): string {
  const d = new Date(t)
  const day = d.toLocaleString('en-US', { month: 'short', day: 'numeric' })
  return `${day}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/* -------------------------------------------------------------------------------------------------
 * Breaks
 * -----------------------------------------------------------------------------------------------*/

/**
 * `rows` (sorted by time) with a row of `null`s inserted one `step` after a point that is followed
 * by nothing for more than `gapSteps` steps: the lines stop there instead of joining the points on
 * both sides of a time nothing was measured. One missing point (`gapSteps` = 2) does not break them.
 */
export function withGaps(
  rows: readonly TimeSeriesRow[],
  keys: readonly string[],
  step: number,
  gapSteps = 2,
): TimeSeriesRow[] {
  if (!(step > 0) || !(gapSteps > 0)) return [...rows]
  const out: TimeSeriesRow[] = []
  for (const row of rows) {
    const previous = out[out.length - 1]
    if (previous && row.t - previous.t > gapSteps * step) {
      const gap: TimeSeriesRow = { t: previous.t + step }
      for (const key of keys) gap[key] = null
      out.push(gap)
    }
    out.push(row)
  }
  return out
}
