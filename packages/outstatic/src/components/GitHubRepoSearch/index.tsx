'use client'
import useOutstatic from '@/utils/hooks/useOutstatic'
import debounce from 'lodash/debounce'
import React, { useEffect, useState } from 'react'

import { SearchCombobox } from '@/components/ui/search-combobox'
import {
  useInitialData,
  useLocalData,
  useOutstaticNew
} from '@/utils/hooks/useOstData'

interface Repository {
  full_name: string
  private?: boolean
}

const GitHubRepoSearch: React.FC = () => {
  const { data: env } = useInitialData()
  const { setData } = useLocalData()
  const { repoOwner, repoSlug } = useOutstaticNew()
  const repository = repoOwner && repoSlug ? `${repoOwner}/${repoSlug}` : ''
  const initialSuggestion = repository ? [{ full_name: repository }] : []
  const { session } = useOutstatic()
  const [query, setQuery] = useState<string>('')
  const [suggestions, setSuggestions] =
    useState<Repository[]>(initialSuggestion)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [value, setValue] = React.useState(repository)

  // Replace 'YOUR_TOKEN_HERE' with your actual GitHub Personal Access Token
  const githubToken = session?.access_token

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
            Authorization: `token ${githubToken}`
          })
        }
      )
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      setSuggestions(data.items)
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Using lodash's debounce
  const debouncedFetchRepositories = debounce(fetchRepositories, 300)

  useEffect(() => {
    if (query) {
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
      setData({ repoSlug, repoOwner })
      // cookies.set('ost_settings', JSON.stringify(ostSettings), { expires: 7 }) // Expires in 7 days
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
            : suggestions.map((repo) => ({
                value: repo.full_name,
                label: repo.full_name
              }))
        }
        value={!!env?.repoSlug ? `${repoOwner}/${repoSlug}` : value}
        setValue={setValue}
        onValueChange={setQuery}
        isLoading={isLoading}
        disabled={!!env?.repoSlug}
      />
    </div>
  )
}

export default GitHubRepoSearch
