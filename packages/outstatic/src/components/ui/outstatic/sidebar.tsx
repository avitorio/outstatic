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
import { NavigationConfigSchema } from './navigation-config.schema'
import { z } from 'zod/v4'

export type SidebarConfig = z.infer<typeof NavigationConfigSchema>

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
  depth
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
}) {
  const Container = (props: React.PropsWithChildren) => {
    if (group.collapsible) {
      return (
        <Collapsible
          defaultOpen={!group.collapsed}
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

                return (
                  <SidebarMenuSubItem key={child.path}>
                    <SidebarMenuSubButton isActive={isActive} asChild>
                      <Link className={linkClassName} href={child.path}>
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

  return (
    <>
      {config.routes.map((item, index) => {
        const isLast = index === config.routes.length - 1

        if ('divider' in item) {
          return <SidebarSeparator key={`divider-${index}`} />
        }

        if ('children' in item) {
          const Container = (props: React.PropsWithChildren) => {
            if (item.collapsible) {
              return (
                <Collapsible
                  defaultOpen={!item.collapsed}
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

                <SidebarGroupContent>
                  <SidebarMenu>
                    <ContentContainer>
                      {item.children.map((child, childIndex) => {
                        const Container = (props: React.PropsWithChildren) => {
                          if ('collapsible' in child && child.collapsible) {
                            return (
                              <Collapsible
                                defaultOpen={!child.collapsed}
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
                                <SidebarMenuButton tooltip={child.label}>
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
                                  </div>
                                </SidebarMenuButton>
                              </CollapsibleTrigger>
                            )
                          }

                          const path = 'path' in child ? child.path : ''
                          const end = 'end' in child ? child.end : false

                          const isActive = isRouteActive(path, currentPath, end)

                          return (
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              tooltip={child.label}
                            >
                              <Link
                                className={cn('flex items-center', {
                                  'mx-auto w-full gap-0! [&>svg]:flex-1': !open
                                })}
                                href={path}
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
                                        (subChild, subChildIndex) => {
                                          // Check if this is a sub-RouteGroup
                                          if (isRouteGroup(subChild)) {
                                            return (
                                              <SubRouteGroup
                                                key={`sub-group-${subChildIndex}`}
                                                group={subChild}
                                                currentPath={currentPath}
                                                open={open}
                                                depth={1}
                                              />
                                            )
                                          }

                                          const isActive = isRouteActive(
                                            subChild.path,
                                            currentPath,
                                            subChild.end
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
                                                  className={linkClassName}
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
                                              <If condition={subChild.renderAction}>
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
                            </SidebarMenuItem>
                          </Container>
                        )
                      })}
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
