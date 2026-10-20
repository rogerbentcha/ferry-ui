import * as React from 'react'

import { Hint } from '../primitives/tooltip'
import { cn } from '../../lib/utils'

import { type LegendDotTone } from './metric-card'

/** One part of a {@link UsageBreakdown}. */
export interface UsageBreakdownItem {
  /** Unique key of the part. */
  key: string
  /** Name of the part ("Messages", "Images"). */
  label: React.ReactNode
  /** Amount the part uses, in the unit of `total`. Negative values count as 0. */
  value: number
  /**
   * Color of the part (same vocabulary as `LegendDot`). Defaults to `chart-1`…`chart-5` in order,
   * then `neutral`. Give the small "other" parts `neutral` so the large ones stand out.
   */
  tone?: LegendDotTone
  /**
   * Explanation shown in a tooltip when the label is hovered or focused (the label gets a dotted
   * underline). Requires a `TooltipProvider` ancestor; never put essential information here.
   */
  info?: React.ReactNode
}

/** Props of {@link UsageBreakdown}. Extra `<div>` props go to the root. */
export interface UsageBreakdownProps extends Omit<React.ComponentProps<'div'>, 'children' | 'title'> {
  /** The parts, the largest first. Their sum is the amount used. */
  items: readonly UsageBreakdownItem[]
  /** The capacity the parts use up (a quota, a context window, a disk). Must be above 0. */
  total: number
  /** Accessible name of the bar ("Storage used"). Always set it. */
  label: string
  /** Formats an amount in the header and the rows. Defaults to a compact number (`197.6k`, `1M`). */
  formatValue?: (value: number) => string
  /** Left side of the header. Defaults to the share used: "20% used". */
  title?: React.ReactNode
  /** Right side of the header. Defaults to "used / total" (`197.6k / 1M`). `null` hides it. */
  summary?: React.ReactNode
  /** Hides the list of parts under the bar (keeps the bar and the header). */
  hideList?: boolean
}

const TONE_ORDER: LegendDotTone[] = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']

const TONE_FILL: Record<LegendDotTone, string> = {
  brand: 'bg-brand',
  'chart-1': 'bg-chart-1',
  'chart-2': 'bg-chart-2',
  'chart-3': 'bg-chart-3',
  'chart-4': 'bg-chart-4',
  'chart-5': 'bg-chart-5',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-info',
  neutral: 'bg-foreground-muted',
}

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

/** `950`, `8.3k`, `197.6k`, `1M`. */
function formatCompact(value: number): string {
  return compact.format(value).replace('K', 'k')
}

/** `14.0%`; `<0.1%` for a part too small to read, `0%` for nothing. */
function formatShare(share: number): string {
  if (share <= 0) return '0%'
  if (share < 0.1) return '<0.1%'
  return `${share.toFixed(1)}%`
}

/**
 * How a capacity is split between its parts: a header ("20% used", "197.6k / 1M"), a segmented bar
 * with one colored segment per part on the remaining track, and one row per part with its color,
 * its name, its amount and its share of the total.
 *
 * Use it for a quota or a budget used by several kinds of things: storage by file type, seats by
 * team, a context window by source. The rows carry the numbers, so the colors are never the only
 * cue. Do NOT use it for one percentage (use `UsageBar`), nor for parts that change over time (use
 * a stacked `TimeSeriesChart` from `ferry-ui/charts`).
 */
export function UsageBreakdown({
  items,
  total,
  label,
  formatValue = formatCompact,
  title,
  summary,
  hideList = false,
  className,
  ...props
}: UsageBreakdownProps) {
  const parts = items.map((item, index) => ({
    ...item,
    value: Number.isFinite(item.value) ? Math.max(0, item.value) : 0,
    tone: item.tone ?? TONE_ORDER[index] ?? 'neutral',
  }))
  const used = parts.reduce((sum, part) => sum + part.value, 0)
  const capacity = total > 0 ? total : used
  const share = (value: number) => (capacity > 0 ? (value / capacity) * 100 : 0)
  const usedShare = Math.min(100, share(used))
  return (
    <div data-slot="usage-breakdown" className={cn('flex min-w-0 flex-col gap-3', className)} {...props}>
      <div data-slot="usage-breakdown-header" className="flex items-baseline justify-between gap-3">
        <span className="text-base text-foreground">{title ?? `${Math.round(usedShare)}% used`}</span>
        {summary !== null && (
          <span className="text-[13px] text-foreground-lighter tabular">
            {summary ?? `${formatValue(used)} / ${formatValue(total)}`}
          </span>
        )}
      </div>
      <div
        data-slot="usage-breakdown-bar"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(usedShare)}
        aria-valuetext={`${formatValue(used)} of ${formatValue(total)}`}
        className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full bg-foreground/[0.07]"
      >
        {parts
          .filter((part) => part.value > 0)
          .map((part) => (
            <span
              key={part.key}
              className={cn('h-full min-w-1 shrink-0 rounded-full', TONE_FILL[part.tone])}
              style={{ width: `${Math.min(100, share(part.value))}%` }}
            />
          ))}
      </div>
      {!hideList && (
        <ul data-slot="usage-breakdown-list" aria-label={`${label} by part`} className="flex flex-col gap-2">
          {parts.map((part) => (
            <li
              key={part.key}
              data-slot="usage-breakdown-item"
              data-tone={part.tone}
              className="flex min-w-0 items-center gap-2.5 text-sm"
            >
              <span aria-hidden="true" className={cn('size-2.5 shrink-0 rounded-[3px]', TONE_FILL[part.tone])} />
              <span className="min-w-0 flex-1 truncate text-foreground-light">
                {part.info != null ? (
                  <Hint label={part.info}>
                    <button
                      type="button"
                      className="truncate rounded-sm underline decoration-foreground-muted decoration-dotted underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {part.label}
                    </button>
                  </Hint>
                ) : (
                  part.label
                )}
              </span>
              <span className="text-foreground-lighter tabular">{formatValue(part.value)}</span>
              <span className="w-14 text-right text-foreground tabular">{formatShare(share(part.value))}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
