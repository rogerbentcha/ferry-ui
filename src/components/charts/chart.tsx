import * as React from 'react'
import * as RechartsPrimitive from 'recharts'
import type { TooltipValueType } from 'recharts'

import { cn } from '../../lib/utils'

/** Theme name → selector of its root (`.dark` is the class `ThemeProvider` puts on `<html>`). */
const THEMES = { light: '', dark: '.dark' } as const

/** The size a chart draws at before it measures its container (server rendering, first paint). */
const INITIAL_DIMENSION = { width: 320, height: 200 } as const

type TooltipNameType = number | string

/**
 * The series of a chart, by key (the `dataKey` of a recharts `Line`, `Area` or `Bar`): their name
 * and their color. Each color becomes a `--color-<key>` variable on the chart, so a series is drawn
 * with `stroke="var(--color-<key>)"`. Keys must be CSS-safe (letters, digits, `-`, `_`).
 *
 * `color` is any CSS color, best a chart token (`var(--chart-1)`…`var(--chart-5)`); `theme` gives one
 * color per theme when a token does not fit (`{ light: '…', dark: '…' }`).
 */
export type ChartConfig = Record<
  string,
  {
    /** Name of the series in the tooltip and the legend ("Requests", "p95"). */
    label?: React.ReactNode
    /** Icon shown instead of the color swatch in the tooltip and the legend. */
    icon?: React.ComponentType
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<keyof typeof THEMES, string> })
>

interface ChartContextProps {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

/** The {@link ChartConfig} of the nearest {@link ChartContainer}. Throws outside one. */
export function useChart(): ChartContextProps {
  const context = React.useContext(ChartContext)
  if (!context) throw new Error('useChart must be used within a <ChartContainer />')
  return context
}

/* -------------------------------------------------------------------------------------------------
 * ChartContainer
 * -----------------------------------------------------------------------------------------------*/

/** Props of {@link ChartContainer}. Extra `<div>` props go to the root. */
export interface ChartContainerProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** The series of the chart: labels and colors (see {@link ChartConfig}). */
  config: ChartConfig
  /** One recharts chart (`LineChart`, `AreaChart`, `BarChart`…). It fills the container. */
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
  /** Size drawn before the container is measured (server rendering). Defaults to 320 × 200. */
  initialDimension?: { width: number; height: number }
}

/**
 * Themed frame of a recharts chart: sizes the chart to the container (16:9 by default; set a height
 * with `className="aspect-auto h-44 w-full"`), styles the axes, grid and cursor with the ferry-ui
 * tokens and exposes each series color of `config` as `--color-<key>`.
 *
 * Use it for any chart that {@link TimeSeriesChart} does not cover (bars, a pie, a custom chart).
 * Name the chart with `aria-label`. Requires the optional peer dependency `recharts`; import it from
 * `ferry-ui/charts`.
 */
