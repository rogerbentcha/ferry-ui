import { describe, expect, it } from 'vitest'

import {
  type TimeSeriesRow,
  formatChartTick,
  formatChartValue,
  hasValues,
  maxStacked,
  maxValue,
  niceTicks,
  quarterTicks,
  timeTickInterval,
  timeTicks,
  withGaps,
} from './time-series'

const MINUTE = 60_000
const HOUR = 60 * MINUTE

describe('formatChartValue', () => {
  it.each([
    [1284, 'number', '1,284'],
    [0.125, 'number', '0.13'],
    [37.5, 'percent', '37.5%'],
    [512, 'bytes', '512 B'],
    [1.5 * 1024 ** 3, 'bytes', '1.5 GiB'],
    [2 * 1024 ** 2, 'bytes-per-second', '2.0 MiB/s'],
    [12.5, 'per-second', '12.5/s'],
    [0.004, 'per-second', '<0.01/s'],
    [0, 'per-second', '0/s'],
    [4.25, 'milliseconds', '4.3 ms'],
    [180, 'milliseconds', '180 ms'],
    [1800, 'milliseconds', '1.8 s'],
  ] as const)('%s %s → %s', (value, unit, expected) => {
    expect(formatChartValue(value, unit)).toBe(expected)
  })

  it('shows a dash for an unknown value', () => {
    expect(formatChartValue(null)).toBe('—')
    expect(formatChartValue(undefined, 'bytes')).toBe('—')
    expect(formatChartValue(Number.NaN, 'percent')).toBe('—')
    expect(formatChartValue(-1, 'bytes')).toBe('—')
  })
})

describe('formatChartTick', () => {
  it.each([
    [25, 'percent', '25%'],
    [1024 ** 3, 'bytes', '1 GiB'],
    [2 * 1024 ** 2, 'bytes-per-second', '2 MiB/s'],
    [0.5, 'per-second', '0.5/s'],
    [250, 'milliseconds', '250 ms'],
    [2000, 'milliseconds', '2 s'],
    [1000, 'number', '1,000'],
  ] as const)('%s %s → %s', (value, unit, expected) => {
    expect(formatChartTick(value, unit)).toBe(expected)
  })
})

describe('niceTicks', () => {
  it('is undefined without a value above 0', () => {
    expect(niceTicks(0)).toBeUndefined()
    expect(niceTicks(Number.NaN)).toBeUndefined()
  })

  it('steps decimal values by 1, 2 or 5', () => {
    expect(niceTicks(7)).toEqual([0, 2, 4, 6, 8])
    expect(niceTicks(0.3, 'per-second')).toEqual([0, 0.1, 0.2, 0.3])
    expect(niceTicks(180, 'milliseconds')).toEqual([0, 50, 100, 150, 200])
  })

  it('steps percents by round values', () => {
    expect(niceTicks(62, 'percent')).toEqual([0, 25, 50, 75])
  })

  it('steps bytes by powers of 2', () => {
    const mib = 1024 ** 2
    expect(niceTicks(300 * mib, 'bytes')).toEqual([0, 128 * mib, 256 * mib, 384 * mib])
  })
})

describe('quarterTicks', () => {
  it('ticks the quarters of the top', () => {
    expect(quarterTicks(100)).toEqual([0, 25, 50, 75, 100])
  })
})

describe('maxValue, maxStacked, hasValues', () => {
  const rows: TimeSeriesRow[] = [
    { t: 0, a: 1, b: 2 },
    { t: 1, a: 3, b: null },
    { t: 2, a: null, b: 2.5 },
  ]

  it('finds the highest value and the highest total', () => {
    expect(maxValue(rows, ['a', 'b'])).toBe(3)
    expect(maxStacked(rows, ['a', 'b'])).toBe(3)
    expect(maxValue([], ['a'])).toBe(0)
  })

  it('knows whether there is a value', () => {
    expect(hasValues(rows, ['a'])).toBe(true)
    expect(hasValues([{ t: 0, a: null }], ['a'])).toBe(false)
    expect(hasValues(rows, ['missing'])).toBe(false)
  })
})

describe('timeTicks', () => {
  it('ticks every 15 minutes over an hour', () => {
    expect(timeTickInterval(0, HOUR)).toBe(15 * MINUTE)
  })

  it('ticks every hour over 6 hours and every 4 hours over a day', () => {
    expect(timeTickInterval(0, 6 * HOUR)).toBe(HOUR)
    expect(timeTickInterval(0, 24 * HOUR)).toBe(4 * HOUR)
  })

  it('falls on round local times, 7 at most', () => {
    const from = new Date(2026, 9, 17, 14, 7).getTime()
    const ticks = timeTicks(from, from + HOUR)
    expect(ticks.map((t) => new Date(t).getMinutes())).toEqual([15, 30, 45, 0])
    expect(timeTicks(from, from + 24 * HOUR).length).toBeLessThanOrEqual(7)
  })
})

describe('withGaps', () => {
  const step = 10_000

  it('breaks the lines after more than 2 missing steps', () => {
    const rows: TimeSeriesRow[] = [
      { t: 0, a: 1 },
      { t: step, a: 2 },
      { t: 10 * step, a: 3 },
    ]
    expect(withGaps(rows, ['a'], step)).toEqual([
      { t: 0, a: 1 },
      { t: step, a: 2 },
      { t: 2 * step, a: null },
      { t: 10 * step, a: 3 },
    ])
  })

  it('keeps the line over one missing point', () => {
    const rows: TimeSeriesRow[] = [
      { t: 0, a: 1 },
      { t: 2 * step, a: 2 },
    ]
    expect(withGaps(rows, ['a'], step)).toEqual(rows)
  })

  it('returns the rows as they are without a step', () => {
    const rows: TimeSeriesRow[] = [{ t: 0, a: 1 }]
    expect(withGaps(rows, ['a'], 0)).toEqual(rows)
  })
})
