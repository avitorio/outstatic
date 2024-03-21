'use client'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger
} from '@/components/ui/drawer'
import { Menu, XIcon } from 'lucide-react'
import { useState } from 'react'
// import { ThemeToggle } from './theme-toggle'
import useHash from '@/hooks/useHash'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CustomLinkProps } from './mdx/custom-link'
import MDXComponent from './mdx/mdx-component'
import SocialLinks from './social-links'
import { ThemeToggle } from './theme-toggle'
import { Button } from './ui/button'

type MobileMenuProps = {
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
      className={`border border-secondary font-normal -ml-2 block rounded-md px-2 py-1 no-underline hover:bg-secondary hover:text-secondary-foreground ${className}${
        `${pathname}${hash || ''}` === href
          ? 'bg-secondary text-foreground'
          : ' text-foreground '
      }`}
      {...rest}
    >
      {children}
    </Link>
  )
}

export const MobileMenu = ({ content }: MobileMenuProps) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="py-4 fixed bottom-0 border-t border-secondary w-full z-20 bg-background lg:hidden">
      <div className="px-4">
        <Drawer open={open} onOpenChange={setOpen}>
          <div className="flex justify-between">
            <SocialLinks />
            <DrawerTrigger>
              <div className="p-2">
                <Menu aria-label="open menu" />
              </div>
            </DrawerTrigger>
          </div>
          <DrawerContent>
            <div className="sidebar overflow-x-scroll">
              <div className="prose prose-sm max-h-[calc(70vh-100px)] max-w-full overflow-y-scroll px-2 pr-4">
                <MDXComponent
                  content={content}
                  components={{ a: SidebarLink, p: Paragraph }}
                />
              </div>
            </div>
            <DrawerFooter>
              <div className="w-full justify-end flex gap-4">
                <ThemeToggle variant="outline" size="default" />
                <Button asChild variant="outline">
                  <DrawerClose>
                    <XIcon />
                  </DrawerClose>
                </Button>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
