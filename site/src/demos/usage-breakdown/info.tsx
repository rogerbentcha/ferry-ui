import { UsageBreakdown } from 'ferry-ui'

export default function UsageBreakdownInfo() {
  return (
    <UsageBreakdown
      className="w-full max-w-sm"
      label="Storage used"
      total={1_000_000}
      items={[
        { key: 'images', label: 'Images', value: 140_000 },
        { key: 'documents', label: 'Documents', value: 14_000, info: 'PDF, Word and spreadsheet files.' },
        { key: 'backups', label: 'Backups', value: 10_000, tone: 'neutral', info: 'Daily backups of the last 7 days.' },
      ]}
    />
  )
}
