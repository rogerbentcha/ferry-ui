import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { MetricCard } from './metric-card'
import { UsageBreakdown } from './usage-breakdown'

const meta = {
  title: 'Patterns/Usage Breakdown',
  component: UsageBreakdown,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'How a capacity is split between its parts: a header ("20% used", "197.6k / 1M"), a segmented bar and one row per part with its amount and its share. Use it for a quota used by several kinds of things (storage by file type, seats by team). Use `UsageBar` for one percentage, a stacked `TimeSeriesChart` for parts over time.',
      },
    },
  },
  args: {
    label: 'Storage used',
    total: 1_000_000,
    items: [
      { key: 'images', label: 'Images', value: 140_000 },
      { key: 'videos', label: 'Videos', value: 16_000 },
      { key: 'documents', label: 'Documents', value: 14_000, info: 'PDF, Word and spreadsheet files.' },
      { key: 'backups', label: 'Backups', value: 10_000, tone: 'neutral', info: 'Daily backups of the last 7 days.' },
      { key: 'other', label: 'Other', value: 8_300, tone: 'neutral' },
    ],
    hideList: false,
  },
  argTypes: {
    items: { control: false },
    formatValue: { control: false },
    title: { control: 'text' },
    summary: { control: 'text' },
  },
  render: (args) => (
    <div className="w-80">
      <UsageBreakdown {...args} />
    </div>
  ),
} satisfies Meta<typeof UsageBreakdown>

export default meta
type Story = StoryObj<typeof meta>

/** Driven by args: change them in the Controls panel. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('19% used')).toBeInTheDocument()
    await expect(canvas.getByRole('meter', { name: 'Storage used' })).toHaveAttribute('aria-valuetext', '188.3k of 1M')
    await expect(within(canvas.getByRole('list')).getAllByRole('listitem')).toHaveLength(5)
    await expect(canvas.getByText('14.0%')).toBeInTheDocument()
  },
}

/** `info` underlines a label with dots and explains it in a tooltip. */
export const WithInfo: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole('button', { name: 'Backups' }))
    await waitFor(() => expect(within(document.body).getByRole('tooltip')).toHaveTextContent('Daily backups'))
  },
}

/** `formatValue` sets the unit of the amounts; `title` and `summary` replace the header. */
export const CustomFormat: Story = {
  args: {
    label: 'Seats assigned',
    total: 50,
    title: '38 of 50 seats',
    summary: '12 left',
    formatValue: (value) => String(value),
    items: [
      { key: 'engineering', label: 'Engineering', value: 21 },
      { key: 'sales', label: 'Sales', value: 9 },
      { key: 'support', label: 'Support', value: 6 },
      { key: 'guests', label: 'Guests', value: 2, tone: 'neutral' },
    ],
  },
}

/** `hideList`: only the header and the bar, for a dense place. */
export const BarOnly: Story = {
  args: { hideList: true },
}

/** In a `MetricCard`, under a label. */
export const InMetricCard: Story = {
  args: { summary: null },
  render: (args) => (
    <MetricCard label="Storage" className="w-80">
      <UsageBreakdown {...args} />
    </MetricCard>
  ),
}
