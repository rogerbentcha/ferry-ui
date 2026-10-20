import { fileURLToPath, URL } from 'node:url'

import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import rehypeSlug from 'rehype-slug'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { defineConfig, type Plugin } from 'vite'

import { themeInitScript } from '../src/theme/theme-script.ts'

import { docsNav } from './plugins/docs-nav.ts'
import { markdownPages } from './plugins/markdown-pages.ts'
import { rehypeCodeMeta, remarkDocsBlocks } from './plugins/mdx-blocks.ts'

const root = fileURLToPath(new URL('.', import.meta.url))

/** Applies the stored theme before first paint (the same script an app puts in its `<head>`). */
function themeScript(): Plugin {
  return {
    name: 'ferry-ui-site:theme-script',
    transformIndexHtml: () => [{ tag: 'script', children: themeInitScript(), injectTo: 'head-prepend' }],
  }
}

// The documentation site of ferry-ui: the landing page and the docs, built with ferry-ui itself.
// `ferry-ui` resolves to the sources (../src), so a demo always shows the current code.
export default defineConfig({
  root,
  // Served from a sub-path (GitHub Pages: /ferry-ui/)? Build with SITE_BASE=/ferry-ui/.
  base: process.env.SITE_BASE ?? '/',
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkGfm, remarkFrontmatter, [remarkMdxFrontmatter, { name: 'frontmatter' }], remarkDocsBlocks],
        rehypePlugins: [rehypeSlug, rehypeCodeMeta],
      }),
    },
    react(),
    tailwindcss(),
    docsNav(),
    markdownPages(),
    themeScript(),
  ],
  resolve: {
    alias: {
      // Before `ferry-ui`: an alias also matches the paths under its name.
      'ferry-ui/charts': fileURLToPath(new URL('../src/charts.ts', import.meta.url)),
      'ferry-ui': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 5173 to 5180 are taken by other projects of this machine; Storybook is on 6006.
  server: { port: 5181 },
  preview: { port: 4181 },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
})
