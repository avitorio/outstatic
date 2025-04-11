import React, { useEffect, useState, useMemo } from 'react'
import { twMerge } from 'tailwind-merge'

interface TOCItem {
  depth: number
  value: string
  url: string
}

interface TOCProps {
  content: string
  maxDepth?: number
  className?: string
  headingClassName?: string
  title?: string
}

const TOC: React.FC<TOCProps> = ({
  content,
  maxDepth = 3,
  className = 'toc',
  headingClassName = 'toc-heading',
  title = 'Table of Contents'
}) => {
  const [headings, setHeadings] = useState<TOCItem[]>([])

  const extractHeadings = useMemo(
    () => () => {
      try {
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = content

        const headingElements = tempDiv.querySelectorAll(
          'h1, h2, h3, h4, h5, h6'
        )
        return Array.from(headingElements)
          .filter((el) => parseInt(el.tagName[1]) <= maxDepth)
          .map((el) => ({
            depth: parseInt(el.tagName[1]),
            value: el.textContent?.trim() || '',
            url: `#${el.id}`
          }))
      } catch (error) {
        console.error('Error extracting headings:', error)
        return []
      }
    },
    [content, maxDepth]
  )

  useEffect(() => {
    setHeadings(extractHeadings())
  }, [extractHeadings])

  if (headings.length === 0) {
    return null
  }

  return (
    <nav className={className}>
      <h2 className={twMerge(headingClassName, 'hover:!no-underline')}>
        {title}
      </h2>
      <ul>
        {headings.map((heading, index) => (
          <li
            key={`${heading.url}-${index}`}
            style={{ marginLeft: `${(heading.depth - 1) * 16}px` }}
          >
            <a href={heading.url} className="no-underline hover:underline">
              {heading.value}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default TOC
