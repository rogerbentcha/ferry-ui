# Authoring guide

How to write a page of the ferry-ui documentation. The goal: a developer who is new to ferry-ui, and whose
first language is possibly not English, understands each page at the first read and copies code that
works.

The pages to copy:

| Kind of page | Model |
| --- | --- |
| A component with one part | `src/content/components/button.mdx` + `src/demos/button/` |
| A component with several parts | `src/content/components/dialog.mdx` + `src/demos/dialog/` |
| A component that fills the viewport | `src/content/components/app-shell.mdx` + `src/demos/app-shell/` |
| A guide | `src/content/overview/quick-start.mdx` |

All commands below run from the repository root.

```sh
npm run site:dev                                              # the site, http://localhost:5181
node site/scripts/check-content.mjs -v src/content/components/button.mdx   # the writing rules
```

## 1. Where a page lives

```text
site/src/content/<section>/<slug>.mdx   → /docs/<section>/<slug>
site/src/demos/<slug>/<demo>.tsx        → <Demo name="<slug>/<demo>" />
```

| Folder | Sidebar group | Content |
| --- | --- | --- |
| `overview/` | Overview | What ferry-ui is, how to start. |
| `handbook/` | Handbook | One subject that goes across components: styling, theming, forms. |
| `examples/` | Examples | A full screen built with ferry-ui. |
| `components/` | Primitives, Patterns, Layout or Charts (`group:` in the front matter) | One page per component file of `src/components/`. |
| `utilities/` | Utilities | Providers, hooks and helper functions. |

A new page needs no registration: the sidebar, the search, the "on this page" list and the Markdown
version come from the file. The file name is the kebab-case name of the source file (`alert-dialog.mdx`).

### Front matter

```mdx
---
title: Alert Dialog
description: A dialog that stops the user until they answer a question.
group: Primitives
source: src/components/primitives/alert-dialog.tsx
order: 3
---
```

| Key | Rule |
| --- | --- |
| `title` | The name a reader looks for. Words with spaces for a component: "Alert Dialog", not "AlertDialog". |
| `description` | One full sentence, 20 words at most, that says what the thing is. It ends with a period. Plain text, no Markdown. |
| `group` | Component pages only: `Primitives`, `Patterns`, `Layout` or `Charts` (the folder of the source file). |
| `source` | Component and utility pages: the path of the module in the repository. It gives the "View source" link. |
| `order` | Overview, Handbook and Examples only: the position in the group. Other groups sort by title. |

Each value is on one line. Do not write the title again as a `#` heading.

## 2. The component page

The structure follows the Base UI docs: first the thing, then the rules, then the parts, then examples,
then the API.

```mdx
<Demo name="dialog/hero" title="A dialog with a form" />     ← the component in a real use, before any text

## Usage guidelines        ← 2 to 5 bullets: when to use it, when to use another component (with a link)
## Anatomy                 ← the import and the parts, as code. A table of parts when there are 3 or more
## Examples                ← one ### per idea: 1 or 2 sentences, then a <Demo>
## Accessibility           ← only what the developer must do, and the keys. Leave it out if there is nothing
## API reference           ← one ### and one <PropsTable> per exported component
```

Rules:

- **Show, then tell.** Each `###` under Examples has a `<Demo>` or a code block. The text says what the
  reader sees and which prop does it, in 1 to 3 short sentences.
- **Cover the props that matter.** One example per important prop or behavior: variants, sizes, states
  (disabled, loading, error), controlled and uncontrolled use, composition with another component.
  A page has 3 to 8 examples.
- **Few words.** 120 to 300 words of sentences is the aim. The checker refuses more than 400.
- **Tables for values.** A list of variants, sizes or parts with their role is a table, not a paragraph.
- **Links.** Link to the page of each other component you name, the first time: `[Switch](/docs/components/switch)`.
  Links are absolute paths. Only link to pages of the page list (section 8 of the brief, or the sidebar).
- **API reference.** `<PropsTable of="DialogContent" />` shows the props from the source code (types,
  defaults, JSDoc). Do not write a props table by hand for a component. Write one sentence above the
  first table that says which element or Radix UI primitive gives the other props. For a hook or a
  helper function (no generated table), write a Markdown table: name, type, role.
