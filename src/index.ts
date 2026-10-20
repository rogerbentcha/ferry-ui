/**
 * ferry-ui — public entry point.
 *
 * Everything a consuming app may import lives here: components, their prop
 * types, variant helpers (cva), hooks and utilities. Deep imports
 * (`ferry-ui/dist/...`) are not part of the public API.
 *
 * Stylesheets are separate entry points:
 * - `ferry-ui/theme.css`  Tailwind v4 theme (import after `tailwindcss`).
 * - `ferry-ui/styles.css` precompiled CSS for apps without Tailwind.
 * - `ferry-ui/fonts.css`  optional Inter + Source Code Pro webfonts.
 * - `ferry-ui/tokens.css` raw design tokens (CSS custom properties) only.
 */

/* -------------------------------------------------------------------------------------------------
 * Theme
 * -----------------------------------------------------------------------------------------------*/

export * from './theme/theme-provider'
// Server-safe (no 'use client'): callable from a server layout to render the no-flash <head> script.
export * from './theme/theme-script'

/* -------------------------------------------------------------------------------------------------
 * Lib
 * -----------------------------------------------------------------------------------------------*/

export * from './lib/utils'
export * from './lib/errors'
export * from './lib/link'
export * from './lib/platform'

/* -------------------------------------------------------------------------------------------------
 * Hooks
 * -----------------------------------------------------------------------------------------------*/

export * from './hooks/use-copy'
export * from './hooks/use-command-shortcut'
export * from './hooks/use-platform'

/* -------------------------------------------------------------------------------------------------
 * Primitives
 * -----------------------------------------------------------------------------------------------*/

export * from './components/primitives/alert-dialog'
export * from './components/primitives/avatar'
export * from './components/primitives/badge'
export * from './components/primitives/breadcrumb'
export * from './components/primitives/button'
export * from './components/primitives/card'
export * from './components/primitives/checkbox'
export * from './components/primitives/collapsible'
export * from './components/primitives/command'
export * from './components/primitives/dialog'
export * from './components/primitives/dropdown-menu'
export * from './components/primitives/input'
export * from './components/primitives/label'
export * from './components/primitives/popover'
export * from './components/primitives/radio-group'
export * from './components/primitives/scroll-area'
export * from './components/primitives/select'
export * from './components/primitives/separator'
export * from './components/primitives/sheet'
export * from './components/primitives/skeleton'
// `toast` is sonner's, re-exported here so it always reaches the same sonner copy as `<Toaster>`.
export * from './components/primitives/sonner'
export * from './components/primitives/switch'
export * from './components/primitives/table'
export * from './components/primitives/tabs'
export * from './components/primitives/textarea'
export * from './components/primitives/toggle'
export * from './components/primitives/toggle-group'
export * from './components/primitives/tooltip'

/* -------------------------------------------------------------------------------------------------
 * Patterns
 * -----------------------------------------------------------------------------------------------*/

export * from './components/patterns/callout'
export * from './components/patterns/code-block'
export * from './components/patterns/confirm-dialog'
export * from './components/patterns/copy'
export * from './components/patterns/description-list'
export * from './components/patterns/empty-state'
export * from './components/patterns/field'
export * from './components/patterns/form-card'
export * from './components/patterns/icon-box'
export * from './components/patterns/info-tile'
export * from './components/patterns/kbd'
export * from './components/patterns/key-value-editor'
export * from './components/patterns/key-value-rows'
export * from './components/patterns/list-toolbar'
export * from './components/patterns/metric-card'
export * from './components/patterns/mono-label'
export * from './components/patterns/page'
export * from './components/patterns/radio-card-group'
export * from './components/patterns/resource-card'
export * from './components/patterns/save-bar'
export * from './components/patterns/split-button'
export * from './components/patterns/status'
export * from './components/patterns/table-states'
export * from './components/patterns/table-utils'
export * from './components/patterns/usage-breakdown'

/* -------------------------------------------------------------------------------------------------
 * Layout
 * -----------------------------------------------------------------------------------------------*/

export * from './components/layout/types'
export * from './components/layout/app-shell'
export * from './components/layout/command-menu'
export * from './components/layout/icon-rail'
export * from './components/layout/inner-menu'
export * from './components/layout/mobile-nav'
export * from './components/layout/resource-switcher'
export * from './components/layout/theme-menu'
export * from './components/layout/top-bar'
