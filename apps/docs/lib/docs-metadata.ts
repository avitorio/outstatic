import type { source } from '@/lib/source'
import { appName } from '@/lib/shared'

const DOCS_ORIGIN = 'https://outstatic.com'
const DOCS_CANONICAL_BASE = `${DOCS_ORIGIN}/docs`

type DocsPage = (typeof source)['$inferPage']

/**
 * Public URL for a docs page. The docs app is mounted at /docs, and the
 * canonical home is https://outstatic.com/docs with no trailing slash.
 * Fumadocs page URLs are rooted at `/` (`/` or `/some-page`).
 */
export function canonicalDocsUrl(pageUrl: string): string {
  if (pageUrl === '/' || pageUrl === '') return DOCS_CANONICAL_BASE

  const path = pageUrl.startsWith('/') ? pageUrl : `/${pageUrl}`
  const absolute =
    path === '/docs' || path.startsWith('/docs/')
      ? `${DOCS_ORIGIN}${path}`
      : `${DOCS_CANONICAL_BASE}${path}`

  return absolute.replace(/\/+$/, '')
}

export async function buildDocsStructuredData(page: DocsPage) {
  const url = canonicalDocsUrl(page.url)
  const description = page.data.description
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'TechArticle',
      headline: page.data.title,
      description,
      url,
      mainEntityOfPage: url,
      publisher: {
        '@type': 'Organization',
        name: appName,
        url: DOCS_ORIGIN
      }
    }
  ]

  if (page.slugs.at(-1) === 'faqs') {
    const markdown = await page.data.getText('processed')
    const faqs = parseFaqMarkdown(markdown)

    if (faqs.length > 0) {
      graph.push({
        '@type': 'FAQPage',
        url,
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer
          }
        }))
      })
    }
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph
  }
}

export function parseFaqMarkdown(markdown: string) {
  const faqs: { question: string; answer: string }[] = []
  const sections = markdown.split(/\n(?=#{1,2} )/)

  for (const section of sections) {
    const match = section.match(/^#{1,2}\s+([^\n]+)\n+([\s\S]*)$/)
    if (!match) continue

    const question = cleanHeading(match[1] ?? '')
    const answer = cleanAnswer(match[2] ?? '')
    if (!question || answer.length < 20) continue

    faqs.push({ question, answer })
  }

  return faqs
}

function cleanHeading(value: string) {
  return value
    .replace(/\s*\{#[^}]*\}\s*$/, '')
    .replace(/\s*\[#[^\]]*]\s*$/, '')
    .replace(/\\/g, '')
    .trim()
}

function cleanAnswer(value: string) {
  const text = value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/\s*\[#[^\]]*]/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length <= 600) return text

  const clipped = text.slice(0, 600)
  const boundary = clipped.lastIndexOf(' ')
  return `${(boundary > 400 ? clipped.slice(0, boundary) : clipped).trim()}…`
}
