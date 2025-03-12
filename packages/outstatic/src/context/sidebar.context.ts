import { createContext } from 'react'

const SidebarContext = createContext<{
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}>({
  collapsed: false,
  setCollapsed: (_) => _
})

export { SidebarContext }
