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
import { NavigationConfigSchema } from './navigation-config.schema'
import { z } from 'zod'

export type SidebarConfig = z.infer<typeof NavigationConfigSchema>

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

                <If condition={item.badge}>
                  <SidebarMenuBadge>
                    {item.badge}
                  </SidebarMenuBadge>
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

                          if ('dialog' in child && child.dialog) {
                            return (
                              <SidebarMenuButton tooltip={child.label}>
                                {child.dialog}
                              </SidebarMenuButton>
                            )
                          }

                          const path = 'path' in child ? child.path : ''
                          const newTab = 'newTab' in child ? child.newTab : false
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
                                target={newTab ? '_blank' : '_self'}
                                rel={newTab ? 'noopener noreferrer' : undefined}
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
                                      {children.map((child) => {
                                        const isActive = isRouteActive(
                                          child.path,
                                          currentPath,
                                          child.end
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
                                          <SidebarMenuSubItem key={child.path}>
                                            <SidebarMenuSubButton
                                              isActive={isActive}
                                              asChild
                                            >
                                              <Link
                                                className={linkClassName}
                                                href={child.path}
                                              >
                                                {child.Icon}

                                                <span className={spanClassName}>
                                                  {child.label}
                                                </span>
                                              </Link>
                                            </SidebarMenuSubButton>
                                          </SidebarMenuSubItem>
                                        )
                                      })}
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
                      })}
                    </ContentContainer>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <If condition={!open && !isLast}>
                <SidebarSeparator />
              </If>
            </Container >
          )
        }
      })}
    </>
  )
}
