import { ChartLegendList, chartColor } from 'ferry-ui/charts'

const PROJECTS = ['Website', 'Mobile app', 'Billing API', 'Data pipeline', 'Admin console']

export default function ChartLegendListDemo() {
  return (
    <ChartLegendList
      className="max-w-sm"
      items={PROJECTS.map((label, i) => ({ key: `p${i}`, label, color: chartColor(i) }))}
    />
  )
}
