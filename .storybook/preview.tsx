import { withThemeByClassName } from '@storybook/addon-themes'
import type { Preview } from '@storybook/react-vite'

import { TooltipProvider } from '../src/components/primitives/tooltip'

import './storybook.css'

const isPrimitive = (value: unknown) => value == null || ['string', 'number', 'boolean'].includes(typeof value)

/**
 * Key built from the `default*` args of a story (`defaultOpen`, `defaultValue`, `defaultChecked`…).
 * Components read those on mount only, and Storybook re-renders (does not remount) a story when an
 * arg changes: keying the story on them makes their controls work.
 */
function defaultArgsKey(args: Record<string, unknown>): string {
  return Object.entries(args)
    .filter(
      ([name, value]) =>
        /^default[A-Z]/.test(name) && (isPrimitive(value) || (Array.isArray(value) && value.every(isPrimitive))),
    )
    .map(([name, value]) => `${name}=${JSON.stringify(value) ?? 'undefined'}`)
    .join('&')
}

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: { expanded: true, sort: 'requiredFirst' },
    a11y: { test: 'todo' },
    docs: { toc: true },
    options: {
      storySort: {
        order: ['Introduction', 'Foundations', 'Primitives', 'Patterns', 'Layout', 'Charts', '*'],
      },
    },
  },
  decorators: [
    // Remounts the story when one of its `default*` args changes (see defaultArgsKey).
    (Story, { args }) => <Story key={defaultArgsKey(args)} />,
    // Toolbar theme switch: toggles `class="dark"` on <html>, exactly like ThemeProvider.
    withThemeByClassName({ themes: { light: '', dark: 'dark' }, defaultTheme: 'light', parentSelector: 'html' }),
    (Story) => (
      <TooltipProvider>
        <div className="bg-background font-sans text-foreground">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
}

export default preview
