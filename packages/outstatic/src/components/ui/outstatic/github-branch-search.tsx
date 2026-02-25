'use client'
import { SearchCombobox } from '@/components/ui/outstatic/search-combobox'
import { GET_BRANCHES } from '@/graphql/queries/branches'
import { useOutstatic, useLocalData } from '@/utils/hooks/use-outstatic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CreateBranchDialog } from '@/components/ui/outstatic/create-branch-dialog'
import { PlusCircle } from 'lucide-react'
import { Button } from '../shadcn/button'
import { useInitialData } from '@/utils/hooks/use-initial-data'
import { useQueryClient } from '@tanstack/react-query'
import { useDebouncedCallback } from 'use-debounce'

interface Branch {
  name: string
}

interface GitHubBranchSearchProps {
  variant?: React.ComponentProps<typeof Button>['variant']
  size?: React.ComponentProps<typeof Button>['size']
  onboarding?: boolean
}

export const GitHubBranchSearch = ({
  variant = 'outline',
  size = 'default',
  onboarding = false
}: GitHubBranchSearchProps) => {
  const queryClient = useQueryClient()
  const { setData } = useLocalData()
  const [query, setQuery] = useState('')
  const { repoBranch: initialRepoBranch } = useInitialData()
  const { repoOwner, repoSlug, repoBranch, gqlClient, session } = useOutstatic()
  const [suggestions, setSuggestions] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [value, setValue] = useState('')
  const [showCreateBranchDialog, setShowCreateBranchDialog] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const latestRequestIdRef = useRef(0)
  const repoStateRef = useRef({ repoOwner, repoSlug, repoBranch, gqlClient })

  useEffect(() => {
    repoStateRef.current = { repoOwner, repoSlug, repoBranch, gqlClient }
  }, [repoOwner, repoSlug, repoBranch, gqlClient])

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchBranches = useCallback(
    async (keyword: string, requestId: number) => {
      const { repoOwner, repoSlug, repoBranch, gqlClient } = repoStateRef.current

      if (!repoOwner || !repoSlug || !gqlClient) {
        if (requestId === latestRequestIdRef.current) {
          setSuggestions(repoBranch ? [{ name: repoBranch }] : [])
          setIsLoading(false)
        }
        return
      }

      try {
        const variables = {
          owner: repoOwner,
          name: repoSlug,
          first: 10,
          query: keyword
        }

        const response = await gqlClient.request(GET_BRANCHES, variables)

        if (requestId !== latestRequestIdRef.current) return

        const branches: Branch[] =
          response.repository?.refs?.nodes
            ?.filter((node): node is { name: string } => node !== null)
            .map((node) => ({
              name: node.name
            })) ?? []

        // Keep current branch selectable even if GraphQL search does not return it.
        if (repoBranch && !branches.some((branch) => branch.name === repoBranch)) {
          branches.unshift({ name: repoBranch })
        }

        setSuggestions(branches)
      } catch (error) {
        if (requestId === latestRequestIdRef.current) {
          setSuggestions(repoBranch ? [{ name: repoBranch }] : [])
        }
        console.error('There was a problem with the GraphQL operation:', error)
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setIsLoading(false)
        }
      }
    },
    []
  )

  const debouncedFetchBranches = useDebouncedCallback(fetchBranches, 300)

  useEffect(() => {
    if (isOpen) {
      const requestId = latestRequestIdRef.current + 1
      latestRequestIdRef.current = requestId
      setIsLoading(true)
      debouncedFetchBranches(query === repoBranch ? '' : query, requestId)
    } else {
      latestRequestIdRef.current += 1
      debouncedFetchBranches.cancel()
      setIsLoading(false)
    }

    return () => debouncedFetchBranches.cancel()
  }, [query, isOpen, repoBranch, debouncedFetchBranches])

  useEffect(() => {
    if (value && value !== repoBranch) {
      setData({ repoBranch: value })
      queryClient.invalidateQueries()
    }
  }, [value, repoBranch, setData, queryClient])

  useEffect(() => {
    if (mounted && repoOwner && repoSlug && repoBranch) {
      setValue(repoBranch)
      setQuery(repoBranch)
      setSuggestions([{ name: repoBranch }])
    }
  }, [mounted, repoOwner, repoSlug, repoBranch])

  if (!mounted) {
    return (
      <div>
        <SearchCombobox
          data={[]}
          value=""
          setValue={() => {}}
          onValueChange={() => {}}
          isLoading={false}
          disabled={true}
          selectPlaceholder="Select a branch"
          searchPlaceholder="Search for a branch. Ex: main"
          resultsPlaceholder="No branches found"
          loadingPlaceholder={size !== 'sm' ? 'loading...' : ''}
          variant={initialRepoBranch ? 'hidden' : variant}
          size={size}
          isOpen={false}
          onOpenChange={() => {}}
        />
      </div>
    )
  }

  return (
    <div>
      <SearchCombobox
        data={suggestions.map((branch) => ({
          value: branch.name,
          label: branch.name
        }))}
        value={value}
        setValue={setValue}
        onValueChange={setQuery}
        isLoading={isLoading}
        disabled={!repoSlug || !repoOwner || !!initialRepoBranch}
        selectPlaceholder="Select a branch"
        searchPlaceholder="Search for a branch. Ex: main"
        resultsPlaceholder="No branches found"
        loadingPlaceholder={size !== 'sm' ? 'loading...' : value}
        variant={initialRepoBranch ? 'hidden' : variant}
        size={size}
        scrollFooter={() =>
          session?.user?.permissions?.includes('projects.manage') && (
            <div
              className="rounded-t-none border border-t px-3 hover:cursor-pointer relative flex cursor-default select-none items-center rounded-sm py-1.5 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                setIsOpen(false)
                setIsLoading(true)
                setShowCreateBranchDialog(true)
              }}
            >
              <div className="flex gap-2 items-center">
                {query !== repoBranch &&
                query !== '' &&
                !suggestions.some((branch) => branch.name === query) ? (
                  <span className="grow font-normal break-words">
                    <PlusCircle className="mr-2 h-4 w-4 min-w-[1rem] inline-block select-none align-text-bottom overflow-visible" />
                    <span>Create branch&nbsp;</span>
                    <span className="font-semibold">{query}</span> from{' '}
                    <span className="font-semibold">{repoBranch}</span>
                  </span>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4 min-w-[1rem] inline-block select-none align-text-bottom overflow-visible" />
                    <span>Create a new branch</span>
                  </>
                )}
              </div>
            </div>
          )
        }
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
      <CreateBranchDialog
        branchName={query !== repoBranch ? query : ''}
        showCreateBranchDialog={showCreateBranchDialog}
        setShowCreateBranchDialog={(value) => {
          setShowCreateBranchDialog(value)
          setIsLoading(value)
        }}
        callbackFunction={({ branchName }: { branchName: string }) => {
          if (onboarding) {
            const currentUrl = new URL(window.location.href)
            currentUrl.searchParams.set('confirmed', 'true')
            window.history.pushState({}, '', currentUrl)
          }

          setSuggestions([{ name: branchName }])
          setValue(branchName)
          setIsLoading(false)
        }}
      />
    </div>
  )
}
