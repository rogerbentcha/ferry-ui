import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import pkg from './package.json' with { type: 'json' }

// Every runtime dependency stays external: consumers dedupe React, Radix, etc.
const externals = [...Object.keys(pkg.peerDependencies), ...Object.keys(pkg.dependencies)]
const isExternal = (id: string) => externals.some((dep) => id === dep || id.startsWith(`${dep}/`))

/**
 * React Server Components: every module that imports React at runtime (components, hooks,
 * providers) is a client module and starts with `'use client'`. Modules that don't (the barrel,
 * `cn`, `getErrorMessage`, `isMac`, `themeInitScript`, `rowLinkProps`) stay server-safe, so a
 * server component can call them and the barrel re-exports real functions next to client
 * references.
 */
const importsReact = (imports: readonly string[]) =>
  imports.some((id) => id === 'react' || id.startsWith('react/') || id === 'react-dom' || id.startsWith('react-dom/'))

export default defineConfig({
  plugins: [react()],
  build: {
    lib: { entry: { index: 'src/index.ts', charts: 'src/charts.ts' }, formats: ['es'] },
    sourcemap: true,
    // Readable output: consumers minify their own bundles.
    minify: false,
    emptyOutDir: false,
    rollupOptions: {
      external: isExternal,
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        banner: (chunk) => (importsReact(chunk.imports) ? "'use client';" : ''),
      },
    },
  },
})
