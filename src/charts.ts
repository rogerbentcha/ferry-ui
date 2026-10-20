/**
 * ferry-ui/charts — the charts of ferry-ui, on recharts.
 *
 * A separate entry point because `recharts` is an optional peer dependency: an app that draws no
 * chart does not install it, and `ferry-ui` (the main entry) never imports it. Apps that do:
 *
 *   npm install recharts
 *   import { TimeSeriesChart } from 'ferry-ui/charts'
 *
 * The rest of ferry-ui (`MetricCard`, `LegendDot`…) still comes from `ferry-ui`.
 */

export * from './components/charts/chart'
export * from './components/charts/time-series'
export * from './components/charts/time-series-chart'
