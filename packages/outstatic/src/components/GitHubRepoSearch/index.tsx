'use client'
import { SearchCombobox } from '@/components/ui/search-combobox'
import useOutstatic, {
  useInitialData,
  useLocalData
} from '@/utils/hooks/useOutstatic'
import React, { useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

const GitHubRepoSearch: React.FC = () => {
  const { data: env } = useInitialData()
  const { setData } = useLocalData()
  const { repoOwner, repoSlug, session } = useOutstatic()
  const repository = repoOwner && repoSlug ? `${repoOwner}/${repoSlug}` : ''
  const initialSuggestion = repository ? [{ full_name: repository }] : []
  const [query, setQuery] = useState<string>('')
  const [suggestions, setSuggestions] = useState(initialSuggestion)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [value, setValue] = React.useState(repository)

  const fetchRepositories = async (searchQuery: string) => {
    if (!searchQuery) {
      setSuggestions([])
      return
    }
    try {
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${searchQuery}&per_page=100&timestamp=${Date.now()}`,
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
      setSuggestions((oldData) =>
        data.items.length > 0 ? data.items : oldData
      )
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const debouncedFetchRepositories = useDebouncedCallback(
    fetchRepositories,
    300
  )

  useEffect(() => {
    if (query && query !== `${repoOwner}/${repoSlug}`) {
      setIsLoading(true)
      debouncedFetchRepositories(`${query} in:name fork:true`)
    } else {
      setIsLoading(false)
      setSuggestions([])
    }
    // Cleanup the debounce on component unmount
    return () => debouncedFetchRepositories.cancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  useEffect(() => {
    if (value) {
      setQuery(value)
      const [repoOwner, repoSlug] = value.split('/')
      setData({ repoSlug, repoOwner, repoBranch: '' })
    }
  }, [value])

  return (
    <div>
      <SearchCombobox
        data={
          !!env?.repoSlug
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
        value={!!env?.repoSlug ? `${repoOwner}/${repoSlug}` : value}
        setValue={setValue}
        onValueChange={setQuery}
        isLoading={isLoading}
        disabled={!!env?.repoSlug}
        searchPlaceholder="Ex: avitorio/outstatic"
        selectPlaceholder="Search for a repository"
        resultsPlaceholder="No repositories found"
      />
    </div>
  )
}

export default GitHubRepoSearch
