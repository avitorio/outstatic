'use client'

import { useState } from 'react'

type ApiFetcherProps = {
  url?: string
  label?: string
}

type RepoData = {
  stargazers_count: number
  description: string | null
  html_url: string
  full_name: string
}

export default function ApiFetcher({
  url = 'https://api.github.com/repos/avitorio/outstatic',
  label = 'Fetch repo info'
}: ApiFetcherProps) {
  const [data, setData] = useState<RepoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`)
      }
      const json = (await res.json()) as RepoData
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="not-prose my-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {loading ? 'Loading…' : label}
      </button>
      {error ? (
        <p className="mt-3 text-sm text-red-600">Error: {error}</p>
      ) : null}
      {data ? (
        <div className="mt-3 text-sm text-neutral-700">
          <div>
            <strong>{data.full_name}</strong> — ★ {data.stargazers_count}
          </div>
          {data.description ? <p className="mt-1">{data.description}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
