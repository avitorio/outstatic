'use client'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger
} from '@/components/ui/drawer'
import { Menu, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import useHash from '@/hooks/useHash'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CustomLinkProps } from './mdx/custom-link'
import MDXComponent from './mdx/mdx-component'
import SocialLinks from './social-links'
import { ThemeToggle } from './theme-toggle'
import { Button } from './ui/button'
import { VERSIONS } from '@/lib/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select'
import { useRouter } from 'next/navigation'

type MobileMenuProps = {
  content: string
  hideVersionSelect?: boolean
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

  const isVersionPath = VERSIONS.some(
    (v) => pathname.startsWith(`${v.path}`) && v.path !== '/'
  )

  if (isVersionPath) {
    const version = pathname.split('/')[1]
    href = `/${version}${href}`
  }

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

export const MobileMenu = ({
  content,
  hideVersionSelect = false
}: MobileMenuProps) => {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Add state to track current version
  const [currentVersion, setCurrentVersion] = useState('')

  // Update current version when pathname changes
  useEffect(() => {
    if (pathname && !hideVersionSelect) {
      const version = [...VERSIONS].reverse().find((version) => {
        return pathname?.startsWith(version.path)
      })

      setCurrentVersion(version?.value || VERSIONS[0].value)
    }
  }, [hideVersionSelect, pathname])

  return (
    <div className="py-4 fixed bottom-0 border-t border-secondary w-full z-20 bg-background lg:hidden">
      <div className="px-4">
        <Drawer open={open} onOpenChange={setOpen}>
          <div className="flex justify-between">
            {!hideVersionSelect ? (
              <div>
                <Select
                  value={currentVersion}
                  onValueChange={(value) => {
                    const version = VERSIONS.find((v) => v.value === value)
                    if (version) {
                      router.push(version.path)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={currentVersion}
                      defaultValue={currentVersion}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {VERSIONS.map((version) => (
                      <SelectItem key={version.value} value={version.value}>
                        {version.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
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
              <div className="flex w-full justify-between gap-4">
                <SocialLinks />
                <div className="flex gap-4">
                  <ThemeToggle variant="outline" size="default" />
                  <Button asChild variant="outline">
                    <DrawerClose>
                      <XIcon />
                    </DrawerClose>
                  </Button>
                </div>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
