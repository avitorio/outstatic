import { useOstSession, useOstSignOut } from '@/utils/auth/hooks'
import { Menu, SlashIcon } from 'lucide-react'
import { memo, useEffect, useState } from 'react'
import { Button } from '@/components/ui/shadcn/button'
import { AppLogo } from '../ui/outstatic/app-logo'
import { cn } from '@/utils/ui'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { GitHubBranchSearch } from '@/components/ui/outstatic/github-branch-search'

type AdminHeaderProps = {
  name?: string | null | undefined
  email?: string | null | undefined
  image?: string | null | undefined
  status?: 'authenticated' | 'unauthenticated' | 'loading'
  toggleSidebar: () => void
}

const AdminHeader = ({ toggleSidebar }: AdminHeaderProps) => {
  const { session, status } = useOstSession()
  const { repoOwner, repoSlug } = useOutstatic()
  const [isOpen, setIsOpen] = useState(false)
  const { signOut } = useOstSignOut()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // avoid hydration error
    setIsMounted(true)
  }, [])

  return (
    <>
      <nav
        className={cn(
          'flex h-14 items-center justify-between border-b border-gray-200 bg-background px-4 dark:border-border dark:bg-background dark:shadow-primary/10 lg:justify-start'
        )}
      >
        <div className={'flex w-full flex-1 items-center space-x-8'}>
          <div className={'flex w-full flex-1 justify-between'}>
            <Button
              variant="ghost"
              size="icon"
              className="flex lg:hidden items-center justify-center"
              data-collapse-toggle="mobile-menu-2"
              type="button"
              aria-controls="mobile-menu-2"
              aria-expanded="false"
              onClick={toggleSidebar}
            >
              <span className="sr-only">Open main menu</span>
              <Menu />
            </Button>

            <div className={'flex items-center space-x-4'}>
              <AppLogo />
              {isMounted && repoOwner && repoSlug && (
                <>
                  <SlashIcon className="w-4 text-foreground/20" />
                  <span className="whitespace-nowrap text-sm font-medium lg:w-auto lg:max-w-fit justify-start truncate">
                    {repoOwner}
                  </span>
                  <SlashIcon className="w-4 text-foreground/20" />
                  <span className="whitespace-nowrap text-sm font-medium lg:w-auto lg:max-w-fit justify-start truncate">
                    {repoSlug}
                  </span>
                  <SlashIcon className="w-4 text-foreground/20" />
                  <span className="whitespace-nowrap text-sm font-medium lg:w-auto lg:max-w-fit justify-start truncate">
                    <GitHubBranchSearch variant="ghost" size="sm" />
                  </span>
                </>
              )}
            </div>
            {status === 'loading' ? (
              <div className="flex items-center md:order-2" />
            ) : (
              <div className="flex items-center md:order-2">
                <button
                  type="button"
                  className="mr-3 flex items-center rounded-full bg-muted text-sm focus:ring-4 focus:ring-muted md:mr-0"
                  id="user-menu-button"
                  aria-expanded="false"
                  data-dropdown-toggle="dropdown"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="h-8 w-8 rounded-full"
                    src={session?.user?.image || ''}
                    alt="user"
                  />
                </button>
                <div
                  className={`right-0 top-[60px] z-50 my-4 w-full list-none divide-y divide-muted rounded-br rounded-bl bg-background text-base shadow md:-right-0 md:top-[52px] md:w-auto border border-muted ${
                    isOpen ? 'block' : 'hidden'
                  }`}
                  id="dropdown"
                  style={{
                    position: 'absolute',
                    margin: '0px'
                  }}
                >
                  <div className="py-3 px-4">
                    <span className="block text-sm text-foreground">
                      {session?.user?.name}
                    </span>
                    <span className="block truncate text-sm font-medium text-foreground">
                      {session?.user?.email}
                    </span>
                  </div>
                  <ul className="py-1" aria-labelledby="dropdown">
                    <li>
                      <a
                        className="block cursor-pointer py-2 px-4 text-sm text-foreground hover:bg-muted"
                        onClick={signOut}
                      >
                        Sign out
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}

export default memo(AdminHeader)
