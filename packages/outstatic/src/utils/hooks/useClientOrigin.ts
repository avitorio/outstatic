import { useEffect, useState } from 'react'

export const useClientOrigin = () => {
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  return origin
}
