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
import { usePathname, useRouter } from 'next/navigation'
import { DocsMenu } from './docs-menu'

type MobileMenuProps = {
  content: string
  hideVersionSelect?: boolean
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

      // eslint-disable-next-line react-hooks/set-state-in-effect
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
              <div className="max-h-[calc(70vh-100px)] max-w-full overflow-y-auto px-1 pr-2">
                <DocsMenu
                  content={content}
                  onNavigate={() => {
                    setOpen(false)
                  }}
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
