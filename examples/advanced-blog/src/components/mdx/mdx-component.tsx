'use client'
import { getMDXComponent } from 'mdx-bundler/client'
import Image from 'next/image'
import { ImgHTMLAttributes, useMemo, useRef, useEffect, useState } from 'react'
import { CustomCode, Pre } from './custom-code'
import CustomLink from './custom-link'
import TOC from './toc'

const MDXComponentsMap = {
  a: CustomLink,
  Image,
  img: ({ ...props }: ImgHTMLAttributes<HTMLImageElement>) => (
    <img className="border rounded-lg" {...props} />
  ),
  pre: Pre,
  code: CustomCode
}

type MDXComponentProps = {
  content: string
  components?: Record<string, any>
  showTOC?: boolean
}

export const MDXComponent = ({
  content,
  components = {},
  showTOC = false
}: MDXComponentProps) => {
  const [renderedContent, setRenderedContent] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  const Component = useMemo(() => getMDXComponent(content), [content])

  useEffect(() => {
    if (contentRef.current) {
      setRenderedContent(contentRef.current.innerHTML)
    }
  }, [content])

  const shouldShowTOC = useMemo(() => {
    if (showTOC === true) return true
    if (showTOC === false) return false
  }, [showTOC])

  return (
    <>
      {shouldShowTOC && <TOC content={renderedContent} />}
      <div ref={contentRef}>
        <Component
          components={
            {
              ...MDXComponentsMap,
              ...components
            } as any
          }
        />
      </div>
    </>
  )
}

export default MDXComponent
