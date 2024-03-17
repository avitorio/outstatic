'use client'
import { getMDXComponent } from 'mdx-bundler/client'
import Image from 'next/image'
import { useMemo } from 'react'
import { CustomCode, Pre } from './custom-code'
import CustomLink from './custom-link'

const MDXComponentsMap = {
  a: CustomLink,
  Image,
  img: ({ ...props }: any) => <img className="border rounded-lg" {...props} />,
  pre: Pre,
  code: CustomCode
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
