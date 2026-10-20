import type { Meta, StoryObj } from '@storybook/react-vite'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { expect, within } from 'storybook/test'

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartLegendList,
  ChartTooltip,
  ChartTooltipContent,
  chartColor,
} from './chart'

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

const meta = {
  title: 'Charts/Chart',
  component: ChartContainer,
  subcomponents: { ChartTooltipContent, ChartLegendContent, ChartLegendList },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Themed frame of a recharts chart: `ChartContainer` sizes the chart, styles axes and grid with the tokens and turns each color of `config` into a `--color-<key>` variable; `ChartTooltipContent` and `ChartLegendContent` give recharts the ferry-ui look; `ChartLegendList` is a legend outside the chart. Import them from `ferry-ui/charts` (needs `recharts`). For values over time, use `TimeSeriesChart`.',
      },
    },
  },
  args: {
    config,
    'aria-label': 'Orders per month',
    className: 'aspect-auto h-60 w-[520px] max-w-full',
    children: (
      <BarChart data={ORDERS}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="online" fill="var(--color-online)" radius={3} />
        <Bar dataKey="store" fill="var(--color-store)" radius={3} />
      </BarChart>
    ),
  },
  argTypes: {
    config: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof ChartContainer>

export default meta
type Story = StoryObj<typeof meta>

/** A bar chart with the ferry-ui tooltip and legend. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const chart = within(canvasElement).getByLabelText('Orders per month')
    await expect(chart).toHaveAttribute('data-slot', 'chart')
    // Each color of `config` is a variable of the chart.
    await expect(chart.querySelector('style')?.textContent).toContain('--color-online: var(--chart-1);')
  },
}

/** `theme`: one color per theme when no chart token fits. */
export const ThemedColors: Story = {
  args: {
    config: {
      online: { label: 'Online', theme: { light: 'var(--chart-1)', dark: 'var(--chart-5)' } },
      store: { label: 'In store', color: 'var(--chart-4)' },
    },
  },
}

/** `ChartLegendList`: a legend outside the chart, in a card header or above several charts. */
export const LegendList: Story = {
  render: () => (
    <ChartLegendList
      items={['web · 9f8e7d', 'web · 1a2b3c', 'worker', 'postgres', 'redis', 'cron'].map((label, i) => ({
        key: `c${i}`,
        label,
        color: chartColor(i),
      }))}
      className="w-80"
    />
  ),
  play: async ({ canvasElement }) => {
    const legend = within(canvasElement).getByRole('list', { name: 'Legend' })
    await expect(within(legend).getAllByRole('listitem')).toHaveLength(6)
  },
}
