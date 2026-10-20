#!/usr/bin/env node
// Measures how simple the documentation is to read, with the main writing rules of ASD-STE100
// (Simplified Technical English) and the page rules of site/AUTHORING.md.
//
//   node site/scripts/check-content.mjs                       every page
//   node site/scripts/check-content.mjs src/content/components/button.mdx
//   node site/scripts/check-content.mjs -v <path>             also print each sentence that fails
//   node site/scripts/check-content.mjs --strict <path>       exit 1 when a page is below the targets
//   node site/scripts/check-content.mjs --links               also check the links between pages
//
// Paths are relative to the current directory or to site/ (or absolute). A page passes when at least 80% of its sentences obey
// every rule below, when it shows a demo or a code sample, when it stays inside the word budget,
// and when its front matter and its blocks (<Demo>, <PropsTable>) are correct.
//
// This is a heuristic, not the STE standard: it knows the sentence rules and a short list of words
// that STE does not approve. It does not have the STE dictionary. Read its output as a guide.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { API_DIR, CONTENT_DIR, DEMOS_DIR, GROUPS, REPO_ROOT, SITE_ROOT, parseFrontmatter, readPages } from '../lib/content.mjs'

const args = process.argv.slice(2)
const verbose = args.includes('-v')
const strict = args.includes('--strict')
const checkLinks = args.includes('--links')
const targets = args.filter((a) => !a.startsWith('-'))

export const TARGET = 0.8 // share of sentences that must pass
export const MAX_WORDS = 400 // words a reader sees in sentences
export const MAX_TABLE_WORDS = 400 // words in tables
const MAX_DESCRIPTION = 20 // words of the `description` of a page
const MAX_DESCRIPTIVE = 25 // STE rule 6.1
const MAX_INSTRUCTION = 20 // STE rule 5.1
const MAX_PARAGRAPH = 6 // STE rule 6.3 (sentences)

// Verbs that start an instruction ("Import the component.").
const IMPERATIVES = new Set(
  `add align apply ask avoid bind build call change check choose click close combine compose connect control copy
   create declare define delete disable do edit enable enter find follow forward give go group hide import install
   keep label link look make mark mount move name nest open override pass paste pick place point prefer press put
   read remove render replace reset run save scroll select send set show sort start stop style tell try type update
   use wait wrap write`
    .split(/\s+/)
    .filter(Boolean),
)

// Words and phrases that STE does not approve, with what to write.
const UNAPPROVED = [
  [/\bmay\b/i, 'may → can'],
  [/\bmight\b/i, 'might → can / it is possible that'],
  [/\bshould\b/i, 'should → must (or give the instruction)'],
  [/\bvia\b/i, 'via → through / with'],
  [/\bonce\b/i, 'once → when / after (at once → immediately)'],
  [/\bsince\b/i, 'since → because / after'],
  [/\bin order to\b/i, 'in order to → to'],
  [/\bas well as\b/i, 'as well as → and'],
  [/\be\.g\.|\bi\.e\.|\betc\b/i, 'e.g. / i.e. / etc. → for example / that is / name the items'],
  [/\butili[sz]e[sd]?\b/i, 'utilize → use'],
  [/\bensures?\b/i, 'ensure → make sure'],
  [/\b(simply|just|basically|actually|really|very|quite|easily|obviously|of course)\b/i, 'filler word → remove it'],
  [/\bhowever\b/i, 'however → but'],
  [/\btherefore\b/i, 'therefore → thus / as a result'],
  [/\bwhether\b/i, 'whether → if'],
  [/\bperform(s|ed)?\b/i, 'perform → do'],
  [/\bprior to\b/i, 'prior to → before'],
  [/\bupon\b/i, 'upon → when / on'],
  [/\b(obtain|retrieve)s?\b/i, 'obtain / retrieve → get'],
  [/\bterminates?\b/i, 'terminate → stop'],
  [/\badditional\b/i, 'additional → more'],
  [/\bleverag(e|es|ed)\b/i, 'leverage → use'],
  [/\b(allows?|enables?|lets?) you to\b/i, '"allows you to" → say what the reader does ("Use … to …")'],
  [/\bunder the hood\b|\bout of the box\b|\bon the fly\b|\bbehind the scenes\b/i, 'idiom → plain words'],
  [/\b(handy|tweak|grab|gotcha|seamless(ly)?|powerful|robust|blazing)\b/i, 'informal or marketing word → plain word'],
  [
    /\b(don't|doesn't|didn't|can't|won't|isn't|aren't|wasn't|weren't|hasn't|haven't|it's|that's|there's|you're|you'll|you've|we're|we'll|they're)\b/i,
    'contraction → write the full words',
  ],
]

