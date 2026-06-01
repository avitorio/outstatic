'use client'
import { getMDXComponent } from 'mdx-bundler/client'
import Image from 'next/image'
import { ImgHTMLAttributes, useMemo } from 'react'
import ApiFetcher from './api-fetcher'
import Callout from './callout'
import Counter from './counter'
import { CustomCode, Pre } from './custom-code'
import CustomLink from './custom-link'
import Youtube from './youtube'

const MDXComponentsMap = {
  a: CustomLink,
  Image,
  img: ({ ...props }: ImgHTMLAttributes<HTMLImageElement>) => (
    <img className="border rounded-lg" {...props} />
  ),
  pre: Pre,
  code: CustomCode,
  Callout,
  Counter,
  ApiFetcher,
  Youtube
}

type MDXComponentProps = {
  content: string
  components?: Record<string, any>
}

export const MDXComponent = ({
  content,
  components = {}
}: MDXComponentProps) => {
  const Component = useMemo(() => getMDXComponent(content), [content])

  return (
    <Component
      components={
        {
          ...MDXComponentsMap,
          ...components
        } as any
      }
    />
  )
}

export default MDXComponent
