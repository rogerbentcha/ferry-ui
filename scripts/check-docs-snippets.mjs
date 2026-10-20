// Docs check (`npm run check:docs`): keeps the written documentation honest.
//
// 1. Snippets. Every ```tsx code block of AGENTS.md, README.md and the Storybook introduction is
//    extracted into a temporary folder and type-checked with the project's own tsconfig, with
//    `ferry-ui` mapped onto ./src/index.ts and `ferry-ui/charts` onto ./src/charts.ts. A snippet is checked as ONE standalone module: it must
//    import what it uses (from 'ferry-ui', 'react', 'lucide-react'…) and declare its own data.
//      - ```tsx file=app/providers.tsx   writes the snippet at that path (inside a folder of its
//        own per document), so a later snippet of the same document can import it ('./providers').
//      - ```tsx file=src/components/patterns/x.tsx   a path under src/ is overlaid on the real
//        src/ folder (tsconfig `rootDirs`), so contributor examples are checked with the
//        repository's own relative imports ('../../lib/utils', '../primitives/button').
//      - ```tsx no-check                 skips a block (illustrative fragments). Other languages
//        (```ts, ```jsx, ```css, ```sh…) are never checked.
//    Errors are reported with the line of the Markdown file, not of the temporary file.
//
// 2. Catalog coverage. Every name exported by src/index.ts and src/charts.ts (components, hooks,
//    helpers, types) must be mentioned in AGENTS.md, so a new export cannot ship undocumented.
//
// Usage: node scripts/check-docs-snippets.mjs [--keep] [--no-coverage] [files…]
//   --keep         keep the temporary folder (node_modules/.cache/ferry-ui-docs-check) for debugging
//   --no-coverage  skip the catalog coverage check
//   files…         Markdown / MDX files to check instead of the default list
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(join(root, 'package.json'))

const DEFAULT_DOCS = ['AGENTS.md', 'README.md', 'src/foundations/introduction.mdx']
/** The document whose catalog must mention every public export. */
const CATALOG_DOC = 'AGENTS.md'
/** Inside node_modules: ignored by git, ESLint, Tailwind and the project's own tsconfig. */
const TEMP_DIR = join(root, 'node_modules', '.cache', 'ferry-ui-docs-check')

const args = process.argv.slice(2)
const keep = args.includes('--keep')
const coverage = !args.includes('--no-coverage')
const requested = args.filter((arg) => !arg.startsWith('--'))
const docs = requested.length > 0 ? requested : DEFAULT_DOCS

/* -------------------------------------------------------------------------------------------------
 * Snippet extraction
 * -----------------------------------------------------------------------------------------------*/

const toPosix = (path) => path.split(sep).join('/')
const slug = (doc) => toPosix(doc).replace(/[^A-Za-z0-9]+/g, '_')

/**
 * Fenced code blocks of a Markdown / MDX source.
 * @returns {{ lang: string, meta: string, line: number, indent: number, code: string }[]} `line`
 *   is the 1-based line of the opening fence, so line N of `code` is line `line + N` of the
 *   document; `indent` is the number of leading characters removed from every line.
 */