// Words in -ing that are names of things, not verb forms.
const ING_NAMES = new Set(
  `thing things nothing anything something everything during string strings setting settings warning warnings
   ring bring spring sibling siblings pending meaning listing
   heading headings styling theming spacing padding loading rendering nesting sizing positioning routing
   billing building typing marketing`
    .split(/\s+/)
    .filter(Boolean),
)
const PARTICIPLES =
  'built|sent|kept|made|run|shown|written|taken|given|known|done|set|put|chosen|found|held|lost|read|told|seen|left|bound|hidden|paid|sold|stuck|cut|shut|drawn|thrown|broken|frozen|begun|gone|won'
// Words in -ed that name a state of a component ("the item is selected") or are not verbs.
const NOT_PARTICIPLES =
  /^(need|speed|feed|red|bed|shed|embed|indeed|proceed|exceed|succeed|hundred|shared|named|limited|disabled|enabled|selected|checked|unchecked|pressed|focused|controlled|uncontrolled|required|closed|expanded|collapsed|mounted|unmounted|deprecated|nested|related|allowed|supported|truncated)$/i

function listFiles(target) {
  // A relative path is read from the current directory first, then from site/.
  const full = [path.resolve(target), path.resolve(SITE_ROOT, target)].find((candidate) => fs.existsSync(candidate))
  if (!full) return []
  if (fs.statSync(full).isFile()) return full.endsWith('.mdx') ? [full] : []
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) => listFiles(path.join(full, entry.name)))
}

const words = (text) => text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w))

