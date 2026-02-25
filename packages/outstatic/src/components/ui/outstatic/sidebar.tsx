'use client'

import React from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ChevronDown } from 'lucide-react'

import { cn, isRouteActive } from '@/utils/ui'
import { If } from './if'
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '../shadcn/sidebar'
import { SidebarGroupContent } from '../shadcn/sidebar'
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarSeparator,
  useSidebar
} from '../shadcn/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '../shadcn/collapsible'
import {
  NavigationConfigSchema,
  RouteChildType,
  RouteGroupType,
  RouteSubChildType
} from './navigation-config.schema'
import { z } from 'zod/v4'
import { useCollapsibleState } from '@/utils/hooks/use-collapsible-state'

export type SidebarConfig = z.infer<typeof NavigationConfigSchema>

function isExactRoute(path: string, currentPath: string) {
  const normalizedPath = (path.split('?')[0] || '').replace(/\/+$/, '') || '/'
  const normalizedCurrentPath = currentPath.replace(/\/+$/, '') || '/'

  return normalizedPath === normalizedCurrentPath
}

// Type guard to check if a child is a RouteGroup (has children but no path)
function isRouteGroup(child: unknown): child is {
  label: string
  children: unknown[]
  Icon?: React.ReactNode
  collapsible?: boolean
  collapsed?: boolean
  renderAction?: React.ReactNode
} {
  return (
    typeof child === 'object' &&
    child !== null &&
    'children' in child &&
    !('path' in child)
  )
}

// Type guard to check if a child is a RouteChild (has path)
function isRouteChild(child: unknown): child is {
  label: string
  path: string
  Icon?: React.ReactNode
  end?: boolean | ((input: string) => boolean)
  renderAction?: React.ReactNode
} {
  return typeof child === 'object' && child !== null && 'path' in child
}

// Recursive component for rendering sub-RouteGroups
function SubRouteGroup({
  group,
  currentPath,
  open,
  depth,
  parentKey
}: {
  group: {
    label: string
    children: unknown[]
    Icon?: React.ReactNode
    collapsible?: boolean
    collapsed?: boolean
    renderAction?: React.ReactNode
  }
  currentPath: string
  open: boolean
  depth: number
  parentKey: string
}) {
  const { isOpen, setOpen: setCollapsibleOpen } = useCollapsibleState()
  const collapsibleKey = `${parentKey}-${group.label}-${depth}`
  // Respect collapsed prop for initial state, but prefer persisted state
  const defaultGroupOpen =
    group.collapsed === undefined ? true : !group.collapsed
  const isCollapsibleOpen = group.collapsible
    ? (isOpen(collapsibleKey) ?? defaultGroupOpen)
    : true

  const Container = (props: React.PropsWithChildren) => {
    if (group.collapsible) {
      return (
        <Collapsible
          open={isCollapsibleOpen}
          onOpenChange={(open) => setCollapsibleOpen(collapsibleKey, open)}
          className={'group/collapsible'}
        >
          {props.children}
        </Collapsible>
      )
    }
    return props.children
  }

  const ContentContainer = (props: React.PropsWithChildren) => {
    if (group.collapsible) {
      return <CollapsibleContent>{props.children}</CollapsibleContent>
    }
    return props.children
  }

  const linkClassName = cn('flex items-center', {
    'mx-auto w-full gap-0! [&>svg]:flex-1': !open
  })

  const spanClassName = cn('w-auto transition-opacity duration-300', {
    'w-0 opacity-0': !open
  })

  return (
    // eslint-disable-next-line react-hooks/static-components
    <Container>
      <SidebarMenuSubItem>
        <If
          condition={group.collapsible}
          fallback={
            <SidebarMenuSubButton asChild={false}>
              <div className={linkClassName}>
                {group.Icon}
                <span className={spanClassName}>{group.label}</span>
              </div>
            </SidebarMenuSubButton>
          }
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuSubButton asChild={false}>
              <div className={linkClassName}>
                {group.Icon}
                <span className={spanClassName}>{group.label}</span>
                <ChevronDown
                  className={cn(
                    'ml-auto size-3 transition-transform group-data-[state=open]/collapsible:rotate-180',
                    { 'hidden size-0': !open }
                  )}
                />
              </div>
            </SidebarMenuSubButton>
          </CollapsibleTrigger>
        </If>

        {/* eslint-disable-next-line react-hooks/static-components */}
        <ContentContainer>
          <SidebarMenuSub
            className={cn({
              'mx-0 px-1.5': !open
            })}
          >
            {group.children.map((child, childIndex) => {
              // Recursively render sub-RouteGroups
              if (isRouteGroup(child)) {
                return (
                  <SubRouteGroup
                    key={`sub-group-${depth}-${childIndex}`}
                    group={child}
                    currentPath={currentPath}
                    open={open}
                    depth={depth + 1}
                    parentKey={parentKey}
                  />
                )
              }

              // Render RouteChild items
              if (isRouteChild(child)) {
                const isActive = isRouteActive(
                  child.path,
                  currentPath,
                  child.end
                )
                const isCurrentRoute = isExactRoute(child.path, currentPath)

                return (
                  <SidebarMenuSubItem key={child.path}>
                    <SidebarMenuSubButton isActive={isActive} asChild>
                      <Link
                        className={cn(linkClassName, {
                          'pointer-events-none': isCurrentRoute
                        })}
                        href={child.path}
                      >
                        {child.Icon}
                        <span className={spanClassName}>{child.label}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )
              }

              return null
            })}
          </SidebarMenuSub>
        </ContentContainer>
      </SidebarMenuSubItem>
    </Container>
  )
}

