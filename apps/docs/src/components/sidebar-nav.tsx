'use client'
import useHash from '@/hooks/useHash'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CustomLinkProps } from './mdx/custom-link'
import MDXComponent from './mdx/mdx-component'

type SidebarNavProps = {
  content: string
}

export const Paragraph = ({ children }: CustomLinkProps) => {
  return <p className="m-0">{children}</p>
}

export const SidebarLink = ({
  children,
  href,
  openNewTab,
  className = '',
  ...rest
}: CustomLinkProps) => {
  const pathname = usePathname()
  const hash = useHash()
  return (
    <Link
      href={href}
      className={`font-normal -ml-2 block rounded-md px-2 py-1 no-underline hover:text-gray-900 text-gray-700 hover:bg-gray-100 ${className}${
        `${pathname}${hash || ''}` === href
          ? 'bg-gray-200 text-black'
          : ' text-gray-700'
      }`}
      {...rest}
    >
      {children}
    </Link>
  )
}

export const SidebarNav = ({ content }: SidebarNavProps) => {
  return (
    <aside className="hidden lg:block border-r px-4 py-4 w-full max-w-xs sticky top-16 h-[calc(100vh-4rem)] overflow-y-scroll no-scrollbar sidebar">
      <div className="prose prose-sm">
        <MDXComponent
          content={content}
          components={{ a: SidebarLink, p: Paragraph }}
        />
      </div>
    </aside>
  )
}
