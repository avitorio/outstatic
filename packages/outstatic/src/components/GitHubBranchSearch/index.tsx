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

interface Branch {
  name: string
}

const GitHubBranchSearch: React.FC = () => {
  const { data: env } = useInitialData()
  const { setData } = useLocalData()
  const { repoOwner, repoSlug, repoBranch } = useOutstaticNew()
  const initialSuggestion = repoBranch
    ? [{ name: repoBranch }]
    : [{ name: 'main' }]
  const { session } = useOutstatic()
  const [query, setQuery] = useState<string>('')
  const [suggestions, setSuggestions] = useState<Branch[]>(initialSuggestion)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [value, setValue] = React.useState(repoBranch)

  // Replace 'YOUR_TOKEN_HERE' with your actual GitHub Personal Access Token
  const githubToken = session?.access_token

  const fetchRepositories = async (searchQuery: string) => {
    if (!searchQuery) {
      setSuggestions([])
      return
    }
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoSlug}/branches?per_page=100&timestamp=${Date.now()}`,
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
      setSuggestions(data)
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
      setData({ repoBranch: value })
    }
  }, [value])

  return (
    <div>
      <SearchCombobox
        data={
          !!env?.repoBranch
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
        value={!!env?.repoBranch ? `${repoBranch}` : value}
        setValue={setValue}
        onValueChange={setQuery}
        isLoading={isLoading}
        disabled={!!env?.repoBranch || !repoSlug || !repoOwner}
      />
    </div>
  )
}

export default GitHubBranchSearch
