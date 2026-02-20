'use client'

import useHash from '@/hooks/useHash'
import { VERSIONS } from '@/lib/constants'
import { type DocsMenuItem, parseMenuMarkdown } from '@/lib/menu'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode, useMemo, useState } from 'react'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from './ui/sidebar'

type MenuGroup = {
  title: string
  items: DocsMenuItem[]
}

type DocsMenuProps = {
  content: string
  className?: string
  onNavigate?: () => void
}

const DEFAULT_GROUP_LABEL = 'Documentation'

const toKey = (value: string) => {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return normalized.replace(/^-+|-+$/g, '') || 'section'
}

const normalizeMenuGroups = (items: DocsMenuItem[]) => {
  const groups: MenuGroup[] = []
  const defaultGroupItems: DocsMenuItem[] = []

  items.forEach((item) => {
    if (!item.href && item.items.length > 0) {
      groups.push({ title: item.title, items: item.items })
      return
    }

    defaultGroupItems.push(item)
  })

  if (defaultGroupItems.length > 0) {
    groups.unshift({
      title: DEFAULT_GROUP_LABEL,
      items: defaultGroupItems
    })
  }

  return groups
}

export const DocsMenu = ({ content, className = '', onNavigate }: DocsMenuProps) => {
  const pathname = usePathname()
  const hash = useHash()
  const items = useMemo(() => parseMenuMarkdown(content), [content])
  const groups = useMemo(() => normalizeMenuGroups(items), [items])
  const versionPrefix = useMemo(() => {
    const activeVersion = VERSIONS.find(
      (version) => version.path !== '/' && pathname.startsWith(version.path)
    )

    return activeVersion?.path ?? ''
  }, [pathname])

  const resolveHref = (href?: string) => {
    if (!href || !href.startsWith('/')) {
      return href ?? ''
    }

    if (!versionPrefix) {
      return href
    }

    if (href === versionPrefix || href.startsWith(`${versionPrefix}/`)) {
      return href
    }

    return `${versionPrefix}${href}`
  }

  const isActiveHref = (href?: string) => {
    if (!href) {
      return false
    }

    return `${pathname}${hash || ''}` === resolveHref(href)
  }

  const itemHasActiveDescendant = (item: DocsMenuItem): boolean => {
    if (item.href && isActiveHref(item.href)) {
      return true
    }

    return item.items.some(itemHasActiveDescendant)
  }

  const groupHasActiveItem = (group: MenuGroup) => {
    return group.items.some(itemHasActiveDescendant)
  }

  const [groupVisibility, setGroupVisibility] = useState<Record<string, boolean>>({})

  const renderItems = (menuItems: DocsMenuItem[], depth = 0): ReactNode => {
    if (depth === 0) {
      return (
        <SidebarMenu>
          {menuItems.map((item, index) => (
            <SidebarMenuItem key={`${item.title}-${item.href ?? 'group'}-${index}`}>
              {item.href ? (
                <SidebarMenuButton asChild isActive={isActiveHref(item.href)}>
                  <Link
                    href={resolveHref(item.href)}
                    onClick={() => {
                      onNavigate?.()
                    }}
                  >
                    {item.title}
                  </Link>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  aria-label={item.title}
                  disabled
                  className="cursor-default text-sidebar-foreground/70 opacity-100"
                >
                  {item.title}
                </SidebarMenuButton>
              )}
              {item.items.length > 0 ? renderItems(item.items, depth + 1) : null}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      )
    }

    return (
      <SidebarMenuSub>
        {menuItems.map((item, index) => (
          <SidebarMenuSubItem key={`${item.title}-${item.href ?? depth}-${index}`}>
            {item.href ? (
              <SidebarMenuSubButton asChild isActive={isActiveHref(item.href)}>
                <Link
                  href={resolveHref(item.href)}
                  onClick={() => {
                    onNavigate?.()
                  }}
                >
                  {item.title}
                </Link>
              </SidebarMenuSubButton>
            ) : (
              <p className="text-sidebar-foreground/70 px-2 py-1 text-xs font-semibold uppercase tracking-wide">
                {item.title}
              </p>
            )}
            {item.items.length > 0 ? renderItems(item.items, depth + 1) : null}
          </SidebarMenuSubItem>
        ))}
      </SidebarMenuSub>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      {groups.map((group, index) => {
        const groupKey = `${index}-${toKey(group.title)}`
        const scopedGroupKey = `${pathname}:${groupKey}`
        const isOpen = groupVisibility[scopedGroupKey] ?? groupHasActiveItem(group)

        return (
          <SidebarGroup key={groupKey}>
            <SidebarGroupLabel className="h-auto px-0">
              <button
                type="button"
                onClick={() => {
                  setGroupVisibility((currentGroups) => ({
                    ...currentGroups,
                    [scopedGroupKey]: !isOpen
                  }))
                }}
                className="text-sidebar-foreground/70 hover:text-sidebar-foreground flex w-full items-center gap-1 rounded-md px-2 py-1 text-left text-xs font-semibold uppercase tracking-wide"
                aria-expanded={isOpen}
                aria-controls={`docs-menu-group-${groupKey}`}
              >
                <ChevronRight
                  className={cn('size-3 transition-transform', {
                    'rotate-90': isOpen
                  })}
                />
                <span>{group.title}</span>
              </button>
            </SidebarGroupLabel>
            {isOpen ? (
              <SidebarGroupContent id={`docs-menu-group-${groupKey}`}>
                {renderItems(group.items)}
              </SidebarGroupContent>
            ) : null}
          </SidebarGroup>
        )
      })}
    </div>
  )
}
