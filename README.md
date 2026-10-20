# ferry-ui

ferry-ui is a React design system for dense product interfaces: dashboards, admin consoles, settings
pages, data tables and developer tools. It ships design tokens, accessible primitives built on
[Radix UI](https://www.radix-ui.com), higher-level patterns and application-shell layout pieces, all
styled with Tailwind CSS v4 and following the [shadcn/ui](https://ui.shadcn.com) conventions (`cn()`,
`cva` variants, `data-slot` attributes, `asChild`).

It is written for two audiences: the people building product screens, and the AI coding agents working
next to them. Every component, prop and hook carries a JSDoc that says what it is, when to use it and
when not to. Storybook shows that text next to live examples, and [AGENTS.md](./AGENTS.md) condenses
it into one reference for agents.

```tsx
import { Button, EmptyState } from 'ferry-ui'
import { FolderKanban, Plus } from 'lucide-react'

export function NoProjects({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={<FolderKanban />}
      title="No projects yet"
      description="Projects group your invoices, members and API keys."
      actions={
        <Button variant="primary" icon={<Plus />} onClick={onCreate}>
          New project
        </Button>
      }
    />
  )
}
```

## Contents

- [What is in the box](#what-is-in-the-box)
- [Design principles](#design-principles)
- [Install](#install)
- [CSS setup](#css-setup)
- [Fonts](#fonts)
- [App setup](#app-setup)
- [Theme: light, dark, system](#theme-light-dark-system)
- [Links and routers](#links-and-routers)
- [Theming a product](#theming-a-product)
- [Components](#components)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Contributing](#contributing)
- [Documentation for AI agents](#documentation-for-ai-agents)

## What is in the box

| Layer | Content |
| --- | --- |
| Tokens | Colors, radii, shadows and fonts as CSS custom properties, light and dark, mapped onto Tailwind theme names |
| Primitives | 28 shadcn-style building blocks on Radix UI: Button, Input, Select, Dialog, Dropdown Menu, Tabs, Table, Tooltip, Toaster… |
| Patterns | Compositions for recurring product needs: page headers, form cards, data-table states, empty and error states, callouts, confirm dialogs, copy fields, metric cards, key/value editor… |
| Layout | The application shell: app shell, top bar, icon rail, mobile navigation, inner menu, command menu, resource switcher, theme menu |
| Charts | Charts on recharts, from `ferry-ui/charts`: a time-series chart (lines or stacked areas, round axes, breaks, units) and the themed chart container, tooltip and legends |
| Hooks and helpers | `cn`, `getErrorMessage`, `useCopy`, `useCommandShortcut`, `useTheme`, `useModKey`, the link contract |
| Documentation | A Storybook with every variant and state, full-screen example pages, and an agent guide |

## Design principles

- **Dense, calm product UI.** Small type (13px for most UI copy, 14px body), compact controls (30px
  buttons, 34px fields), generous whitespace between sections rather than inside rows. Color is reserved
  for meaning.
- **Hairline borders over shadows.** Structure comes from 1px borders in three strengths. Shadows are
  almost invisible on resting cards and only get real depth on things that float (menus, popovers,
  dialogs).
- **Two radii that encode role.** 6px for controls (buttons, inputs, navigation items), 8px for
  containers (cards, tables, popovers, dialogs).
- **Uppercase mono micro-labels.** The signature caption (`MonoLabel`, 11.5px uppercase monospace)
  labels cards, table columns, metrics and key/value pairs.
- **One primary action per view.** The solid `primary` button is the single main action of a page,
  dialog or card.
- **Hierarchy through size and ink, not weight.** Only weights 400 and 500 are used.
- **Light and dark through one class.** Every color is a CSS variable; `class="dark"` on `<html>` swaps
  the palette. Components never branch on the theme.
- **Router and state agnostic.** No global store, no router dependency, no data fetching. Components are
  controlled through props (`value` / `onValueChange`, `open` / `onOpenChange`, or `default*` for
  uncontrolled use) and links go through a pluggable link component.

## Install

Requirements:

- `react` and `react-dom` 19. Components take `ref` as a regular prop, so React 18 is not supported.
- An ESM toolchain (Vite, Next.js, any modern bundler). The package is ESM only, with one module per
  component, so unused components are tree-shaken.
- `tailwindcss` 4.1 or later, only if your app compiles `ferry-ui/theme.css` itself
  (see [CSS setup](#css-setup)).
- `recharts` 3.10 or later, only if your app draws charts (see [Charts](#charts)).

Radix UI, lucide-react, cmdk, sonner and the class helpers are regular dependencies and are installed
with the package. Everything is imported from the package root (`import { Button } from 'ferry-ui'`); deep
imports into `ferry-ui/dist` are not part of the API.

### From npm

```sh
npm install ferry-ui
```

### From a local checkout

To try a version that is not released, build a tarball and install it. `npm pack` runs the build first
(`prepack`).

```sh
# in the ferry-ui checkout
npm install
npm pack                                # writes ferry-ui-<version>.tgz

# in your app
npm install ../ferry-ui/ferry-ui-0.1.0.tgz
```

To work on ferry-ui and an app side by side, install the folder itself (`npm install ../ferry-ui`). npm then
creates a symlink, so two rules apply: run `npm run build` in ferry-ui after each change (the app consumes
`dist/`), and make your bundler use a single copy of React (with Vite:
`resolve: { dedupe: ['react', 'react-dom'] }`).

### From a git repository

`dist/` is not committed, so a git dependency has to build itself during installation. npm does that
with a `prepare` script only; ferry-ui builds in `prepack`, which npm does not run for git dependencies.
Until a `prepare` script is added, install from npm, or from a checkout:

```sh
git clone https://github.com/Carter2307/ferry-ui.git
cd ferry-ui && npm ci && npm pack          # writes ferry-ui-<version>.tgz
cd ../my-app && npm install ../ferry-ui/ferry-ui-0.1.0.tgz
```

## CSS setup

ferry-ui has four stylesheet entry points:

| Entry | Content | Use it when |
| --- | --- | --- |
| `ferry-ui/theme.css` | Tokens, their Tailwind v4 theme mapping, the `dark` variant, base styles and utilities | Your app uses Tailwind CSS v4 |
| `ferry-ui/styles.css` | Precompiled CSS: Tailwind preflight, tokens and every class the components use | Your app does not use Tailwind |
| `ferry-ui/fonts.css` | Inter and Source Code Pro webfonts | You want the default typefaces |
| `ferry-ui/tokens.css` | The CSS custom properties only | Another stack needs the tokens (emails, a marketing site) |

### App with Tailwind CSS v4 (recommended)

Import the theme in your main stylesheet, after Tailwind:

```css
@import "tailwindcss";
@import "ferry-ui/fonts.css"; /* optional */
@import "ferry-ui/theme.css";
```

`theme.css` registers ferry-ui's own files as a Tailwind source, so the classes used by the components are
generated without any `@source` or `content` configuration. Your code can then use the same tokens:
`bg-surface-100`, `text-foreground-light`, `border-border-strong`, `rounded-lg`, `shadow-card`,
`mono-label`.

If your project folder is not a git repository, add a `.gitignore` that lists your build output
(`dist`, `.next`…). Tailwind uses it to decide what to scan; without it, classes found in a previous
build end up in the next one.

### App without Tailwind

Import the precompiled stylesheet once, at the root of the app. It includes Tailwind's preflight reset.

```ts
import 'ferry-ui/styles.css'
import 'ferry-ui/fonts.css' // optional
```

Style your own markup with plain CSS and the variables (`var(--surface-100)`, `var(--border-strong)`).
The utilities `mono-label`, `bg-dot-grid`, `tabular` and `scrollbar-none` are available as class names.

## Fonts

The tokens name two families: `--ferry-ui-font-sans` (Inter, then system fonts) and `--ferry-ui-font-mono`
(Source Code Pro, then system monospace).

- `ferry-ui/fonts.css` loads both as variable fonts from the bundled `@fontsource-variable` packages. No
  request goes to a font CDN.
- Skip `fonts.css` to use the system fallbacks.
- To use other typefaces, load them yourself and override the two variables:

```css
:root {
  --ferry-ui-font-sans: "Geist", system-ui, sans-serif;
  --ferry-ui-font-mono: "Geist Mono", ui-monospace, monospace;
}
```

## App setup

Mount the providers once, at the root:

```tsx
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { LinkProvider, ThemeProvider, Toaster, TooltipProvider, type LinkComponent } from 'ferry-ui'

// Defined at module level so it keeps the same identity between renders.
const RouterLink: LinkComponent = ({ href, ...props }) => <Link to={href} {...props} />

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <LinkProvider component={RouterLink}>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </LinkProvider>
    </ThemeProvider>
  )
}
```

| Provider | Role | Required |
| --- | --- | --- |
| `ThemeProvider` | Applies light / dark / system and exposes `useTheme()` | No. Skip it if another library manages the `dark` class |
| `LinkProvider` | Routes ferry-ui links through your router | No. Without it links are plain `<a>` elements |
| `TooltipProvider` | Shared tooltip timing | Yes, for `Tooltip`, `Hint` and every component that shows a tooltip |
| `Toaster` | Outlet for `toast()` | Yes, if you call `toast` or use the copy components |

### React Server Components

Every component, hook and provider module is marked `'use client'`: a server component can render them
directly. The plain helpers stay callable on the server: `cn`, `getErrorMessage`, `themeInitScript`,
`rowLinkProps`, `isMac` / `modKey`. The variant helpers (`buttonVariants`, `badgeVariants`…) live in
client modules, so call them from client components only.

## Theme: light, dark, system

`ThemeProvider` toggles the `dark` class on `<html>`, persists the preference in `localStorage` and
exposes it through `useTheme()`.

| Prop | Default | Meaning |
| --- | --- | --- |
| `defaultTheme` | `'system'` | Preference used when nothing is stored yet: `'light'`, `'dark'` or `'system'` |
| `storageKey` | `'ferry-ui-theme'` | `localStorage` key; `null` disables persistence |
| `theme`, `onThemeChange` | none | Controlled mode, for a preference saved in the user's account |

`useTheme()` returns `{ theme, resolvedTheme, setTheme }`. Bind pickers to `theme`; read
`resolvedTheme` (`'light'` or `'dark'`) for things tokens cannot style, such as a chart library.
`ThemeMenu` is a ready-made picker for the top bar.

### No flash of the wrong theme

React applies the theme after it loads, which is too late for the first paint. `themeInitScript()`
returns a tiny inline script that applies the stored theme before anything renders. Put it in `<head>`
and pass it the same `storageKey` and `defaultTheme` as the provider.

**Next.js (App Router).** `themeInitScript` only builds a string, so the server layout can call it. The
providers live in a client component.

`app/providers.tsx`

```tsx file=app/providers.tsx
'use client'

import type { ReactNode } from 'react'
import NextLink from 'next/link'
import { LinkProvider, ThemeProvider, Toaster, TooltipProvider, type LinkComponent } from 'ferry-ui'

const RouterLink: LinkComponent = ({ href, ...props }) => <NextLink href={href} {...props} />

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LinkProvider component={RouterLink}>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </LinkProvider>
    </ThemeProvider>
  )
}
```

`app/layout.tsx`

```tsx file=app/layout.tsx
import type { ReactNode } from 'react'
import { themeInitScript } from 'ferry-ui'

import { Providers } from './providers'
import './globals.css'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The script sets the class before hydration: tell React the difference is expected.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

**Vite (single-page app).** Inject the script into `index.html` from `vite.config.ts`:

```tsx file=vite.config.ts
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { themeInitScript } from 'ferry-ui'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'ferry-ui-theme-init',
      transformIndexHtml: () => [{ tag: 'script', children: themeInitScript(), injectTo: 'head-prepend' }],
    },
  ],
})
```

## Links and routers

ferry-ui never imports a router. Components that render links (navigation items, cards, breadcrumbs,
command items, back links) take an `href` string and ask `useLinkComponent()` which element to render: a
plain `<a>` by default. Plug your router in once with `LinkProvider`. The adapter receives `href` plus
the usual anchor props and must forward all of them (`className`, `onClick`, `aria-current`, `target`…).
Define it at module level so its identity is stable.

React Router:

```tsx
import { Link } from 'react-router'
import type { LinkComponent } from 'ferry-ui'

export const RouterLink: LinkComponent = ({ href, ...props }) => <Link to={href} {...props} />
```

Next.js:

```tsx
import NextLink from 'next/link'
import type { LinkComponent } from 'ferry-ui'

export const RouterLink: LinkComponent = ({ href, ...props }) => <NextLink href={href} {...props} />
```

TanStack Router:

```tsx
import { Link } from '@tanstack/react-router'
import type { LinkComponent } from 'ferry-ui'

export const RouterLink: LinkComponent = ({ href, ...props }) => <Link to={href} {...props} />
```

ferry-ui hands the adapter a plain string. Routers that type their destinations against the route tree
(TanStack Router, Next.js with `typedRoutes`) may reject it: cast `href` in the adapter, which is the
only place where the two meet.

A single component can override the provider with its `linkComponent` prop. For the links you write
yourself, use your router's `Link` directly. The current page is your router's knowledge: pass it down
as `active: true` on the matching navigation item.

## Theming a product

Override the CSS variables after the ferry-ui import, globally on `:root` / `.dark`. Change the source
tokens (`--primary`, `--surface-100`, `--ferry-ui-radius-md`, `--ferry-ui-font-sans`…), never the shadcn
aliases (`--card`, `--popover`, `--muted`…), which point at them.

```css
@import "tailwindcss";
@import "ferry-ui/theme.css";

:root {
  --primary: oklch(0.55 0.2 290);
  --primary-solid: oklch(0.55 0.2 290);
  --primary-solid-border: oklch(0.48 0.2 290);
  --primary-bright: oklch(0.66 0.2 290);
  --primary-soft: oklch(0.66 0.2 290 / 0.1);
  --ring: oklch(0.55 0.2 290 / 0.75);
  --brand: oklch(0.55 0.2 290);
  --ferry-ui-radius-md: 8px;
}

.dark {
  --primary: oklch(0.75 0.14 290);
  --primary-bright: oklch(0.75 0.14 290);
  --primary-soft: oklch(0.75 0.14 290 / 0.12);
  --ring: oklch(0.75 0.14 290 / 0.7);
}
```

| Group | Variables |
| --- | --- |
| Surfaces | `--background`, `--surface-75`, `--surface-100`, `--surface-200`, `--surface-300`, `--selection`, `--overlay`, `--code-bg` |
| Text | `--foreground`, `--foreground-light`, `--foreground-lighter`, `--foreground-muted` |
| Borders | `--border`, `--border-strong`, `--border-stronger` |
| Primary | `--primary`, `--primary-solid`, `--primary-solid-border`, `--primary-bright`, `--primary-soft`, `--primary-foreground`, `--ring` |
| Brand and charts | `--brand`, `--chart-1` to `--chart-5` |
| Feedback | `--success`, `--warning`, `--destructive`, `--info`, each with a `-soft` companion; `--warning`, `--destructive` and `--info` also have a `-border` (success borders are `border-success/30`); `--destructive-solid` for the confirm button |
| Shape | `--ferry-ui-radius-sm` (4px), `--ferry-ui-radius-md` (6px), `--ferry-ui-radius-lg` (8px), `--ferry-ui-radius-xl` (12px), `--shadow-card`, `--shadow-overlay` |
| Fonts | `--ferry-ui-font-sans`, `--ferry-ui-font-mono` |

### Scoping a theme to a container

The same variables can be set on any container for a scoped brand, with two limits:

- **Aliases do not follow.** The shadcn aliases are resolved on `:root` and inherited as fixed values,
  so `Card` (`bg-card`), `Avatar` fallbacks (`bg-muted`), muted icons and the first chart series
  (`bg-chart-1`) keep the global look.
  In the scope, re-declare the aliases of every token you change, pointing at the same source:
  `--card: var(--surface-100)`, `--popover: var(--surface-300)`, `--secondary: var(--surface-200)`,
  `--muted: var(--surface-200)`, `--muted-foreground: var(--foreground-lighter)`,
  `--accent: var(--selection)`, `--input: var(--border-strong)`, `--chart-1: var(--brand)`, and the
  `--card-foreground`, `--popover-foreground`, `--secondary-foreground`, `--accent-foreground`
  aliases of `--foreground`.
- **Overlays are outside.** Dialogs, sheets, menus, popovers, tooltips and toasts render in `<body>`,
  so a container scope never reaches them: they keep the `:root` / `.dark` theme.

```css
.partner-area {
  --brand: oklch(0.6 0.19 250);
  --chart-1: var(--brand); /* alias of --brand */
  --surface-100: oklch(0.985 0.005 250);
  --card: var(--surface-100); /* alias of --surface-100 */
}
```

The Storybook page [Foundations / Colors](http://localhost:6006/?path=/docs/foundations-colors--docs)
lists every token with its class, variable and live value, and
[Foundations / Theming](http://localhost:6006/?path=/docs/foundations-theming--docs) has live demos of
brand overrides.

## Components

Storybook is the reference: every component has a Docs page with its description, props table, variants
and states. Start it with `npm run storybook`; the links below then open the matching page on
`http://localhost:6006`.

### Foundations

| Page | Content |
| --- | --- |
| [Introduction](http://localhost:6006/?path=/docs/introduction--docs) | Principles, installation, setup |
| [Colors](http://localhost:6006/?path=/docs/foundations-colors--docs) | Every color token with its class, variable and value |
| [Typography](http://localhost:6006/?path=/docs/foundations-typography--docs) | Type scale, weights, mono labels |
| [Radius & Elevation](http://localhost:6006/?path=/docs/foundations-radius-elevation--docs) | Radii, borders, shadows |
| [Utilities](http://localhost:6006/?path=/docs/foundations-utilities--docs) | `mono-label`, `bg-dot-grid`, `tabular`, `scrollbar-none`, focus rings, clipboard helpers |
| [Theming](http://localhost:6006/?path=/docs/foundations-theming--docs) | Theme switch, token overrides, router links |

### Primitives

| Component | Use it for |
| --- | --- |
| [Button](http://localhost:6006/?path=/docs/primitives-button--docs) | Actions: nine variants, text and icon sizes, loading state |
| [Badge](http://localhost:6006/?path=/docs/primitives-badge--docs) | Short static tags: a plan, a version, a count |
| [Input](http://localhost:6006/?path=/docs/primitives-input--docs) | Single-line text fields |
| [Textarea](http://localhost:6006/?path=/docs/primitives-textarea--docs) | Multi-line text fields that grow with their content |
| [Label](http://localhost:6006/?path=/docs/primitives-label--docs) | Accessible form labels |
| [Checkbox](http://localhost:6006/?path=/docs/primitives-checkbox--docs) | Choices applied on submit, row selection |
| [Switch](http://localhost:6006/?path=/docs/primitives-switch--docs) | Settings that apply immediately |
| [Radio Group](http://localhost:6006/?path=/docs/primitives-radio-group--docs) | One choice among a few visible options |
| [Select](http://localhost:6006/?path=/docs/primitives-select--docs) | One value from a short list |
| [Toggle](http://localhost:6006/?path=/docs/primitives-toggle--docs) | A button that stays pressed |
| [Toggle Group](http://localhost:6006/?path=/docs/primitives-toggle-group--docs) | Segmented controls |
| [Tabs](http://localhost:6006/?path=/docs/primitives-tabs--docs) | Panels inside one view |
| [Dialog](http://localhost:6006/?path=/docs/primitives-dialog--docs) | Modal tasks and forms |
| [Alert Dialog](http://localhost:6006/?path=/docs/primitives-alert-dialog--docs) | Confirmations with a custom layout |
| [Sheet](http://localhost:6006/?path=/docs/primitives-sheet--docs) | Side panels |
| [Popover](http://localhost:6006/?path=/docs/primitives-popover--docs) | Small anchored forms and pickers |
| [Dropdown Menu](http://localhost:6006/?path=/docs/primitives-dropdown-menu--docs) | Menus of actions and options |
| [Tooltip](http://localhost:6006/?path=/docs/primitives-tooltip--docs) | Hints on hover and focus (`Hint`) |
| [Command](http://localhost:6006/?path=/docs/primitives-command--docs) | Searchable lists, comboboxes |
| [Card](http://localhost:6006/?path=/docs/primitives-card--docs) | Bordered containers |
| [Table](http://localhost:6006/?path=/docs/primitives-table--docs) | Data tables |
| [Avatar](http://localhost:6006/?path=/docs/primitives-avatar--docs) | People and organizations |
| [Breadcrumb](http://localhost:6006/?path=/docs/primitives-breadcrumb--docs) | Hierarchy trails |
| [Collapsible](http://localhost:6006/?path=/docs/primitives-collapsible--docs) | Show / hide regions |
| [Scroll Area](http://localhost:6006/?path=/docs/primitives-scroll-area--docs) | Bounded scrolling with a themed scrollbar |
| [Separator](http://localhost:6006/?path=/docs/primitives-separator--docs) | Hairline dividers |
| [Skeleton](http://localhost:6006/?path=/docs/primitives-skeleton--docs) | Loading placeholders |
| [Toaster](http://localhost:6006/?path=/docs/primitives-toaster--docs) | Transient feedback (`toast`) |

### Patterns

| Component | Use it for |
| --- | --- |
| [Page](http://localhost:6006/?path=/docs/patterns-page--docs) | `PageContainer`, `PageHeader`, `PageBackLink`, `PageSection`: the page column and its titles |
| [List Toolbar](http://localhost:6006/?path=/docs/patterns-list-toolbar--docs) | `ListToolbar`, `SearchInput`, `FilterMenu`, `FilterButton`: the row above a list |
| [Table States](http://localhost:6006/?path=/docs/patterns-table-states--docs) | `TableSkeletonRows`, `TableMessageRow`, `TableErrorRow`, `rowLinkProps`: table states and clickable rows |
| [Empty State](http://localhost:6006/?path=/docs/patterns-empty-state--docs) | `EmptyState`, `ErrorState`: nothing to show, or a load that failed |
| [Callout](http://localhost:6006/?path=/docs/patterns-callout--docs) | `Callout`, `StaleDataCallout`: persistent inline messages |
| [Confirm Dialog](http://localhost:6006/?path=/docs/patterns-confirm-dialog--docs) | Confirmation of destructive or impactful actions, with async handling |
| [Form Card](http://localhost:6006/?path=/docs/patterns-form-card--docs) | `FormCard`, `FormRow`, `FormActions`, `ActionRow`: settings forms and danger zones |
| [Field](http://localhost:6006/?path=/docs/patterns-field--docs) | Stacked label + control + hint or error |
| [Save Bar](http://localhost:6006/?path=/docs/patterns-save-bar--docs) | Unsaved-changes footer for editors and long forms |
| [Key Value Editor](http://localhost:6006/?path=/docs/patterns-key-value-editor--docs) | Editable key/value lists with validation, masking and bulk import |
| [Radio Card Group](http://localhost:6006/?path=/docs/patterns-radio-card-group--docs) | One choice among options that need a description |
| [Copy](http://localhost:6006/?path=/docs/patterns-copy--docs) | `CopyButton`, `CopyField`, `SecretField` |
| [Code Block](http://localhost:6006/?path=/docs/patterns-code-block--docs) | Commands and snippets with a copy button |
| [Description List](http://localhost:6006/?path=/docs/patterns-description-list--docs) | Read-only facts about one record |
| [Info Tile](http://localhost:6006/?path=/docs/patterns-info-tile--docs) | Overview tiles: icon, label, value |
| [Metric Card](http://localhost:6006/?path=/docs/patterns-metric-card--docs) | `MetricCard`, `MetricTrend`, `UsageBar`, `LegendDot`: KPI numbers |
| [Usage Breakdown](http://localhost:6006/?path=/docs/patterns-usage-breakdown--docs) | A capacity split between its parts: segmented bar and rows with amounts and shares |
| [Resource Card](http://localhost:6006/?path=/docs/patterns-resource-card--docs) | `ResourceGrid`, `ResourceCard`: browsable collections |
| [Status](http://localhost:6006/?path=/docs/patterns-status--docs) | `StatusBadge`, `StatusDot`, `StatusLine`: the state of a record |
| [Icon Box](http://localhost:6006/?path=/docs/patterns-icon-box--docs) | The outlined icon square in front of a name |
| [Split Button](http://localhost:6006/?path=/docs/patterns-split-button--docs) | A default action plus a menu of alternatives |
| [Mono Label](http://localhost:6006/?path=/docs/patterns-mono-label--docs) | The uppercase monospace caption |
| [Kbd](http://localhost:6006/?path=/docs/patterns-kbd--docs) | Keyboard key hints |

### Layout

| Component | Use it for |
| --- | --- |
| [App Shell](http://localhost:6006/?path=/docs/layout-app-shell--docs) | The application frame: top bar, rail, scrolling main region, mobile drawer |
| [Top Bar](http://localhost:6006/?path=/docs/layout-top-bar--docs) | Logo, trail of segments, search trigger, icon buttons, user menu |
| [Icon Rail](http://localhost:6006/?path=/docs/layout-icon-rail--docs) | Primary navigation on desktop |
| [Mobile Nav](http://localhost:6006/?path=/docs/layout-mobile-nav--docs) | Primary navigation on phones |
| [Inner Menu](http://localhost:6006/?path=/docs/layout-inner-menu--docs) | Secondary navigation of one area |
| [Command Menu](http://localhost:6006/?path=/docs/layout-command-menu--docs) | The app-wide command palette |
| [Resource Switcher](http://localhost:6006/?path=/docs/layout-resource-switcher--docs) | Searchable switcher between projects, workspaces, teams |
| [Theme Menu](http://localhost:6006/?path=/docs/layout-theme-menu--docs) | Light / dark / system picker |

### Charts

Charts draw with [recharts](https://recharts.org), an optional peer dependency: install it only if your
app draws charts, and import the charts from their own entry point. `ferry-ui` itself never imports
recharts.

```sh
npm install recharts
```

```ts
import { TimeSeriesChart } from 'ferry-ui/charts'
```

| Component | Use it for |
| --- | --- |
| [Time Series Chart](http://localhost:6006/?path=/docs/charts-time-series-chart--docs) | `TimeSeriesChart`: values over time (CPU, memory, requests, latency) in a `MetricCard` |
| [Chart](http://localhost:6006/?path=/docs/charts-chart--docs) | `ChartContainer`, `ChartTooltipContent`, `ChartLegendContent`, `ChartLegendList`: any other recharts chart, on the tokens |

### Examples

Full screens built only from the public exports. Read their source in `src/examples` to see how the
pieces fit together.

| Example | Shows |
| --- | --- |
| [Dashboard](http://localhost:6006/?path=/docs/examples-dashboard--docs) | The application frame, info tiles, metric cards, a resource grid, a command menu |
| [List Page](http://localhost:6006/?path=/docs/examples-list-page--docs) | Toolbar, search and filters, table with loading and empty states, row menus |
| [Detail Page](http://localhost:6006/?path=/docs/examples-detail-page--docs) | Page header with status, description list, tabs, secret fields, confirmations |
| [Settings](http://localhost:6006/?path=/docs/examples-settings--docs) | Inner menu, form cards, validation, save actions, danger zone |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run storybook` | Starts Storybook on http://localhost:6006 |
| `npm run build-storybook` | Builds the static Storybook into `storybook-static/` |
| `npm run build` | Builds the package into `dist/`: ESM modules, type declarations, stylesheets, precompiled `styles.css` |
| `npm run typecheck` | Type-checks the sources, stories and configs (`tsc --noEmit`) |
| `npm run lint` | Runs ESLint |
| `npm run test` | Runs Vitest once: every story (render + `play`), the barrel test and the unit tests |
| `npm run test:watch` | Runs Vitest in watch mode |
| `npm run check:docs` | Type-checks the `tsx` snippets of this file, of AGENTS.md and of the Storybook introduction, and verifies that AGENTS.md mentions every public export |
| `npm run check` | `typecheck`, `lint`, `test` and `check:docs` in sequence |
| `npm run site:dev` | Starts the documentation site (landing page and docs) on http://localhost:5181 |
| `npm run site:build` | Builds the documentation site into `site/dist/` as static pages |
| `npm run site:verify` | Type-checks the site, renders every demo, checks the writing rules and the links, then builds |

Run the stories of a few files only:

```sh
STORIES=primitives/button,patterns/empty-state npx vitest run src/stories.test.tsx
```

## Project structure

```text
ferry-ui/
├─ src/
│  ├─ index.ts                  public barrel: everything an app may import
│  ├─ charts.ts                 `ferry-ui/charts` barrel: the charts (they need recharts)
│  ├─ styles/                   tokens.css, theme.css, fonts.css, standalone.css
│  ├─ theme/                    ThemeProvider, useTheme, themeInitScript
│  ├─ lib/                      cn, getErrorMessage, link contract, platform constants
│  ├─ hooks/                    useCopy, useCommandShortcut, useIsMac / useModKey
│  ├─ components/
│  │  ├─ primitives/            building blocks on Radix UI, one file per component
│  │  ├─ patterns/              compositions of primitives
│  │  ├─ layout/                application-shell pieces
│  │  └─ charts/                charts on recharts, exported by charts.ts only
│  ├─ foundations/              Storybook pages: introduction, colors, typography, theming…
│  ├─ examples/                 full-screen example pages (`*-example.tsx`) and their stories
│  ├─ stories.test.tsx          smoke test: renders every story and runs its play function
│  └─ index.test.ts             checks that every public module is exported by the barrel
├─ scripts/                     build helpers and the docs check
├─ site/                        documentation site: landing page and docs, built with ferry-ui (see site/README.md)
├─ .storybook/                  Storybook configuration
├─ AGENTS.md                    reference for AI coding agents
└─ dist/                        build output (not committed)
```

Each component file sits next to its stories: `button.tsx` and `button.stories.tsx`.

## Contributing

The full rules are in [AGENTS.md, section 10](./AGENTS.md#10-extending-ferry-ui); they apply to people and
agents alike. In short, to add a component:

1. **Pick the layer.** A primitive wraps one Radix part or HTML element. A pattern composes primitives
   for a recurring product need. A layout piece belongs to the application shell.
2. **Create the files** in that folder, in kebab-case: `timeline.tsx` and `timeline.stories.tsx`.
3. **Write the component** like its neighbours: function component with `ref` as a regular prop,
   relative imports, `cn()` with `className` merged last, a `data-slot` attribute, token classes only,
   `cva` for variants, controlled and uncontrolled state props, links through `useLinkComponent`.
   Nothing product specific, no router, no store, no data fetching.
4. **Document it in JSDoc**, on the component and on every prop: what it is, when to use it, when not
   to (and what to use instead), the defaults. Storybook renders this text.
5. **Write the stories** (CSF3, `satisfies Meta<typeof Component>`):
   - a title in the right section (`Primitives/…`, `Patterns/…`, `Layout/…`, `Charts/…`);
   - `parameters.docs.description.component` with usage guidance;
   - a `Default` story driven by `args`;
   - one story per variant, size and state, then compositions;
   - `fn()` for callbacks and a `play` test for interactive behavior;
   - generic example data (projects, members, invoices, API keys, orders).
6. **Export it** from `src/index.ts` with `export * from './components/<layer>/<file>'` (a chart: from
   `src/charts.ts`).
7. **Add it to AGENTS.md** (catalog entry and snippet) and to the table above.
8. **Run the checks**:

```sh
npm run typecheck
npm run lint
STORIES=patterns/timeline npx vitest run src/stories.test.tsx
npm run check:docs
```

Before opening a pull request, run `npm run check` and `npm run build`.

## Documentation for AI agents

- [AGENTS.md](./AGENTS.md): the rules for building UI with ferry-ui, a decision table (which component for
  which job), recipes for common screens, the catalog of every export with its props, the token cheat
  sheet, accessibility rules and the contributor conventions. Its snippets are type-checked by
  `npm run check:docs`.
- [CLAUDE.md](./CLAUDE.md): points Claude Code at AGENTS.md.
- [llms.txt](./llms.txt): an index of the documentation in the [llms.txt](https://llmstxt.org) format.

The package ships README.md and AGENTS.md, so an agent working in an app can read
`node_modules/ferry-ui/AGENTS.md`.

## License

MIT
