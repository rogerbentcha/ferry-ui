import { describe, expect, it } from 'vitest'

import * as charts from './charts'
import * as barrel from './index'

// Every public module of the library (stories, tests and foundations excluded). The charts import
// recharts, an optional peer dependency: they have their own entry point (src/charts.ts).
const modules = import.meta.glob<Record<string, unknown>>(
  [
    './{lib,hooks,theme}/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '!./components/charts/**',
    '!./**/*.stories.tsx',
    '!./**/*.test.{ts,tsx}',
  ],
  { eager: true },
)

const chartModules = import.meta.glob<Record<string, unknown>>(
  ['./components/charts/**/*.{ts,tsx}', '!./components/charts/**/*.stories.tsx', '!./components/charts/**/*.test.{ts,tsx}'],
  { eager: true },
)

describe('public barrel (src/index.ts)', () => {
  it('covers the component, hook, lib and theme folders', () => {
    expect(Object.keys(modules).length).toBeGreaterThan(60)
  })

  it.each(Object.entries(modules))('re-exports every runtime export of %s', (path, mod) => {
    for (const [name, value] of Object.entries(mod)) {
      expect(barrel, `${path} exports "${name}" but src/index.ts does not`).toHaveProperty(name, value)
    }
  })

  it.each(Object.keys(chartModules))('does not re-export %s (it needs recharts)', (path) => {
    for (const name of Object.keys(chartModules[path]!)) {
      expect(barrel, `src/index.ts exports "${name}" of ${path}: move it to src/charts.ts`).not.toHaveProperty(name)
    }
  })
})

describe('charts barrel (src/charts.ts)', () => {
  it('covers the charts folder', () => {
    expect(Object.keys(chartModules).length).toBeGreaterThan(0)
  })

  it.each(Object.entries(chartModules))('re-exports every runtime export of %s', (path, mod) => {
    for (const [name, value] of Object.entries(mod)) {
      expect(charts, `${path} exports "${name}" but src/charts.ts does not`).toHaveProperty(name, value)
    }
  })
})
