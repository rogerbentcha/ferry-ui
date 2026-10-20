# ferry-ui: guide for AI coding agents

ferry-ui is a React 19 design system for dense product interfaces (dashboards, admin consoles, settings
pages, data tables, developer tools): design tokens, accessible primitives on Radix UI, higher-level
patterns and application-shell layout pieces, styled with Tailwind CSS v4.

This file is the authoritative reference for building UI **with** ferry-ui and for contributing **to** it.
Follow it over your defaults. Every `tsx` snippet below is type-checked against the current sources
(`npm run check:docs`), and every public export is listed in the catalog (section 7).

| Section | Read it when |
| --- | --- |
| [1. Rules](#1-rules) | Always, before writing any UI |
| [2. App setup](#2-app-setup) | Wiring ferry-ui into an app (CSS, providers, router) |
| [3. Design language](#3-design-language) | Choosing sizes, spacing, type |
| [4. Tokens](#4-tokens) | Writing any class that sets a color, radius, shadow or font |
| [5. Which component for which job](#5-which-component-for-which-job) | Picking a component |
| [6. Recipes](#6-recipes) | Building a whole screen |
| [7. Catalog](#7-catalog) | Looking up exports, props and allowed values |
| [8. Accessibility](#8-accessibility) | Before finishing any screen |
| [9. Do and don't](#9-do-and-dont) | Reviewing your own output |
| [10. Extending ferry-ui](#10-extending-ferry-ui) | Adding or changing a component in this repository |

## 1. Rules

1. **Import from the package root only.** `import { Button, cn } from 'ferry-ui'`. Never import from
   `ferry-ui/dist/...` and never copy a ferry-ui component into the app. The only other entry points are
   `ferry-ui/charts` (the charts of section 7.7, which need `recharts`) and the stylesheets:
   `ferry-ui/theme.css`, `ferry-ui/styles.css`, `ferry-ui/fonts.css`, `ferry-ui/tokens.css`. Icons come
   from `lucide-react`.
2. **Look in the catalog before writing markup.** Compose existing primitives and patterns. Build a new
   component only when nothing in sections 5 and 7 fits, and build it from ferry-ui primitives and tokens.
3. **Tokens only.** Colors, radii, shadows and fonts come from the token classes of section 4
   (`bg-surface-100`, `text-foreground-light`, `border-border-strong`). Never write raw colors (`#fff`,
   `rgb()`, `oklch()`), Tailwind palette classes (`bg-white`, `text-gray-600`, `bg-blue-500`) or
   per-theme color forks (`dark:bg-…` with a palette color). Tokens switch with the theme on their own.
4. **One primary action per view.** At most one `<Button variant="primary">` per page, dialog or card.
   Other actions use `default`, `outline` or `ghost`. Destructive actions use `destructive` and are
   confirmed by a `ConfirmDialog` (whose confirm button is `destructive-solid`).
5. **Use the built-in sizes and variants.** Do not set heights, paddings, font sizes or colors on
   controls (`Button`, `Input`, `Select`, `Badge`, `Toggle`, `Tabs`…) through `className`; pick a `size`
   / `variant` / `tone` instead. On a control, `className` is for layout: margin, width, grid placement,
   `max-w-*`. Containers and slots (`Card` parts, `TableCell`, `PopoverContent`, `ScrollArea`, `Avatar`,
   `AvatarBadge`, `Skeleton`) take the token classes shown in their catalog entry.
6. **Two font weights.** `font-normal` (400) and `font-medium` (500). No bold. Hierarchy comes from size
   and from the foreground step (`foreground` → `foreground-light` → `foreground-lighter` →
   `foreground-muted`).
7. **Borders give structure, shadows mean floating.** Cards and tables use a 1px `border` (plus the
   built-in, barely visible `shadow-card`). `shadow-overlay` is reserved for menus, popovers and dialogs.
8. **Radius encodes role.** `rounded-md` (6px) for controls, `rounded-lg` (8px) for containers,
   `rounded-sm` (4px) for chips, `rounded-full` for pills and avatars.
9. **State lives in props.** Every stateful component is controlled (`value` + `onValueChange`, `open` +
   `onOpenChange`, `checked` + `onCheckedChange`) or uncontrolled (`defaultValue`, `defaultOpen`,
   `defaultChecked`). ferry-ui has no store, fetches nothing and knows no router.
10. **Links are `href` strings.** Components that navigate take `href` and render it through the app's
    link component (`LinkProvider`, section 2). Do not wrap a ferry-ui component in a router link, and do not
    pass router objects. For links you write yourself, use your router's own `Link`.
11. **Mount the providers once.** `TooltipProvider` is required by `Tooltip`, `Hint` and every component
    that shows a tooltip (icon-only `CopyButton`, `SecretField`, `CodeBlock`, `KeyValueEditor`,
    `MetricCard` with `info`, `SaveBar` with an `extraAction` hint, `IconRail`, `ThemeMenu`,
    `TopBarIconButton`). `Toaster` is required by `toast` and by everything that copies (`useCopy`,
    `CopyButton`, `CopyField`, `SecretField`, `CodeBlock` report clipboard failures in a toast).
12. **Every interactive element has an accessible name** and every dialog a title (section 8).
13. **Buttons default to `type="button"`.** Set `type="submit"` on the submit button of a form.
14. **Generic content.** Example and placeholder data use neutral product vocabulary: projects, members,
    invoices, API keys, orders, customers.

## 2. App setup

### Requirements

- `react` and `react-dom` 19 (components take `ref` as a regular prop; React 18 is not supported).
- ESM only. One module per component, tree-shakeable.
- `tailwindcss` 4.1 or later, only when the app compiles `ferry-ui/theme.css` itself.
- `recharts` 3.10 or later, only when the app imports `ferry-ui/charts` (an optional peer dependency:
  `npm install recharts`). `ferry-ui` itself never imports it.

### CSS

App that uses Tailwind CSS v4 (preferred: the app can use the same tokens in its own classes):

```css
@import "tailwindcss";
@import "ferry-ui/fonts.css"; /* optional: Inter + Source Code Pro */
@import "ferry-ui/theme.css";
```

`theme.css` maps the tokens onto Tailwind theme names, declares the class-based `dark` variant, adds the
utilities `mono-label`, `bg-dot-grid`, `tabular`, `scrollbar-none`, and registers ferry-ui's own files as a
Tailwind source, so the classes used by the components are generated without extra configuration.

App without Tailwind: import the precompiled stylesheet once (it includes Tailwind's preflight reset).
The app then styles its own markup with plain CSS and the variables of section 4.

```ts
import 'ferry-ui/styles.css'
import 'ferry-ui/fonts.css' // optional
```

`ferry-ui/tokens.css` contains only the CSS custom properties (no Tailwind), for other stacks.

### Providers

```tsx
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { LinkProvider, ThemeProvider, Toaster, TooltipProvider, type LinkComponent } from 'ferry-ui'

// Module level, so the component identity is stable between renders.
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

- `ThemeProvider` toggles `class="dark"` on `<html>` and persists the preference in `localStorage`
  (key `ferry-ui-theme`). Add `<script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />` to
  `<head>` to avoid a flash of the wrong theme; pass it the same `storageKey` and `defaultTheme`.
- `LinkProvider` is optional: without it ferry-ui renders plain `<a>` elements. A component's own
  `linkComponent` prop overrides the provider for that component.
- Next.js adapter: `({ href, ...props }) => <NextLink href={href} {...props} />`. TanStack Router adapter:
  `({ href, ...props }) => <Link to={href} {...props} />`.

### React Server Components

Every component, hook and provider module starts with `'use client'`. A server component may render them
and pass serializable props, but may not call their helpers. These exports are plain modules and can be
**called** on the server: `cn`, `getErrorMessage`, `themeInitScript`, `DEFAULT_THEME_STORAGE_KEY`,
`rowLinkProps`, `isMac`, `modKey`. The variant helpers (`buttonVariants`, `badgeVariants`,
`inputVariants`, `tabsListVariants`, `toggleVariants`, `statusBadgeVariants`, `iconBoxVariants`) live in
client modules: call them from client components only. In server-rendered markup use `useIsMac()` /
`useModKey()` instead of the `isMac` / `modKey` constants (on a server those describe the server's OS).

## 3. Design language

- **Dense and calm.** 13px for most UI copy, 14px for body text and field values, compact controls,
  generous space between sections (40px between page sections) rather than inside rows.
- **Control heights** line up across components:

  | Height | `Button` `size` | `Input` `size` | `SelectTrigger` `size` | `Toggle` / `ToggleGroup` `size` |
  | --- | --- | --- | --- | --- |
  | 26px | `tiny`, `icon-tiny` | `tiny` | `tiny` | `tiny` |
  | 30px | `sm` (default), `icon` | `sm` | `sm` | `sm` (default) |
  | 34px | `md`, `icon-md` | `md` (default) | `md` (default) | `md` |
  | 38px | `lg`, `icon-lg` | `lg` | n/a | n/a |

  Toolbars and table rows use 30px controls, form fields 34px, dense inline actions 26px. Every sized
  component uses the same names (`tiny`, `sm`, `md`, `lg`): `Switch` is `sm` / `md`, `Avatar` is `sm` /
  `md` / `lg`.
- **Type scale.** Page title 24 to 26px (`PageHeader`), section title 18 to 20px (`PageSection`), card
  and dialog titles 14 to 16px medium, body 14px, secondary copy 13px, captions 11.5px uppercase mono
  (`MonoLabel`), badges 10.5px uppercase.
- **Signature caption.** Small uppercase monospace labels (`MonoLabel` or the `mono-label` class) name
  cards, table columns, metrics, menu groups and key/value pairs. Keep them to 1 to 4 words.
- **Color is meaning.** Neutral surfaces everywhere; `primary` for the main action, links and focus;
  `success` / `warning` / `destructive` / `info` only for status and feedback.
- **Icons.** `lucide-react` line icons. Components size them (usually 16px): pass `<Plus />`, not
  `<Plus className="size-4" />`, unless you need another size.
- **Page layout.** `AppShell` > `PageContainer` > `PageHeader` + `PageSection`s. Grids use `gap-4`,
  stacked blocks `gap-4` to `gap-6`.

## 4. Tokens

With Tailwind, a color token `x` gives `bg-x`, `text-x`, `border-x`, `ring-x`, `fill-x`, `stroke-x`,
`divide-x` and opacity forms (`bg-destructive/10`). Without Tailwind, use the CSS variable. Light values
are on `:root`, dark values on `.dark`.

### Surfaces

| Tailwind class | CSS variable | Meaning |
| --- | --- | --- |
| `bg-background` | `--background` | Page canvas behind everything |
| `bg-surface-75` | `--surface-75` | Recessed strips: card footers, save bars, hovered cards |
| `bg-surface-100` | `--surface-100` | Cards, panels, inputs, default buttons |
| `bg-surface-200` | `--surface-200` | Translucent fill: hover and pressed states, table headers, neutral chips |
| `bg-surface-300` | `--surface-300` | Raised overlays: menus, popovers, dialogs, tooltips |
| `bg-selection` | `--selection` | Selected table row, active navigation item |
| `bg-overlay` | `--overlay` | Scrim behind dialogs and sheets |
| `bg-code` | `--code-bg` | Sunken surface for code samples you style yourself (`CodeBlock` uses `surface-200`) |

### Text

| Tailwind class | CSS variable | Meaning |
| --- | --- | --- |
| `text-foreground` | `--foreground` | Primary text: titles, values, body copy |
| `text-foreground-light` | `--foreground-light` | Secondary text: descriptions, inactive items |
| `text-foreground-lighter` | `--foreground-lighter` | Captions, mono labels, table headers, icons |
| `text-foreground-muted` | `--foreground-muted` | Decorative marks only (separators, prompt characters, idle icons). Too faint for text that must be read: placeholders and metadata use `foreground-lighter` |

### Borders

| Tailwind class | CSS variable | Meaning |
| --- | --- | --- |
| `border` (default color) | `--border` | Cards, dividers, table rows, section separators |
| `border-border-strong` | `--border-strong` | Controls (inputs, buttons, selects), overlay outlines |
| `border-border-stronger` | `--border-stronger` | Hover state of controls, dashed outlines |

Every element's default border color is `--border`: write `border`, `border-t`, `divide-y` with no color.

### Primary and brand

| Tailwind class | CSS variable | Meaning |
| --- | --- | --- |
| `text-primary` | `--primary` | Links, active icons, selected text |
| `bg-primary-solid` | `--primary-solid` | Fill of the primary button, checked checkbox, radio and switch |
| `border-primary-solid-border` | `--primary-solid-border` | Border of solid primary fills |
| `border-primary-bright` | `--primary-bright` | Focused field border, highlights |
| `bg-primary-soft` | `--primary-soft` | Soft tint: counters, selected cards, text selection |
| `text-primary-foreground` | `--primary-foreground` | Text and icons on `primary-solid` |
| `bg-brand` | `--brand` | Logo marks, first chart series. Product specific |

### Feedback

| Tailwind class | CSS variable | Meaning |
| --- | --- | --- |
| `text-success` | `--success` | Healthy, completed, paid, online |
| `bg-success-soft` | `--success-soft` | Success badge and callout fill |
| `text-warning` | `--warning` | Degraded, needs attention, expiring soon |
| `bg-warning-soft` | `--warning-soft` | Warning badge and callout fill |
| `border-warning-border` | `--warning-border` | Warning badge and callout border |
| `text-destructive` | `--destructive` | Errors, failed states, destructive ink |
| `bg-destructive-solid` | `--destructive-solid` | Confirm button of destructive dialogs only |
| `bg-destructive-soft` | `--destructive-soft` | Error callout and danger-zone fill |
| `border-destructive-border` | `--destructive-border` | Error callout and destructive button border |
| `text-info` | `--info` | In progress, informational |
| `bg-info-soft` | `--info-soft` | Info badge and callout fill |
| `border-info-border` | `--info-border` | Info badge and callout border |

### shadcn aliases, charts, focus

These aliases point at the tokens above so stock shadcn/ui classes keep working. Prefer the ferry-ui names
in new code, and never override the aliases when theming (override the source token).

| Tailwind class | CSS variable | Resolves to |
| --- | --- | --- |
| `bg-card`, `text-card-foreground` | `--card`, `--card-foreground` | `surface-100`, `foreground` |
| `bg-popover`, `text-popover-foreground` | `--popover`, `--popover-foreground` | `surface-300`, `foreground` |
| `bg-secondary`, `text-secondary-foreground` | `--secondary`, `--secondary-foreground` | `surface-200`, `foreground` |
| `bg-muted`, `text-muted-foreground` | `--muted`, `--muted-foreground` | `surface-200`, `foreground-lighter` |
| `bg-accent`, `text-accent-foreground` | `--accent`, `--accent-foreground` | `selection`, `foreground` |
| `border-input` | `--input` | `border-strong` |
| `ring-ring` | `--ring` | Focus ring color (translucent primary) |
| `bg-chart-1` … `bg-chart-5` | `--chart-1` … `--chart-5` | Chart series (`chart-1` is `brand`) |

### Radius, elevation, fonts, utilities

| Tailwind class | CSS variable | Meaning |
| --- | --- | --- |
| `rounded-sm` | `--ferry-ui-radius-sm` (4px) | Chips, square badges, keycaps |
| `rounded-md` | `--ferry-ui-radius-md` (6px) | Controls: buttons, inputs, navigation items |
| `rounded-lg` | `--ferry-ui-radius-lg` (8px) | Containers: cards, tables, popovers, dialogs |
| `rounded-xl` | `--ferry-ui-radius-xl` (12px) | Large standalone panels (rare) |
| `rounded-full` | n/a | Pills, avatars, dots |
| `shadow-card` | `--shadow-card` | Resting cards (almost invisible; none in dark mode) |
| `shadow-overlay` | `--shadow-overlay` | Floating layers: menus, popovers, dialogs, toasts |
| `font-sans` | `--ferry-ui-font-sans` | Inter, then system fonts |
| `font-mono` | `--ferry-ui-font-mono` | Source Code Pro, then system monospace |
| `mono-label` | n/a | 11.5px uppercase mono caption in `foreground-lighter` |
| `tabular` | n/a | Tabular figures for numbers that align or update |
| `bg-dot-grid` | n/a | Dotted-grid canvas background |
| `scrollbar-none` | n/a | Hides the scrollbar, keeps scrolling |

Focus ring of a custom interactive element: `outline-none focus-visible:ring-2 focus-visible:ring-ring`.

### Theming a product

Override the source variables after the ferry-ui import, on `:root` / `.dark`. Do not edit ferry-ui and do not
override the shadcn aliases. The variables can also be set on a container to scope a brand to it, with
two limits: the shadcn aliases and `--chart-1` are resolved on `:root`, so re-declare in the scope the
aliases of every token you change (`--card: var(--surface-100)`, `--chart-1: var(--brand)`…), and
overlays (dialogs, menus, popovers, tooltips, toasts) render in `<body>`, outside the scope.

```css
:root {
  --primary: oklch(0.55 0.2 290);
  --primary-solid: oklch(0.55 0.2 290);
  --primary-solid-border: oklch(0.48 0.2 290);
  --primary-bright: oklch(0.66 0.2 290);
  --primary-soft: oklch(0.66 0.2 290 / 0.1);
  --ring: oklch(0.55 0.2 290 / 0.75);
  --brand: oklch(0.55 0.2 290);
}
.dark {
  --primary: oklch(0.75 0.14 290);
  --primary-bright: oklch(0.75 0.14 290);
  --primary-soft: oklch(0.75 0.14 290 / 0.12);
  --ring: oklch(0.75 0.14 290 / 0.7);
}
```

## 5. Which component for which job

### Actions

| Need | Use | Not |
| --- | --- | --- |
| The main action of a page, dialog or card | `Button variant="primary"` (one per view) | Several primary buttons |
| A secondary action | `Button` (`default`), `outline` on tinted surfaces, `ghost` in dense rows | `primary` |
| An icon-only action | `Button size="icon"` + `aria-label`, wrapped in `Hint` | A bare `<button>` or clickable `<div>` |
| A destructive action | `Button variant="destructive"` that opens a `ConfirmDialog` | Deleting on click |
| A default action plus a few alternatives | `SplitButton` | Two buttons side by side |
| Row or card actions | `DropdownMenu` on a `ghost` icon button | Inline button rows |
| Copy a value | `CopyButton`, `CopyField`, `SecretField` (secrets), `CodeBlock` (commands, snippets) | A hand-written clipboard handler |
| An app-wide command palette (mod+K) | `CommandMenu` | `Dialog` + `Input` |
| A keyboard hint | `Kbd` with `useModKey()` | Plain text |

### Forms

| Need | Use | Not |
| --- | --- | --- |
| A settings page section (label left, control right) | `FormCard` + `FormRow` + `FormActions` | `Card` with hand-made rows |
| A stacked field (dialog, popover, sign-in) | `Field` wrapping the control | Hand-wired `Label` + ids |
| One-click account actions and the danger zone | `FormCard asDiv` + `ActionRow` (`tone="destructive"`) | `FormRow` |
| Single line of text | `Input` (`mono` for identifiers, keys, URLs) | `Textarea` |
| Multiple lines | `Textarea` | `Input` |
| One value among 4 to 15 options | `Select` | `RadioGroup` |
| One value among 2 to 5 visible options | `RadioGroup` | `Select` |
| One value among 2 to 6 options that need a description or icon | `RadioCardGroup` | `RadioGroup` |
| One value in a long or searchable list | `Command` inside a `Popover` | `Select` |
| A setting applied immediately | `Switch` | `Checkbox` |
| A choice applied on submit, or multi-select | `Checkbox` | `Switch` |
| A compact view or format switch | `ToggleGroup type="single"` | `Tabs` |
| A pressed/unpressed toolbar button | `Toggle` | `Switch` |
| A free-form key/value map | `KeyValueEditor` + `useKeyValueRows` | A table of inputs |
| Sticky save footer for a long form or editor | `SaveBar` | `FormActions` |

### Overlays

| Need | Use | Not |
| --- | --- | --- |
| A focused task or form | `Dialog` | `AlertDialog` |
| Confirm a destructive or impactful action | `ConfirmDialog` (or `AlertDialog` for a custom layout) | `Dialog`, `window.confirm` |
| A side panel that keeps the page visible | `Sheet` | `Dialog` |
| A small form or picker anchored to a trigger | `Popover` | `DropdownMenu` |
| A list of actions | `DropdownMenu` | `Popover`, `Select` |
| A short hint on hover or focus | `Hint` (or `Tooltip` parts) | `Popover`, the `title` attribute |
| Transient feedback after an action | `toast` (`Toaster` mounted once) | `Callout`, `Dialog` |

### Data display

| Need | Use | Not |
| --- | --- | --- |
| Records compared by column | `Table` (+ `TableSkeletonRows`, `TableMessageRow`, `TableErrorRow`) | Cards, `DescriptionList` |
| A browsable collection of named things | `ResourceGrid` + `ResourceCard` | `Table`, `Card` |
| Read-only facts about one record | `DescriptionList` + `DescriptionItem` | `Table`, `FormRow` |
| A few headline facts with icons at the top of a page | `InfoTile` in a grid | `MetricCard` |
| A KPI number (with trend, bar or chart) | `MetricCard`, `MetricTrend`, `UsageBar`, `LegendDot` | `Card`, `InfoTile` |
| A capacity split between its parts (storage by type, seats by team) | `UsageBreakdown` | Several `UsageBar`s |
| Values over time (CPU, requests, latency) | `TimeSeriesChart` in a `MetricCard` (`ferry-ui/charts`) | A hand-made SVG |
| Any other chart (bars by category, a pie) | `ChartContainer` + a recharts chart (`ferry-ui/charts`) | recharts unstyled |
| A legend outside a chart | `ChartLegendList` (series names), `LegendDot` (UPPERCASE caption) | Hand-made swatches |
| The state of a record | `StatusBadge` (pill), `StatusDot` (next to a name), `StatusLine` (sentence) | `Badge` |
| A static tag, plan, version or count | `Badge` | `StatusBadge` |
| A person or organization | `Avatar` (+ `AvatarGroup`) | `IconBox` |
| The kind of an entity (icon in a box) | `IconBox` | `Avatar` |
| A generic bordered container | `Card` | A hand-styled `<div>` |
| A command or code snippet to copy | `CodeBlock` | `<pre>` |
| A small uppercase caption | `MonoLabel` | A custom styled `<span>` |
| A bounded scroll area with a themed scrollbar | `ScrollArea` | Native overflow where it does not matter |

### Feedback and states

| Situation | Use |
| --- | --- |
| First load of a table | `TableSkeletonRows` in the real table |
| First load of a card grid | `ResourceCardSkeleton` in the `ResourceGrid` (`aria-busy`) |
| First load of a value | `loading` on `MetricCard`, `InfoTile`, `DescriptionItem`, `TopBarSegment`; else `Skeleton` |
| An action in flight | `loading` on the `Button` |
| Empty list, first run, no search result | `EmptyState` (inside a table body: `TableMessageRow`) |
| First load failed, nothing to show | `ErrorState` with `onRetry` (inside a table body: `TableErrorRow`) |
| Refresh failed, stale data still on screen | `StaleDataCallout` above the data |
| Persistent contextual message | `Callout` (`banner` variant flush at the top of a card or panel) |
| A form submit failed | `Callout tone="destructive" size="sm"` near the submit button, or `SaveBar` `error` |
| One field is invalid | `error` on `Field` / `FormRow` |
| Something just happened | `toast.success(...)`, `toast.error(...)` |
| Not found, crashed, no access (full page) | `EmptyState variant="bordered" size="lg"` |

### Navigation and layout

| Need | Use | Not |
| --- | --- | --- |
| The application frame | `AppShell` | A hand-made flex layout |
| Primary navigation (desktop) | `IconRail` | `InnerMenu` |
| Primary navigation (phones) | `MobileNav` + `MobileNavTrigger` | `Sheet` built by hand |
| The top bar | `TopBar` + `TopBarLogo`, `TopBarSeparator`, `TopBarSegment`, `TopBarSearch`, `TopBarIconButton`, `TopBarUserMenu` | A custom `<header>` |
| Switch between projects, workspaces, teams | `ResourceSwitcher` | `Select` |
| Light / dark / system picker | `ThemeMenu` | A custom toggle |
| Sections of one area (settings, a record's pages) | `InnerMenu` | `Tabs`, `IconRail` |
| Panels inside one view | `Tabs` | Route links |
| The page column and title | `PageContainer`, `PageHeader`, `PageSection` | Custom wrappers |
| Back to the parent list | `PageBackLink` in `PageHeader` `eyebrow` | A history-back button |
| A deeper hierarchy | `Breadcrumb` in `PageHeader` `eyebrow` | Text with slashes |
| A toolbar above a list | `ListToolbar` + `SearchInput` + `FilterMenu` / `FilterButton` | A hand-made flex row |
| A collapsible region | `Collapsible` | `Tabs` |
| A divider | `Separator`, or `border-t` / `divide-y` | A colored `<hr>` |

## 6. Recipes

Each recipe is a complete module. Data loading, routing and mutations are the app's: the recipes take
them as props. Replace `<a href>` in your own markup with your router's `Link`.

### 6.1 Application frame

`AppShell` owns the frame; only its `<main>` scrolls. The same `NavGroup[]` feeds the desktop rail, the
phone drawer and the command menu. Mark the current destination with `active`.

```tsx
import * as React from 'react'
import {
  AppShell,
  CommandMenu,
  DropdownMenuItem,
  IconRail,
  MobileNav,
  ThemeMenu,
  TopBar,
  TopBarLogo,
  TopBarSearch,
  TopBarSegment,
  TopBarSeparator,
  TopBarUserMenu,
  type NavGroup,
} from 'ferry-ui'
import { CreditCard, FolderKanban, LayoutDashboard, Settings, Users } from 'lucide-react'

interface AppFrameProps {
  /** Current pathname, from your router. */
  pathname: string
  user: { name: string; email: string }
  onSignOut: () => void
  /** The routed page. */
  children: React.ReactNode
}

export function AppFrame({ pathname, user, onSignOut, children }: AppFrameProps) {
  const [navOpen, setNavOpen] = React.useState(false)
  const [commandOpen, setCommandOpen] = React.useState(false)

  const groups: NavGroup[] = [
    {
      id: 'main',
      items: [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard />, href: '/', active: pathname === '/' },
        { id: 'projects', label: 'Projects', icon: <FolderKanban />, href: '/projects', active: pathname.startsWith('/projects') },
        { id: 'members', label: 'Members', icon: <Users />, href: '/members', active: pathname.startsWith('/members') },
      ],
    },
    {
      id: 'workspace',
      label: 'Workspace',
      items: [
        { id: 'billing', label: 'Billing', icon: <CreditCard />, href: '/billing', active: pathname.startsWith('/billing') },
        { id: 'settings', label: 'Settings', icon: <Settings />, href: '/settings', active: pathname.startsWith('/settings') },
      ],
    },
  ]

  return (
    <>
      <AppShell
        scrollKey={pathname}
        mobileNavOpen={navOpen}
        onMobileNavOpenChange={setNavOpen}
        onCommandShortcut={() => setCommandOpen((open) => !open)}
        topBar={
          <TopBar
            onOpenMobileNav={() => setNavOpen(true)}
            logo={
              <TopBarLogo href="/" label="Acme home">
                <svg viewBox="0 0 20 20" fill="currentColor" className="text-brand">
                  <circle cx="10" cy="10" r="8" />
                </svg>
              </TopBarLogo>
            }
            actions={
              <>
                <TopBarSearch onClick={() => setCommandOpen(true)} />
                <ThemeMenu />
                <TopBarUserMenu name={user.name} description={user.email}>
                  <DropdownMenuItem onSelect={onSignOut}>Sign out</DropdownMenuItem>
                </TopBarUserMenu>
              </>
            }
          >
            <TopBarSeparator />
            <TopBarSegment href="/">Acme</TopBarSegment>
          </TopBar>
        }
        rail={<IconRail groups={groups} />}
        mobileNav={<MobileNav groups={groups} title="Acme" showThemeToggle />}
      >
        {children}
      </AppShell>
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} groups={groups} />
    </>
  )
}
```

### 6.2 List page

`PageContainer` > `PageHeader` (primary action) > `ListToolbar` > `Table`. The table keeps its header in
every state: skeleton rows, error row, message row.

```tsx
import * as React from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FilterMenu,
  ListToolbar,
  PageContainer,
  PageHeader,
  SearchInput,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableErrorRow,
  TableHead,
  TableHeader,
  TableMessageRow,
  TableRow,
  TableSkeletonRows,
  rowLinkProps,
  type FilterOption,
  type StatusTone,
} from 'ferry-ui'
import { MoreHorizontal, Plus } from 'lucide-react'

type InvoiceStatus = 'paid' | 'open' | 'overdue'

interface Invoice {
  id: string
  number: string
  customer: string
  amount: string
  status: InvoiceStatus
}

// Map domain statuses to tones once, next to the types.
const INVOICE_STATUS: Record<InvoiceStatus, { tone: StatusTone; label: string }> = {
  paid: { tone: 'success', label: 'Paid' },
  open: { tone: 'info', label: 'Open' },
  overdue: { tone: 'destructive', label: 'Overdue' },
}

const STATUS_OPTIONS: FilterOption[] = [
  { value: 'paid', label: 'Paid' },
  { value: 'open', label: 'Open' },
  { value: 'overdue', label: 'Overdue' },
]

interface InvoicesPageProps {
  /** `undefined` while the first load runs. */
  invoices: Invoice[] | undefined
  /** Set when the first load failed. */
  error?: unknown
  onRetry: () => void
  onCreate: () => void
  onOpen: (invoice: Invoice) => void
  onVoid: (invoice: Invoice) => void
}

export function InvoicesPage({ invoices, error, onRetry, onCreate, onOpen, onVoid }: InvoicesPageProps) {
  const [query, setQuery] = React.useState('')
  const [statuses, setStatuses] = React.useState<string[]>([])

  const rows = (invoices ?? []).filter(
    (invoice) =>
      `${invoice.number} ${invoice.customer}`.toLowerCase().includes(query.toLowerCase()) &&
      (statuses.length === 0 || statuses.includes(invoice.status)),
  )
  const filtered = query !== '' || statuses.length > 0
  const loading = invoices === undefined && error === undefined

  return (
    <PageContainer>
      <PageHeader
        title="Invoices"
        description="Every invoice sent to your customers."
        actions={
          <Button variant="primary" icon={<Plus />} onClick={onCreate}>
            New invoice
          </Button>
        }
      />
      <ListToolbar className="mb-4">
        <SearchInput placeholder="Search invoices" value={query} onValueChange={setQuery} />
        <FilterMenu label="Status" options={STATUS_OPTIONS} value={statuses} onValueChange={setStatuses} />
      </ListToolbar>
      <Table aria-label="Invoices">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Invoice</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[1%]">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody aria-busy={loading}>
          {loading ? (
            <TableSkeletonRows columns={5} />
          ) : invoices === undefined ? (
            <TableErrorRow colSpan={5} error={error} onRetry={onRetry} />
          ) : rows.length === 0 ? (
            <TableMessageRow colSpan={5}>
              {filtered ? 'No invoices match your filters.' : 'No invoices yet.'}
            </TableMessageRow>
          ) : (
            rows.map((invoice) => (
              <TableRow key={invoice.id} {...rowLinkProps(() => onOpen(invoice))}>
                <TableCell className="font-mono text-[13px]">
                  {/* A real link in the first cell: keyboard and screen-reader users rely on it. */}
                  <a href={`/invoices/${invoice.id}`}>{invoice.number}</a>
                </TableCell>
                <TableCell>{invoice.customer}</TableCell>
                <TableCell>
                  <StatusBadge {...INVOICE_STATUS[invoice.status]} />
                </TableCell>
                <TableCell className="text-right tabular">{invoice.amount}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-tiny" icon={<MoreHorizontal />} aria-label={`Actions for ${invoice.number}`} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onOpen(invoice)}>Open</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => onVoid(invoice)}>
                        Void invoice
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </PageContainer>
  )
}
```

For a first-run list (no record at all), replace the whole table with an `EmptyState` that explains what
goes there and holds the create button. For cards instead of rows, use `ResourceGrid` (section 7,
`ResourceCard`).

### 6.3 Settings form

One `FormCard` per topic. `FormRow` links label, control, description and error by id: give it
`htmlFor` and a single control (or a render function for a composite control such as `Select`), and do
not set `id`, `aria-describedby` or `aria-invalid` yourself. `FormActions` enables Save only while the
form is dirty. Destructive actions go in a separate `tone="destructive"`
card and are confirmed.

```tsx
import * as React from 'react'
import {
  ActionRow,
  Button,
  Checkbox,
  ConfirmDialog,
  FormActions,
  FormCard,
  FormRow,
  Input,
  PageContainer,
  PageHeader,
  PageSection,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  getErrorMessage,
  toast,
} from 'ferry-ui'

interface ProjectSettings {
  name: string
  currency: string
  weeklyDigest: boolean
}

interface ProjectSettingsPageProps {
  saved: ProjectSettings
  onSave: (next: ProjectSettings) => Promise<void>
  onDelete: () => Promise<void>
}

export function ProjectSettingsPage({ saved, onSave, onDelete }: ProjectSettingsPageProps) {
  const [draft, setDraft] = React.useState(saved)
  const [saving, setSaving] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)

  const dirty =
    draft.name !== saved.name || draft.currency !== saved.currency || draft.weeklyDigest !== saved.weeklyDigest
  const nameError = submitted && draft.name.trim() === '' ? 'Enter a project name.' : undefined

  const submit = async () => {
    setSubmitted(true)
    if (draft.name.trim() === '') return
    setSaving(true)
    try {
      await onSave(draft)
      toast.success('Settings saved')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageContainer size="narrow">
      <PageHeader title="Project settings" description="Changes apply to every member of the project." />

      <PageSection title="General">
        <FormCard
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
          footer={
            <FormActions
              dirty={dirty}
              saving={saving}
              invalid={nameError !== undefined}
              onReset={() => {
                setDraft(saved)
                setSubmitted(false)
              }}
            />
          }
        >
          <FormRow label="Name" description="Shown in the project switcher." htmlFor="project-name" error={nameError}>
            {/* A single control: the row gives it `id`, `aria-describedby` and `aria-invalid`. */}
            <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </FormRow>
          <FormRow label="Currency" description="Used for new invoices." htmlFor="project-currency">
            {/* A composite control: spread `control` onto its focusable part. */}
            {(control) => (
              <Select value={draft.currency} onValueChange={(currency) => setDraft({ ...draft, currency })}>
                <SelectTrigger {...control} className="w-full">
                  <SelectValue placeholder="Select a currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">US dollar</SelectItem>
                  <SelectItem value="eur">Euro</SelectItem>
                  <SelectItem value="gbp">Pound sterling</SelectItem>
                </SelectContent>
              </Select>
            )}
          </FormRow>
          <FormRow label="Weekly digest" description="Email a summary every Monday." htmlFor="project-digest">
            {/* Saved with the button: a Checkbox. A Switch is for settings applied on change. */}
            <Checkbox
              checked={draft.weeklyDigest}
              onCheckedChange={(checked) => setDraft({ ...draft, weeklyDigest: checked === true })}
            />
          </FormRow>
        </FormCard>
      </PageSection>

      <PageSection title="Danger zone">
        <FormCard asDiv tone="destructive">
          <ActionRow
            title="Delete project"
            description="Deletes the project, its invoices and its API keys. This cannot be undone."
            action={
              <ConfirmDialog
                trigger={<Button variant="destructive">Delete project</Button>}
                title={`Delete project “${saved.name}”?`}
                description="All invoices and API keys of this project are deleted. This cannot be undone."
                confirmLabel="Delete project"
                confirmText={saved.name}
                onConfirm={onDelete}
              />
            }
          />
        </FormCard>
      </PageSection>
    </PageContainer>
  )
}
```

A setting that applies immediately (a lone `Switch`) saves on change and needs no `FormActions`. A long
editor uses `SaveBar sticky` instead of a card footer.

### 6.4 Detail page

Back link in the `eyebrow`, status next to the title, facts in a `DescriptionList`, panels in `Tabs`.

```tsx
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CopyButton,
  DescriptionItem,
  DescriptionList,
  PageBackLink,
  PageContainer,
  PageHeader,
  StatusBadge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from 'ferry-ui'
import { Download } from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  plan: string
  since: string
  address: string
}

export function CustomerPage({ customer, onExport }: { customer: Customer | undefined; onExport: () => void }) {
  const loading = customer === undefined
  return (
    <PageContainer>
      <PageHeader
        size="lg"
        eyebrow={<PageBackLink href="/customers">Customers</PageBackLink>}
        title={customer?.name ?? 'Customer'}
        badges={!loading && <StatusBadge tone="success" label="Active" size="sm" />}
        actions={
          <Button icon={<Download />} onClick={onExport}>
            Export
          </Button>
        }
      />

      <DescriptionList columns={4} aria-label="Customer details">
        <DescriptionItem label="Customer ID" mono loading={loading} valueClassName="flex items-center gap-1.5">
          {customer && (
            <>
              <span className="truncate">{customer.id}</span>
              <CopyButton value={customer.id} what="customer ID" variant="ghost" />
            </>
          )}
        </DescriptionItem>
        <DescriptionItem label="Plan" loading={loading}>
          {customer?.plan}
        </DescriptionItem>
        <DescriptionItem label="Billing email" loading={loading}>
          {customer && <span title={customer.email}>{customer.email}</span>}
        </DescriptionItem>
        <DescriptionItem label="Customer since" loading={loading}>
          {customer?.since}
        </DescriptionItem>
        <DescriptionItem label="Billing address" span="full" wrap loading={loading}>
          {customer?.address}
        </DescriptionItem>
      </DescriptionList>

      <Tabs defaultValue="invoices" className="mt-8">
        <TabsList aria-label="Customer sections">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent className="text-[13px] text-foreground-light">Render the invoices table here.</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity">
          <Card>
            <CardContent className="text-[13px] text-foreground-light">Render the activity feed here.</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
```

A record with several pages (overview, invoices, settings) uses an `InnerMenu` beside the content
instead of `Tabs`.

### 6.5 Dashboard

KPI cards in a 4-column grid, then sections. Format numbers before passing them (`value` is displayed
as given).

```tsx
import {
  Badge,
  LegendDot,
  MetricCard,
  MetricTrend,
  PageContainer,
  PageHeader,
  PageSection,
  ResourceCard,
  ResourceCardSkeleton,
  ResourceGrid,
  StatusLine,
  UsageBar,
} from 'ferry-ui'
import { FolderKanban } from 'lucide-react'

interface Project {
  id: string
  name: string
  owner: string
  plan: string
}

interface DashboardProps {
  /** `undefined` while loading. */
  stats: { revenue: string; revenueChange: string; orders: string; errorRate: string; storagePercent: number } | undefined
  /** `undefined` while loading. */
  projects: Project[] | undefined
}

export function Dashboard({ stats, projects }: DashboardProps) {
  const loading = stats === undefined
  return (
    <PageContainer>
      <PageHeader title="Overview" description="Activity of the last 30 days." />

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Revenue"
          value={stats?.revenue}
          trend={<MetricTrend>{stats?.revenueChange}</MetricTrend>}
          hint="Last 30 days"
          loading={loading}
        />
        <MetricCard label="Orders" value={stats?.orders} hint="Last 30 days" loading={loading} />
        <MetricCard
          label="Error rate"
          value={stats?.errorRate}
          info="Share of API requests that failed."
          infoLabel="About the error rate"
          loading={loading}
        />
        <MetricCard
          label="Storage"
          value={stats ? `${stats.storagePercent}%` : undefined}
          unit="of 50 GB"
          aside={<LegendDot tone="brand">Used</LegendDot>}
          loading={loading}
        >
          <UsageBar value={stats?.storagePercent} label="Storage used" />
        </MetricCard>
      </div>

      <PageSection title="Projects">
        <ResourceGrid aria-label="Projects" aria-busy={projects === undefined}>
          {projects === undefined
            ? Array.from({ length: 3 }, (_, index) => <ResourceCardSkeleton key={index} />)
            : projects.map((project) => (
                <ResourceCard
                  key={project.id}
                  name={project.name}
                  href={`/projects/${project.id}`}
                  icon={<FolderKanban />}
                  subtitle={project.owner}
                  badges={
                    <Badge font="mono" shape="square">
                      {project.plan}
                    </Badge>
                  }
                  footer={<StatusLine tone="success">Project is active</StatusLine>}
                />
              ))}
        </ResourceGrid>
      </PageSection>
    </PageContainer>
  )
}
```

### 6.6 Confirm a destructive action

`ConfirmDialog` handles the async part: spinner while `onConfirm` runs, no dismissal while pending,
inline error on rejection, auto-close on success. Open it from a menu item with controlled `open`.

```tsx
import * as React from 'react'
import {
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  toast,
} from 'ferry-ui'
import { MoreHorizontal, Trash2 } from 'lucide-react'

export function ApiKeyActions({ name, onRevoke }: { name: string; onRevoke: () => Promise<void> }) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-tiny" icon={<MoreHorizontal />} aria-label={`Actions for ${name}`} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
            <Trash2 /> Revoke key
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Revoke API key “${name}”?`}
        description="Requests signed with this key start failing immediately. This cannot be undone."
        confirmLabel="Revoke key"
        onConfirm={async () => {
          await onRevoke()
          toast.success('API key revoked')
        }}
      />
    </>
  )
}
```

- `tone`: `destructive` (default, delete / revoke / remove), `warning` (pause, suspend, sign out
  everywhere), `primary` (send, publish).
- `confirmText="acme-production"` makes the user type the name first: reserve it for irreversible,
  high-impact actions.
- Do not close the dialog from `onConfirm`; return the promise.

### 6.7 Empty, error and loading states

One component per state; never show a blank area or a bare spinner.

```tsx
import { Button, EmptyState, ErrorState, Skeleton, StaleDataCallout } from 'ferry-ui'
import { FolderKanban, Plus } from 'lucide-react'

interface ProjectListProps {
  /** `undefined` until the first load settles. */
  projects: { id: string; name: string }[] | undefined
  /** Error of the last load, if it failed. */
  error?: unknown
  refetching: boolean
  onRetry: () => void
  onCreate: () => void
}

export function ProjectList({ projects, error, refetching, onRetry, onCreate }: ProjectListProps) {
  // First load failed: nothing to show, offer Retry.
  if (projects === undefined && error !== undefined) {
    return <ErrorState title="Could not load projects" error={error} onRetry={onRetry} retrying={refetching} />
  }
  // First load: skeletons with the footprint of the real content.
  if (projects === undefined) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    )
  }
  // Loaded but empty: say what goes here and how to create it.
  if (projects.length === 0) {
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
  return (
    <div className="flex flex-col gap-4">
      {/* A refresh failed but earlier data is still valid: keep it and say so. */}
      {error !== undefined && <StaleDataCallout error={error} onRetry={onRetry} retrying={refetching} />}
      <ul className="divide-y rounded-lg border bg-surface-100">
        {projects.map((project) => (
          <li key={project.id} className="px-4 py-3 text-sm">
            {project.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### 6.8 Dialog with a form

Wrap header, body and footer in one `<form className="flex min-h-0 flex-col">` so Enter submits and the
body keeps scrolling. `Field` wires label, hint and error. Cancel first, primary action last.

```tsx
import * as React from 'react'
import {
  Button,
  Callout,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  getErrorMessage,
} from 'ferry-ui'

export function InviteMemberDialog({ onInvite }: { onInvite: (email: string, role: string) => Promise<void> }) {
  const [open, setOpen] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [role, setRole] = React.useState('member')
  const [pending, setPending] = React.useState(false)
  const [emailError, setEmailError] = React.useState<string>()
  const [submitError, setSubmitError] = React.useState<string>()

  const submit = async () => {
    if (!email.includes('@')) {
      setEmailError('Enter a valid email address.')
      return
    }
    setEmailError(undefined)
    setSubmitError(undefined)
    setPending(true)
    try {
      await onInvite(email, role)
      setOpen(false)
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Invite member</Button>
      </DialogTrigger>
      <DialogContent>
        <form
          className="flex min-h-0 flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <DialogHeader>
            <DialogTitle>Invite member</DialogTitle>
            <DialogDescription>They receive an email with a link to join.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Email" size="sm" error={emailError}>
              <Input type="email" autoFocus value={email} onChange={(event) => setEmail(event.target.value)} />
            </Field>
            <Field label="Role" size="sm" hint="Admins can manage billing and members.">
              {(control) => (
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger {...control} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </Field>
            {submitError && (
              <Callout tone="destructive" size="sm">
                {submitError}
              </Callout>
            )}
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button disabled={pending}>Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="primary" loading={pending}>
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

## 7. Catalog

Every public export, grouped like the Storybook sidebar. Conventions that hold for all components:

- Unless its entry lists a closed set of props, a component accepts `className` (merged with `cn()`,
  yours wins), spreads the remaining props onto its root element, takes `ref` as a regular prop and sets
  a `data-slot="<name>"` attribute.
- Composite components, which assemble several parts and have no single root to extend (such as
  `ConfirmDialog`, `FilterMenu`, `CommandMenu`, `InnerMenu`, `MobileNav`, `ResourceSwitcher`,
  `ThemeMenu`, `TopBarUserMenu`, `IconRailItem`, `CopyField`, `SecretField`, `FormActions`, `Hint`),
  take only the props listed in their entry: no `id`, `ref` or other pass-through props unless listed.
- Radix-based parts accept `asChild` to merge their behavior onto your own element (usually a `Button`).
- "Default" below is the value used when the prop is omitted.
- The prop types (`ButtonProps`, `CalloutProps`…) are exported next to their component.

### 7.1 Theme

#### ThemeProvider, useTheme

Exports: `ThemeProvider`, `useTheme`, types `ThemeProviderProps`, `ThemeContextValue`, `ThemePreference`
(`'light' | 'dark' | 'system'`), `ResolvedTheme` (`'light' | 'dark'`).

- `ThemeProvider` props: `defaultTheme` (default `system`, read on mount), `storageKey` (default
  `ferry-ui-theme`; `null` disables persistence), `theme` + `onThemeChange` (controlled, e.g. a preference
  saved in the user's account). Mount once at the root; do not nest it or use it to theme one section.
- `useTheme()` returns `{ theme, resolvedTheme, setTheme }`. Bind pickers to `theme`; branch on
  `resolvedTheme` for things that cannot use tokens (charts, code highlighting). Outside a provider it
  reads the `dark` class of `<html>` and `setTheme` is a no-op. Plain styling never needs it.

```tsx
import { ToggleGroup, ToggleGroupItem, useTheme, type ThemePreference } from 'ferry-ui'

const isPreference = (value: string): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system'

export function AppearanceSetting() {
  const { theme, setTheme } = useTheme()
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      aria-label="Theme"
      value={theme}
      onValueChange={(next) => {
        // Single mode emits "" when the active item is clicked again: keep one option selected.
        if (isPreference(next)) setTheme(next)
      }}
    >
      <ToggleGroupItem value="light">Light</ToggleGroupItem>
      <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
      <ToggleGroupItem value="system">System</ToggleGroupItem>
    </ToggleGroup>
  )
}
```

#### themeInitScript

Exports: `themeInitScript`, `DEFAULT_THEME_STORAGE_KEY` (`'ferry-ui-theme'`). Server-safe.

`themeInitScript(storageKey?, defaultTheme?)` returns the source of an inline script that applies the
stored theme before first paint. Pass the same arguments as the `ThemeProvider`.

```tsx
import type { ReactNode } from 'react'
import { themeInitScript } from 'ferry-ui'

export function Document({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 7.2 Lib

#### cn

`cn(...classes)` merges class names (clsx + tailwind-merge): later Tailwind utilities win. Use it for
every conditional or merged `className`. Server-safe.

#### getErrorMessage

`getErrorMessage(err, fallback = 'Something went wrong.')` returns a readable message for anything
thrown or rejected. Use it before showing an error in a `toast`, `Callout` or `SaveBar`. `ErrorState`,
`TableErrorRow`, `StaleDataCallout` and `ConfirmDialog` already call it. Server-safe.

#### LinkProvider, useLinkComponent

Exports: `LinkProvider`, `useLinkComponent`, types `LinkComponent`, `LinkComponentProps`,
`LinkProviderProps`.

- `LinkComponent` is `React.ComponentType<LinkComponentProps>`; `LinkComponentProps` is every anchor
  attribute plus a required string `href`. An adapter must forward all props to the rendered anchor.
- `<LinkProvider component={RouterLink}>` makes every ferry-ui link below go through the router (setup
  snippet in section 2).
- `useLinkComponent(override?)` is for authors of components that render links: it returns the
  `override`, else the provider's component, else a plain `<a>`.
- Components with link support and a `linkComponent` override: `BreadcrumbLink`, `PageBackLink`,
  `ResourceCard`, `DescriptionItem`, `IconRail`, `IconRailItem`, `MobileNav`, `InnerMenu`, `CommandMenu`,
  `ResourceSwitcher`, `TopBarLogo`, `TopBarSegment`, `TopBarIconButton`.

```tsx
import type { ReactNode } from 'react'
import { cn, useLinkComponent, type LinkComponent } from 'ferry-ui'

interface DocsLinkProps {
  href: string
  children: ReactNode
  className?: string
  /** Overrides the app's `LinkProvider` for this link. */
  linkComponent?: LinkComponent
}

export function DocsLink({ href, children, className, linkComponent }: DocsLinkProps) {
  const Link = useLinkComponent(linkComponent)
  return (
    <Link href={href} className={cn('text-primary underline-offset-4 hover:underline', className)}>
      {children}
    </Link>
  )
}
```

#### isMac, modKey

Constants: `isMac` (boolean, Apple platform) and `modKey` (`'⌘'` or `'Ctrl'`), read once at module load.
Use them in client-only code (event handlers). In rendered markup use the hooks `useIsMac()` /
`useModKey()` (7.3), which are hydration-safe.

### 7.3 Hooks

#### useCopy, copyText

Exports: `useCopy`, `copyText`, type `UseCopyOptions`.

- `useCopy(options?)` returns `[copied, copy]`. `copy(text)` writes to the clipboard; `copied` is `true`
  for `timeout` ms (default 1500) after a success. Failures show `toast.error`; options: `timeout`,
  `errorMessage` (default "Could not copy to the clipboard"), `onError(text)` (replaces the toast).
- `copyText(text)` resolves to `true` / `false` and never throws: for code outside React.
- Prefer the ready-made `CopyButton`, `CopyField`, `SecretField`, `CodeBlock`.

```tsx
import { Button, useCopy } from 'ferry-ui'
import { Check, Link2 } from 'lucide-react'

export function CopyInviteLink({ url }: { url: string }) {
  const [copied, copy] = useCopy({ timeout: 2000 })
  return (
    <Button icon={copied ? <Check /> : <Link2 />} onClick={() => void copy(url)}>
      {copied ? 'Link copied' : 'Copy invite link'}
    </Button>
  )
}
```

#### useCommandShortcut

Exports: `useCommandShortcut`, type `CommandShortcutOptions` (`{ key?: string; enabled?: boolean }`).

`useCommandShortcut(handler, options?)` binds mod+K (⌘K on Apple, Ctrl+K elsewhere) on the window, or
another letter: `useCommandShortcut(fn, 'j')` or `{ key: 'j', enabled }`. It prevents the browser
default and ignores presses with Alt or Shift. Bind each letter in one place only: this hook, **or**
`AppShell` `onCommandShortcut`, **or** `CommandMenu` `shortcut`.

#### useIsMac, useModKey

`useIsMac()` (boolean) and `useModKey()` (`'⌘'` or `'Ctrl'`) are the hydration-safe versions of `isMac`
/ `modKey`: `false` / `'Ctrl'` on the server and during hydration, then the real platform.

```tsx
import * as React from 'react'
import { Button, CommandMenu, Kbd, useCommandShortcut, useModKey, type CommandMenuGroup } from 'ferry-ui'

export function SearchEverywhere({ groups }: { groups: CommandMenuGroup[] }) {
  const [open, setOpen] = React.useState(false)
  const mod = useModKey()
  useCommandShortcut(() => setOpen((current) => !current))
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Search <Kbd>{mod} K</Kbd>
      </Button>
      <CommandMenu open={open} onOpenChange={setOpen} groups={groups} />
    </>
  )
}
```

### 7.4 Primitives

#### Button

Exports: `Button`, `buttonVariants`, type `ButtonProps`.

- `variant`: `default` (outlined neutral, the default), `primary` (solid, the one main action),
  `outline` (transparent with border, on tinted surfaces), `ghost` (borderless), `destructive` (red
  outline), `destructive-solid` (solid red, confirm button of destructive dialogs), `warning` (amber
  outline), `link` (text link look), `dashed` (filter buttons). `danger` and `danger-solid` are
  deprecated aliases of the two destructive variants: never use them in new code.
- `size`: `tiny` 26px, `sm` 30px (default), `md` 34px, `lg` 38px; square icon sizes of the same heights:
  `icon-tiny` 26px, `icon` 30px, `icon-md` 34px, `icon-lg` 38px.
- `shape`: `default`, `pill` (fully rounded).
- `icon` (leading), `iconRight` (trailing): pass a bare lucide icon, it is sized for you.
- `loading`: spinner instead of `icon`, button disabled, `aria-busy`.
- `asChild`: style the single child (an `<a>` or a router link) as a button; `icon` / `iconRight` render
  inside it. A link has no disabled state, so `disabled` / `loading` map to `aria-disabled` (and
  `aria-busy` for `loading`) plus `tabIndex={-1}` on the child; `type` is ignored.
- `type` defaults to `button`: set `type="submit"` in forms. Other `<button>` props pass through.
- Icon-only buttons need `aria-label`.
- `buttonVariants({ variant, size, shape })` returns the classes for a non-button element; prefer
  `asChild`.

```tsx
import { Button, Hint } from 'ferry-ui'
import { ArrowRight, Download, Plus } from 'lucide-react'

export function ButtonExamples({ saving, onCreate }: { saving: boolean; onCreate: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary" icon={<Plus />} loading={saving} onClick={onCreate}>
        New project
      </Button>
      <Button>Cancel</Button>
      <Button variant="ghost" size="tiny">
        Dismiss
      </Button>
      <Hint label="Download CSV">
        <Button size="icon" icon={<Download />} aria-label="Download CSV" />
      </Hint>
      <Button variant="link" iconRight={<ArrowRight />} asChild>
        <a href="/docs">Read the docs</a>
      </Button>
    </div>
  )
}
```

#### Badge

Exports: `Badge`, `badgeVariants`, type `BadgeProps`.

20px uppercase label for short static metadata: a plan, a version, a count, a tag. Never wraps. For the
state of a record use `StatusBadge`.

- `variant`: `default` (neutral fill), `outline`, `success`, `warning`, `destructive`, `info`, `primary`
  (solid primary, sparingly: "New").
- `font`: `sans` (default), `mono` (versions, regions, ids).
- `shape`: `pill` (default), `square` (4px radius).
- `case`: `upper` (default), `normal` (sentence case, e.g. names).
- `asChild`: render the child (an `<a>`) with the badge look.
- `badgeVariants({ variant, font, shape, case })` returns the classes.

```tsx
import { Badge } from 'ferry-ui'

export function PlanBadges() {
  return (
    <div className="flex items-center gap-1.5">
      <Badge>Free</Badge>
      <Badge variant="primary">New</Badge>
      <Badge variant="outline" font="mono" shape="square">
        v2.4.1
      </Badge>
      <Badge variant="info" case="normal">
        Maya Chen
      </Badge>
    </div>
  )
}
```

#### Input

Exports: `Input`, `inputVariants`, type `InputProps`.

- `size`: `tiny` 26px, `sm` 30px, `md` 34px (default), `lg` 38px (the native numeric `size` attribute
  is not available).
- `mono`: monospace 13px for identifiers, slugs, URLs, keys.
- States: `aria-invalid` (error border), `readOnly` (dimmed, copyable), `disabled`.
- Always labelled: `Field`, `FormRow`, `<Label htmlFor>` or `aria-label`.
- `inputVariants({ size, mono })` gives a non-input element the field look.

```tsx
import { Input, Label } from 'ferry-ui'

export function SlugField({ value, onChange }: { value: string; onChange: (slug: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="project-slug">Slug</Label>
      <Input
        id="project-slug"
        mono
        placeholder="marketing-site"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
```

#### Textarea

Exports: `Textarea`, type `TextareaProps`.

Multi-line field with the `Input` look. Grows with its content from an 80px minimum: cap it with
`max-h-*`, or add `className="field-sizing-fixed"` and `rows` for a fixed height. `mono` for code-like
content (JSON, keys). Same `aria-invalid` / `disabled` states as `Input`.

```tsx
import { Field, Textarea } from 'ferry-ui'

export function NotesField({ value, onChange }: { value: string; onChange: (notes: string) => void }) {
  return (
    <Field label="Internal notes" optional hint="Only visible to your team.">
      <Textarea className="max-h-60" value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  )
}
```

#### Label

Export: `Label`. Accessible form label (14px medium). Link it with `htmlFor` + the control's `id`, or
wrap the control. It is a flex row with an 8px gap, so `<Label><Checkbox /> Text</Label>` aligns. Not a
generic caption (use `MonoLabel` or plain text). Inside `Field` and `FormRow` the label is rendered for
you.

#### Checkbox

Export: `Checkbox`. 16px checkbox for choices applied on submit and for row selection.

- `checked`: `true`, `false` or `'indeterminate'`; `onCheckedChange(checked)` receives the same three
  values. Uncontrolled: `defaultChecked`.
- `name`, `value`, `required` join native form submission; `aria-invalid` paints the error border.
- Needs a `Label` (wrapping it or via `htmlFor`) or an `aria-label` (table cells).

```tsx
import { Checkbox, Label } from 'ferry-ui'

export function TermsCheckbox({ accepted, onChange }: { accepted: boolean; onChange: (accepted: boolean) => void }) {
  return (
    <Label>
      <Checkbox checked={accepted} onCheckedChange={(checked) => onChange(checked === true)} />
      I accept the terms of service
    </Label>
  )
}
```

#### Switch

Exports: `Switch`, type `SwitchProps`. On/off toggle for settings that apply immediately.

- `size`: `md` (34×20px, default), `sm` (28×16px, dense lists and table cells). `default` is a deprecated
  alias of `md`.
- `checked` + `onCheckedChange(checked: boolean)`, or `defaultChecked`; `disabled`; `name` + `value`.
- Needs an accessible name: `<Label htmlFor>` or `aria-label`.

```tsx
import { Label, Switch } from 'ferry-ui'

export function NotificationsSwitch({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Switch id="email-notifications" checked={enabled} onCheckedChange={onChange} />
      <Label htmlFor="email-notifications">Email notifications</Label>
    </div>
  )
}
```

#### RadioGroup

Exports: `RadioGroup`, `RadioGroupItem`. Single choice among 2 to 5 visible options.

- `RadioGroup`: `value` + `onValueChange(value)`, or `defaultValue`; `name`, `required`, `disabled`.
  Lays out as `grid gap-3`; pass `className="flex gap-4"` for a row. Needs `aria-label` or
  `aria-labelledby`.
- `RadioGroupItem`: `value` (required), `disabled`, `aria-invalid`. Wrap it with its text in a `Label`.

```tsx
import { Label, RadioGroup, RadioGroupItem } from 'ferry-ui'

export function BillingPeriod({ value, onChange }: { value: string; onChange: (period: string) => void }) {
  return (
    <RadioGroup aria-label="Billing period" value={value} onValueChange={onChange}>
      <Label>
        <RadioGroupItem value="monthly" /> Monthly
      </Label>
      <Label>
        <RadioGroupItem value="yearly" /> Yearly (two months free)
      </Label>
    </RadioGroup>
  )
}
```

#### Select

Exports: `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`, `SelectGroup`,
`SelectLabel`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`, type
`SelectTriggerProps`.

Pick one value from roughly 4 to 15 plain options.

- `Select`: `value` + `onValueChange(value)`, or `defaultValue`; `open` / `defaultOpen` /
  `onOpenChange`; `name`, `required`, `disabled`.
- `SelectTrigger`: `size` `tiny` 26px, `sm` 30px, `md` 34px (default; `default` is a deprecated alias of
  `md`). It is `w-fit`: add `className="w-full"` in forms. Takes `id` (for the label), `aria-invalid`, `aria-label`.
- `SelectValue`: `placeholder` for the empty state.
- `SelectContent`: `position` `item-aligned` (default, overlaps the trigger) or `popper` (drops below,
  at least as wide as the trigger; honors `side`, `align`, `sideOffset`).
- `SelectItem`: `value` must be a non-empty string (use `"none"`, never `""`); `disabled`.
- `SelectGroup` + `SelectLabel` group items; `SelectSeparator` divides groups. The scroll buttons are
  rendered by `SelectContent` and are exported only for custom wrappers.

```tsx
import {
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from 'ferry-ui'

export function RoleSelect({ value, onChange }: { value: string; onChange: (role: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="member-role">Role</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="member-role" className="w-full">
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectGroup>
            <SelectLabel>Workspace</SelectLabel>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectItem value="guest">Guest</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
```

#### Toggle

Exports: `Toggle`, `toggleVariants`, type `ToggleProps`. A button that stays pressed (`aria-pressed`).

- `variant`: `default` (transparent), `outline` (bordered).
- `size`, on the `Button` scale: `tiny` 26px, `sm` 30px (default), `md` 34px. `default` and `lg` are
  deprecated aliases of `sm` and `md`.
- `pressed` + `onPressedChange(pressed)`, or `defaultPressed`; `disabled`.
- Icon-only toggles need `aria-label`. `toggleVariants({ variant, size })` returns the classes.

#### ToggleGroup

Exports: `ToggleGroup`, `ToggleGroupItem`, types `ToggleGroupProps`, `ToggleGroupItemProps`.

- `type` (required): `single` (segmented control; `value` is a string) or `multiple` (`value` is a
  string array).
- `value` + `onValueChange`, or `defaultValue`. In `single` mode clicking the active item emits `""`:
  ignore empty values when one option must stay selected.
- `variant` (`default`, `outline`) and `size` (`tiny` 26px, `sm` 30px, the default, `md` 34px) apply to
  every item.
- `spacing`: gap in 4px units; `0` (default) joins the items into one control.
- `ToggleGroupItem`: `value` (required), `disabled`; icon-only items need `aria-label`.

```tsx
import { Toggle, ToggleGroup, ToggleGroupItem } from 'ferry-ui'
import { Archive, LayoutGrid, List } from 'lucide-react'

interface ViewOptionsProps {
  view: string
  onViewChange: (view: string) => void
  showArchived: boolean
  onShowArchivedChange: (show: boolean) => void
}

export function ViewOptions({ view, onViewChange, showArchived, onShowArchivedChange }: ViewOptionsProps) {
  return (
    <div className="flex items-center gap-2">
      <ToggleGroup
        type="single"
        variant="outline"
        aria-label="View"
        value={view}
        onValueChange={(next) => next && onViewChange(next)}
      >
        <ToggleGroupItem value="grid" aria-label="Grid view">
          <LayoutGrid />
        </ToggleGroupItem>
        <ToggleGroupItem value="list" aria-label="List view">
          <List />
        </ToggleGroupItem>
      </ToggleGroup>
      <Toggle variant="outline" pressed={showArchived} onPressedChange={onShowArchivedChange}>
        <Archive /> Archived
      </Toggle>
    </div>
  )
}
```

#### Tabs

Exports: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `tabsListVariants`, type `TabsListProps`.

Switch between sibling panels inside one view. Not for route navigation (use `InnerMenu` or links) nor
for filtering the same content (use `ToggleGroup`).

- `Tabs`: `value` + `onValueChange(value)`, or `defaultValue`.
- `TabsList`: `variant` `underline` (default, page-level tabs on a full-width border) or `pills`
  (compact segmented control for cards and toolbars). Give it `aria-label`.
- `TabsTrigger`: `value` (required), `disabled`; may hold an icon and a count `Badge`.
- `TabsContent`: `value` (required); inactive panels unmount unless `forceMount`.
- `tabsListVariants({ variant })` returns the list classes.

```tsx
import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from 'ferry-ui'

export function ProjectTabs({ openInvoices }: { openInvoices: number }) {
  return (
    <Tabs defaultValue="overview">
      <TabsList aria-label="Project sections">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="invoices">
          Invoices <Badge>{openInvoices}</Badge>
        </TabsTrigger>
        <TabsTrigger value="audit" disabled>
          Audit log
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="invoices">Invoices panel</TabsContent>
    </Tabs>
  )
}
```

#### Dialog

Exports: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`,
`DialogBody`, `DialogFooter`, `DialogClose`, `DialogPortal`, `DialogOverlay`, type `DialogContentProps`.

Modal for a focused task or form. Full example: recipe 6.8.

- `Dialog`: `open` + `onOpenChange(open)`, or `defaultOpen`.
- `DialogTrigger` / `DialogClose`: use `asChild` with a `Button`.
- `DialogContent`: `size` `sm` 384px, `md` 448px (default), `lg` 512px, `xl` 672px, `xxl` 896px;
  `showCloseButton` (default `true`); `closeLabel` (accessible name of the close button, default
  "Close": pass a translation in localized apps). Compose `DialogHeader` (title + description),
  `DialogBody` (the only scrolling part) and `DialogFooter` (Cancel first, primary action last).
- `DialogTitle` is required. Without a `DialogDescription`, pass `aria-describedby={undefined}` to
  `DialogContent`.
- `DialogPortal` and `DialogOverlay` are already rendered by `DialogContent`.

```tsx
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'ferry-ui'

export function ShortcutsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">Keyboard shortcuts</Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Available on every page.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="text-[13px] text-foreground-light">Press mod+K to open the command menu.</p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="primary">Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

#### AlertDialog

Exports: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`,
`AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogBody`, `AlertDialogFooter`,
`AlertDialogCancel`, `AlertDialogAction`, `AlertDialogPortal`, `AlertDialogOverlay`, types
`AlertDialogActionProps`, `AlertDialogCancelProps`.

Confirmation that cannot be dismissed by clicking outside. **Use `ConfirmDialog` (7.5) unless you need a
custom layout.**

- `AlertDialog`: `open` + `onOpenChange`, or `defaultOpen`.
- `AlertDialogAction`: `variant` (default `primary`; `destructive-solid` for destructive), `size` (default
  `sm`), `loading`. Clicking closes the dialog unless `onClick` calls `event.preventDefault()`.
- `AlertDialogCancel`: `variant` (default `default`), `size`; focused first when the dialog opens.
- `AlertDialogTitle` (a question) and `AlertDialogDescription` (the consequence) are both required.
  Footer order: Cancel first, action last.

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from 'ferry-ui'

export function DiscardChanges({ onDiscard }: { onDiscard: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Discard</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>Your edits to this invoice will be lost.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction variant="destructive-solid" onClick={onDiscard}>
            Discard changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

#### Sheet

Exports: `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`,
`SheetBody`, `SheetFooter`, `SheetClose`, type `SheetContentProps`.

Modal panel sliding from a screen edge: detail panels, filters, long edit forms.

- `Sheet`: `open` + `onOpenChange`, or `defaultOpen`.
- `SheetContent`: `side` `right` (default), `left`, `top`, `bottom`; `showCloseButton` (default `true`);
  `closeLabel` (accessible name of the close button, default "Close"). Left / right sheets are 384px
  wide at most: widen with `className="sm:max-w-lg"`.
- `SheetBody` scrolls; `SheetFooter` sticks to the bottom (stacked buttons; add
  `className="flex-row justify-end"` for an inline bar).
- `SheetTitle` is required; without `SheetDescription` pass `aria-describedby={undefined}`.

```tsx
import type { ReactNode } from 'react'
import {
  Button,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from 'ferry-ui'

export function OrderDetailsSheet({ orderNumber, children }: { orderNumber: string; children: ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>View order</Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Order {orderNumber}</SheetTitle>
          <SheetDescription>Items, payment and shipping.</SheetDescription>
        </SheetHeader>
        <SheetBody>{children}</SheetBody>
        <SheetFooter className="flex-row justify-end">
          <SheetClose asChild>
            <Button>Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
```

#### Popover

Exports: `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverAnchor`, `PopoverHeader`,
`PopoverTitle`, `PopoverDescription`.

Floating panel for small forms and pickers. Non-modal: clicking outside closes it.

- `Popover`: `open` + `onOpenChange`, or `defaultOpen`.
- `PopoverContent`: 288px wide with 16px padding (override with `className="w-80 p-0"`); `side`, `align`
  (default `center`), `sideOffset` (default 6). Give it `aria-label` when it has no visible title.
- `PopoverAnchor` positions the panel against another element than the trigger.

```tsx
import type { ReactNode } from 'react'
import { Button, Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from 'ferry-ui'

export function ShareLinkPopover({ children }: { children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Share</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex flex-col gap-3">
        <PopoverHeader>
          <PopoverTitle>Share this report</PopoverTitle>
          <PopoverDescription>Anyone with the link can view it.</PopoverDescription>
        </PopoverHeader>
        {children}
      </PopoverContent>
    </Popover>
  )
}
```

#### DropdownMenu

Exports: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`,
`DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuLabel`,
`DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuGroup`, `DropdownMenuSub`,
`DropdownMenuSubTrigger`, `DropdownMenuSubContent`, `DropdownMenuPortal`, types
`DropdownMenuItemProps`, `DropdownMenuLabelProps`, `DropdownMenuSubTriggerProps`.

A short list of actions or options opened from a trigger.

- `DropdownMenu`: `open` + `onOpenChange`, or `defaultOpen`; `modal={false}` keeps the page interactive.
- `DropdownMenuContent`: `side`, `align` (`start`, `center`, `end`), `sideOffset` (default 4); set a
  width with `className="w-48"`.
- `DropdownMenuItem`: run the action in `onSelect` (not `onClick`); `variant` `default` or
  `destructive`; `inset` (aligns with checkbox / radio items); `disabled`; `asChild` for a link.
- `DropdownMenuCheckboxItem`: `checked` + `onCheckedChange`; call `event.preventDefault()` in `onSelect`
  to keep the menu open.
- `DropdownMenuRadioGroup` (`value` + `onValueChange`) > `DropdownMenuRadioItem` (`value`).
- `DropdownMenuLabel` (`inset`): mono uppercase heading. `DropdownMenuShortcut`: display-only key hint.
- Submenu: `DropdownMenuSub` > `DropdownMenuSubTrigger` (`inset`) + `DropdownMenuPortal` >
  `DropdownMenuSubContent`. One level only.

```tsx
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  useModKey,
} from 'ferry-ui'
import { Copy, MoreHorizontal, Trash2 } from 'lucide-react'

interface OrderMenuProps {
  showArchived: boolean
  onShowArchivedChange: (show: boolean) => void
  sort: string
  onSortChange: (sort: string) => void
  onDuplicate: () => void
  onMove: (team: string) => void
  onDelete: () => void
}

export function OrderMenu(props: OrderMenuProps) {
  const mod = useModKey()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" icon={<MoreHorizontal />} aria-label="Order actions" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={props.onDuplicate}>
            <Copy /> Duplicate
            <DropdownMenuShortcut>{mod} D</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger inset>Move to</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onSelect={() => props.onMove('sales')}>Sales</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => props.onMove('support')}>Support</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel inset>View</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={props.showArchived}
          onCheckedChange={(checked) => props.onShowArchivedChange(checked === true)}
          onSelect={(event) => event.preventDefault()}
        >
          Show archived
        </DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value={props.sort} onValueChange={props.onSortChange}>
          <DropdownMenuRadioItem value="newest">Newest first</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="oldest">Oldest first</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={props.onDelete}>
          <Trash2 /> Delete order
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

#### Tooltip, Hint

Exports: `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent`, `Hint`, type `HintProps`.

- `TooltipProvider`: mount once at the root (`delayDuration` default 250ms).
- `Hint`: the one-liner. Props: `label` (a few words), `side` (default `top`), `children` (one focusable
  element: `Button`, link). To explain a disabled button, wrap it in `<span tabIndex={0}>`.
- `Tooltip` > `TooltipTrigger asChild` + `TooltipContent` (`side`, `align`, `sideOffset` default 6): for
  controlled `open` or custom content props.
- A tooltip is a visual aid, never the accessible name: icon buttons still need `aria-label`. Never put
  essential or interactive content in a tooltip (touch users cannot hover).

```tsx
import { Button, Hint, Tooltip, TooltipContent, TooltipTrigger } from 'ferry-ui'
import { RefreshCw } from 'lucide-react'

export function RefreshButton({ onRefresh, updatedAt }: { onRefresh: () => void; updatedAt: string }) {
  return (
    <div className="flex items-center gap-2">
      <Hint label="Refresh">
        <Button variant="ghost" size="icon" icon={<RefreshCw />} aria-label="Refresh" onClick={onRefresh} />
      </Hint>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="tiny">
            Updated recently
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start">
          {updatedAt}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
```

#### Command

Exports: `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`,
`CommandSeparator`, `CommandShortcut`, `CommandDialog`, type `CommandDialogProps`.

Search field over a filtered, keyboard-navigable list (cmdk). Inline in a `Popover` it is the combobox
for long or searchable lists. For the app-wide palette use `CommandMenu` (7.6), not `CommandDialog`.

- `Command`: `shouldFilter={false}` when you filter yourself (server-side search); `loop`; `filter`.
- `CommandInput`: `placeholder`; `value` + `onValueChange(query)`.
- `CommandGroup`: `heading`. `CommandEmpty`: shown when nothing matches.
- `CommandItem`: `onSelect()` runs on click and Enter; `value` (text matched, defaults to the content),
  `keywords`, `disabled`.
- `CommandShortcut`: display-only key hint. `CommandSeparator`: hairline between groups.
- `CommandDialog`: `open` + `onOpenChange`, `title`, `description` (visually hidden), `showCloseButton`,
  `closeLabel` (accessible name of the close button, default "Close"), `className`, `commandProps`
  (options of the inner `Command`).

```tsx
import * as React from 'react'
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ferry-ui'
import { Check, ChevronsUpDown } from 'lucide-react'

interface OwnerComboboxProps {
  members: { id: string; name: string }[]
  value: string | undefined
  onChange: (memberId: string) => void
}

export function OwnerCombobox({ members, value, onChange }: OwnerComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const current = members.find((member) => member.id === value)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button role="combobox" aria-expanded={open} iconRight={<ChevronsUpDown />} className="w-56 justify-between">
          {current?.name ?? 'Select an owner'}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0" aria-label="Owner">
        <Command>
          <CommandInput placeholder="Find a member…" />
          <CommandList>
            <CommandEmpty>No member found.</CommandEmpty>
            <CommandGroup heading="Members">
              {members.map((member) => (
                <CommandItem
                  key={member.id}
                  value={`${member.name} ${member.id}`}
                  onSelect={() => {
                    onChange(member.id)
                    setOpen(false)
                  }}
                >
                  {member.name}
                  {member.id === value && <Check className="ml-auto" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

#### Card

Exports: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`,
`CardFooter`.

Bordered panel that groups one topic. `CardHeader` (title block left, `CardAction` right), `CardContent`
(padded body; omit it for edge-to-edge content such as a table), `CardFooter` (actions right-aligned).
Wrap `CardTitle` + `CardDescription` in a `<div>` to stack them. Do not nest cards. For settings forms
use `FormCard`, for KPIs `MetricCard`, for entity lists `ResourceCard`.

```tsx
import { Button, Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from 'ferry-ui'

export function PaymentMethodCard({ last4, onReplace }: { last4: string; onReplace: () => void }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Payment method</CardTitle>
          <CardDescription>Charged on the first day of each month.</CardDescription>
        </div>
        <CardAction>
          <Button size="tiny" onClick={onReplace}>
            Replace
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="text-sm">Card ending in {last4}</CardContent>
      <CardFooter className="justify-between text-[13px] text-foreground-light">Next charge on Nov 1</CardFooter>
    </Card>
  )
}
```

#### Table

Exports: `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`,
`TableCaption`, type `TableProps`.

Native table in a bordered, horizontally scrolling container. Full example: recipe 6.2.

- `Table`: `className` goes to the `<table>`; `containerClassName` and `containerProps` go to the
  scroll container (`max-h-80` for a scrolling body, `rounded-none border-0 shadow-none` inside a
  card). Name it with `aria-label` or a `TableCaption`.
- `TableHeader`: give its row `className="hover:bg-transparent"`.
- `TableRow`: `data-state="selected"` highlights it; spread `rowLinkProps()` for a clickable row.
- `TableHead`: `text-right` over numeric columns, `w-[1%]` to shrink to content, an `sr-only` label in
  icon-only columns.
- `TableCell`: no wrapping by default; numbers `className="text-right tabular"`; long values
  `w-full max-w-0` + `truncate` inside.
- `TableFooter`: totals only. Loading, empty and error rows: `TableSkeletonRows`, `TableMessageRow`,
  `TableErrorRow` (7.5).

```tsx
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from 'ferry-ui'

interface OrderLine {
  id: string
  product: string
  quantity: number
  total: string
}

export function OrderLines({ lines, total }: { lines: OrderLine[]; total: string }) {
  return (
    <Table>
      <TableCaption>Amounts in USD</TableCaption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line) => (
          <TableRow key={line.id}>
            <TableCell>{line.product}</TableCell>
            <TableCell className="text-right tabular">{line.quantity}</TableCell>
            <TableCell className="text-right tabular">{line.total}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell className="text-right tabular">{total}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
```

#### Avatar

Exports: `Avatar`, `AvatarImage`, `AvatarFallback`, `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount`,
type `AvatarProps`.

- `Avatar`: `size` `sm` 24px, `md` 32px (default), `lg` 40px (`default` is a deprecated alias of `md`).
  Round; pass `className="rounded-md"` for organizations.
- `AvatarImage`: `src`, `alt` (the person's name). Always pair it with an `AvatarFallback` (initials).
- `AvatarBadge`: presence dot; tone it with `className="bg-success"`; add `role="img"` + `aria-label`
  when the state matters.
- `AvatarGroup` stacks avatars; `AvatarGroupCount` is the trailing "+N".

```tsx
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from 'ferry-ui'

export function TeamAvatars({ members, extra }: { members: { name: string; initials: string; photo?: string }[]; extra: number }) {
  return (
    <AvatarGroup>
      {members.map((member) => (
        <Avatar key={member.name} size="sm">
          <AvatarImage src={member.photo} alt={member.name} />
          <AvatarFallback>{member.initials}</AvatarFallback>
        </Avatar>
      ))}
      {extra > 0 && <AvatarGroupCount>+{extra}</AvatarGroupCount>}
    </AvatarGroup>
  )
}

export function OnlineAvatar({ initials }: { initials: string }) {
  return (
    <Avatar>
      <AvatarFallback>{initials}</AvatarFallback>
      <AvatarBadge className="bg-success" role="img" aria-label="Online" />
    </Avatar>
  )
}
```

#### Breadcrumb

Exports: `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`,
`BreadcrumbSeparator`, `BreadcrumbEllipsis`, type `BreadcrumbLinkProps`.

Hierarchy trail (more than one level; for one level use `PageBackLink`). `BreadcrumbLink` takes `href`
(rendered through the link component), `linkComponent`, or `asChild`. Exactly one `BreadcrumbPage` (the
current page, last). `BreadcrumbSeparator` renders a chevron unless given children.
`BreadcrumbEllipsis` stands for collapsed levels.

```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from 'ferry-ui'

export function InvoiceBreadcrumb({ customer, invoice }: { customer: { id: string; name: string }; invoice: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/customers">Customers</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href={`/customers/${customer.id}`}>{customer.name}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{invoice}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

#### Collapsible

Exports: `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`. Unstyled show / hide region ("Advanced
options"). `open` + `onOpenChange`, or `defaultOpen`. `CollapsibleTrigger asChild` with a `Button`;
`data-state="open" | "closed"` is set on trigger and content for styling.

```tsx
import type { ReactNode } from 'react'
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ferry-ui'
import { ChevronRight } from 'lucide-react'

export function AdvancedOptions({ children }: { children: ReactNode }) {
  return (
    <Collapsible className="flex flex-col gap-3">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="group w-fit" icon={<ChevronRight className="transition-transform group-data-[state=open]:rotate-90" />}>
          Advanced options
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}
```

#### ScrollArea

Exports: `ScrollArea`, `ScrollBar`, type `ScrollAreaProps`. Scroll container with a thin themed
scrollbar. It needs a bounded size (`h-72`, `max-h-80`, `flex-1 min-h-0`) or it never scrolls. Add
`<ScrollBar orientation="horizontal" />` as the last child for horizontal scrolling. `type="always"`
pins the scrollbar. `viewportProps` goes to the scrolling element: when the content holds nothing
focusable (plain text, a read-only list), pass `tabIndex: 0`, `role: 'region'` and an `aria-label` so
the area can be scrolled from the keyboard; leave it unset when the content has links or fields.

```tsx
import { ScrollArea, ScrollBar } from 'ferry-ui'

export function ActivityLog({ entries }: { entries: string[] }) {
  return (
    <ScrollArea
      className="h-72 rounded-lg border bg-surface-100"
      viewportProps={{ tabIndex: 0, role: 'region', 'aria-label': 'Activity log' }}
    >
      <ul className="divide-y text-[13px]">
        {entries.map((entry, index) => (
          <li key={index} className="px-4 py-2.5 whitespace-nowrap">
            {entry}
          </li>
        ))}
      </ul>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
```

#### Separator

Export: `Separator`. 1px line in the border color. `orientation` `horizontal` (default) or `vertical`
(needs a parent with a height); `decorative` (default `true`; set `false` when the split is meaningful).
Inside containers prefer `border-t` / `divide-y`.

#### Skeleton

Export: `Skeleton`. Pulsing placeholder; size it like the content it replaces
(`<Skeleton className="h-4 w-32" />`, `size-8 rounded-full`). Hidden from assistive technology: set
`aria-busy` on the loading region. Prefer the built-in `loading` props and `TableSkeletonRows` /
`ResourceCardSkeleton` where they exist.

```tsx
import { Separator, Skeleton } from 'ferry-ui'

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Separator />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}
```

#### Toaster, toast

Exports: `Toaster`, `toast`, type `ToasterProps`. Brief, non-blocking feedback (sonner).

- `Toaster`: mount once near the root. Bottom-right with a close button by default; takes every sonner
  option (`position`, `duration`, `visibleToasts`…). It follows the theme by itself.
- `toast(title, { description, action, cancel, id, duration })`, `toast.success`, `toast.error`,
  `toast.warning`, `toast.info`, `toast.loading`, `toast.promise(promise, { loading, success, error })`,
  `toast.dismiss(id?)`. Always import `toast` from `ferry-ui`, not from `sonner`.
- Not for errors that need a decision (`ConfirmDialog`) or persistent status (`Callout`).

```tsx
import { Button, getErrorMessage, toast } from 'ferry-ui'

export function ExportButton({ onExport }: { onExport: () => Promise<void> }) {
  return (
    <Button
      onClick={() => {
        toast.promise(onExport(), {
          loading: 'Preparing your export…',
          success: 'Export ready',
          error: (err: unknown) => getErrorMessage(err),
        })
      }}
    >
      Export data
    </Button>
  )
}
```

### 7.5 Patterns

#### PageContainer, PageHeader, PageBackLink, PageSection

Exports: `PageContainer`, `PageHeader`, `PageBackLink`, `PageSection`, types `PageContainerProps`,
`PageContainerSize`, `PageHeaderProps`, `PageBackLinkProps`, `PageSectionProps`.

- `PageContainer`: the centered page column, once per page. `size` `narrow` (about 800px: settings,
  forms, detail), `default` (about 1200px: lists, dashboards), `full` (no max width).
- `PageHeader`: exactly one per page, first child of the container. `title` (the `<h1>`),
  `description`, `badges` (next to the title), `actions` (secondary buttons first, primary last),
  `eyebrow` (a `PageBackLink` or `Breadcrumb`), `size` `md` (default) or `lg` (home page of one record),
  `children` (tabs, a callout under the title row).
- `PageBackLink`: `href` (required), children = name of the parent page (no arrow, no "Back to"),
  `linkComponent`.
- `PageSection`: `title` (an `<h2>`), `description`, `actions`; pass `id` for deep links. Consecutive
  sections are 40px apart.

```tsx
import type { ReactNode } from 'react'
import { Button, PageBackLink, PageContainer, PageHeader, PageSection } from 'ferry-ui'
import { Plus } from 'lucide-react'

export function MembersPage({ onInvite, children }: { onInvite: () => void; children: ReactNode }) {
  return (
    <PageContainer size="narrow">
      <PageHeader
        eyebrow={<PageBackLink href="/settings">Settings</PageBackLink>}
        title="Members"
        description="People with access to this workspace."
        actions={
          <Button variant="primary" icon={<Plus />} onClick={onInvite}>
            Invite member
          </Button>
        }
      />
      <PageSection id="active" title="Active members" description="They can sign in today.">
        {children}
      </PageSection>
    </PageContainer>
  )
}
```

#### ListToolbar, SearchInput, FilterMenu, FilterButton

Exports: `ListToolbar`, `SearchInput`, `FilterMenu`, `FilterButton`, types `ListToolbarProps`,
`SearchInputProps`, `FilterMenuProps`, `FilterOption`, `FilterButtonProps`.

- `ListToolbar`: the row above a list. Children on the left (search first, then filters), `actions` on
  the right. No outer margin: add `className="mb-4"` unless the parent spaces its children.
- `SearchInput`: `value` + `onValueChange(query)`, or `defaultValue`; `placeholder` (default "Search",
  phrase it as "Search invoices"), `label` (accessible name, defaults to the placeholder), `size`
  `tiny`, `sm` (default), `md`; `className` (wrapper width), `inputClassName`. Escape and the × button
  clear it (`clearLabel` names that button, default "Clear search"). Debounce upstream when it hits a
  server.
- `FilterMenu`: multi-select filter. `label`, `options` (`FilterOption[]`: `value`, `label`, `count`,
  `icon`, `disabled`), `value` + `onValueChange(values)` or `defaultValue`, `heading`, `clearLabel`
  (text of the reset item, default "Clear filter"), `triggerLabel(label, selected)` (accessible name of
  the trigger, default "Filter by status" / "Status filter: Paid, Overdue"), `open` / `defaultOpen` /
  `onOpenChange`, `align`, `disabled`, `className`, `contentClassName`. An empty selection means "no
  filter".
- `FilterButton`: the dashed trigger alone (`label`, `selected: string[]`, `triggerLabel`), for a custom
  filter panel: use it as the `asChild` child of a `PopoverTrigger` / `DropdownMenuTrigger`.

```tsx
import * as React from 'react'
import { Button, FilterMenu, ListToolbar, SearchInput, StatusDot, type FilterOption } from 'ferry-ui'
import { Download } from 'lucide-react'

const STATUS_OPTIONS: FilterOption[] = [
  { value: 'active', label: 'Active', count: 18, icon: <StatusDot tone="success" /> },
  { value: 'invited', label: 'Invited', count: 2, icon: <StatusDot tone="info" /> },
  { value: 'suspended', label: 'Suspended', count: 1, icon: <StatusDot tone="neutral" /> },
]

export function MembersToolbar({ onExport }: { onExport: () => void }) {
  const [query, setQuery] = React.useState('')
  const [statuses, setStatuses] = React.useState<string[]>([])
  return (
    <ListToolbar
      className="mb-4"
      actions={
        <Button icon={<Download />} onClick={onExport}>
          Export
        </Button>
      }
    >
      <SearchInput placeholder="Search members" value={query} onValueChange={setQuery} />
      <FilterMenu label="Status" options={STATUS_OPTIONS} value={statuses} onValueChange={setStatuses} />
    </ListToolbar>
  )
}
```

#### TableSkeletonRows, TableMessageRow, TableErrorRow

Exports: `TableSkeletonRows`, `TableMessageRow`, `TableErrorRow`, types `TableSkeletonRowsProps`,
`TableMessageRowProps`, `TableErrorRowProps`. Rows for the states of a `TableBody` (recipe 6.2).

- `TableSkeletonRows`: `columns` (required, the number of columns), `rows` (default 4). First load
  only; set `aria-busy` on the `TableBody`.
- `TableMessageRow`: `colSpan` (required), children = the message, `tone` `neutral` (default) or
  `destructive` (`muted` is a deprecated alias of `neutral`). Empty table, no match.
- `TableErrorRow`: `colSpan`, `error` (required), `onRetry`, `retrying`, `retryLabel`. The rows failed
  to load.
- Other `<tr>` props (`data-*`, `aria-*`…) are forwarded to the row (to every placeholder row for
  `TableSkeletonRows`).

#### rowLinkProps

`rowLinkProps(onOpen)` returns `{ className, onClick }` to spread on a `TableRow` so the whole row is
clickable. Clicks on links, buttons, inputs and menus inside the row are ignored, as are clicks that end
a text selection. Keep a real link in the first cell. Server-safe function, but the handler it returns
only works in a client component.

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableSkeletonRows, rowLinkProps } from 'ferry-ui'

interface Member {
  id: string
  name: string
  role: string
}

export function MembersTable({ members, onOpen }: { members: Member[] | undefined; onOpen: (id: string) => void }) {
  return (
    <Table aria-label="Members">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody aria-busy={members === undefined}>
        {members === undefined ? (
          <TableSkeletonRows columns={2} rows={3} />
        ) : (
          members.map((member) => (
            <TableRow key={member.id} {...rowLinkProps(() => onOpen(member.id))}>
              <TableCell>
                <a href={`/members/${member.id}`}>{member.name}</a>
              </TableCell>
              <TableCell>{member.role}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
```

#### EmptyState, ErrorState

Exports: `EmptyState`, `ErrorState`, types `EmptyStateProps`, `ErrorStateProps`. Example: recipe 6.7.

- `EmptyState`: `title` (required), `icon`, `description`, `actions`, `children` (extra content under
  the actions), `variant` `dashed` (default: room for content), `bordered` (standalone pages: not found,
  crashed, no access), `plain` (inside an existing card or popover); `size` `sm`, `md` (default), `lg`
  (whole page).
- `ErrorState`: red box for a first load that failed. `error` (anything thrown), `title` (default
  "Something went wrong"), `description` (replaces the error's message), `onRetry`, `retrying`,
  `retryLabel`. Omit `onRetry` when retrying cannot help.

```tsx
import { Button, EmptyState } from 'ferry-ui'
import { SearchX } from 'lucide-react'

export function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <EmptyState
      icon={<SearchX />}
      title={`No results for “${query}”`}
      description="Check the spelling or remove a filter."
      actions={<Button onClick={onClear}>Clear filters</Button>}
    />
  )
}
```

#### Callout, StaleDataCallout

Exports: `Callout`, `StaleDataCallout`, types `CalloutProps`, `CalloutTone`, `CalloutSize`,
`CalloutVariant`, `CalloutActionsPlacement`, `StaleDataCalloutProps`.

Persistent inline message tied to a page, card or form. Not for transient feedback (`toast`).

- `tone`: `info` (default), `warning`, `destructive` (announced as an alert), `success`, `neutral`.
- `variant`: `box` (default, in the content flow), `banner` (flush strip at the top of a card or panel).
- `size`: `md` (default), `sm` (form-submit errors, dialogs). Ignored by `banner`.
- `title`, children (the message), `icon` (default per tone; `false` hides it), `actions` (use
  `Button size="tiny"`), `actionsPlacement` `bottom` (default) or `end` (one short action on the right),
  `role` (default `alert` for `destructive`, else `note`).
- `StaleDataCallout`: `error` and `onRetry` (required), `retrying`, `retryLabel`, children (replaces the
  default sentence, "This data may be out of date. Refreshing failed: <message>"). Place it above data
  that could not be refreshed.

```tsx
import { Button, Callout } from 'ferry-ui'

export function TrialCallout({ daysLeft, onAddCard }: { daysLeft: number; onAddCard: () => void }) {
  return (
    <Callout
      tone="warning"
      title={`Your trial ends in ${daysLeft} days`}
      actionsPlacement="end"
      actions={
        <Button size="tiny" onClick={onAddCard}>
          Add payment method
        </Button>
      }
    >
      Add a payment method to keep access to your projects.
    </Callout>
  )
}
```

#### ConfirmDialog

Exports: `ConfirmDialog`, types `ConfirmDialogProps`, `ConfirmDialogTone`. Example: recipe 6.6.

- `title` (required, a question naming the target), `description` (the consequences), `children` (extra
  content: a checkbox, a callout, a list of affected items).
- `onConfirm` (required): may return a promise. Spinner while it is pending, the dialog cannot be
  dismissed, a rejection is shown inline, it closes on success.
- `confirmLabel` (default "Confirm": name the action instead), `cancelLabel` (default "Cancel").
- `tone`: `destructive` (default), `warning`, `primary`.
- `confirmText`: the user must type this exact text; `confirmTextLabel` rewords the prompt.
- Open state: `trigger` (an element, usually a `Button`) for uncontrolled use, or `open` +
  `onOpenChange` (plus `defaultOpen`). `className` goes to the panel.

#### CopyButton, CopyField, SecretField

Exports: `CopyButton`, `CopyField`, `SecretField`, types `CopyButtonProps`, `CopyFieldProps`,
`SecretFieldProps`, `CopyLabels`.

- `CopyButton`: `value` (required), `label` (visible text; without it the button is icon-only with a
  tooltip), `what` (what is copied: accessible name "Copy API key"; always set it on icon-only
  buttons), `onCopy(value)`, plus `Button` props (`variant="ghost"` in dense rows, `size`).
- `CopyField`: read-only field with a Copy button. `value` (required), `id`, `mono` (default `true`),
  `what`, `size` `sm` or `md` (default), `aria-label`, `aria-describedby`, `onCopy`, `className`.
- `SecretField`: same props, masked until revealed, copies without revealing. Plus `mask`, `revealed` +
  `onRevealedChange`, `defaultRevealed`. Use it for every credential on screen.
- `labels` (all three, and `CodeBlock`): a `Partial<CopyLabels>` that translates or rewords the built-in
  English texts. `copy` ("Copy"), `copied` ("Copied"), `copyWhat(what)` ("Copy API key"), and for
  `SecretField` `reveal` / `hide` (tooltips) and `revealWhat(what)` / `hideWhat(what)` (accessible
  names). Unset entries keep their default.

```tsx
import { CopyButton, CopyField, FormCard, FormRow, SecretField } from 'ferry-ui'

export function ApiAccessCard({ projectId, apiKey }: { projectId: string; apiKey: string }) {
  return (
    <FormCard asDiv title="API access" description="Use these values to call the API from your backend.">
      <FormRow label="Project ID" htmlFor="project-id">
        <CopyField value={projectId} what="project ID" />
      </FormRow>
      <FormRow label="Secret key" description="Never share it or commit it." htmlFor="secret-key">
        <SecretField value={apiKey} what="secret key" />
      </FormRow>
      <FormRow label="Endpoint">
        <span className="flex items-center gap-2 font-mono text-[13px]">
          https://api.example.com/v1
          <CopyButton value="https://api.example.com/v1" what="endpoint URL" variant="ghost" />
        </span>
      </FormRow>
    </FormCard>
  )
}
```

#### CodeBlock, CodeBlockPrompt

Exports: `CodeBlock`, `CodeBlockPrompt`, types `CodeBlockProps`, `CodeBlockVariant`,
`CodeBlockPromptProps`.

Monospace snippet with a copy button. No syntax highlighting.

- `code` (plain text) or `children` (rich content; then pass `copyValue`). `copyValue` overrides what is
  copied (show a masked key, copy the real one).
- `variant`: `block` (default), `inline` (one-line chip), `terminal` (decorative window, not copyable
  unless `copyable`).
- `prompt`: `true` renders `$` before each line, or pass a string (`'>'`). Never copied.
- `copyable` (default `true`, `false` for `terminal`), `copyPlacement` `overlay` (default) or `side`
  (long single lines), `what` (accessible name of the copy button), `size` `sm` or `md`, `wrap`,
  `onCopy(value)`, `labels` (a `Partial<CopyLabels>` to translate "Copy <what>" / "Copied").
- `CodeBlockPrompt`: the muted prompt for rich `children` (children default `$`).

```tsx
import { CodeBlock, CodeBlockPrompt } from 'ferry-ui'

export function QuickStart({ apiKey }: { apiKey: string }) {
  return (
    <div className="flex flex-col gap-3">
      <CodeBlock prompt code="npm install @acme/sdk" copyPlacement="side" />
      <CodeBlock variant="inline" code="{{customer.name}}" what="placeholder" />
      <CodeBlock copyValue={`export ACME_API_KEY=${apiKey}`} what="command" wrap>
        <CodeBlockPrompt />
        export ACME_API_KEY=sk_live_••••
      </CodeBlock>
    </div>
  )
}
```

#### DescriptionList, DescriptionItem

Exports: `DescriptionList`, `DescriptionItem`, types `DescriptionListProps`, `DescriptionListVariant`,
`DescriptionListColumns`, `DescriptionItemProps`, `DescriptionItemSpan`.

Read-only label / value facts about **one** record, as a semantic `<dl>`. Example: recipe 6.4.

- `DescriptionList`: `variant` `grid` (default: bordered card of cells), `strip` (one row of cells
  flush at the bottom of a card), `rows` (full-width rows, label left and value right), `inline`
  (compact two-column list for popovers); `columns` 1 to 4 (default 4; `grid` and `strip` only);
  `divided` (`rows` only, default `true`: hairline above the first row).
- `DescriptionItem`: `label` (required), children = the value (empty shows "—"), `mono`, `wrap`,
  `loading`, `valueClassName`; `span` 1, 2 or `'full'` (`grid` only); `icon`, `hint`, `href`,
  `linkComponent` (`rows` only: `href` turns the whole row into a link).
- In `grid`, fill every row or use `span` so no empty cell shows.

```tsx
import { DescriptionItem, DescriptionList } from 'ferry-ui'
import { KeyRound, Users } from 'lucide-react'

export function WorkspaceSummary({ members, pending, keys }: { members: number; pending: number; keys: number }) {
  return (
    <DescriptionList variant="rows" divided={false} aria-label="Workspace summary">
      <DescriptionItem label="Members" icon={<Users />} hint={`${pending} pending`} href="/members">
        {members}
      </DescriptionItem>
      <DescriptionItem label="API keys" icon={<KeyRound />} href="/api-keys">
        {keys}
      </DescriptionItem>
      <DescriptionItem label="Region" mono>
        eu-west
      </DescriptionItem>
    </DescriptionList>
  )
}
```

#### Field

Exports: `Field`, types `FieldProps`, `FieldControlProps`, `FieldRenderMeta`. Example: recipe 6.8.

Stacked form field: label, control, then hint or error, with ids and ARIA wired for you. For label-left
settings rows use `FormRow`; for a checkbox or switch with an inline label use `Label`.

- `label` (required), `hint`, `error` (sets `aria-invalid` on the control, rendered as an alert),
  `optional` (`true` shows "(optional)", or pass your own text), `errorReplacesHint` (default `true`).
- `size`: `md` (default, page forms), `sm` (dialogs, popovers).
- `labelVariant`: `default`, `subtle` (sign-in forms), `mono` (caption for read-only values).
- `labelAs`: `label` (default) or `span` (groups with no single focus target: `RadioGroup`,
  `RadioCardGroup`, `ToggleGroup`; the control then gets `aria-labelledby`).
- `id`: defaults to the child's `id`, else generated.
- Children: one control element (`Input`, `Textarea`, `RadioGroup`…), or a render function
  `(control, { labelId }) => node` for composite controls: spread `control` onto the focusable element
  (`<SelectTrigger {...control}>`).

```tsx
import { Field, Input, RadioGroup, RadioGroupItem, Label } from 'ferry-ui'

interface WebhookFieldsProps {
  url: string
  onUrlChange: (url: string) => void
  urlError?: string
  format: string
  onFormatChange: (format: string) => void
}

export function WebhookFields({ url, onUrlChange, urlError, format, onFormatChange }: WebhookFieldsProps) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Endpoint URL" hint="We send a POST request for every event." error={urlError}>
        <Input mono placeholder="https://example.com/webhooks" value={url} onChange={(event) => onUrlChange(event.target.value)} />
      </Field>
      <Field label="Payload format" labelAs="span">
        <RadioGroup value={format} onValueChange={onFormatChange}>
          <Label>
            <RadioGroupItem value="json" /> JSON
          </Label>
          <Label>
            <RadioGroupItem value="form" /> Form-encoded
          </Label>
        </RadioGroup>
      </Field>
    </div>
  )
}
```

#### FormCard, FormRow, FormActions, ActionRow

Exports: `FormCard`, `FormRow`, `FormActions`, `ActionRow`, types `FormCardProps`, `FormCardTone`,
`FormRowProps`, `FormActionsProps`, `ActionRowProps`. Example: recipe 6.3.

- `FormCard`: a `<form noValidate>` in a card (you validate). `title`, `description`, `headerActions`,
  `footer` (usually `FormActions`), `onSubmit` and other `<form>` props; `asDiv` renders a `<div>`
  instead (read-only cards, instant toggles, action rows); `tone` `neutral` (default) or `destructive`
  (the danger zone; `default` is a deprecated alias of `neutral`). Children are `FormRow`s or
  `ActionRow`s, divided by hairlines.
- `FormRow`: `label` (required), `description`, `htmlFor` (the control's `id`), `error`, `layout`
  `horizontal` (default: label left, control right from `md`) or `vertical` (wide controls),
  `controlClassName` (`max-w-xs` for a short field). With `htmlFor="x"` and a single control as child
  (`Input`, `Textarea`, `Checkbox`, `Switch`, `CopyField`, a native control), the row wires it for you:
  `id="x"`, `aria-describedby` (the description `x-description` and the error `x-error`) and, while
  `error` is set, `aria-invalid`. Do not set them by hand. For a composite control, pass a render
  function and spread `control` onto its focusable part: `{(control) => <Select><SelectTrigger
  {...control} />…</Select>}`. Without `htmlFor`, the render function also receives
  `aria-labelledby`, for groups (`RadioGroup`, `ToggleGroup`, `RadioCardGroup`).
- `FormActions`: `dirty` (required), `saving`, `invalid` (the last submit failed validation: adds
  `invalidMessage` to the status, Save stays enabled so the user can fix and resubmit), `onReset`
  (shows Cancel), `onSave` (only when the card is not a form; otherwise Save is `type="submit"`),
  `saveLabel` (default "Save changes"), `cancelLabel`, `unsavedLabel`, `invalidMessage` (default "fix
  the highlighted fields"), `hint`, `children`.
- `ActionRow`: `title` and `action` (required; one `Button`, often opening a `ConfirmDialog`),
  `description`, `tone` (inherits the card's).

```tsx
import { ActionRow, Button, FormCard } from 'ferry-ui'

export function DataActions({ onExport, exporting }: { onExport: () => void; exporting: boolean }) {
  return (
    <FormCard asDiv title="Your data">
      <ActionRow
        title="Export data"
        description="Download every invoice and customer as CSV files."
        action={
          <Button loading={exporting} onClick={onExport}>
            Export
          </Button>
        }
      />
    </FormCard>
  )
}
```

#### SaveBar

Exports: `SaveBar`, types `SaveBarProps`, `SaveBarAction`.

Save footer for editors and long forms: status on the left, Cancel / Save on the right.

- `dirty` (required), `invalid` (live validation: Save stays disabled, unlike `FormActions`), `saving`,
  `error` (last save error, shown as an alert), `hint` (neutral summary while pristine).
- `onReset` (shows Cancel), `onSave` (omit it inside a `<form>`: Save is then `type="submit"`).
- `saveLabel`, `cancelLabel`, `unsavedLabel`, `invalidMessage`.
- `extraAction` (`SaveBarAction`: `label`, `onClick`, `icon`, `hint`, `loading`): a second save flavour
  ("Save and publish") that becomes the primary button.
- `variant`: `bar` (default, own border and tinted strip) or `inline` (only the row). `sticky` keeps it
  at the bottom of the scrolling ancestor.

#### KeyValueEditor, useKeyValueRows

Exports: `KeyValueEditor`, types `KeyValueEditorProps`, `KeyValueEditorLabels`, `KeyValueItemNoun`;
from the rows helpers: `useKeyValueRows`, `rowsFromPairs`, `pairsFromRows`, `validateRows`, `mergeRows`,
`newRowId`, `parseKeyValueText`, `formatKeyValueText`, `validateIdentifierKey`, `isIdentifierKey`,
`VALUE_MASK`, types `KeyValuePair`, `KeyValueRow`, `KeyValidator`, `ValidateRowsOptions`,
`KeyValueRowsState`, `ParseKeyValueTextOptions`, `ParsedKeyValueText`.

Editable list of key / value pairs (request headers, metadata, labels, variables) with add / remove,
validation, secret masking and bulk paste / import of `key=value` lines.

- `KeyValueEditor`: `value` + `onValueChange(rows)`, or `defaultValue`; `errors` (map of row id to
  message), `validateKey`, `readOnly`, `disabled`, `maskValues`, `revealAll`, `allowImport` (default
  `true`), `importAccept` (file types of the import dialog's file picker, default
  `.txt,.env,text/plain`), `emptyMessage`. Texts: `keyLabel`, `valueLabel`, `keyPlaceholder`,
  `valuePlaceholder`, `addLabel`, `importLabel`, `itemNoun` (`{ one, other }`), `listLabel`, `labels`
  (every other built-in text, for translation).
- `KeyValuePair` is `{ key, value, secret? }`; `KeyValueRow` adds a stable `id`.
- `useKeyValueRows(initial, options?)` returns `{ rows, setRows, reset, pairs, errors, valid, dirty }`
  (`KeyValueRowsState`). `initial` is read once: call `reset(pairs)` after a load or a save. Keep
  `options` (`ValidateRowsOptions`: `validateKey`, `messages`) stable (module level).
- Helpers: `rowsFromPairs(pairs)`, `pairsFromRows(rows)`, `validateRows(rows, options?)`,
  `mergeRows(rows, incoming)`, `newRowId()`, `parseKeyValueText(text, options?)` returning
  `{ pairs, invalid }`, `formatKeyValueText(pairs)`, `validateIdentifierKey` (a `KeyValidator` for
  identifier-style keys: letters, digits, `_`, `.` and `-`, not starting with a digit),
  `isIdentifierKey(key)`, `VALUE_MASK` (the fixed mask string).

```tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  KeyValueEditor,
  SaveBar,
  useKeyValueRows,
  validateIdentifierKey,
  type KeyValuePair,
  type ValidateRowsOptions,
} from 'ferry-ui'

// Module level: keeps the validation options stable between renders.
const OPTIONS: ValidateRowsOptions = { validateKey: validateIdentifierKey }

interface MetadataCardProps {
  saved: KeyValuePair[]
  saving: boolean
  saveError?: string
  onSave: (pairs: KeyValuePair[]) => void
}

export function MetadataCard({ saved, saving, saveError, onSave }: MetadataCardProps) {
  const metadata = useKeyValueRows(saved, OPTIONS)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Metadata</CardTitle>
      </CardHeader>
      <CardContent>
        <KeyValueEditor
          value={metadata.rows}
          onValueChange={metadata.setRows}
          errors={metadata.errors}
          validateKey={validateIdentifierKey}
          itemNoun={{ one: 'label', other: 'labels' }}
          emptyMessage="No metadata yet."
          disabled={saving}
        />
      </CardContent>
      <SaveBar
        dirty={metadata.dirty}
        invalid={!metadata.valid}
        saving={saving}
        error={saveError}
        hint={`${metadata.pairs.length} labels`}
        onReset={() => metadata.reset(saved)}
        onSave={() => onSave(metadata.pairs)}
      />
    </Card>
  )
}
```

#### RadioCardGroup, RadioCard

Exports: `RadioCardGroup`, `RadioCard`, types `RadioCardGroupProps`, `RadioCardProps`,
`RadioCardOption`, `RadioCardSize`, `RadioCardAppearance`, `RadioCardIndicator`.

Single choice among 2 to 6 options shown as selectable cards (icon, title, description).

- `RadioCardGroup`: `value` + `onValueChange(value)` (`null` = controlled with nothing selected), or
  `defaultValue`; `options` (`RadioCardOption[]`: `value`, `label`, `description`, `icon`, `disabled`)
  and / or `RadioCard` children; `size` `lg` (default) or `sm`; `appearance` `outline` (default) or
  `soft`; `indicator` `check`, `radio` or `none` (default `check` for `outline`, `radio` for `soft`);
  `columns` 1, 2 or 3 (from `sm` up); `disabled`; `name`, `required`; `aria-label` /
  `aria-labelledby`; `aria-invalid`.
- `RadioCard`: `value` and `label` (required), `description`, `icon`, `media` (a preview shown above
  the label, for appearance pickers), `children` (non-interactive extra content: a price, a `Badge`),
  `disabled`.
- Wrap it in `Field labelAs="span"` for a visible label, hint and error.

```tsx
import { Field, RadioCardGroup, type RadioCardOption } from 'ferry-ui'
import { Globe, Lock } from 'lucide-react'

type Visibility = 'private' | 'public'

const VISIBILITY_OPTIONS: RadioCardOption<Visibility>[] = [
  { value: 'private', label: 'Private', description: 'Only invited members can open it.', icon: <Lock /> },
  { value: 'public', label: 'Public', description: 'Anyone with the link can view it.', icon: <Globe /> },
]

interface VisibilityFieldProps {
  value: Visibility | null
  onChange: (visibility: Visibility) => void
  error?: string
}

export function VisibilityField({ value, onChange, error }: VisibilityFieldProps) {
  return (
    <Field label="Visibility" labelAs="span" error={error}>
      <RadioCardGroup value={value} onValueChange={onChange} options={VISIBILITY_OPTIONS} columns={2} />
    </Field>
  )
}
```

#### ResourceGrid, ResourceCard, ResourceCardSkeleton

Exports: `ResourceGrid`, `ResourceCard`, `ResourceCardSkeleton`, `resourceGridClassName`, types
`ResourceGridProps`, `ResourceCardProps`, `ResourceCardSkeletonProps`. Example: recipe 6.5.

- `ResourceGrid`: responsive `<ul>` grid. `minItemWidth` (default 248px; a number of px or a CSS
  length). Give it `aria-label`, and `aria-busy` while it holds skeletons.
- `ResourceCard`: `name` (required), `href` (the whole card becomes a link), `linkComponent`, `icon`,
  `menu` (top-right slot: a ghost `icon-tiny` `Button` opening a `DropdownMenu`), `subtitle`, `badges`,
  `footer` (pinned to the bottom; interactive elements in it need `className="relative z-10"`), `as`
  `li` (default) or `div`, `titleAs` `h2` to `h6` or `div` (default `h3`).
- `ResourceCardSkeleton`: same footprint; `as` `li` (default) or `div`.
- `resourceGridClassName`: the grid classes, for a list element you do not control.

```tsx
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ResourceCard,
  ResourceGrid,
  StatusLine,
} from 'ferry-ui'
import { FolderKanban, MoreVertical } from 'lucide-react'

interface Project {
  id: string
  name: string
  owner: string
  plan: string
}

export function ProjectGrid({ projects, onArchive }: { projects: Project[]; onArchive: (id: string) => void }) {
  return (
    <ResourceGrid aria-label="Projects" minItemWidth={280}>
      {projects.map((project) => (
        <ResourceCard
          key={project.id}
          name={project.name}
          href={`/projects/${project.id}`}
          icon={<FolderKanban />}
          subtitle={`Owned by ${project.owner}`}
          badges={
            <Badge font="mono" shape="square">
              {project.plan}
            </Badge>
          }
          menu={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-tiny" icon={<MoreVertical />} aria-label={`Actions for ${project.name}`} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onArchive(project.id)}>Archive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
          footer={<StatusLine tone="success">Project is active</StatusLine>}
        />
      ))}
    </ResourceGrid>
  )
}
```

#### MetricCard, MetricTrend, UsageBar, LegendDot

Exports: `MetricCard`, `MetricTrend`, `UsageBar`, `LegendDot`, `USAGE_BAR_TONES`, `LEGEND_DOT_TONES`,
types `MetricCardProps`, `MetricTrendProps`, `MetricTrendDirection`, `MetricTrendSentiment`,
`UsageBarProps`, `UsageBarTone`, `LegendDotProps`, `LegendDotTone`. Example: recipe 6.5.

- `MetricCard`: `label` (required), `value` (already formatted), `unit`, `trend` (a `MetricTrend`),
  `hint` (line under the value), `info` (tooltip from an (i) button; never essential information),
  `infoLabel`, `aside` (right of the header: a `LegendDot`, a badge), `loading`, `compact` (16px
  padding), `children` (a `UsageBar`, a chart). Grid: `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`.
- `MetricTrend`: children = the signed, formatted change ("+12.5%"); `direction` `up` (default),
  `down`, `flat`; `sentiment` `positive`, `negative`, `neutral` (defaults follow the direction; override
  when a rise is bad: `direction="up" sentiment="negative"`).
- `UsageBar`: `value` 0 to 100 (required), `label` (accessible name; always set it), `tone` `auto`
  (default: turns `warning` at `warningAt`, default 75, and `destructive` at `destructiveAt`, default 90),
  `brand`, `warning`, `destructive`. `USAGE_BAR_TONES` lists the tones.
- `LegendDot`: children = series name; `tone` `brand` (default), `chart-1` to `chart-5`, `success`,
  `warning`, `destructive`, `info`, `neutral`; `dotClassName`. `LEGEND_DOT_TONES` lists the tones.

```tsx
import { LegendDot, MetricCard, MetricTrend, UsageBar } from 'ferry-ui'

export function SeatUsage({ used, total, change }: { used: number; total: number; change: string }) {
  return (
    <MetricCard
      label="Seats"
      value={used}
      unit={`of ${total}`}
      trend={<MetricTrend direction="up" sentiment="neutral">{change}</MetricTrend>}
      aside={<LegendDot tone="chart-2">Assigned</LegendDot>}
    >
      <UsageBar value={(used / total) * 100} label="Seats used" aria-valuetext={`${used} of ${total} seats`} />
    </MetricCard>
  )
}
```

#### UsageBreakdown

Exports: `UsageBreakdown`, types `UsageBreakdownProps`, `UsageBreakdownItem`. How a capacity is split
between its parts: a header ("20% used", "197.6k / 1M"), a segmented bar, and one row per part with its
color, name, amount and share of the total. For one percentage, use `UsageBar`.

- `items` (required): `{ key, label, value, tone?, info? }`, the largest first. `tone` uses the
  `LegendDot` vocabulary (default `chart-1` … `chart-5` in order, then `neutral`); give small "other"
  parts `neutral`. `info` underlines the label with dots and explains it in a tooltip (needs
  `TooltipProvider`).
- `total` (required): the capacity, in the unit of the values. `label` (required): accessible name of
  the bar ("Storage used").
- `formatValue`: formats the amounts (default compact: `8.3k`, `197.6k`, `1M`).
- `title`: left of the header (default "20% used"). `summary`: right of the header (default
  "used / total"; `null` hides it). `hideList`: only the header and the bar.

```tsx
import { MetricCard, UsageBreakdown } from 'ferry-ui'

export function StorageCard({ images, videos, other }: { images: number; videos: number; other: number }) {
  return (
    <MetricCard label="Storage">
      <UsageBreakdown
        label="Storage used"
        total={50 * 1024 ** 3}
        formatValue={(bytes) => `${(bytes / 1024 ** 3).toFixed(1)} GB`}
        items={[
          { key: 'images', label: 'Images', value: images },
          { key: 'videos', label: 'Videos', value: videos },
          { key: 'other', label: 'Other', value: other, tone: 'neutral', info: 'Documents, archives and backups.' },
        ]}
      />
    </MetricCard>
  )
}
```

#### InfoTile

Exports: `InfoTile`, type `InfoTileProps`. Overview tile: icon box, mono label, value, optional hint.
Props: `label` (required), `value`, `icon`, `hint`, `loading`. Lay tiles out in
`grid gap-x-8 gap-y-6 sm:grid-cols-2`. For numbers people compare, use `MetricCard`.

```tsx
import { InfoTile, StatusBadge } from 'ferry-ui'
import { CreditCard, ShieldCheck, User } from 'lucide-react'

export function AccountOverview({ owner, plan, renewsOn }: { owner: string | undefined; plan: string; renewsOn: string }) {
  return (
    <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
      <InfoTile icon={<ShieldCheck />} label="Status" value={<StatusBadge tone="success" label="Active" />} />
      <InfoTile icon={<CreditCard />} label="Plan" value={plan} hint={`Renews on ${renewsOn}`} />
      <InfoTile icon={<User />} label="Owner" value={owner} loading={owner === undefined} />
    </div>
  )
}
```

#### IconBox

Exports: `IconBox`, `iconBoxVariants`, types `IconBoxProps`, `IconBoxSize`, `IconBoxTone`,
`IconBoxVariantProps`. Outlined square holding one line icon: the "kind" mark in front of a name.

- `size`: `xs` 28px, `sm` 32px, `md` 36px (default), `lg` 44px, `xl` 56px (72px from `md` up).
- `tone`: `neutral` (default), `primary` (current / selected), `success`, `warning`, `destructive`,
  `info`.
- `elevated`: card shadow (default `true` for `lg` and `xl`).
- `label`: accessible name; without it the box is decorative.
- `iconBoxVariants({ size, tone, elevated })` returns the classes.

#### StatusBadge, StatusDot, StatusLine

Exports: `StatusBadge`, `StatusDot`, `StatusLine`, `statusBadgeVariants`, `STATUS_TONES`, types
`StatusTone`, `StatusBadgeProps`, `StatusDotProps`, `StatusLineProps`.

`StatusTone`: `success` (healthy, done, paid), `warning` (needs attention), `destructive` (failed,
overdue), `info` (in progress, pending), `neutral` (inactive, draft). Map your domain statuses to a
tone once (recipe 6.2). `STATUS_TONES` lists the tones in display order.

- `StatusBadge`: uppercase pill with a dot. `label` (required), `tone` (default `neutral`), `size` `md`
  (default) or `sm` (next to a title), `pulse` (only while something is happening), `icon`, `dot`.
- `StatusDot`: 6px dot. `tone`, `pulse`, `label` (accessible name; without it the dot is decorative, so
  put text next to it).
- `StatusLine`: circled icon + sentence, for card footers. `tone`, children (required), `icon`, `spin`
  (in progress), `iconClassName`.
- `statusBadgeVariants({ tone, size })` returns the badge classes.

```tsx
import { IconBox, StatusBadge, StatusDot, StatusLine } from 'ferry-ui'
import { Webhook } from 'lucide-react'

export function WebhookStatus({ syncing }: { syncing: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <IconBox size="sm">
          <Webhook />
        </IconBox>
        <span className="text-sm text-foreground">Order events</span>
        {syncing ? <StatusBadge tone="info" label="Syncing" pulse /> : <StatusBadge tone="success" label="Active" />}
      </div>
      <span className="flex items-center gap-2 text-[13px] text-foreground-light">
        <StatusDot tone="success" /> 3 endpoints online
      </span>
      <StatusLine tone={syncing ? 'info' : 'success'} spin={syncing}>
        {syncing ? 'Delivering queued events…' : 'All events delivered'}
      </StatusLine>
    </div>
  )
}
```

#### SplitButton

Exports: `SplitButton`, types `SplitButtonProps`, `SplitButtonVariant`, `SplitButtonSize`,
`SplitButtonActionProps`, `SplitButtonMenuProps`. A main action joined to a chevron menu of
alternatives.

- children = label of the main action; `onClick`; `menu` (required: `DropdownMenuItem`s) and
  `menuLabel` (accessible name of the chevron, default "More actions").
- `variant`: `default`, `primary`, `outline`, `destructive`, `warning`. `size`: `tiny`, `sm` (default), `md`,
  `lg`.
- `icon`, `loading`, `disabled`, `menuDisabled`, `type` (`button`, `submit`, `reset`).
- `open` / `defaultOpen` / `onOpenChange` (the menu), `menuProps` (panel: `align`, `className`),
  `actionProps` (extra props of the main button).

```tsx
import { DropdownMenuItem, SplitButton } from 'ferry-ui'

interface PublishButtonProps {
  publishing: boolean
  onPublish: () => void
  onSchedule: () => void
  onSaveDraft: () => void
}

export function PublishButton({ publishing, onPublish, onSchedule, onSaveDraft }: PublishButtonProps) {
  return (
    <SplitButton
      variant="primary"
      loading={publishing}
      onClick={onPublish}
      menuLabel="More publish options"
      menu={
        <>
          <DropdownMenuItem onSelect={onSchedule}>Schedule…</DropdownMenuItem>
          <DropdownMenuItem onSelect={onSaveDraft}>Save as draft</DropdownMenuItem>
        </>
      }
    >
      Publish
    </SplitButton>
  )
}
```

#### MonoLabel

Exports: `MonoLabel`, types `MonoLabelProps`, `MonoLabelElement`. The signature caption: small uppercase
monospace text for card titles, column headers, menu groups, key / value captions (1 to 4 words).
`as`: `span` (default), `div`, `p`, `h2`, `h3`, `h4`, `dt`, `th`, `legend`, `label` (with `htmlFor`).
Without the component, the `mono-label` class gives the same look.

#### Kbd

Exports: `Kbd`, type `KbdProps`. A keycap for shortcut hints: `<Kbd>Esc</Kbd>`, `<Kbd>{mod} K</Kbd>`
with `const mod = useModKey()`. Display only: bind the shortcut yourself.

```tsx
import { Kbd, MonoLabel, useModKey } from 'ferry-ui'

export function ShortcutList() {
  const mod = useModKey()
  return (
    <section className="flex flex-col gap-2">
      <MonoLabel as="h3">Shortcuts</MonoLabel>
      <p className="flex items-center justify-between text-[13px] text-foreground-light">
        Open the command menu <Kbd>{mod} K</Kbd>
      </p>
      <p className="flex items-center justify-between text-[13px] text-foreground-light">
        Close a dialog <Kbd>Esc</Kbd>
      </p>
    </section>
  )
}
```

### 7.6 Layout

#### NavItem, NavGroup

Types shared by `IconRail`, `MobileNav`, `InnerMenu` and `CommandMenu`, so one navigation definition
feeds them all.

- `NavItem`: `id` (required, stable), `label` (required), `icon` (a lucide element), `href`
  (rendered through the link component), `onSelect` (instead of, or in addition to, `href`), `active`
  (the current location; sets `aria-current="page"`), `external` (opens a new tab: the item renders a
  plain `<a target="_blank" rel="noreferrer">`, not the link component), `badge` (trailing count or
  tag), `disabled`.
- `NavGroup`: `id` (required), `label` (optional mono heading), `items`.

#### AppShell, useAppShell

Exports: `AppShell`, `useAppShell`, types `AppShellProps`, `AppShellContextValue`. Example: recipe 6.1.

The application frame, used once at the root of the signed-in app: a full-viewport column with a top
bar, a desktop rail, a scrolling `<main>` and a skip link.

- Slots: `topBar`, `rail` (shown from `md` up), `mobileNav` (the phone drawer), `children` (the page).
- Drawer state: `mobileNavOpen` + `onMobileNavOpenChange`, or `defaultMobileNavOpen`. A `MobileNav`
  rendered inside the shell follows this state without props.
- `onCommandShortcut`: called on mod+K (toggle the `CommandMenu`).
- `scrollKey`: pass the pathname so each new page starts scrolled to the top.
- `mainId`, `mainClassName`, `skipLinkLabel` (default "Skip to content").
- `useAppShell()` returns `{ mobileNavOpen, setMobileNavOpen, mainId }`, or `null` outside a shell.

#### TopBar and its parts

Exports: `TopBar`, `TopBarLogo`, `TopBarSeparator`, `TopBarSegment`, `TopBarSearch`,
`TopBarIconButton`, `TopBarUserMenu`, types `TopBarProps`, `TopBarLogoProps`, `TopBarSegmentProps`,
`TopBarSearchProps`, `TopBarIconButtonProps`, `TopBarUserMenuProps`.

48px application header: logo, a slash-separated trail, actions on the right.

- `TopBar`: `logo`, children (the trail: a `TopBarSeparator` before each `TopBarSegment` or
  `ResourceSwitcher`), `actions` (search, icon buttons, `ThemeMenu`, user menu last), `onOpenMobileNav`
  (shows a hamburger below `md`), `mobileNavLabel`, `navLabel`.
- `TopBarLogo`: `label` (required accessible name, "Acme home"), `href`, children (an SVG or `<img>`),
  `linkComponent`.
- `TopBarSegment`: children (text, truncated at 180px), `icon`, `badge` (hidden below `sm`, where the
  trail has no room for it), `chevron` (default `true` for a button, `false` for a link), `loading`, `disabled`, `href` (renders a link), `current`,
  `linkComponent`. As a button it is the `asChild` trigger of a `DropdownMenu` or `Popover`.
- `TopBarSearch`: a field-like button; `onClick` opens your command menu. `label`, `placeholder`,
  `shortcut` (default "⌘K" / "Ctrl K"; `false` hides it), `keyShortcuts`, `compactOnMobile` (default
  `true`). It binds no key.
- `TopBarIconButton`: `icon` and `label` (required; the label is the tooltip and accessible name),
  `tooltip` (default `true`), `href`, `external`, `linkComponent`, plus `Button` behavior props
  (`onClick`, `disabled`, `loading`; on a link they become `aria-disabled` / `aria-busy`). Carries
  `data-slot="top-bar-icon-button"`.
- `TopBarUserMenu`: `name`, `description`, `avatarSrc`, `fallback`, `header`, `label` (default
  "Account"), children (`DropdownMenuItem`s), `open` / `defaultOpen` / `onOpenChange`, `modal`, `align`,
  `className`, `contentClassName`.

#### ResourceSwitcher

Exports: `ResourceSwitcher`, types `ResourceSwitcherProps`, `ResourceSwitcherItem`,
`ResourceSwitcherAction`. Trail segment with a searchable popover to jump between entities of one kind
(projects, workspaces, teams).

- `items` (`ResourceSwitcherItem[]`: `id`, `label`, `icon`, `description`, `meta`, `href`, `keywords`,
  `disabled`), `value` + `onValueChange(id, item)` or `defaultValue`.
- `actions` (`ResourceSwitcherAction[]`: `id`, `label`, `icon`, `href`, `onSelect`, `disabled`): footer
  commands such as "New project…", never filtered out.
- `heading`, `searchPlaceholder` (default "Find…"), `placeholder` (default "Select…"), `emptyMessage`
  (default "Nothing found."), `loading`, `loadingMessage` (default "Loading…"), `disabled`. `emptyText`
  and `loadingText` are deprecated aliases of the two messages.
- `label`: what the trigger does, as a short hint ("switch project"). It is appended to the visible
  text to form the accessible name ("Web app, switch project") and names the popover.
- Remote search: `shouldFilter={false}` + `onSearchChange(query)`.
- Trigger: `children` (custom text), `icon`; `open` / `defaultOpen` / `onOpenChange`, `align`,
  `linkComponent`, `className`, `contentClassName`.

#### ThemeMenu

Exports: `ThemeMenu`, type `ThemeMenuProps`. Round icon button opening a light / dark / system menu. It
drives the nearest `ThemeProvider`; or control it with `value` + `onValueChange`. Other props: `label`
(default "Theme"), `labels` (translated option names), `tooltip`, `open` / `defaultOpen` /
`onOpenChange`, `modal`, `align`, `className` (the button), `contentClassName` (the panel). The button
carries `data-slot="theme-menu-trigger"` and the panel `data-slot="theme-menu"`. In a settings form,
bind a `ToggleGroup` to `useTheme()` instead (7.1).

```tsx
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ResourceSwitcher,
  ThemeMenu,
  TopBar,
  TopBarIconButton,
  TopBarLogo,
  TopBarSearch,
  TopBarSegment,
  TopBarSeparator,
  TopBarUserMenu,
  type ResourceSwitcherItem,
} from 'ferry-ui'
import { LifeBuoy, LogOut, Plus } from 'lucide-react'

interface AppTopBarProps {
  projects: ResourceSwitcherItem[]
  projectId: string
  onProjectChange: (projectId: string) => void
  onNewProject: () => void
  onSearch: () => void
  onOpenNav: () => void
  onSignOut: () => void
}

export function AppTopBar(props: AppTopBarProps) {
  return (
    <TopBar
      onOpenMobileNav={props.onOpenNav}
      logo={
        <TopBarLogo href="/" label="Acme home">
          <svg viewBox="0 0 20 20" fill="currentColor" className="text-brand">
            <rect x="3" y="3" width="14" height="14" rx="4" />
          </svg>
        </TopBarLogo>
      }
      actions={
        <>
          <TopBarSearch onClick={props.onSearch} />
          <TopBarIconButton icon={<LifeBuoy />} label="Help" href="https://example.com/help" external />
          <ThemeMenu />
          <TopBarUserMenu name="Maya Chen" description="maya@example.com">
            <DropdownMenuItem asChild>
              <a href="/account">Account settings</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={props.onSignOut}>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </TopBarUserMenu>
        </>
      }
    >
      <TopBarSeparator />
      <TopBarSegment href="/">Acme</TopBarSegment>
      <TopBarSeparator />
      <ResourceSwitcher
        label="switch project"
        heading="Projects"
        items={props.projects}
        value={props.projectId}
        onValueChange={(projectId) => props.onProjectChange(projectId)}
        actions={[{ id: 'new', label: 'New project…', icon: <Plus />, onSelect: props.onNewProject }]}
      />
    </TopBar>
  )
}
```

#### IconRail, IconRailItem, useIconRail

Exports: `IconRail`, `IconRailItem`, `useIconRail`, types `IconRailProps`, `IconRailItemProps`,
`IconRailLabels`, `IconRailContextValue`.

Vertical icon navigation: 56px wide (labels in tooltips), expandable to 200px. For 3 to 10 top-level
destinations that each have an icon. Desktop only: `AppShell` hides it on phones.

- `groups` (`NavGroup[]`) or `items` (`NavItem[]`); mark the current one with `active: true`.
- `expanded` + `onExpandedChange`, or `defaultExpanded` (default `false`); persist it yourself.
  `collapsible` (default `true`) shows the toggle.
- `logo` (top slot), `footer` (bottom slot: `IconRailItem`s for help, docs, settings), `linkComponent`,
  `labels` (`IconRailLabels`: `expand`, `collapse`, `collapseText`, `external`), `aria-label` (default
  "Main").
- `external` items are plain `<a target="_blank">` anchors (they skip the link component); screen
  readers hear `labels.external` (default "(opens in a new tab)") after the label.
- `IconRailItem`: `item` (a `NavItem`), `linkComponent`, `className`. Only inside an `IconRail`.
- `useIconRail()` returns `{ expanded, setExpanded }` (or `null` outside a rail), for slot content
  that adapts to the width.

```tsx
import { IconRail, IconRailItem, useIconRail, type NavGroup } from 'ferry-ui'
import { LifeBuoy } from 'lucide-react'

function Wordmark() {
  const rail = useIconRail()
  return (
    <span className="flex h-9 items-center gap-2 px-[9px] text-sm font-medium text-foreground">
      <span className="size-[18px] shrink-0 rounded-sm bg-brand" aria-hidden="true" />
      {rail?.expanded && 'Acme'}
    </span>
  )
}

export function AppRail({ groups, onExpandedChange }: { groups: NavGroup[]; onExpandedChange: (expanded: boolean) => void }) {
  return (
    <IconRail
      groups={groups}
      onExpandedChange={onExpandedChange}
      logo={<Wordmark />}
      footer={
        <IconRailItem
          item={{ id: 'help', label: 'Help center', icon: <LifeBuoy />, href: 'https://example.com/help', external: true }}
        />
      }
    />
  )
}
```

#### MobileNav, MobileNavTrigger, MobileNavSection

Exports: `MobileNav`, `MobileNavTrigger`, `MobileNavSection`, types `MobileNavProps`, `MobileNavLabels`,
`MobileNavTriggerProps`, `MobileNavSectionProps`.

Phone navigation drawer. Inside an `AppShell` (`mobileNav` slot) it needs no `open` prop.

- `MobileNav`: `groups` or `items` (the same as the rail), `title` (default "Menu"), `description`,
  `logo`, `children` (extra blocks, usually `MobileNavSection`s), `footer` (a sign-out `Button`),
  `showThemeToggle` (a Light / Dark / System control), `theme` + `onThemeChange`, `closeOnSelect`
  (default `true`), `side` `left` (default) or `right`, `linkComponent`, `labels` (`MobileNavLabels`:
  `navigation`, `theme`, `light`, `dark`, `system`, `close` for the close button, `external` for the
  screen-reader suffix of external items), `className`. Standalone: `open` + `onOpenChange` (or
  `defaultOpen`), or a `trigger`.
- `MobileNavTrigger`: the hamburger button, hidden from `md` up. Inside an `AppShell` it opens the
  shell's drawer by itself: put it at the start of a custom top bar (`TopBar` has its own, through
  `onOpenMobileNav`).
- `MobileNavSection`: `label` + free content below the navigation groups.

```tsx
import { Button, MobileNav, MobileNavSection, MobileNavTrigger, type NavItem } from 'ferry-ui'

export function PhoneNavigation({ items, workspace, onSignOut }: { items: NavItem[]; workspace: string; onSignOut: () => void }) {
  return (
    <MobileNav
      trigger={<MobileNavTrigger />}
      items={items}
      title="Acme"
      description="Customer billing"
      showThemeToggle
      footer={
        <Button className="w-full" onClick={onSignOut}>
          Sign out
        </Button>
      }
    >
      <MobileNavSection label="Workspace">
        <span className="px-1 text-sm text-foreground">{workspace}</span>
      </MobileNavSection>
    </MobileNav>
  )
}
```

#### InnerMenu

Exports: `InnerMenu`, type `InnerMenuProps`. Secondary side menu for the sections of one area (a
settings area, the pages of one record). 240px wide; below `md` it becomes a horizontally scrolling tab
strip (`mobileTabs`, default `true`).

- `groups` (`NavGroup[]`, required; item ids unique across groups), `title`, `header`, `footer`, `label`.
- Active item: set `active` on items (route-driven), or pass `value` + `onValueChange(id)` (state-driven).
- `linkComponent`, `externalLabel` (screen-reader suffix of external items, default "(opens in a new
  tab)"), `className`.
- Place it as the first child of a `flex flex-col md:flex-row` container, next to the scrolling content.

```tsx
import * as React from 'react'
import { InnerMenu, PageContainer, PageHeader, type NavGroup } from 'ferry-ui'

const GROUPS: NavGroup[] = [
  {
    id: 'account',
    items: [
      { id: 'profile', label: 'Profile' },
      { id: 'security', label: 'Security' },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { id: 'members', label: 'Members' },
      { id: 'billing', label: 'Billing' },
      { id: 'docs', label: 'Documentation', href: 'https://example.com/docs', external: true },
    ],
  },
]

export function SettingsArea() {
  const [section, setSection] = React.useState('profile')
  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <InnerMenu title="Settings" groups={GROUPS} value={section} onValueChange={setSection} />
      <div className="min-w-0 flex-1 overflow-y-auto">
        <PageContainer size="narrow">
          <PageHeader title={section === 'profile' ? 'Profile' : 'Settings'} />
        </PageContainer>
      </div>
    </div>
  )
}
```

#### CommandMenu

Exports: `CommandMenu`, types `CommandMenuProps`, `CommandMenuGroup`, `CommandMenuItem`. The app-wide
command palette. Mount it once near the root.

- `groups` (required): `CommandMenuGroup[]`. A `CommandMenuItem` is a `NavItem` plus `hint`
  (right-aligned secondary text), `shortcut` (display only), `keywords`, `value` (text matched; must be
  unique), `keepOpen`. Items navigate (`href`) and / or run `onSelect`. Navigation groups first,
  side-effect actions last.
- `open` + `onOpenChange`, or `defaultOpen`. `shortcut`: `true` binds mod+K (or pass a letter); leave
  it `false` when `AppShell` `onCommandShortcut` or `useCommandShortcut` already toggles the menu.
- Remote results: `loading`, `loadingMessage`, `onSearchChange(query)`, `shouldFilter={false}`.
- `placeholder`, `title`, `description`, `emptyMessage`, `onItemSelect(item)`, `linkComponent`,
  `closeLabel` (accessible name of the close button, default "Close"), `externalLabel` (screen-reader
  suffix of external items, default "(opens in a new tab)"), `children` (extra `CommandGroup` /
  `CommandItem` rows), `className`. The panel carries `data-slot="command-menu"`.

```tsx
import { CommandMenu, type CommandMenuGroup } from 'ferry-ui'
import { FolderKanban, Plus, Receipt } from 'lucide-react'

export function AppCommandMenu({ onNewInvoice }: { onNewInvoice: () => void }) {
  const groups: CommandMenuGroup[] = [
    {
      id: 'navigation',
      label: 'Go to',
      items: [
        { id: 'projects', label: 'Projects', icon: <FolderKanban />, href: '/projects' },
        { id: 'invoices', label: 'Invoices', icon: <Receipt />, href: '/invoices', hint: '12 open' },
      ],
    },
    {
      id: 'actions',
      label: 'Actions',
      items: [
        { id: 'new-invoice', label: 'New invoice', icon: <Plus />, onSelect: onNewInvoice, keywords: ['create', 'bill'] },
      ],
    },
  ]
  // Uncontrolled: the menu binds mod+K itself.
  return <CommandMenu groups={groups} shortcut />
}
```

### 7.7 Charts

Import them from `ferry-ui/charts`, not from `ferry-ui`: they draw with `recharts`, an optional peer
dependency the app installs itself (`npm install recharts`). Everything else (`MetricCard`, `LegendDot`)
still comes from `ferry-ui`. Series colors are the chart tokens (`var(--chart-1)` to `var(--chart-5)`).

#### TimeSeriesChart

Exports: `TimeSeriesChart`, types `TimeSeriesChartProps`, `TimeSeriesSeries`. Line chart of values over
time: round time axis in local time, value axis on round values of the unit, a tooltip with every series
at the hovered time, breaks where nothing was measured, an empty text when there is no value.

- `data` (required): rows `{ t, <series key>: value }`, sorted by time, `t` in milliseconds since the
  epoch (`TimeSeriesRow`). A `null` value stops the line of its series.
- `series` (required): `{ key, label, color? }`, the most important first. `key` is CSS-safe; `color`
  defaults to `chartColor(index)`.
- `unit`: `number` (default), `percent`, `bytes`, `bytes-per-second`, `per-second`, `milliseconds`: the
  tooltip format, the axis format and the round steps of the axis. `TIME_SERIES_UNITS` lists them.
- `stacked`: stacked areas (parts of a total) instead of lines.
- `from`, `to`: the time axis (ms); default the first and last point.
- `step`: time between two points (ms). With it, a run of more than `gapSteps` (default 2) missing steps
  breaks the lines.
- `max`: fixed top of the value axis (`100` for a percentage, a memory limit); the axis ticks its
  quarters. Default: a round value above the highest point.
- `formatValue`, `formatTick`, `formatTime`: replace the tooltip value, the axis tick and the tooltip
  header (default `Oct 17, 14:05:30`).
- `empty`: shown instead of the chart, at the same height, when no series has a value. Default "No data".
- Height: `className` (default `h-44 w-full`). Name it with `aria-label`.

```tsx
import { MetricCard } from 'ferry-ui'
import { ChartLegendList, TimeSeriesChart, chartColor, type TimeSeriesRow, type TimeSeriesSeries } from 'ferry-ui/charts'

const SERIES: TimeSeriesSeries[] = [
  { key: 'p50', label: 'p50' },
  { key: 'p95', label: 'p95' },
]

export function LatencyCard({ rows, from, to }: { rows: TimeSeriesRow[]; from: number; to: number }) {
  return (
    <MetricCard
      label="Latency"
      info="p95: 95% of the requests were faster."
      aside={<ChartLegendList items={SERIES.map((s, i) => ({ ...s, color: chartColor(i) }))} />}
    >
      <TimeSeriesChart
        aria-label="Latency over time"
        data={rows}
        series={SERIES}
        unit="milliseconds"
        from={from}
        to={to}
        step={10_000}
        empty="No request in this range"
      />
    </MetricCard>
  )
}
```

Its pure helpers are exported for charts and tables of your own: `formatChartValue(value, unit)`
(`37.5%`, `1.5 GiB`, `—` when unknown), `formatChartTick(value, unit)`, `niceTicks(max, unit)`,
`quarterTicks(max)`, `maxValue(rows, keys)`, `maxStacked(rows, keys)`, `hasValues(rows, keys)`,
`timeTicks(from, to)`, `timeTickInterval(from, to)`, `formatTimeTick(t, interval)`,
`formatPointTime(t)` and `withGaps(rows, keys, step, gapSteps)`; types `TimeSeriesRow`,
`TimeSeriesUnit`.

#### ChartContainer, ChartTooltip, ChartLegend, ChartLegendList

Exports: `ChartContainer`, `ChartStyle`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`,
`ChartLegendContent`, `ChartLegendList`, `chartColor`, `useChart`, types `ChartConfig`,
`ChartContainerProps`, `ChartStyleProps`, `ChartTooltipContentProps`, `ChartLegendContentProps`,
`ChartLegendListProps`, `ChartLegendListItem`. The shadcn/ui chart parts, on the ferry-ui tokens: use
them for every chart `TimeSeriesChart` does not cover.

- `ChartContainer`: `config` (required, a `ChartConfig`: `{ [key]: { label, color } }` or `theme: { light,
  dark }` instead of `color`), `children` (one recharts chart). Each color becomes `--color-<key>`: draw a
  series with `fill="var(--color-<key>)"`. 16:9 by default; set a height with
  `className="aspect-auto h-60 w-full"`. `initialDimension` (default 320 × 200) is the size drawn before
  the container is measured. Name the chart with `aria-label`.
- `ChartTooltip` and `ChartLegend` are recharts' `Tooltip` and `Legend`. Give them
  `content={<ChartTooltipContent />}` and `content={<ChartLegendContent />}`.
- `ChartTooltipContent`: `indicator` `dot` (default), `line`, `dashed`; `hideLabel`, `hideIndicator`,
  `labelFormatter` (header), `formatter` (replaces a row), `nameKey`, `labelKey`.
- `ChartLegendContent`: `hideIcon`, `nameKey`.
- `ChartLegendList`: a legend outside a chart (a `MetricCard`'s `aside`, above several charts):
  `items` `{ key, label, color }`; named "Legend" unless `aria-label` says otherwise.
- `chartColor(index)`: `var(--chart-1)` … `var(--chart-5)`, then again from `var(--chart-1)`.
- `ChartStyle` (the `--color-<key>` variables) and `useChart` (the `config` of the nearest container) are
  for chart parts of your own.

```tsx
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from 'ferry-ui/charts'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

const config = {
  online: { label: 'Online', color: 'var(--chart-1)' },
  store: { label: 'In store', color: 'var(--chart-4)' },
} satisfies ChartConfig

export function OrdersByMonth({ rows }: { rows: { month: string; online: number; store: number }[] }) {
  return (
    <ChartContainer config={config} aria-label="Orders per month" className="aspect-auto h-60 w-full">
      <BarChart data={rows}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="online" fill="var(--color-online)" radius={3} />
        <Bar dataKey="store" fill="var(--color-store)" radius={3} />
      </BarChart>
    </ChartContainer>
  )
}
```

## 8. Accessibility

ferry-ui components ship the roles, focus management and keyboard behavior. The parts that depend on you:

1. **Name every control.** Icon-only `Button`, `Toggle`, `ToggleGroupItem`, menu triggers:
   `aria-label`. `Hint` and tooltips are not accessible names. Name what the action targets when a
   screen repeats it: ``aria-label={`Actions for ${invoice.number}`}``.
2. **Label every field.** Use `Field` or `FormRow` (`htmlFor`; the row gives the control its `id`), a `Label`, or
   `aria-label` for fields without visible text (search, table cells). Groups (`RadioGroup`,
   `ToggleGroup`, `RadioCardGroup`) take `aria-label` or `aria-labelledby`.
3. **Errors are text.** Show the message (`error` on `Field` / `FormRow`): both set `aria-invalid` and
   `aria-describedby` on the control for you (with `FormRow`, when it has `htmlFor` and a single control
   or a render function). Never signal an error by color alone.
4. **Dialogs have a title.** `DialogTitle`, `AlertDialogTitle`, `SheetTitle` are required. Without a
   description, pass `aria-describedby={undefined}` to the content.
5. **Status is never color only.** `StatusBadge` carries a label. A lone `StatusDot` needs `label`.
   `MetricTrend` children carry the sign ("+12.5%"). `UsageBar` needs `label`.
6. **Tables.** Name them (`aria-label` or `TableCaption`); put an `sr-only` label in icon-only header
   cells; keep a real link in the first cell of a row made clickable with `rowLinkProps`; set
   `aria-busy` on the `TableBody` while skeleton rows show.
7. **Loading.** Skeletons are hidden from assistive technology: set `aria-busy` on the region (the
   `loading` props do it for you).
8. **Headings.** One `<h1>` per page (`PageHeader`), `<h2>` per `PageSection`, `<h3>` in `FormCard`
   and `ResourceCard` (`titleAs` to change it). `CardTitle` is a `<div>`: put a heading inside when
   the outline needs one.
9. **Decorative icons** inside ferry-ui slots (`icon` props) are hidden for you. An icon that carries
   meaning alone needs a text alternative: `IconBox label`, `StatusDot label`, or `sr-only` text.
10. **Focus.** Never remove focus rings. A custom interactive element uses
    `outline-none focus-visible:ring-2 focus-visible:ring-ring`. Do not put interactive elements inside
    other interactive elements (a button in a `RadioCard`, a link in a linked `DescriptionItem` row).
11. **Motion and hover.** Do not put essential information in tooltips or hover-only UI. `pulse` and
    `spin` are for work actually in progress. Overlay enter / exit animations already respect
    `prefers-reduced-motion`; gate your own with `motion-safe:` or `motion-reduce:`.
12. **Landmarks.** `AppShell` provides `<main>` and the skip link; `IconRail`, `MobileNav`,
    `InnerMenu` and `TopBar` provide labelled `<nav>` elements. Do not add another `<main>`.

## 9. Do and don't

**Do**

- Import from `'ferry-ui'`; take icons from `lucide-react`.
- Start a screen from a recipe (section 6), then swap parts using the decision tables (section 5).
- Use tokens for every color, and the two weights 400 / 500.
- Keep one `primary` button per view; confirm destructive actions with `ConfirmDialog`.
- Give every list its four states: loading (skeletons), empty, error (with Retry), loaded.
- Run actions of menu items in `onSelect`, and close dialogs through their state.
- Map domain statuses to a `StatusTone` once, next to the domain types.
- Format numbers, dates and currencies before passing them to components.
- Pass `href` strings to components that navigate; mark the current nav item with `active`.
- Keep example data neutral: projects, members, invoices, API keys, orders.

**Don't**

- Don't write raw colors or palette classes: `bg-white`, `text-gray-500`, `border-[#e5e5e5]`,
  `style={{ color: '#333' }}`.
- Don't restyle controls (`Button`, `Input`, `Select`, `Badge`, `Toggle`, `Tabs`…) through `className`
  (heights, paddings, font sizes, colors, radii): pick a `size` / `variant` / `tone`. Containers and
  slots take the token classes shown in their catalog entry.
- Don't hand-roll what exists: a `<button>` with classes, a custom modal, a custom dropdown, a
  clickable `<div>`, a `<table>` with your own borders, a `<pre>` for commands.
- Don't use `font-bold` / `font-semibold`, large shadows on resting elements, or gradients.
- Don't use `Badge` for record status (use `StatusBadge`), `Dialog` for confirmations (use
  `ConfirmDialog`), `Tabs` for page navigation (use `InnerMenu` or links), `Select` for actions (use
  `DropdownMenu`), `Switch` inside a form saved with a button (use `Checkbox`).
- Don't nest `Card`s, `PageContainer`s, `AppShell`s or `ThemeProvider`s.
- Don't bind the same shortcut in several places, and don't mount several `Toaster`s.
- Don't import `toast` from `sonner`, Radix parts from `radix-ui`, or anything from `ferry-ui/dist`.
- Don't call variant helpers (`buttonVariants`…) or hooks from a server component.
- Don't use the deprecated aliases (`danger` / `danger-solid` button variants, size `default` on
  `Select`, `Switch`, `Avatar`, `Toggle`): use `destructive`, `destructive-solid` and `md` / `sm`.

```tsx no-check
// Don't: raw colors, hand-made button, bold text, no accessible name.
<div className="rounded-xl bg-white p-6 shadow-lg">
  <h3 className="font-bold text-gray-900">Delete project</h3>
  <button className="rounded bg-red-600 px-3 py-1 text-white" onClick={deleteProject}>
    <Trash2 />
  </button>
</div>
```

```tsx
// Do: tokens through components, one action that is confirmed, named controls.
import { ActionRow, Button, ConfirmDialog, FormCard } from 'ferry-ui'

export function DangerZone({ name, onDelete }: { name: string; onDelete: () => Promise<void> }) {
  return (
    <FormCard asDiv tone="destructive">
      <ActionRow
        title="Delete project"
        description="This cannot be undone."
        action={
          <ConfirmDialog
            trigger={<Button variant="destructive">Delete project</Button>}
            title={`Delete project “${name}”?`}
            description="Its invoices and API keys are deleted too."
            confirmLabel="Delete project"
            onConfirm={onDelete}
          />
        }
      />
    </FormCard>
  )
}
```

## 10. Extending ferry-ui

Rules for changing this repository. They are the conventions of the existing code: match them exactly.

### Layout of the repository

```text
src/
  index.ts                     public barrel: `export *` for every public module
  charts.ts                    `ferry-ui/charts` barrel: the modules of components/charts (they need recharts)
  styles/                      tokens.css (variables), theme.css (Tailwind mapping + utilities),
                               fonts.css, standalone.css (source of the precompiled styles.css)
  theme/                       ThemeProvider, themeInitScript
  lib/                         cn, getErrorMessage, link contract, platform constants
  hooks/                       useCopy, useCommandShortcut, useIsMac / useModKey
  components/primitives/       shadcn-style building blocks on Radix UI
  components/patterns/         compositions of primitives for recurring product needs
  components/layout/           application-shell pieces
  components/charts/           charts on recharts (optional peer dependency), exported by charts.ts only
  foundations/                 Storybook docs pages (not shipped)
  examples/                    full-screen example pages (`*-example.tsx`) and their stories (not shipped)
```

A primitive wraps one Radix part or HTML element. A pattern composes primitives for a recurring need and
may import primitives and other patterns. A layout component may import patterns and primitives.
Primitives never import patterns or layout.

### Component rules

1. **Files** are kebab-case: `timeline.tsx` next to `timeline.stories.tsx` (and `timeline.test.ts` for
   pure logic). One module may export a small family (`Timeline`, `TimelineItem`).
2. **Relative imports only** (`'../../lib/utils'`); no `@/` alias, no import from `'ferry-ui'` inside `src`.
3. **Function components, no `forwardRef`.** `ref` is a regular prop (React 19). Spread the remaining
   props onto the root element so `id`, `aria-*` and `data-*` pass through. A composite with no single
   root (a trigger plus a portaled panel, a fragment of buttons) takes a closed list of props instead:
   name each part's class prop (`className`, `contentClassName`) and add it to the list in section 7.
4. **`data-slot="<kebab-name>"`** on the root and on meaningful inner parts.
5. **`className` is merged last** with `cn(base, className)`.
6. **Tokens only** in class strings (section 4). No raw colors, no arbitrary palette values.
7. **Variants** use `cva`; export the generator as `<name>Variants` when another element may need the
   look. Reuse the existing vocabularies: tones are `success`, `warning`, `destructive`, `info`,
   `neutral` (never `danger`, `error` or `muted`); sizes are named `tiny`, `sm`, `md`, `lg` (never
   `default`), and control heights follow the `Button` scale (26, 30, 34, 38px).
8. **Controlled and uncontrolled.** Stateful components take `value` + `onValueChange` (or `open` +
   `onOpenChange`) and `defaultValue` / `defaultOpen`.
9. **Links** go through `useLinkComponent(props.linkComponent)` with a string `href`. No router import.
10. **No global state, no data fetching, no product-specific concept.** Texts are props with English
    defaults, so apps can translate them.
11. **JSDoc on every export and every prop**, in English: what it is, when to use it, when NOT to use
    it (name the alternative), defaults. This text is the Storybook documentation. Export a named
    `<Name>Props` type whenever the component adds props of its own; a wrapper that only passes the
    props of its Radix part or HTML element through needs none (apps write
    `React.ComponentProps<typeof Checkbox>`).
12. **Accessibility is part of the component**: roles, names, keyboard behavior, focus ring
    (`outline-none focus-visible:ring-2 focus-visible:ring-ring`), `aria-hidden` on decoration.
13. **Export it** from `src/index.ts` (`export * from './components/patterns/timeline'`), or from
    `src/charts.ts` for a module of `components/charts`. `src/index.test.ts` fails when a module is
    missing from its barrel, and when `src/index.ts` exports a chart.
14. **Document it** in this file (catalog entry with props and a snippet). `npm run check:docs` fails
    when a public export is not mentioned here or when a snippet stops type-checking.
15. Do not add a runtime dependency (or run `npm install`) without agreement. `recharts` is an optional
    peer dependency: only `components/charts` may import it.

A component file that follows every rule, `src/components/patterns/timeline.tsx`:

```tsx file=src/components/patterns/timeline.tsx
import * as React from 'react'

import { useLinkComponent, type LinkComponent } from '../../lib/link'
import { cn } from '../../lib/utils'

import { StatusDot, type StatusTone } from './status'

/** Props of {@link Timeline}: every `<ol>` prop. Name the list with `aria-label`. */
export type TimelineProps = React.ComponentProps<'ol'>

/**
 * Vertical list of dated events, newest first: an activity feed or an audit trail.
 *
 * Fill it with {@link TimelineItem}s. Do NOT use it for records people compare by column (use
 * `Table`) nor for the steps of a flow.
 */
export function Timeline({ className, ...props }: TimelineProps) {
  return <ol data-slot="timeline" className={cn('flex flex-col divide-y', className)} {...props} />
}

/** Props of {@link TimelineItem}. Extra `<li>` props go to the root. */
export interface TimelineItemProps extends Omit<React.ComponentProps<'li'>, 'title'> {
  /** What happened, in one short sentence ("Invoice INV-2041 paid"). */
  title: React.ReactNode
  /** Secondary line: who and when ("Maya Chen · 2 hours ago"). */
  meta?: React.ReactNode
  /** Colour of the dot (same vocabulary as the status components). Defaults to `neutral`. */
  tone?: StatusTone
  /** Turns the title into a link to the record the event is about. */
  href?: string
  /** Router link used for `href`. Defaults to the nearest `LinkProvider` component (a plain `<a>`). */
  linkComponent?: LinkComponent
}

/**
 * One event of a {@link Timeline}: a status dot, a title (a link when `href` is set) and a meta line.
 * Do NOT use it outside a `Timeline`.
 */
export function TimelineItem({ title, meta, tone = 'neutral', href, linkComponent, className, ...props }: TimelineItemProps) {
  const Link = useLinkComponent(linkComponent)
  const titleClassName = 'truncate text-sm text-foreground'
  return (
    <li data-slot="timeline-item" data-tone={tone} className={cn('flex items-start gap-3 py-2.5', className)} {...props}>
      <StatusDot tone={tone} className="mt-[7px]" />
      <div className="flex min-w-0 flex-col gap-0.5">
        {href !== undefined ? (
          // `Link` comes from props/context (useLinkComponent): stable, not created during render.
          // eslint-disable-next-line react-hooks/static-components
          <Link
            href={href}
            data-slot="timeline-item-link"
            className={cn(titleClassName, 'rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring')}
          >
            {title}
          </Link>
        ) : (
          <span className={titleClassName}>{title}</span>
        )}
        {meta != null && <span className="text-[13px] text-foreground-lighter">{meta}</span>}
      </div>
    </li>
  )
}
```

### Story rules

Stories are the documentation and the test suite: `src/stories.test.tsx` renders every story and runs
its `play` function in jsdom.

1. CSF3, co-located, typed with `satisfies Meta<typeof Component>`.
2. `title`: `Primitives/<Name>`, `Patterns/<Name>`, `Layout/<Name>`, `Charts/<Name>`,
   `Foundations/<Name>` or `Examples/<Name>`.
3. `parameters.docs.description.component`: usage guidance (what, when, when not).
4. A `Default` story driven by `args` (so the Controls panel works), then one story per variant, size
   and state (loading, empty, error, disabled), then composition stories.
5. Callbacks are `fn()` from `storybook/test`.
6. Interactive components get a `play` test that passes in jsdom **and** in the browser:
   - content rendered in a portal (dialogs, menus, popovers, tooltips, toasts) is queried on
     `within(document.body)` (or `screen`) with `findBy…` / `waitFor`, not on the canvas;
   - in jsdom `userEvent.click` on a `<label>` throws: use `fireEvent.click`;
   - sonner toasts: interact with the keyboard rather than clicking.
7. Example data is generic (projects, members, invoices, API keys, orders).
8. `.storybook/preview.tsx` already wraps stories in a `TooltipProvider` and provides the light / dark
   toolbar switch: do not add them again. It also remounts a story when one of its `default*` args
   changes, so the controls of `defaultOpen`, `defaultValue`, `defaultChecked`… work without a `key`.

Its stories, `src/components/patterns/timeline.stories.tsx`:

```tsx file=src/components/patterns/timeline.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { Timeline, TimelineItem } from './timeline'

const meta = {
  title: 'Patterns/Timeline',
  component: Timeline,
  parameters: {
    docs: {
      description: {
        component:
          'Vertical list of dated events, newest first (activity feed, audit trail). Fill it with `TimelineItem`s. Do not use it for records people compare by column (use `Table`).',
      },
    },
  },
  args: {
    'aria-label': 'Recent activity',
    className: 'w-[360px]',
    children: (
      <>
        <TimelineItem tone="success" title="Invoice INV-2041 paid" meta="$4,280.00 · 2 hours ago" />
        <TimelineItem title="Maya Chen joined the workspace" meta="Invited by Sam Lee · 5 hours ago" />
      </>
    ),
  },
} satisfies Meta<typeof Timeline>

export default meta
type Story = StoryObj<typeof meta>

/** Driven by args: change them in the Controls panel. */
export const Default: Story = {}

/** With `href`, the title of an item links to the record through the app's link component. */
export const WithLinks: Story = {
  args: {
    children: <TimelineItem tone="success" title="Invoice INV-2041 paid" meta="2 hours ago" href="/invoices/inv-2041" />,
  },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'Invoice INV-2041 paid' })
    await expect(link).toHaveAttribute('href', '/invoices/inv-2041')
  },
}
```

### Tokens and styles

- A new color is a CSS variable in `src/styles/tokens.css` (light on `:root`, dark on `.dark`) mapped in
  the `@theme inline` block of `src/styles/theme.css` (`--color-<name>: var(--<name>)`), and documented
  in `src/foundations/colors.stories.tsx` and in section 4 of this file.
- A new utility is an `@utility` in `theme.css`; add it to the `@source inline(...)` list of
  `src/styles/standalone.css` so apps without Tailwind get it.

### Checks before you finish

```sh
npm run typecheck                                              # tsc, strict
npm run lint                                                   # eslint
STORIES=patterns/timeline npx vitest run src/stories.test.tsx  # stories of the files you touched
npm run test                                                   # everything (stories, barrel, unit tests)
npm run check:docs                                             # snippets of the docs + catalog coverage
npm run build                                                  # dist: ESM + .d.ts + CSS
```

A new public component also gets a page on the documentation site: `site/src/content/components/<name>.mdx`,
with its live demos in `site/src/demos/<name>/`. `site/AUTHORING.md` gives the structure of a page and the
writing rules; `npm run site:verify` checks the page, its demos and its links.
