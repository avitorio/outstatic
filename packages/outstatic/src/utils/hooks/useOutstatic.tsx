import { OutstaticContext } from '@/context'
import { useContext } from 'react'

export default function useOutstatic() {
  return useContext(OutstaticContext)
}
