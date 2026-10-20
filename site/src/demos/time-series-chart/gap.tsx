import { MetricCard } from 'ferry-ui'
import { TimeSeriesChart, type TimeSeriesRow } from 'ferry-ui/charts'

const STEP = 10_000
const TO = Date.UTC(2026, 9, 17, 14, 0)
const FROM = TO - 60 * 60_000
// No point between minute 25 and minute 45: the server was stopped.
const ROWS: TimeSeriesRow[] = Array.from({ length: 361 }, (_, i) => ({
  t: FROM + i * STEP,
  memory: (1.2 + 0.3 * Math.sin(i / 30)) * 1024 ** 3,
})).filter((row) => row.t < FROM + 25 * 60_000 || row.t > FROM + 45 * 60_000)

export default function TimeSeriesChartGap() {
  return (
    <MetricCard label="Memory" className="w-full max-w-xl">
      <TimeSeriesChart
        aria-label="Memory over time"
        data={ROWS}
        series={[{ key: 'memory', label: 'Used' }]}
        unit="bytes"
        max={2 * 1024 ** 3}
        from={FROM}
        to={TO}
        step={STEP}
      />
    </MetricCard>
  )
}
