'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const getHash = () =>
  typeof window !== 'undefined' ? window.location.hash : undefined

const useHash = () => {
  const [isClient, setIsClient] = useState(false)
  const [hash, setHash] = useState(getHash())
  const params = useParams()

  useEffect(() => {
    setIsClient(true)
    setHash(getHash())
  }, [params])

  return isClient ? hash : null
}

export default useHash
