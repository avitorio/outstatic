'use client'

import { DocsMenu } from './docs-menu'
import { Sidebar, SidebarContent } from './ui/sidebar'

export const SidebarNav = ({ content }: { content: string }) => {
  return (
    <Sidebar className="sticky top-16">
      <SidebarContent className="no-scrollbar py-3">
        <DocsMenu content={content} />
      </SidebarContent>
    </Sidebar>
  )
}
