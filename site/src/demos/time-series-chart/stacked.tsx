import { MetricCard } from 'ferry-ui'
import { TimeSeriesChart, type TimeSeriesRow } from 'ferry-ui/charts'

const STEP = 10_000
const TO = Date.UTC(2026, 9, 17, 14, 0)
const FROM = TO - 60 * 60_000
const ROWS: TimeSeriesRow[] = Array.from({ length: 361 }, (_, i) => ({
  t: FROM + i * STEP,
  ok: 18 + 5 * Math.sin(i / 23),
  redirect: 2 + Math.sin(i / 11),
  clientError: 1.2 + 0.6 * Math.sin(i / 7),
  serverError: i > 200 && i < 230 ? 1.5 : 0,
}))

export default function TimeSeriesChartStacked() {
  return (
    <MetricCard label="Requests" className="w-full max-w-xl">
      <TimeSeriesChart
        aria-label="Requests over time"
        data={ROWS}
        series={[
          { key: 'ok', label: '2xx', color: 'var(--chart-1)' },
          { key: 'redirect', label: '3xx', color: 'var(--chart-4)' },
          { key: 'clientError', label: '4xx', color: 'var(--chart-2)' },
          { key: 'serverError', label: '5xx', color: 'var(--chart-3)' },
        ]}
        unit="per-second"
        stacked
        step={STEP}
      />
    </MetricCard>
  )
}
