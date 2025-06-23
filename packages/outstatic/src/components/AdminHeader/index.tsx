import { useOstSession, useOstSignOut } from '@/utils/auth/hooks'
import {
  Menu,
  SlashIcon,
  MessageCircleQuestion,
  LogOut,
  Monitor,
  Moon,
  Sun
} from 'lucide-react'
import { memo, useEffect, useState } from 'react'
import { Button } from '@/components/ui/shadcn/button'
import { AppLogo } from '../ui/outstatic/app-logo'
import { cn } from '@/utils/ui'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { GitHubBranchSearch } from '@/components/ui/outstatic/github-branch-search'
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/shadcn/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/shadcn/dropdown-menu'
import { useTheme } from 'next-themes'
import Link from 'next/link'

type AdminHeaderProps = {
  name?: string | null | undefined
  email?: string | null | undefined
  image?: string | null | undefined
  status?: 'authenticated' | 'unauthenticated' | 'loading'
  toggleSidebar: () => void
}

const themes = [
  {
    icon: Monitor,
    name: 'system'
  },
  {
    icon: Moon,
    name: 'dark'
  },
  {
    icon: Sun,
    name: 'light'
  }
]

const AdminHeader = ({ toggleSidebar }: AdminHeaderProps) => {
  const { session, status } = useOstSession()
  const { repoOwner, repoSlug } = useOutstatic()
  const { signOut } = useOstSignOut()
  const [isMounted, setIsMounted] = useState(false)
  const { theme, setTheme } = useTheme()

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
                  <SlashIcon className="hidden md:flex w-4 text-foreground/20" />
                  <span className="hidden md:flex whitespace-nowrap text-sm font-medium lg:w-auto lg:max-w-fit justify-start truncate">
                    {repoOwner}
                  </span>
                  <SlashIcon className="hidden md:flex w-4 text-foreground/20" />
                  <span className="hidden md:flex whitespace-nowrap text-sm font-medium lg:w-auto lg:max-w-fit justify-start truncate">
                    {repoSlug}
                  </span>
                  <SlashIcon className="hidden md:flex w-4 text-foreground/20" />
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
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    className="relative flex shrink-0 overflow-hidden group-hover/trigger:border-background/50 rounded-md border border-transparent transition-colors mx-auto h-9 w-9 group-focus:ring-2"
                  >
                    <Avatar className="rounded-md">
                      <AvatarImage src={session?.user?.image || ''} />
                      <AvatarFallback>
                        {session?.user?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col justify-start truncate text-left text-xs">
                        <div className="text-muted-foreground">
                          Signed in as:
                        </div>
                        <div>
                          <span className="block truncate">
                            {session?.user?.email}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link
                        className="flex cursor-pointer items-center space-x-2"
                        href="https://outstatic.com/docs"
                      >
                        <MessageCircleQuestion className={'h-5'} />
                        <span>Documentation</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <div className="focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 flex cursor-pointer items-center space-x-2 flex cursor-pointer items-center space-x-2">
                          <Sun className={'h-5'} />
                          <span>Theme</span>
                        </div>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {themes.map((t) => (
                          <DropdownMenuItem
                            key={t.name}
                            onClick={() => setTheme(t.name)}
                            className={theme === t.name ? 'bg-accent' : ''}
                          >
                            <t.icon className={'h-5'} />
                            <span className="capitalize">{t.name}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={signOut}>
                      <div className="focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 flex cursor-pointer items-center space-x-2 flex cursor-pointer items-center space-x-2">
                        <LogOut className={'h-5'} />
                        <span>Sign out</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}

export default memo(AdminHeader)
