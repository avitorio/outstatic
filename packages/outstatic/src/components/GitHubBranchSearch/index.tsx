'use client'
import useOutstatic from '@/utils/hooks/useOutstatic'
import React, { useEffect, useState } from 'react'
import { SearchCombobox } from '@/components/ui/search-combobox'
import {
  useInitialData,
  useLocalData,
  useOutstaticNew
} from '@/utils/hooks/useOstData'
import { useCollections } from '@/utils/hooks/useCollections'
import { useRouter } from 'next/navigation'

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
  const [suggestions, setSuggestions] = useState<Branch[]>(initialSuggestion)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [value, setValue] = React.useState(repoBranch)
  const { refetch } = useCollections()
  const router = useRouter()

  useEffect(() => {
    setIsLoading(true)

    if (repoOwner && repoSlug) {
      const baseUrl = `https://api.github.com/repos/${repoOwner}/${repoSlug}/branches`
      const headers = {
        headers: new Headers({
          Authorization: `token ${session?.access_token}`
        })
      }

      try {
        async function fetchAllBranches() {
          // Function to parse the 'Link' header to find the number of pages
          function getLastPageNumber(headers: Headers): number {
            const linkHeader = headers.get('Link')
            if (!linkHeader) return 0

            const matches = linkHeader.match(/&page=(\d+)>; rel="last"/)
            return matches ? parseInt(matches[1], 10) : 1
          }

          // Initial request to find out how many pages there are
          const response = await fetch(`${baseUrl}?per_page=1`, headers)
          const totalBranches = getLastPageNumber(response.headers)

          // Function to fetch a single page of branches
          const fetchPage = async (
            perPage: number,
            index: number = 100
          ): Promise<Branch[]> => {
            const url = `${baseUrl}?per_page=${perPage}&page=${index + 1}`
            const response = await fetch(url, headers)
            return response.json()
          }

          // Fetch all pages concurrently
          const fullPages = Math.floor(totalBranches / 100)
          const remainder = totalBranches % 100
          const pageNumbers = [
            ...Array(fullPages).fill(100),
            ...(remainder > 0 ? [remainder] : [])
          ]

          const promises = pageNumbers.map((perPage, index) =>
            fetchPage(perPage, index)
          )

          const pages = await Promise.all(promises)

          // create a map with the pages array where each item's name is the key
          // and the value is a bool with true
          const pagesMap = new Map<string, boolean>()

          pages.forEach((page) => {
            page.forEach((branch) => {
              pagesMap.set(branch.name, true)
            })
          })

          setSuggestions(Array.from(pagesMap.keys()).map((name) => ({ name })))
        }
        fetchAllBranches()
      } catch (error) {
        console.error('There was a problem with the fetch operation:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }, [repoOwner, repoSlug])

  useEffect(() => {
    if (value) {
      setData({ repoBranch: value })

      if (value !== repoBranch) {
        const getCollections = async () => {
          const { data } = await refetch()

          if (data === null) {
            console.log({ data })
            router.push('/outstatic')
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
        onValueChange={() => {}}
        isLoading={isLoading}
        disabled={!!env?.repoBranch || !repoSlug || !repoOwner}
        selectPlaceholder="Select a branch"
        searchPlaceholder="Search for a branch. Ex: main"
        resultsPlaceholder="No branches found"
      />
    </div>
  )
}

export default GitHubBranchSearch
