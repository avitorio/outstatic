'use client'
import { SearchCombobox } from '@/components/ui/outstatic/search-combobox'
import { GET_BRANCHES } from '@/graphql/queries/branches'
import { useCollections } from '@/utils/hooks/useCollections'
import useOutstatic, { useLocalData } from '@/utils/hooks/useOutstatic'
import { queryClient } from '@/utils/react-query/queryClient'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { CommandItem } from '../ui/shadcn/command'
import CreateBranchDialog from '../ui/outstatic/create-branch-dialog'
import { PlusCircle } from 'lucide-react'

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

const GitHubBranchSearch = () => {
  const { setData } = useLocalData()
  const [query, setQuery] = useState('')
  const { repoOwner, repoSlug, repoBranch, dashboardRoute, gqlClient } =
    useOutstatic()
  const initialSuggestion = repoBranch
    ? [{ name: repoBranch }]
    : [{ name: 'main' }]
  const [suggestions, setSuggestions] = useState<Branch[]>(initialSuggestion)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [value, setValue] = useState(repoBranch)
  const { refetch } = useCollections()
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
              first: 100,
              query: kw
            }

            const response = await gqlClient.request(GET_BRANCHES, variables)

            const branches: Branch[] =
              response.repository?.refs?.nodes
                ?.filter((node): node is { name: string } => node !== null)
                .map((node) => ({
                  name: node.name
                })) ?? []

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
    fetchBranches(query)
  }, [query])

  useEffect(() => {
    if (value) {
      setData({ repoBranch: value })

      if (value !== repoBranch) {
        const getCollections = async () => {
          queryClient.invalidateQueries()
          const { data } = await refetch()

          if (data === null) {
            router.push(dashboardRoute)
          }
        }
        getCollections()
      }
    }
  }, [value])

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

export default GitHubBranchSearch
