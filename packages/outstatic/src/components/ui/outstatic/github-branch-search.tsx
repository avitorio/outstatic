'use client'
import { SearchCombobox } from '@/components/ui/outstatic/search-combobox'
import { GET_BRANCHES } from '@/graphql/queries/branches'
import useOutstatic, { useLocalData } from '@/utils/hooks/useOutstatic'
import { queryClient } from '@/utils/react-query/queryClient'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { CommandItem } from '@/components/ui/shadcn/command'
import { CreateBranchDialog } from '@/components/ui/outstatic/create-branch-dialog'
import { PlusCircle } from 'lucide-react'
import { Button } from '../shadcn/button'

interface Branch {
  name: string
}

const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null
  return (...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

interface GitHubBranchSearchProps {
  variant?: React.ComponentProps<typeof Button>['variant']
  size?: React.ComponentProps<typeof Button>['size']
}

export const GitHubBranchSearch = ({
  variant = 'outline',
  size = 'default'
}: GitHubBranchSearchProps) => {
  const { setData, data } = useLocalData()
  const [query, setQuery] = useState('')
  const { repoOwner, repoSlug, repoBranch, dashboardRoute, gqlClient } =
    useOutstatic()
  const [suggestions, setSuggestions] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [value, setValue] = useState(repoBranch)
  const router = useRouter()
  const [showCreateBranchDialog, setShowCreateBranchDialog] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const fetchBranches = useCallback(
    (keyword: string) => {
      const debouncedFetch = debounce(async (kw: string) => {
        if (repoOwner && repoSlug && gqlClient) {
          setIsLoading(true)
          try {
            const variables = {
              owner: repoOwner,
              name: repoSlug,
              first: 10,
              query: kw
            }

            const response = await gqlClient.request(GET_BRANCHES, variables)

            const branches: Branch[] =
              response.repository?.refs?.nodes
                ?.filter((node): node is { name: string } => node !== null)
                .map((node) => ({
                  name: node.name
                })) ?? []

            // Check if repoBranch is in the response, if not add it
            if (
              repoBranch &&
              !branches.some((branch) => branch.name === repoBranch)
            ) {
              branches.unshift({ name: repoBranch })
            }

            setSuggestions(branches)
          } catch (error) {
            console.error(
              'There was a problem with the GraphQL operation:',
              error
            )
          } finally {
            setIsLoading(false)
          }
        }
      }, 300)
      debouncedFetch(keyword)
    },
    [repoOwner, repoSlug, gqlClient]
  )

  useEffect(() => {
    if (isOpen) {
      fetchBranches(query === repoBranch ? '' : query)
    }
  }, [query, isOpen])

  useEffect(() => {
    if (value && value !== repoBranch) {
      setData({ repoBranch: value })
      queryClient.invalidateQueries()
      router.push(dashboardRoute)
    }
  }, [value])

  useEffect(() => {
    if (repoOwner && repoSlug && repoBranch) {
      setValue(repoBranch)
      setQuery(repoBranch)
      setSuggestions([{ name: repoBranch }])
    }
  }, [data])

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
        disabled={!repoSlug || !repoOwner}
        selectPlaceholder="Select a branch"
        searchPlaceholder="Search for a branch. Ex: main"
        resultsPlaceholder="No branches found"
        loadingPlaceholder={size !== 'sm' ? 'loading...' : value}
        variant={variant}
        size={size}
        scrollFooter={() => (
          <CommandItem
            key="create branch"
            value="create branch"
            className="rounded-t-none border border-t px-3 hover:cursor-pointer"
            onSelect={() => {
              setIsOpen(false)
              setIsLoading(true)
              setShowCreateBranchDialog(true)
            }}
          >
            <div className="flex gap-2 items-center">
              <PlusCircle className="h-4 w-4" />
              <span>Create a new branch</span>
            </div>
          </CommandItem>
        )}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
      <CreateBranchDialog
        showCreateBranchDialog={showCreateBranchDialog}
        setShowCreateBranchDialog={(value) => {
          setShowCreateBranchDialog(value)
          setIsLoading(value)
        }}
        callbackFunction={({ branchName }: { branchName: string }) => {
          setSuggestions([{ name: branchName }])
          setValue(branchName)
          setIsLoading(false)
        }}
      />
    </div>
  )
}