- **No "Next steps" list** at the end of a component page: the page has previous and next links.

## 3. Demos

A demo is one `.tsx` file with one default export, a component with no props.

```tsx
import { Button } from 'ferry-ui'
import { Plus } from 'lucide-react'

export default function ButtonWithIcon() {
  return <Button icon={<Plus />}>New project</Button>
}
```

- **It is the code a reader copies.** Import from `'ferry-ui'` (and `lucide-react`, `react`) only. No import
  from the site, no relative import, no helper file. A demo that needs data declares it in the file.
- **One idea per demo.** 10 to 60 lines. If a demo shows two ideas, make two demos.
- **The first demo of the page (`hero`) shows a real use**, not every variant.
- **Real, neutral content.** Projects, members, invoices, API keys, orders, customers. Names like
  "Maya Chen", "Acme", `maya@example.com`. No "foo", no "Lorem ipsum", no real brand.
- **ferry-ui rules apply** (`AGENTS.md`, section 1): token classes only (`text-foreground-light`,
  `bg-surface-100`), no raw colors, no `dark:` forks, sizes through the `size` prop, one `primary`
  button per view, an `aria-label` on each icon-only button, a title in each dialog.
- **It renders on the server.** The build writes each page as HTML first. Use `window`, `document`,
  `localStorage` and `navigator` only in an event handler or in an effect, never while rendering.
- **It is closed at the start.** A dialog, a menu or a popover opens when the reader clicks. Do not
  use `defaultOpen` on an overlay (it would open on page load and take the focus).
- **Links do not leave the page.** Use `onSelect` / `onClick` with local state, or `href="#"`-free
  buttons. An `href` to a path that does not exist breaks the reader's navigation.
- **Layout.** The preview centers the demo and puts 12px between its top-level elements: return a
  fragment for a row of small things. Use `align="stretch"` on `<Demo>` for a table, a card or a form
  that takes the width (give it `className="w-full max-w-md"` or similar yourself when needed).
- **Full-screen components** (`AppShell`, `TopBar`, `IconRail`, `MobileNav`, anything with breakpoints):
  `<Demo name="…" frame height={520} />` runs the demo in an iframe with desktop, tablet and phone
  widths. The demo then fills the viewport of the iframe.

### `<Demo>` props

| Prop | Value |
| --- | --- |
| `name` | `"<slug>/<demo>"`: the file `src/demos/<slug>/<demo>.tsx`. Required. |
| `title` | A few words that say what the demo shows. It names the preview for screen readers. Required in practice. |
| `align` | `center` (default), `start`, or `stretch` (the demo takes the full width). |
| `frame` | Run the demo in an iframe (see above). |
| `height` | Height of the framed preview in pixels. Default 560. |
| `viewport` | Width the framed preview starts with: `desktop` (default), `tablet` or `phone`. |
| `code` | Show another file of the repository as the code: `code="src/examples/dashboard-example.tsx"`. |
| `className` | Classes for the preview area, for example `min-h-80` for a menu that opens downward. |

## 4. Other blocks

All these work in every page with no import.

| Block | Use |
| --- | --- |
| ` ```tsx title="app.tsx" ` | Code that is not a live demo: setup code, a fragment, an anatomy. `title` is optional. Languages: `tsx`, `ts`, `css`, `sh`, `json`, `text`. |
| ` ```sh ` | Commands. Each line gets a `$` prompt that the copy button leaves out. |
| `<PackageTabs packages="ferry-ui" />` | An install command for npm, pnpm, yarn and bun. |
| `<PropsTable of="Button" />` | The generated props of a component. |
| `<Callout tone="warning" title="…">…</Callout>` | One per page at most: a risk, or the one thing to remember. Tones: `info`, `warning`, `destructive`, `success`, `neutral`. |
| `<Kbd>Esc</Kbd>` | A key. |
| Markdown table | To compare things or to list values. Short cells. |

MDX traps: a `{` in text starts JavaScript and a `<` starts a tag. Write them inside backticks
(`` `{children}` ``, `` `<button>` ``). Leave an empty line before and after a block component. A page
that needs a custom figure can import its own component from `@/components/docs/…` at the top of the
file, after the front matter.

