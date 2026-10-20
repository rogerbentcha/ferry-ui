import { UsageBreakdown } from 'ferry-ui'

export default function UsageBreakdownFormat() {
  return (
    <UsageBreakdown
      className="w-full max-w-sm"
      label="Seats assigned"
      total={50}
      title="38 of 50 seats"
      summary="12 left"
      formatValue={(seats) => String(seats)}
      items={[
        { key: 'engineering', label: 'Engineering', value: 21 },
        { key: 'sales', label: 'Sales', value: 9 },
        { key: 'support', label: 'Support', value: 6 },
        { key: 'guests', label: 'Guests', value: 2, tone: 'neutral' },
      ]}
    />
  )
}