/** MDX → the units a reader reads: paragraphs (lists of sentences) and table cells. */
export function extract(source) {
  const { data, body } = parseFrontmatter(source)
  let text = body

  const pictures =
    (text.match(/<(Demo|PackageTabs)\b/g)?.length ?? 0) + (text.match(/^```/gm)?.length ?? 0) / 2

  text = text
    .replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, '\n') // code blocks
    .replace(/^(import|export)\s.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    // Inline code first: a tag between backticks (`<main>`) is a name, not markup.
    .replace(/`[^`\n]*`/g, 'CODE')
    .replace(/^[ \t]*<[A-Z][A-Za-z.]*\b[^<>]*\/>[ \t]*$/gm, '\n') // <Demo … />, <PropsTable … /> on their own line: not prose
    .replace(/^[ \t]*<\/?[A-Z][A-Za-z.]*\b[^<>]*>[ \t]*$/gm, '\n') // <Callout …> and </Callout> lines: the text between them is its own block
    .replace(/<\/?[A-Za-z][^<>]*>/g, '') // inline tags (<Kbd>Esc</Kbd>): keep what is between them
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*|__|(?<![A-Za-z0-9])[*_]|[*_](?![A-Za-z0-9])/g, '')

  const paragraphs = []
  const cells = []
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    if (!lines.length) continue
    if (lines.every((l) => l.startsWith('|'))) {
      for (const line of lines) {
        if (/^\|[\s:|-]+\|$/.test(line)) continue
        for (const cell of line.split('|').map((c) => c.trim()).filter(Boolean)) cells.push(cell)
      }
      continue
    }
    const prose = []
    for (const line of lines) {
      if (/^#{1,6}\s/.test(line)) continue
      const item = /^(?:[-*+]|\d+\.)\s+(.*)$/.exec(line)
      if (item) {
        // every list item is a unit of its own
        paragraphs.push(sentences(item[1]))
        continue
      }
      prose.push(line)
    }
    if (prose.length) paragraphs.push(sentences(prose.join(' ')))
  }
  if (data.description) paragraphs.push(sentences(data.description))
  return { data, body, paragraphs: paragraphs.filter((p) => p.length), cells, pictures }
}

function sentences(text) {
  return text
    .replace(/\s+/g, ' ')
    // A sentence starts with a capital, a quote, a code span or the lowercase name of the project.
    .split(/(?<=[.?!])\s+(?=[A-Z"“`(]|CODE|ferry-ui\b)/)
    .map((s) => s.trim())
    .filter((s) => words(s).length > 0)
}

/** The rules a sentence breaks (an empty list: the sentence passes). */
export function check(sentence) {
  const problems = []
  const w = words(sentence)
  const first = w[0]?.toLowerCase().replace(/[^a-z]/g, '') ?? ''
  const instruction = IMPERATIVES.has(first)
  const max = instruction ? MAX_INSTRUCTION : MAX_DESCRIPTIVE
  if (w.length > max) problems.push(`${w.length} words (max ${max}${instruction ? ' for an instruction' : ''})`)
  if (/;/.test(sentence)) problems.push('two ideas in one sentence (;)')

  const passive = new RegExp(
    String.raw`\b(?:is|are|was|were|be|been|being)\s+(?:not\s+)?(?:\w+ly\s+)?(\w+ed|${PARTICIPLES})\b`,
    'i',
  ).exec(sentence)
  if (passive && !NOT_PARTICIPLES.test(passive[1])) problems.push(`passive voice ("${passive[0]}")`)

  for (const [pattern, advice] of UNAPPROVED) if (pattern.test(sentence)) problems.push(advice)

  const ing = w
    .map((x) => x.toLowerCase().replace(/[^a-z-]/g, ''))
    .filter((x) => /[a-z]{2,}ing$/.test(x) && !ING_NAMES.has(x.split('-').pop()))
  if (ing.length) problems.push(`-ing form (${[...new Set(ing)].join(', ')})`)
  return problems
}

/** Problems of the page that are not about sentences: front matter, demos, API tables. */
function structure(file, data, body) {
  const problems = []
  const relative = path.relative(CONTENT_DIR, file).split(path.sep).join('/')
  if (!data.title) problems.push('front matter: no title')
  if (!data.description) problems.push('front matter: no description')
  else {
    if (words(data.description).length > MAX_DESCRIPTION) problems.push(`description: more than ${MAX_DESCRIPTION} words`)
    if (!/[.?!]$/.test(data.description)) problems.push('description: must be one full sentence that ends with a period')
  }
  if (data.group && !GROUPS.includes(data.group)) problems.push(`front matter: group "${data.group}" is not one of ${GROUPS.join(', ')}`)
  if (relative.startsWith('components/')) {
    if (!['Primitives', 'Patterns', 'Layout', 'Charts'].includes(data.group)) problems.push('front matter: a component page needs group: Primitives, Patterns, Layout or Charts')
    if (!data.source) problems.push('front matter: a component page needs source: (path of the module in the repository)')
  }
  if (data.source && !fs.existsSync(path.join(REPO_ROOT, data.source))) problems.push(`front matter: source ${data.source} does not exist`)
  if (/^#\s/m.test(body.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, ''))) problems.push('a "# " heading: the title comes from the front matter')
  for (const match of body.matchAll(/<Demo\b[^>]*>/g)) {
    const name = /\bname="([^"]*)"/.exec(match[0])?.[1]
    if (!name) problems.push('<Demo> with no name')
    else if (!fs.existsSync(path.join(DEMOS_DIR, `${name}.tsx`))) problems.push(`<Demo name="${name}">: no file src/demos/${name}.tsx`)
  }
  for (const match of body.matchAll(/<PropsTable\b[^>]*>/g)) {
    const of = /\bof="([^"]*)"/.exec(match[0])?.[1]
    if (!of) problems.push('<PropsTable> with no "of"')
    else if (!fs.existsSync(path.join(API_DIR, `${of}.json`))) problems.push(`<PropsTable of="${of}">: no generated API (run "npm run site:api")`)
  }
  return problems
}

export function measure(file) {
  const source = fs.readFileSync(file, 'utf8')
  const { data, body, paragraphs, cells, pictures } = extract(source)
  const failures = []
  let total = 0
  let passed = 0
  let readingWords = 0
  for (const paragraph of paragraphs) {
    if (paragraph.length > MAX_PARAGRAPH) {
      failures.push({ sentence: paragraph[0], problems: [`paragraph of ${paragraph.length} sentences (max ${MAX_PARAGRAPH})`] })
    }
    for (const sentence of paragraph) {
      total += 1
      readingWords += words(sentence).length
      const problems = check(sentence)
      if (problems.length) failures.push({ sentence, problems })
      else passed += 1
    }
  }
  const tableWords = cells.reduce((n, cell) => n + words(cell).length, 0)
  for (const cell of cells) {
    // A cell that is a full sentence obeys the same rules.
    if (words(cell).length < 6) continue
    for (const sentence of sentences(cell)) {
      total += 1
      const problems = check(sentence)
      if (problems.length) failures.push({ sentence, problems })
      else passed += 1
    }
  }
  return { score: total ? passed / total : 1, total, passed, readingWords, tableWords, pictures, failures, structure: structure(file, data, body), body }
}

/** Links to pages of the site that do not exist, or to a heading the page does not have. */
function brokenLinks(file, body, pages) {
  const known = new Map(pages.map((page) => [page.path, page]))
  const problems = []
  const text = body.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, '')
  for (const match of text.matchAll(/\]\((\/[^)\s]*)\)|href="(\/[^"]*)"/g)) {
    const href = match[1] ?? match[2]
    if (!href.startsWith('/docs/')) continue
    const [target, anchor] = href.split('#')
    // `/docs/components/button.md` is the Markdown version of a page: the page must exist.
    const page = known.get(target.replace(/\/$/, '').replace(/\.md$/, ''))
    if (!page) problems.push(`link to ${href}: no such page`)
    else if (anchor && !page.headings.some((heading) => heading.id === anchor)) problems.push(`link to ${href}: no such heading`)
  }
  return problems
}

