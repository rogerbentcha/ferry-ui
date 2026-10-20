import { MetricCard } from 'ferry-ui'
import { TimeSeriesChart } from 'ferry-ui/charts'

export default function TimeSeriesChartEmpty() {
  return (
    <MetricCard label="Requests" className="w-full max-w-xl">
      <TimeSeriesChart
        aria-label="Requests over time"
        data={[]}
        series={[{ key: 'requests', label: 'Requests' }]}
        unit="per-second"
        empty="No request in this range"
      />
    </MetricCard>
  )
}