## 5. Simplified Technical English

The text follows the writing rules of ASD-STE100. The target is 80% of the sentences of each page with
no fault. The checker reports the percentage and each fault.

| Rule | Not this | This |
| --- | --- | --- |
| A description has 25 words at most | | |
| An instruction has 20 words at most and starts with the verb | You can pass the `size` prop to change the height. | Pass `size` to change the height. |
| One instruction per sentence | Import the parts and wrap the trigger. | Import the parts. Wrap the trigger. |
| Active voice | The dialog is closed by the Escape key. | The Escape key closes the dialog. |
| Simple tenses: present, past, future | The menu has been opened. | The menu is open. |
| No `-ing` verb form | When rendering a list… | When you render a list… |
| One word, one meaning. One thing, one name | popup / overlay / layer | overlay |
| Full words | don't, it's, e.g., etc. | do not, it is, for example |
| No idiom, no filler, no sales word | out of the box, simply, just, powerful | (say the fact) |
| The condition comes first | Set `loading` if the request is in progress. | If the request is in progress, set `loading`. |
| A paragraph has 6 sentences at most | | |
| A noun group has 3 words at most | the dialog content close button label | the label of the close button |
| No `;` between two ideas | The body scrolls; the footer stays. | The body scrolls. The footer stays. |

Words to replace:

| Not this | This |
| --- | --- |
| may, might | can |
| should | must, or the instruction |
| allows you to, lets you, enables you to | "Use … to …", or say what the component does |
| once, upon | when, after |
| since | because |
| via | through, with |
| however | but |
| whether | if |
| ensure, verify | make sure |
| perform | do |
| in order to | to |
| as well as | and |
| additional | more |
| obtain, retrieve | get |
| utilize, leverage | use |

One thing, one name. Use these words, and no other word for the same thing:

| Word | Meaning |
| --- | --- |
| component | A React component that ferry-ui exports. |
| part | One component of a group that works together (`DialogTitle` is a part of Dialog). |
| prop | An input of a component. |
| variant, size, tone | The three usual props for the look, the height and the meaning color. |
| token | A named design value (a color, a radius, a font) that ferry-ui gives as a CSS variable and a Tailwind class. |
| primitive, pattern, layout component | The three layers of ferry-ui components. |
| controlled, uncontrolled | State that your code holds, or state that the component holds. |
| trigger | The element that opens an overlay. |
| overlay | A dialog, a sheet, a menu, a popover or a tooltip: content above the page. |
| provider | A component that gives a setting to all the components below it. |
| hook | A function with a name that starts with `use`. |

Names of things are free: prop names, component names, CSS classes and each word of the table above.
Text in `code` stays as the program writes it. Words in `-ing` that name a thing are fine: `styling`,
`theming`, `spacing`, `padding`, `loading`, `rendering`, `nesting`, `heading`, `setting`.

Write "the reader does X" as an instruction ("Pass `open`."), and what the component does as a fact in
the present tense ("The dialog closes."). Address the reader as "you" only when an instruction does
not fit.

## 6. Keep every fact true

- **Read the source before you write.** The component file (`src/components/…`) and its JSDoc are the
  truth, then its story file (`*.stories.tsx`) for real examples, then the catalog entry in `AGENTS.md`
  (section 7). Do not write a prop, a value, a default, a size in pixels or a behavior that you did not
  read there.
- **Do not invent packages, commands or URLs.** The package is `ferry-ui` on npm: the README says how to install it.
- If you are not sure of a fact, leave it out.

## 7. Before you are done

```sh
node site/scripts/check-content.mjs -v src/content/components/<slug>.mdx   # ✓ on each of your pages
DEMOS=<slug> npm run site:test                                           # each demo renders, no console error
npx tsc -p site/tsconfig.json --noEmit                                   # no type error in your demos
npx eslint site/src/demos/<slug>                                         # no lint error
```

`npm run site:verify` runs all the checks and the full build (it also checks the links between pages).

The checker measures the sentence rules and a short list of words. It does not have the STE dictionary:
read each page one more time as the reader.
