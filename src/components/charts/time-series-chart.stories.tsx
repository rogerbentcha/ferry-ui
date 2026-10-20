import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { MetricCard } from '../patterns/metric-card'

import { ChartLegendList, chartColor } from './chart'
import { TIME_SERIES_UNITS, type TimeSeriesRow } from './time-series'
import { TimeSeriesChart, type TimeSeriesSeries } from './time-series-chart'

/* Deterministic sample data: one point every 10 seconds over the last hour. */
const STEP = 10_000
const TO = Date.UTC(2026, 9, 17, 14, 0)
const FROM = TO - 60 * 60_000

/** A smooth, repeatable wave around `base` (no randomness: the stories render the same every time). */
function wave(i: number, base: number, amplitude: number, phase = 0): number {
  return Math.max(0, base + amplitude * (Math.sin(i / 23 + phase) * 0.7 + Math.sin(i / 5 + phase * 2) * 0.3))
}

function series(fill: (i: number) => Omit<TimeSeriesRow, 't'>): TimeSeriesRow[] {
  return Array.from({ length: 361 }, (_, i) => ({ t: FROM + i * STEP, ...fill(i) }) as TimeSeriesRow)
}

const CPU = series((i) => ({ cpu: wave(i, 38, 18) }))
const DISK = series((i) => ({ read: wave(i, 6, 4) * 1024 ** 2, write: wave(i, 3, 2, 1.4) * 1024 ** 2 }))
const LATENCY = series((i) => ({ p50: wave(i, 42, 12), p95: wave(i, 180, 60, 0.6) }))
const REQUESTS = series((i) => ({
  s2xx: wave(i, 18, 6),
  s3xx: wave(i, 2, 1, 0.8),
  s4xx: wave(i, 1.2, 0.8, 2.1),
  s5xx: i > 200 && i < 230 ? wave(i, 1.5, 1) : 0,
}))
/* The service was stopped for 20 minutes: no point between minute 25 and minute 45. */
const WITH_GAP = CPU.filter((row) => row.t < FROM + 25 * 60_000 || row.t > FROM + 45 * 60_000)

const meta = {
  title: 'Charts/Time Series Chart',
  component: TimeSeriesChart,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Line chart of values over time (CPU, memory, requests per second, latency): round time and value axes, a tooltip with every series at the hovered time, breaks where nothing was measured, an empty text when there is no value. `unit` picks the formats; `stacked` draws parts of a total. Put it in a `MetricCard`. Import it from `ferry-ui/charts` (needs `recharts`). Use `ChartContainer` for any other chart.',
      },
    },
  },
  args: {
    'aria-label': 'CPU over time',
    data: CPU,
    series: [{ key: 'cpu', label: 'CPU' }],
    unit: 'percent',
    max: 100,
    from: FROM,
    to: TO,
    step: STEP,
    stacked: false,
  },
  argTypes: {
    unit: { control: 'select', options: TIME_SERIES_UNITS },
    data: { control: false },
    series: { control: false },
    formatValue: { control: false },
    formatTick: { control: false },
    formatTime: { control: false },
    empty: { control: 'text' },
  },
  render: (args) => (
    <div className="w-[520px] max-w-full">
      <TimeSeriesChart {...args} />
    </div>
  ),
} satisfies Meta<typeof TimeSeriesChart>

export default meta
type Story = StoryObj<typeof meta>

/** Driven by args: change them in the Controls panel. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const chart = within(canvasElement).getByLabelText('CPU over time')
    await expect(chart).toHaveAttribute('data-slot', 'time-series-chart')
  },
}

const DISK_SERIES: TimeSeriesSeries[] = [
  { key: 'read', label: 'Read' },
  { key: 'write', label: 'Write' },
]

/** In a `MetricCard`, with a `ChartLegendList` in the header for several series. */
export const InMetricCard: Story = {
  args: { 'aria-label': 'Disk over time', data: DISK, series: DISK_SERIES, unit: 'bytes-per-second', max: undefined },
  render: (args) => (
    <MetricCard
      label="Disk"
      info="How fast the disks read and write, all together."
      aside={<ChartLegendList items={DISK_SERIES.map((s, i) => ({ ...s, color: chartColor(i) }))} />}
      className="w-[520px] max-w-full"
    >
      <TimeSeriesChart {...args} />
    </MetricCard>
  ),
  play: async ({ canvasElement }) => {
    const legend = within(canvasElement).getByRole('list', { name: 'Legend' })
    await expect(within(legend).getAllByRole('listitem')).toHaveLength(2)
  },
}

/** Durations: the axis reads `ms`, then `s` above a second. */
export const Milliseconds: Story = {
  args: {
    'aria-label': 'Latency over time',
    data: LATENCY,
    series: [
      { key: 'p50', label: 'p50' },
      { key: 'p95', label: 'p95' },
    ],
    unit: 'milliseconds',
    max: undefined,
  },
}

/** `stacked`: parts of a total (requests by status class), with a color per class. */
export const Stacked: Story = {
  args: {
    'aria-label': 'Requests over time',
    data: REQUESTS,
    series: [
      { key: 's2xx', label: '2xx', color: 'var(--chart-1)' },
      { key: 's3xx', label: '3xx', color: 'var(--chart-4)' },
      { key: 's4xx', label: '4xx', color: 'var(--chart-2)' },
      { key: 's5xx', label: '5xx', color: 'var(--chart-3)' },
    ],
    unit: 'per-second',
    stacked: true,
    max: undefined,
  },
}

/** With `step`, the line breaks where points are missing for more than `gapSteps` steps. */
export const WithGap: Story = {
  args: { data: WITH_GAP },
}

/** No series has a value: the `empty` text takes the place of the chart, at the same height. */
export const Empty: Story = {
  args: { data: [], empty: 'No request in this range' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('No request in this range')).toBeInTheDocument()
  },
}

/** `formatValue` and `formatTick` replace the formats of the unit. */
export const CustomFormat: Story = {
  args: {
    'aria-label': 'Orders over time',
    data: series((i) => ({ orders: Math.round(wave(i, 120, 40)) })),
    series: [{ key: 'orders', label: 'Orders' }],
    unit: 'number',
    max: undefined,
    formatValue: (value) => `${Math.round(value)} orders`,
    formatTick: (value) => String(value),
  },
}
