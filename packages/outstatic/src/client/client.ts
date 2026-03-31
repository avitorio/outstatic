export { Main as Dashboard } from './pages' // for backward compatibility
export { AdminArea, OstClient } from './pages'
export { RootProvider } from './pages/_components/root-provider'
export { MediaSettings } from './pages/settings/_components/media-settings'
export { GitHubBranchSearch } from '@/components/ui/outstatic/github-branch-search'
export { Sidebar, SidebarProvider } from '@/components'
export { useLocalData } from '@/utils/hooks/use-outstatic'
export {
  useNavigationGuard,
  NavigationGuardProvider
} from 'next-navigation-guard'