export function SidebarNavigation({
  config
}: React.PropsWithChildren<{
  config: SidebarConfig
}>) {
  const currentPath = usePathname() ?? ''
  const { open } = useSidebar()
  const { isOpen, setOpen: setCollapsibleOpen } = useCollapsibleState()

  return (
    <>
      {config.routes.map((item, index) => {
        const isLast = index === config.routes.length - 1

        if ('divider' in item) {
          return <SidebarSeparator key={`divider-${index}`} />
        }

        if ('children' in item) {
          const itemKey = item.label
          // Respect collapsed prop for initial state, but prefer persisted state
          const defaultOpen =
            item.collapsed === undefined ? true : !item.collapsed
          const isItemOpen = item.collapsible
            ? (isOpen(itemKey) ?? defaultOpen)
            : true

          const Container = (props: React.PropsWithChildren) => {
            if (item.collapsible) {
              return (
                <Collapsible
                  open={isItemOpen}
                  onOpenChange={(open) => setCollapsibleOpen(itemKey, open)}
                  className={'group/collapsible'}
                >
                  {props.children}
                </Collapsible>
              )
            }

            return props.children
          }

          const ContentContainer = (props: React.PropsWithChildren) => {
            if (item.collapsible) {
              return <CollapsibleContent>{props.children}</CollapsibleContent>
            }

            return props.children
          }

          return (
            <Container key={`collapsible-${index}`}>
              <SidebarGroup key={item.label}>
                <If
                  condition={item.collapsible}
                  fallback={
                    <SidebarGroupLabel className={cn({ hidden: !open })}>
                      {item.label}
                    </SidebarGroupLabel>
                  }
                >
                  <SidebarGroupLabel className={cn({ hidden: !open })} asChild>
                    <CollapsibleTrigger>
                      {item.label}
                      <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                </If>

                <If condition={item.renderAction}>
                  <SidebarGroupAction title={item.label}>
                    {item.renderAction}
                  </SidebarGroupAction>
                </If>

                <If condition={item.badge}>
                  <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                </If>

                <SidebarGroupContent>
                  <SidebarMenu>
                    <ContentContainer>
                      {item.children.map(
                        (
                          child: RouteChildType | RouteGroupType,
                          childIndex: number
                        ) => {
                          const childKey = `${itemKey}-${child.label}`
                          // Respect collapsed prop for initial state, but prefer persisted state
                          const defaultChildOpen =
                            'collapsed' in child &&
                            child.collapsed !== undefined
                              ? !child.collapsed
                              : true
                          const isChildOpen =
                            'collapsible' in child && child.collapsible
                              ? (isOpen(childKey) ?? defaultChildOpen)
                              : true

                          const Container = (
                            props: React.PropsWithChildren
                          ) => {
                            if ('collapsible' in child && child.collapsible) {
                              return (
                                <Collapsible
                                  open={isChildOpen}
                                  onOpenChange={(open) =>
                                    setCollapsibleOpen(childKey, open)
                                  }
                                  className={'group/collapsible'}
                                >
                                  {props.children}
                                </Collapsible>
                              )
                            }

                            return props.children
                          }

                          const ContentContainer = (
                            props: React.PropsWithChildren
                          ) => {
                            if ('collapsible' in child && child.collapsible) {
                              return (
                                <CollapsibleContent>
                                  {props.children}
                                </CollapsibleContent>
                              )
                            }

                            return props.children
                          }

                          const TriggerItem = () => {
                            if ('collapsible' in child && child.collapsible) {
                              return (
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuButton
                                    tooltip={child.label}
                                    className="group/sub-menu-item"
                                  >
                                    <div
                                      className={cn('flex items-center gap-2', {
                                        'mx-auto w-full gap-0 [&>svg]:flex-1 [&>svg]:shrink-0':
                                          !open
                                      })}
                                    >
                                      {child.Icon}
                                      <span
                                        className={cn(
                                          'transition-width w-auto transition-opacity duration-500',
                                          {
                                            'w-0 opacity-0': !open
                                          }
                                        )}
                                      >
                                        {child.label}
                                      </span>

                                      <ChevronDown
                                        className={cn(
                                          'ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180',
                                          {
                                            'hidden size-0': !open
                                          }
                                        )}
                                      />

                                      <If condition={item.renderAction}>
                                        <SidebarGroupAction title={item.label}>
                                          {item.renderAction}
                                        </SidebarGroupAction>
                                      </If>
                                    </div>
                                  </SidebarMenuButton>
                                </CollapsibleTrigger>
                              )
                            }

                            if ('dialog' in child && child.dialog) {
                              return (
                                <SidebarMenuButton tooltip={child.label}>
                                  {child.dialog}
                                </SidebarMenuButton>
                              )
                            }

                            const path = 'path' in child ? child.path : ''
                            const newTab =
                              'newTab' in child ? child.newTab : false
                            const end = 'end' in child ? child.end : false

                            const isActive = isRouteActive(
                              path,
                              currentPath,
                              end
                            )
                            const isCurrentRoute = isExactRoute(
                              path,
                              currentPath
                            )

                            return (
                              <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={child.label}
                              >
                                <Link
                                  className={cn('flex items-center', {
                                    'mx-auto w-full gap-0! [&>svg]:flex-1':
                                      !open,
                                    'pointer-events-none': isCurrentRoute
                                  })}
                                  href={path}
                                  target={newTab ? '_blank' : '_self'}
                                  rel={
                                    newTab ? 'noopener noreferrer' : undefined
                                  }
                                >
                                  {child.Icon}
                                  <span
                                    className={cn(
                                      'w-auto transition-opacity duration-300',
                                      {
                                        'w-0 opacity-0': !open
                                      }
                                    )}
                                  >
                                    {child.label}
                                  </span>
                                </Link>
                              </SidebarMenuButton>
                            )
                          }

                          return (
                            <Container key={`group-${index}-${childIndex}`}>
                              <SidebarMenuItem>
                                <TriggerItem />

                                <ContentContainer>
                                  <If condition={child.children}>
                                    {(children) => (
                                      <SidebarMenuSub
                                        className={cn({
                                          'mx-0 px-1.5': !open
                                        })}
                                      >
                                        {children.map(
                                          (
                                            subChild:
                                              | RouteSubChildType
                                              | RouteGroupType,
                                            subChildIndex: number
                                          ) => {
                                            // Check if this is a sub-RouteGroup
                                            if (isRouteGroup(subChild)) {
                                              return (
                                                <SubRouteGroup
                                                  key={`sub-group-${subChildIndex}`}
                                                  group={subChild}
                                                  currentPath={currentPath}
                                                  open={open}
                                                  depth={1}
                                                  parentKey={childKey}
                                                />
                                              )
                                            }

                                            const isActive = isRouteActive(
                                              subChild.path,
                                              currentPath,
                                              subChild.end
                                            )
                                            const isCurrentRoute =
                                              isExactRoute(
                                                subChild.path,
                                                currentPath
                                              )

                                            const linkClassName = cn(
                                              'flex items-center',
                                              {
                                                'mx-auto w-full gap-0! [&>svg]:flex-1':
                                                  !open
                                              }
                                            )

                                            const spanClassName = cn(
                                              'w-auto transition-opacity duration-300',
                                              {
                                                'w-0 opacity-0': !open
                                              }
                                            )

                                            return (
                                              <SidebarMenuSubItem
                                                key={subChild.path}
                                                className="group/sub-menu-item"
                                              >
                                                <SidebarMenuSubButton
                                                  isActive={isActive}
                                                  asChild
                                                >
                                                  <Link
                                                    className={cn(
                                                      linkClassName,
                                                      {
                                                        'pointer-events-none':
                                                          isCurrentRoute
                                                      }
                                                    )}
                                                    href={subChild.path}
                                                  >
                                                    {subChild.Icon}

                                                    <span
                                                      className={spanClassName}
                                                    >
                                                      {subChild.label}
                                                    </span>
                                                  </Link>
                                                </SidebarMenuSubButton>
                                                <If
                                                  condition={
                                                    subChild.renderAction
                                                  }
                                                >
                                                  <SidebarMenuAction>
                                                    {subChild.renderAction}
                                                  </SidebarMenuAction>
                                                </If>
                                              </SidebarMenuSubItem>
                                            )
                                          }
                                        )}
                                      </SidebarMenuSub>
                                    )}
                                  </If>
                                </ContentContainer>

                                <If condition={child.renderAction}>
                                  <SidebarMenuAction>
                                    {child.renderAction}
                                  </SidebarMenuAction>
                                </If>
                                <If condition={child.badge}>
                                  <SidebarMenuBadge>
                                    {child.badge}
                                  </SidebarMenuBadge>
                                </If>
                              </SidebarMenuItem>
                            </Container>
                          )
                        }
                      )}
                    </ContentContainer>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <If condition={!open && !isLast}>
                <SidebarSeparator />
              </If>
            </Container>
          )
        }
      })}
    </>
  )
}
