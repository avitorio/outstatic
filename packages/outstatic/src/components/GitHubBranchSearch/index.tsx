'use client'
import { SearchCombobox } from '@/components/ui/outstatic/search-combobox'
import { GET_BRANCHES } from '@/graphql/queries/branches'
import { useCollections } from '@/utils/hooks/useCollections'
import { useInitialData } from '@/utils/hooks/useInitialData'
import useOutstatic, { useLocalData } from '@/utils/hooks/useOutstatic'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface Branch {
  name: string
}

const GitHubBranchSearch = () => {
  const initialData = useInitialData()
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

  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout | null = null
    return (...args: any[]) => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }

  const fetchBranches = useCallback(
    (keyword: string) => {
      const debouncedFetch = debounce(async (kw: string) => {
        setIsLoading(true)

        if (repoOwner && repoSlug && gqlClient) {
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
        data={
          !!initialData?.repoBranch
            ? [
                {
                  value: `${repoBranch}`,
                  label: `${repoBranch}`
                }
              ]
            : suggestions.map((branch) => ({
                value: branch.name,
                label: branch.name
              }))
        }
        value={!!initialData?.repoBranch ? `${repoBranch}` : value}
        setValue={setValue}
        onValueChange={setQuery}
        isLoading={isLoading}
        disabled={!!initialData?.repoBranch || !repoSlug || !repoOwner}
        selectPlaceholder="Select a branch"
        searchPlaceholder="Search for a branch. Ex: main"
        resultsPlaceholder="No branches found"
      />
    </div>
  )
}

export default GitHubBranchSearch
