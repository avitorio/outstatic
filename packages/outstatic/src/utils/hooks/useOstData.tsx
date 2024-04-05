import { OutstaticData } from '@/app'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import cookies from 'js-cookie'

interface QueryOutstaticData extends Partial<OutstaticData> {
  env: Partial<OutstaticData>
  local: Partial<OutstaticData>
}

export const useGetFetchQuery = (key: string[]) => {
  const queryClient = useQueryClient()

  return queryClient.getQueryData(key) as QueryOutstaticData
}

const getOstData = async (ostData?: QueryOutstaticData) => {
  await new Promise((resolve) => setTimeout(resolve, 100)) // Simulate a slight delay
  const savedDetails = JSON.parse(localStorage.getItem('ost_settings') || '{}')
  return { env: ostData?.env, local: savedDetails }
}

export const useOutstaticNew = () => {
  const { data, isPending } = useInitialData()

  for (let key in data.env) {
    if (
      data.env[key] === '' ||
      data.env[key] === null ||
      data.env[key] === undefined
    ) {
      delete data.env[key]
    }
  }

  return { ...data.local, ...data.env, isPending }
}

export const useInitialData = (ostData?: OutstaticData) => {
  const data = useGetFetchQuery(['ost_settings'])
  return useQuery({
    queryKey: ['ost_settings'],
    queryFn: async () => {
      const local = await JSON.parse(cookies.get('ost_settings') || '{}')
      return { env: data ? data?.env : ostData, local }
    },
    initialData: { env: { ...ostData }, local: {} }
  })
}

// Mutation hook for updating repository details
export const useUpdateOstData = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newDetails) => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return newDetails
    },
    onMutate: async (newDetails: QueryOutstaticData) => {
      await queryClient.cancelQueries({ queryKey: ['ost_settings'] })
      const previousDetails = queryClient.getQueryData(['ost_settings'])
      const updatedDetails = {
        ...previousDetails,
        ...newDetails,
        ...previousDetails?.env
      }
      localStorage.setItem('ost_settings', JSON.stringify(updatedDetails))
      return { previousDetails }
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['ost_settings'], context?.previousDetails)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ost_settings'] })
    }
  })
}
