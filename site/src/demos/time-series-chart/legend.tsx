import { MetricCard } from 'ferry-ui'
import { ChartLegendList, TimeSeriesChart, chartColor, type TimeSeriesRow, type TimeSeriesSeries } from 'ferry-ui/charts'

const STEP = 10_000
const TO = Date.UTC(2026, 9, 17, 14, 0)
const FROM = TO - 60 * 60_000
const ROWS: TimeSeriesRow[] = Array.from({ length: 361 }, (_, i) => ({
  t: FROM + i * STEP,
  p50: 42 + 10 * Math.sin(i / 23),
  p95: 180 + 50 * Math.sin(i / 23 + 0.6) + 15 * Math.sin(i / 5),
}))

const SERIES: TimeSeriesSeries[] = [
  { key: 'p50', label: 'p50' },
  { key: 'p95', label: 'p95' },
]

export default function TimeSeriesChartLegend() {
  return (
    <MetricCard
      label="Latency"
      aside={<ChartLegendList items={SERIES.map((series, i) => ({ ...series, color: chartColor(i) }))} />}
      className="w-full max-w-xl"
    >
      <TimeSeriesChart aria-label="Latency over time" data={ROWS} series={SERIES} unit="milliseconds" step={STEP} />
    </MetricCard>
  )
}
