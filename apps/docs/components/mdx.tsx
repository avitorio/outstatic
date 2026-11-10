import { EmailSafe } from '@/components/email-safe'
import { LoopVideo } from '@/components/loop-video'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    EmailSafe,
    LoopVideo,
    ...components
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
