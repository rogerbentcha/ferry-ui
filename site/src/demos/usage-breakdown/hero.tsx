import { MetricCard, UsageBreakdown } from 'ferry-ui'

export default function UsageBreakdownHero() {
  return (
    <MetricCard label="Storage" className="w-full max-w-sm">
      <UsageBreakdown
        label="Storage used"
        total={1_000_000}
        summary={null}
        items={[
          { key: 'images', label: 'Images', value: 140_000 },
          { key: 'videos', label: 'Videos', value: 16_000 },
          { key: 'documents', label: 'Documents', value: 14_000 },
          { key: 'backups', label: 'Backups', value: 10_000, tone: 'neutral' },
          { key: 'other', label: 'Other', value: 8_300, tone: 'neutral' },
        ]}
      />
    </MetricCard>
  )
}
