import Link, { LinkProps } from 'next/link'

export type CustomLinkProps = {
  href: string
  children: React.ReactNode
  openNewTab?: boolean
  className?: string
} & React.ComponentPropsWithoutRef<'a'> &
  LinkProps

export default function CustomLink({
  children,
  href,
  openNewTab,
  className,
  ...rest
}: CustomLinkProps) {
  const isNewTab =
    openNewTab !== undefined
      ? openNewTab
      : href && !href.startsWith('/') && !href.startsWith('#')

  if (!isNewTab) {
    return (
      <Link href={href} {...rest} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <a target="_blank" rel="noopener noreferrer" href={href} {...rest}>
      {children}
    </a>
  )
}
