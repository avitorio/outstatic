import useOutstatic from '@/utils/hooks/useOutstatic'
import type { LinkProps as NextLinkProps } from 'next/link'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import type { HTMLAttributes, PropsWithChildren } from 'react'
import React, { useCallback, type MouseEvent } from 'react'

export type LinkProps = PropsWithChildren<
  NextLinkProps & HTMLAttributes<HTMLAnchorElement>
>

const Link: React.FC<LinkProps> = ({
  href,
  onClick,
  children,
  ...nextLinkProps
}) => {
  const nextRouter = useRouter()
  const { hasChanges, setHasChanges } = useOutstatic()

  const handleLinkClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      if (onClick) {
        onClick(e)
      }

      if (hasChanges) {
        if (
          window.confirm(
            'You have unsaved changes. Are you sure you wish to leave this page?'
          )
        ) {
          setHasChanges(false)
          nextRouter.push(href.toString())
        }
      } else {
        nextRouter.push(href.toString())
      }
    },
    [hasChanges, onClick, setHasChanges, nextRouter, href]
  )

  return (
    <NextLink href={href} onClick={handleLinkClick} {...nextLinkProps}>
      {children}
    </NextLink>
  )
}

export default Link