function extractBlocks(source) {
  const blocks = []
  const lines = source.split(/\r?\n/)
  let open = null
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i]
    if (!open) {
      const match = /^(\s*)(`{3,}|~{3,})\s*([\w-]*)\s*(.*)$/.exec(text)
      if (match) open = { indent: match[1], fence: match[2], lang: match[3], meta: match[4], line: i + 1, body: [] }
      continue
    }
    const closing = new RegExp(`^\\s*${open.fence[0]}{${open.fence.length},}\\s*$`)
    if (closing.test(text)) {
      blocks.push({
        lang: open.lang,
        meta: open.meta,
        line: open.line,
        indent: open.indent.length,
        code: open.body.join('\n') + '\n',
      })
      open = null
      continue
    }
    // A block nested in a list is indented like its fence: remove that indentation.
    open.body.push(text.startsWith(open.indent) ? text.slice(open.indent.length) : text.trimStart())
  }
  if (open) throw new Error(`unclosed code block opened at line ${open.line}`)
  return blocks
}

/** One checked snippet: where it comes from and where it was written. */
const snippets = []
/** Temporary `src` folders overlaid on the real one (snippets declared with `file=src/...`). */
const overlays = new Set()
let skipped = 0
const problems = []

for (const doc of docs) {
  const path = resolve(root, doc)
  if (!existsSync(path)) {
    problems.push(`${doc}: file not found`)
    continue
  }
  let blocks
  try {
    blocks = extractBlocks(readFileSync(path, 'utf8'))
  } catch (error) {
    problems.push(`${doc}: ${error.message}`)
    continue
  }
  for (const block of blocks) {
    if (block.lang !== 'tsx') continue
    if (/\bno-check\b/.test(block.meta)) {
      skipped++
      continue
    }
    const named = /\bfile=(\S+)/.exec(block.meta)?.[1]
    if (named && (named.startsWith('/') || named.split('/').includes('..') || !/\.tsx?$/.test(named))) {
      problems.push(`${doc}:${block.line}: file=${named} must be a relative .ts / .tsx path without ".."`)
      continue
    }
    const folder = join(TEMP_DIR, slug(doc))
    const file = join(folder, named ?? `L${block.line}.tsx`)
    if (named?.startsWith('src/')) overlays.add(join(folder, 'src'))
    if (snippets.some((other) => other.file === file)) {
      problems.push(`${doc}:${block.line}: file=${named} is used by two snippets of this document`)
      continue
    }
    snippets.push({ doc: toPosix(relative(root, path)), line: block.line, indent: block.indent, code: block.code, file })
  }
}

/* -------------------------------------------------------------------------------------------------
 * Type-check
 * -----------------------------------------------------------------------------------------------*/

/**
 * Minimal declarations for the routers the docs show adapters for. They are only used when the
 * package is not installed here (ferry-ui depends on no router): just enough of the real API to check
 * that a `LinkComponent` adapter forwards the right props.
 */
const ROUTER_STUBS = {
  'react-router': `declare module 'react-router' {
  import type * as React from 'react'
  export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
    to: string
    replace?: boolean
    ref?: React.Ref<HTMLAnchorElement>
  }
  export function Link(props: LinkProps): React.ReactElement
  export function Outlet(): React.ReactElement | null
  export function useLocation(): { pathname: string; search: string; hash: string }
  export function useNavigate(): (to: string) => void
}`,
  next: `declare module 'next/link' {
  import type * as React from 'react'
  export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
    href: string
    replace?: boolean
    prefetch?: boolean | null
    ref?: React.Ref<HTMLAnchorElement>
  }
  export default function Link(props: LinkProps): React.ReactElement
}
declare module 'next/navigation' {
  export function usePathname(): string
  export function useRouter(): { push: (href: string) => void; replace: (href: string) => void }
}`,
  '@tanstack/react-router': `declare module '@tanstack/react-router' {
  import type * as React from 'react'
  export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
    to: string
    replace?: boolean
    ref?: React.Ref<HTMLAnchorElement>
  }
  export function Link(props: LinkProps): React.ReactElement
  export function Outlet(): React.ReactElement | null
  export function useLocation(): { pathname: string }
}`,
}

function isInstalled(name) {
  try {
    require.resolve(`${name}/package.json`)
    return true
  } catch {
    return false
  }
}

/** Runs tsc on the extracted snippets and returns its diagnostics, mapped back to the documents. */
function typeCheck() {
  rmSync(TEMP_DIR, { recursive: true, force: true })
  mkdirSync(TEMP_DIR, { recursive: true })
  for (const snippet of snippets) {
    mkdirSync(dirname(snippet.file), { recursive: true })
    writeFileSync(snippet.file, snippet.code)
  }
  const stubs = Object.entries(ROUTER_STUBS)
    .filter(([name]) => !isInstalled(name))
    .map(([, source]) => source)
  const stubsFile = join(TEMP_DIR, 'stubs.d.ts')
  writeFileSync(stubsFile, stubs.join('\n\n') + '\n')

  const fromTemp = (path) => {
    const rel = toPosix(relative(TEMP_DIR, path))
    return rel.startsWith('.') ? rel : `./${rel}`
  }
  const tsconfig = {
    extends: fromTemp(join(root, 'tsconfig.json')),
    compilerOptions: {
      noEmit: true,
      // Snippets declare handlers and data they do not always use.
      noUnusedLocals: false,
      noUnusedParameters: false,
      // The package name resolves to the sources, so the docs are checked against the current API.
      paths: {
        'ferry-ui': [fromTemp(join(root, 'src', 'index.ts'))],
        'ferry-ui/charts': [fromTemp(join(root, 'src', 'charts.ts'))],
      },
      // Relative imports of `file=src/...` snippets resolve as if they were written in ./src.
      ...(overlays.size > 0 && { rootDirs: [join(root, 'src'), ...overlays].map(fromTemp) }),
    },
    include: [],
    files: [stubsFile, ...snippets.map((snippet) => snippet.file)].map(fromTemp),
  }
  const tsconfigFile = join(TEMP_DIR, 'tsconfig.json')
  writeFileSync(tsconfigFile, JSON.stringify(tsconfig, null, 2) + '\n')

  const tsc = require.resolve('typescript/bin/tsc')
  const result = spawnSync(process.execPath, [tsc, '-p', tsconfigFile, '--pretty', 'false'], {
    cwd: root,
    encoding: 'utf8',
  })
  if (result.error) throw result.error

  const byFile = new Map(snippets.map((snippet) => [toPosix(relative(root, snippet.file)), snippet]))
  const output = `${result.stdout}${result.stderr}`.split(/\r?\n/).filter((text) => text.trim() !== '')
  const diagnostics = output.map((text) => {
    const match = /^(.+?)\((\d+),(\d+)\): (.*)$/.exec(text)
    const snippet = match && byFile.get(toPosix(relative(root, resolve(root, match[1]))))
    if (!snippet) return text
    return `${snippet.doc}:${snippet.line + Number(match[2])}:${snippet.indent + Number(match[3])} ${match[4]}`
  })
  return { failed: result.status !== 0, diagnostics }
}

/* -------------------------------------------------------------------------------------------------
 * Catalog coverage
 * -----------------------------------------------------------------------------------------------*/

/** The entry points of the package: their exports are the public API. */
const ENTRIES = ['index.ts', 'charts.ts']

/** Names exported by the entry points (values and types), read with the TypeScript compiler API. */
function publicExports() {
  const ts = require('typescript')
  const configFile = join(root, 'tsconfig.json')
  const config = ts.parseJsonConfigFileContent(ts.readConfigFile(configFile, ts.sys.readFile).config, ts.sys, root)
  const entries = ENTRIES.map((entry) => join(root, 'src', entry))
  const program = ts.createProgram(entries, { ...config.options, noEmit: true })
  const checker = program.getTypeChecker()
  const names = new Set()
  for (const entry of entries) {
    const moduleSymbol = checker.getSymbolAtLocation(program.getSourceFile(entry))
    if (!moduleSymbol) throw new Error(`${toPosix(relative(root, entry))} is not a module`)
    for (const symbol of checker.getExportsOfModule(moduleSymbol)) names.add(symbol.getName())
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}

function missingFromCatalog() {
  const path = join(root, CATALOG_DOC)
  if (!existsSync(path)) return []
  const text = readFileSync(path, 'utf8')
  const words = new Set(text.match(/[A-Za-z_$][\w$]*/g) ?? [])
  return publicExports().filter((name) => !words.has(name))
}

/* -------------------------------------------------------------------------------------------------
 * Run
 * -----------------------------------------------------------------------------------------------*/

let failed = problems.length > 0
for (const problem of problems) console.error(problem)

if (snippets.length > 0) {
  const result = typeCheck()
  for (const diagnostic of result.diagnostics) console.error(diagnostic)
  failed ||= result.failed
  if (keep) console.log(`check:docs: snippets kept in ${toPosix(relative(root, TEMP_DIR))}`)
  else rmSync(TEMP_DIR, { recursive: true, force: true })
} else if (problems.length === 0) {
  console.error(`check:docs: no \`\`\`tsx snippet found in ${docs.join(', ')}`)
  failed = true
}

if (coverage && requested.length === 0) {
  const missing = missingFromCatalog()
  if (missing.length > 0) {
    failed = true
    console.error(`${CATALOG_DOC}: ${missing.length} public export(s) of src/index.ts and src/charts.ts are not documented:`)
    console.error(`  ${missing.join(', ')}`)
  }
}

const summary = `${snippets.length} tsx snippet(s) from ${docs.length} file(s)${skipped ? `, ${skipped} skipped (no-check)` : ''}`
if (failed) {
  console.error(`check:docs failed (${summary}).`)
  process.exit(1)
}
console.log(`check:docs: ${summary} type-check against src/index.ts and src/charts.ts${coverage && requested.length === 0 ? `; every public export is in ${CATALOG_DOC}` : ''}.`)
