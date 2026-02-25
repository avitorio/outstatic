'use client'
import { SearchCombobox } from '@/components/ui/outstatic/search-combobox'
import { OUTSTATIC_API_PATH } from '@/utils/constants'
import { useInitialData } from '@/utils/hooks/use-initial-data'
import { useOutstatic, useLocalData } from '@/utils/hooks/use-outstatic'
import React, { useCallback, useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

interface RepositorySuggestion {
  full_name: string
  default_branch?: string
}

export const GitHubRepoSearch: React.FC = () => {
  const initialData = useInitialData()
  const { setData } = useLocalData()
  const { repoOwner, repoSlug, repoBranch, session } = useOutstatic()
  const repository = repoOwner && repoSlug ? `${repoOwner}/${repoSlug}` : ''
  const initialSuggestion: RepositorySuggestion[] = repository
    ? [{ full_name: repository, default_branch: repoBranch }]
    : []
  const [query, setQuery] = useState<string>('')
  const [suggestions, setSuggestions] =
    useState<RepositorySuggestion[]>(initialSuggestion)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [value, setValue] = React.useState(repository)
  const latestRequestIdRef = React.useRef(0)

  const fetchRepositories = useCallback(
    async (searchQuery: string, requestId: number) => {
      if (!searchQuery) {
        if (requestId === latestRequestIdRef.current) {
          setSuggestions([])
          setIsLoading(false)
        }
        return
      }
      try {
        const response = await fetch(
          `${OUTSTATIC_API_PATH}/github/search/repositories?q=${searchQuery}&per_page=100&timestamp=${Date.now()}`,
          {
            headers: new Headers({
              Authorization: `token ${session?.access_token}`
            })
          }
        )
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data = await response.json()

        if (requestId !== latestRequestIdRef.current) return

        const items = Array.isArray(data?.items) ? data.items : []
        setSuggestions(items)
      } catch (error) {
        if (requestId === latestRequestIdRef.current) {
          setSuggestions([])
        }
        console.error('There was a problem with the fetch operation:', error)
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setIsLoading(false)
        }
      }
    },
    [session?.access_token]
  )

  const debouncedFetchRepositories = useDebouncedCallback(
    fetchRepositories,
    300
  )

  const handleRepositorySelect = useCallback(
    (nextValue: string) => {
      setValue(nextValue)
      setQuery(nextValue)

      if (!nextValue) return

      const [nextRepoOwner, nextRepoSlug] = nextValue.split('/')
      if (!nextRepoOwner || !nextRepoSlug) return

      const selectedRepository = suggestions.find(
        (repo) => repo.full_name === nextValue
      )

      setData({
        repoSlug: nextRepoSlug,
        repoOwner: nextRepoOwner,
        repoBranch: selectedRepository?.default_branch || repoBranch || ''
      })
    },
    [repoBranch, setData, suggestions]
  )

  useEffect(() => {
    if (!value && repository) {
      setValue(repository)
      setQuery(repository)
    }
  }, [repository, value])

  useEffect(() => {
    const selectedRepository = `${repoOwner}/${repoSlug}`

    if (query && query !== selectedRepository) {
      const requestId = latestRequestIdRef.current + 1
      latestRequestIdRef.current = requestId
      setIsLoading(true)
      debouncedFetchRepositories(`${query} in:name fork:true`, requestId)
    } else {
      latestRequestIdRef.current += 1
      debouncedFetchRepositories.cancel()
      setIsLoading(false)
      setSuggestions([])
    }

    // Cleanup the debounce on component unmount
    return () => debouncedFetchRepositories.cancel()
  }, [debouncedFetchRepositories, query, repoOwner, repoSlug])

  return (
    <div>
      <SearchCombobox
        data={
          !!initialData?.repoSlug
            ? [
                {
                  value: `${repoOwner}/${repoSlug}`,
                  label: `${repoOwner}/${repoSlug}`
                }
              ]
            : [
                ...(suggestions.length > 0 ? suggestions : initialSuggestion)
              ].map((repo) => ({
                value: repo.full_name,
                label: repo.full_name
              }))
        }
        value={!!initialData?.repoSlug ? `${repoOwner}/${repoSlug}` : value}
        setValue={handleRepositorySelect}
        onValueChange={setQuery}
        isLoading={isLoading}
        disabled={!!initialData?.repoSlug}
        searchPlaceholder="Ex: avitorio/outstatic"
        selectPlaceholder="Search for a repository"
        resultsPlaceholder="No repositories found"
      />
    </div>
  )
}