export function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: ChartContainerProps) {
  const uniqueId = React.useId()
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-foreground-lighter [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-surface-200 [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-surface-200 [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer initialDimension={initialDimension}>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

/* -------------------------------------------------------------------------------------------------
 * ChartStyle
 * -----------------------------------------------------------------------------------------------*/

/** Props of {@link ChartStyle}. */
export interface ChartStyleProps {
  /** The `data-chart` value of the chart the variables apply to. */
  id: string
  /** The series whose colors become `--color-<key>` variables. */
  config: ChartConfig
}

/**
 * `<style>` that defines the `--color-<key>` variables of a chart, for the light and dark themes.
 * {@link ChartContainer} renders it already: use it only for a chart frame of your own.
 */
export function ChartStyle({ id, config }: ChartStyleProps) {
  const colorConfig = Object.entries(config).filter(([, item]) => item.theme ?? item.color)
  if (!colorConfig.length) return null
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, item]) => {
    const color = item.theme?.[theme as keyof typeof item.theme] ?? item.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join('\n')}
}
`,
          )
          .join('\n'),
      }}
    />
  )
}

/* -------------------------------------------------------------------------------------------------
 * ChartTooltip
 * -----------------------------------------------------------------------------------------------*/

/**
 * recharts' `Tooltip`, re-exported. Give it a {@link ChartTooltipContent} as `content` for the
 * ferry-ui look. Set `isAnimationActive={false}` on dense charts so it follows the pointer.
 */
export const ChartTooltip = RechartsPrimitive.Tooltip

/** Props of {@link ChartTooltipContent}. recharts fills `active`, `payload` and `label`. */
export type ChartTooltipContentProps = React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<'div'> & {
    /** Hides the header line (the hovered x value). */
    hideLabel?: boolean
    /** Hides the color swatch before each series. */
    hideIndicator?: boolean
    /** Shape of the color swatch. Defaults to `dot`. */
    indicator?: 'line' | 'dot' | 'dashed'
    /** Field of the payload that holds the series key of `config` (defaults to its `name` or `dataKey`). */
    nameKey?: string
    /** Field of the payload that holds the key of the header label in `config`. */
    labelKey?: string
  } & Omit<RechartsPrimitive.DefaultTooltipContentProps<TooltipValueType, TooltipNameType>, 'accessibilityLayer'>

/**
 * Popover of a chart under the pointer: the hovered x value, then one row per series with its color,
 * its name (from `config`) and its value. `labelFormatter` formats the header and `formatter`
 * replaces a whole row. Do NOT use it outside a {@link ChartTooltip}.
 */
export function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: ChartTooltipContentProps) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) return null
    const [item] = payload
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? 'value'}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value = !labelKey && typeof label === 'string' ? (config[label]?.label ?? label) : itemConfig?.label
    if (labelFormatter) {
      return <div className={cn('font-medium', labelClassName)}>{labelFormatter(value, payload)}</div>
    }
    if (!value) return null
    return <div className={cn('font-medium', labelClassName)}>{value}</div>
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey])

  if (!active || !payload?.length) return null

  const nestLabel = payload.length === 1 && indicator !== 'dot'

  return (
    <div
      data-slot="chart-tooltip"
      className={cn(
        'grid min-w-[8rem] items-start gap-1.5 rounded-md border border-border-strong bg-popover px-2.5 py-1.5 text-xs shadow-overlay',
        className,
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload
          .filter((item) => item.type !== 'none')
          .map((item, index) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? 'value'}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color ?? item.payload?.fill ?? item.color
            return (
              <div
                key={index}
                className={cn(
                  'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-foreground-lighter',
                  indicator === 'dot' && 'items-center',
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          aria-hidden="true"
                          className={cn('shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)', {
                            'h-2.5 w-2.5': indicator === 'dot',
                            'w-1': indicator === 'line',
                            'w-0 border-[1.5px] border-dashed bg-transparent': indicator === 'dashed',
                            'my-0.5': nestLabel && indicator === 'dashed',
                          })}
                          style={{ '--color-bg': indicatorColor, '--color-border': indicatorColor } as React.CSSProperties}
                        />
                      )
                    )}
                    <div
                      className={cn('flex flex-1 justify-between leading-none', nestLabel ? 'items-end' : 'items-center')}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-foreground-lighter">{itemConfig?.label ?? item.name}</span>
                      </div>
                      {item.value != null && (
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {typeof item.value === 'number' ? item.value.toLocaleString() : String(item.value)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * ChartLegend
 * -----------------------------------------------------------------------------------------------*/

/**
 * recharts' `Legend`, re-exported. Give it a {@link ChartLegendContent} as `content` for the
 * ferry-ui look. For a legend outside the chart (in a `MetricCard` header), use `ChartLegendList`.
 */
export const ChartLegend = RechartsPrimitive.Legend

/** Props of {@link ChartLegendContent}. recharts fills `payload` and `verticalAlign`. */
export type ChartLegendContentProps = React.ComponentProps<'div'> & {
  /** Shows the color swatch even when the series has an `icon` in `config`. */
  hideIcon?: boolean
  /** Field of the payload that holds the series key of `config` (defaults to its `dataKey`). */
  nameKey?: string
} & RechartsPrimitive.DefaultLegendContentProps

/**
 * Row of legend items under (or above) a chart: a color swatch (or the series `icon`) and the
 * series label of `config`. Do NOT use it outside a {@link ChartLegend}.
 */
export function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = 'bottom',
  nameKey,
}: ChartLegendContentProps) {
  const { config } = useChart()
  if (!payload?.length) return null
  return (
    <div
      data-slot="chart-legend"
      className={cn('flex items-center justify-center gap-4', verticalAlign === 'top' ? 'pb-3' : 'pt-3', className)}
    >
      {payload
        .filter((item) => item.type !== 'none')
        .map((item, index) => {
          const key = `${nameKey ?? item.dataKey ?? 'value'}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)
          return (
            <div
              key={index}
              className="flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-foreground-lighter"
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div aria-hidden="true" className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * ChartLegendList
 * -----------------------------------------------------------------------------------------------*/

/**
 * The color of the `index`-th series of a chart: `var(--chart-1)` to `var(--chart-5)`, then again
 * from `var(--chart-1)`. Order the series by importance (the busiest first): `chart-1` is the brand.
 */
export function chartColor(index: number): string {
  return `var(--chart-${(((index % 5) + 5) % 5) + 1})`
}

/** One item of a {@link ChartLegendList}. */
export interface ChartLegendListItem {
  /** Unique key of the series (its `dataKey`). */
  key: string
  /** Name of the series ("Read", "web · 9f8e7d"). Truncated to the width of the item. */
  label: React.ReactNode
  /** CSS color of the swatch: the color the series is drawn with (`var(--chart-2)`). */
  color: string
}

/** Props of {@link ChartLegendList}. Extra `<ul>` props go to the root. */
export interface ChartLegendListProps extends Omit<React.ComponentProps<'ul'>, 'children'> {
  /** The series, in the order of the chart. */
  items: readonly ChartLegendListItem[]
}

/**
 * Legend outside a chart: a wrapping list of square color swatches and series names (`■ Read
 * ■ Write`). Put it in a `MetricCard`'s `aside`, or above several charts that share their series.
 * Named "Legend" by default (`aria-label`).
 *
 * Do NOT use it inside a recharts chart (use {@link ChartLegend} + {@link ChartLegendContent}), nor
 * for one series (its name is the card label already). For an UPPERCASE caption, use `LegendDot`.
 */
export function ChartLegendList({ items, className, 'aria-label': ariaLabel = 'Legend', ...props }: ChartLegendListProps) {
  return (
    <ul
      data-slot="chart-legend-list"
      aria-label={ariaLabel}
      className={cn('flex min-w-0 flex-wrap gap-x-4 gap-y-1.5', className)}
      {...props}
    >
      {items.map((item) => (
        <li key={item.key} className="flex min-w-0 items-center gap-1.5 text-[12px] text-foreground-light">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-[2px]" style={{ background: item.color }} />
          <span className="truncate">{item.label}</span>
        </li>
      ))}
    </ul>
  )
}

/** The entry of `config` a tooltip or legend item belongs to. */
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== 'object' || payload === null) return undefined
  const payloadPayload =
    'payload' in payload && typeof payload.payload === 'object' && payload.payload !== null ? payload.payload : undefined
  let configLabelKey: string = key
  if (key in payload && typeof payload[key as keyof typeof payload] === 'string') {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === 'string'
  ) {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string
  }
  return configLabelKey in config ? config[configLabelKey] : config[key]
}
