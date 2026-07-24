import { renderHook } from '@testing-library/react'

import { useUpgradeDialog } from '@/components/ui/outstatic/upgrade-dialog-context'
import { useMutation } from '@tanstack/react-query'

import { useCreateCommit } from './use-create-commit'
import { useOutstatic } from './use-outstatic'

jest.mock('@/components/ui/outstatic/upgrade-dialog-context', () => ({
  useUpgradeDialog: jest.fn()
}))
jest.mock('./use-outstatic', () => ({
  useOutstatic: jest.fn()
}))
jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn((options) => options),
  useQueryClient: () => ({ invalidateQueries: jest.fn() })
}))

const mockUseMutation = useMutation as jest.Mock
const mockUseOutstatic = useOutstatic as jest.Mock
const mockUseUpgradeDialog = useUpgradeDialog as jest.Mock

describe('useCreateCommit', () => {
  it('opens the conversion dialog and rejects commits for demo projects', async () => {
    const request = jest.fn()
    const openUpgradeDialog = jest.fn()

    mockUseOutstatic.mockReturnValue({
      gqlClient: { request },
      isDemo: true
    })
    mockUseUpgradeDialog.mockReturnValue({ openUpgradeDialog })

    const { result } = renderHook(() => useCreateCommit())
    const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

    await expect(mutationFn({})).rejects.toThrow('Demo projects are read-only')
    expect(openUpgradeDialog).toHaveBeenCalledWith(undefined, undefined, 'demo')
    expect(request).not.toHaveBeenCalled()
    expect(result.current).toBeDefined()
  })
})
