'use client'
import Image from 'next/image'
import { CustomCode, Pre } from './CustomCode'
import CustomLink from './CustomLink'
import { useMemo } from 'react'
import { getMDXComponent } from 'mdx-bundler/client'

const MDXComponentsMap = {
  a: CustomLink,
  Image,
  pre: Pre,
  code: CustomCode
}

export const MDXComponent = (content) => {
  const Component = useMemo(
    () => getMDXComponent(content.content),
    [content.content]
  )

  return (
    <Component
      components={
        {
          ...MDXComponentsMap
        } as any
      }
    />
  )
}

export default MDXComponent