function main() {
  const files = (targets.length ? targets : ['src/content']).flatMap(listFiles).sort()
  if (!files.length) {
    console.error('No .mdx file found.')
    process.exit(2)
  }
  const pages = checkLinks ? readPages() : []
  let below = 0
  let allPassed = 0
  let allTotal = 0
  for (const file of files) {
    const result = measure(file)
    const notes = []
    if (result.score < TARGET) notes.push(`STE ${Math.round(result.score * 100)}% < ${TARGET * 100}%`)
    if (result.readingWords > MAX_WORDS) notes.push(`${result.readingWords} words > ${MAX_WORDS}`)
    if (result.tableWords > MAX_TABLE_WORDS) notes.push(`${result.tableWords} table words > ${MAX_TABLE_WORDS}`)
    if (!result.pictures) notes.push('no demo or code sample')
    const problems = [...result.structure, ...(checkLinks ? brokenLinks(file, result.body, pages) : [])]
    if (problems.length) notes.push(`${problems.length} problem${problems.length > 1 ? 's' : ''}`)
    if (notes.length) below += 1
    allPassed += result.passed
    allTotal += result.total
    const name = path.relative(SITE_ROOT, file)
    console.log(
      `${notes.length ? '✗' : '✓'} ${String(Math.round(result.score * 100)).padStart(3)}%  ${String(result.readingWords).padStart(4)} words  ${name}${notes.length ? `  — ${notes.join(', ')}` : ''}`,
    )
    for (const problem of problems) console.log(`      ! ${problem}`)
    if (verbose) {
      for (const failure of result.failures) {
        console.log(`      · ${failure.sentence.slice(0, 110)}${failure.sentence.length > 110 ? '…' : ''}`)
        console.log(`        ${failure.problems.join(' | ')}`)
      }
    }
  }
  console.log(
    `\n${files.length} pages, ${files.length - below} inside the targets. All sentences together: ${allTotal ? Math.round((allPassed / allTotal) * 100) : 100}% pass.`,
  )
  if (strict && below) process.exit(1)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
