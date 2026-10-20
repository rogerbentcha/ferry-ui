import { type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from 'ferry-ui/charts'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

const ORDERS = [
  { month: 'Jan', online: 186, store: 80 },
  { month: 'Feb', online: 305, store: 200 },
  { month: 'Mar', online: 237, store: 120 },
  { month: 'Apr', online: 173, store: 190 },
  { month: 'May', online: 209, store: 130 },
  { month: 'Jun', online: 214, store: 140 },
]

const config = {
  online: { label: 'Online', color: 'var(--chart-1)' },
  store: { label: 'In store', color: 'var(--chart-4)' },
} satisfies ChartConfig

export default function ChartHero() {
  return (
    <ChartContainer config={config} aria-label="Orders per month" className="aspect-auto h-60 w-full max-w-xl">
      <BarChart data={ORDERS}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="online" fill="var(--color-online)" radius={3} />
        <Bar dataKey="store" fill="var(--color-store)" radius={3} />
      </BarChart>
    </ChartContainer>
  )
}
