import { MetricCard } from 'ferry-ui'
import { TimeSeriesChart, type TimeSeriesRow } from 'ferry-ui/charts'

// One point every 10 seconds over one hour.
const STEP = 10_000
const TO = Date.UTC(2026, 9, 17, 14, 0)
const FROM = TO - 60 * 60_000
const ROWS: TimeSeriesRow[] = Array.from({ length: 361 }, (_, i) => ({
  t: FROM + i * STEP,
  cpu: 38 + 14 * Math.sin(i / 23) + 5 * Math.sin(i / 5),
}))

export default function TimeSeriesChartHero() {
  return (
    <MetricCard label="CPU" info="Use of all the CPUs: 100% means each core is busy." className="w-full max-w-xl">
      <TimeSeriesChart
        aria-label="CPU over time"
        data={ROWS}
        series={[{ key: 'cpu', label: 'CPU' }]}
        unit="percent"
        max={100}
        from={FROM}
        to={TO}
        step={STEP}
      />
    </MetricCard>
  )
}
