import { UsageBreakdown } from 'ferry-ui'

export default function UsageBreakdownBarOnly() {
  return (
    <UsageBreakdown
      className="w-full max-w-sm"
      label="Storage used"
      total={1_000_000}
      hideList
      items={[
        { key: 'images', label: 'Images', value: 140_000 },
        { key: 'videos', label: 'Videos', value: 16_000 },
        { key: 'other', label: 'Other', value: 32_300, tone: 'neutral' },
      ]}
    />
  )
}
