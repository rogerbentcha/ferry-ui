import { Button } from 'ferry-ui'

import { GithubIcon } from '@/components/logo'
import { RouterLink } from '@/components/providers'
import { GITHUB_URL } from '@/config'

import { Reveal } from './reveal'
import { Heading, Section } from './ui'

/** The layers of the package (README, "What is in the box"). */
const LAYERS = [
  { name: 'Tokens', text: 'Colors, radii, shadows and fonts, light and dark' },
  { name: 'Primitives', text: '28 building blocks on Radix UI' },
  { name: 'Patterns', text: '23 compositions for recurring product needs' },
  { name: 'Layout', text: '8 pieces of the application shell' },
  { name: 'Charts', text: 'Time series and themed recharts parts' },
  { name: 'Hooks and helpers', text: 'cn, useCopy, useTheme, the link contract' },
  { name: 'Documentation', text: 'These docs, a Storybook and a guide for agents' },
]

export function OpenSource() {
  return (
    <Section labelledBy="oss-title" className="grid gap-12 lg:grid-cols-2 lg:gap-16">
      <div>
        <Heading id="oss-title" strong="Open source, MIT licensed" quiet="Read it, run it, change it" />
        <Reveal delay={0.12}>
          <p className="mt-5 max-w-[28rem] text-foreground-lighter">
            ferry-ui is built in the open. Each component has a JSDoc that says when to use it and when not to, a story
            in Storybook and a page in these docs.
          </p>
        </Reveal>
        <Reveal delay={0.18} className="mt-8 flex flex-wrap items-center gap-5">
          <Button asChild size="lg" icon={<GithubIcon />}>
            <a href={GITHUB_URL}>View on GitHub</a>
          </Button>
          <RouterLink className="text-link text-sm" href="/docs/overview/about">
            About ferry-ui
          </RouterLink>
        </Reveal>
      </div>

      <Reveal delay={0.1} y={18} className="overflow-hidden rounded-xl border border-border-strong bg-surface-100">
        <div className="flex h-11 items-center border-b px-5 text-[13px] text-foreground-lighter">What is in the box</div>
        <ul>
          {LAYERS.map((layer) => (
            <li
              key={layer.name}
              className="grid grid-cols-[9.5rem_minmax(0,1fr)] items-baseline gap-4 border-b px-5 py-2.5 last:border-b-0 max-sm:grid-cols-1 max-sm:gap-0.5"
            >
              <span className="text-sm font-medium text-foreground">{layer.name}</span>
              <span className="text-sm text-foreground-lighter">{layer.text}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  )
}
