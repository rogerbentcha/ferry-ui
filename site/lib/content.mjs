// Reads the documentation pages (site/src/content/**/*.mdx): front matter, URL, sidebar group and
// headings. Shared by the Vite plugins (plugins/) and the Node scripts (scripts/), so the sidebar,
// the Markdown export and the checks all see the same list of pages.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import GithubSlugger from 'github-slugger'

/** Absolute path of the `site/` folder. */
export const SITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
/** Absolute path of the repository (the ferry-ui package). */
export const REPO_ROOT = path.resolve(SITE_ROOT, '..')
export const CONTENT_DIR = path.join(SITE_ROOT, 'src', 'content')
export const DEMOS_DIR = path.join(SITE_ROOT, 'src', 'demos')
export const API_DIR = path.join(SITE_ROOT, 'src', 'generated', 'api')

/** Sidebar groups, in display order. A page of `content/components/` names its group in `group`. */
export const GROUPS = ['Overview', 'Handbook', 'Examples', 'Primitives', 'Patterns', 'Layout', 'Charts', 'Utilities']

/** Group of a page when its front matter has no `group`: the folder decides. */
const FOLDER_GROUP = {
  overview: 'Overview',
  handbook: 'Handbook',
  examples: 'Examples',
  utilities: 'Utilities',
}

/**
 * @typedef {object} Heading
 * @property {2 | 3} depth
 * @property {string} text
 * @property {string} id
 *
 * @typedef {object} DocPage
 * @property {string} path     URL of the page, e.g. `/docs/components/button`.
 * @property {string} section  Folder under `content/`, e.g. `components`.
 * @property {string} slug     File name without extension.
 * @property {string} file     Path relative to `site/src/content`, e.g. `components/button.mdx`.
 * @property {string} title
 * @property {string} description
 * @property {string} group    One of GROUPS.
 * @property {number | null} order
 * @property {string | null} source  Repository path of the documented module (the "View source" link).
 * @property {Heading[]} headings
 */

/**
 * Front matter of an MDX source: `key: value` lines between two `---` lines. Values are plain
 * one-line strings (quotes are optional), which is all the pages need.
 * @param {string} source
 * @returns {{ data: Record<string, string>, body: string }}
 */
export function parseFrontmatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source)
  if (!match) return { data: {}, body: source }
  /** @type {Record<string, string>} */
  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line)
    if (!pair) continue
    let value = pair[2].trim()
    if (/^(".*"|'.*')$/.test(value)) value = value.slice(1, -1)
    data[pair[1]] = value
  }
  return { data, body: source.slice(match[0].length) }
}

/** Removes fenced code blocks, so a `## ` inside a snippet is not read as a heading. */
export function stripCodeBlocks(body) {
  return body.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, '\n')
}

/** Text of a Markdown heading as a reader sees it (no backticks, no link syntax). */
function plainText(markdown) {
  return markdown
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*|__/g, '')
    .trim()
}

/**
 * The `##` and `###` headings of a page, with the ids rehype-slug gives them.
 * @param {string} body
 * @returns {Heading[]}
 */
export function extractHeadings(body) {
  const slugger = new GithubSlugger()
  /** @type {Heading[]} */
  const headings = []
  for (const match of stripCodeBlocks(body).matchAll(/^(#{1,6})\s+(.+?)\s*$/gm)) {
    const text = plainText(match[2])
    // Every heading takes a slug (ids stay unique in page order), only h2 / h3 are listed.
    const id = slugger.slug(text)
    const depth = match[1].length
    if (depth === 2 || depth === 3) headings.push({ depth, text, id })
  }
  return headings
}

/** Every `.mdx` file under `dir`, as absolute paths. */
function listMdx(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return listMdx(full)
    return entry.name.endsWith('.mdx') ? [full] : []
  })
}

/**
 * One page from its file.
 * @param {string} file Absolute path of the `.mdx` file.
 * @returns {DocPage}
 */
export function readPage(file) {
  const relative = path.relative(CONTENT_DIR, file).split(path.sep).join('/')
  const { data, body } = parseFrontmatter(fs.readFileSync(file, 'utf8'))
  const parts = relative.replace(/\.mdx$/, '').split('/')
  const section = parts[0]
  const slug = parts.slice(1).join('/')
  const order = data.order !== undefined && data.order !== '' ? Number(data.order) : null
  return {
    path: `/docs/${section}/${slug}`,
    section,
    slug,
    file: relative,
    title: data.title ?? slug,
    description: data.description ?? '',
    group: data.group ?? FOLDER_GROUP[section] ?? 'Overview',
    order: Number.isFinite(order) ? order : null,
    source: data.source || null,
    headings: extractHeadings(body),
  }
}

/**
 * Every page, in sidebar order: by group (GROUPS), then by `order`, then by title.
 * @returns {DocPage[]}
 */
export function readPages() {
  const rank = (/** @type {DocPage} */ page) => {
    const index = GROUPS.indexOf(page.group)
    return index === -1 ? GROUPS.length : index
  }
  return listMdx(CONTENT_DIR)
    .filter((file) => path.relative(CONTENT_DIR, file).split(path.sep).length >= 2)
    .map(readPage)
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
        a.title.localeCompare(b.title),
    )
}
