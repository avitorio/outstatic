import { act, renderHook } from '@testing-library/react'

import { useUpgradeDialog } from '@/components/ui/outstatic/upgrade-dialog-context'

import { useDemoWriteGuard } from './use-demo-write-guard'
import { useOutstatic } from './use-outstatic'

jest.mock('@/components/ui/outstatic/upgrade-dialog-context', () => ({
  useUpgradeDialog: jest.fn()
}))

jest.mock('./use-outstatic', () => ({
  useOutstatic: jest.fn()
}))

const mockUseOutstatic = useOutstatic as jest.Mock
const mockUseUpgradeDialog = useUpgradeDialog as jest.Mock

describe('useDemoWriteGuard', () => {
  const openUpgradeDialog = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseUpgradeDialog.mockReturnValue({ openUpgradeDialog })
  })

  it('allows writes for regular projects', () => {
    mockUseOutstatic.mockReturnValue({ isDemo: false })
    const onBlocked = jest.fn()
    const { result } = renderHook(() => useDemoWriteGuard())

    expect(result.current(onBlocked)).toBe(false)
    expect(onBlocked).not.toHaveBeenCalled()
    expect(openUpgradeDialog).not.toHaveBeenCalled()
  })

  it('runs cleanup before opening the demo prompt', () => {
    mockUseOutstatic.mockReturnValue({ isDemo: true })
    const calls: string[] = []
    const onBlocked = jest.fn(() => calls.push('cleanup'))
    openUpgradeDialog.mockImplementation(() => calls.push('dialog'))
    const { result } = renderHook(() => useDemoWriteGuard())

    act(() => {
      expect(result.current(onBlocked)).toBe(true)
    })

    expect(calls).toEqual(['cleanup', 'dialog'])
    expect(openUpgradeDialog).toHaveBeenCalledWith(undefined, undefined, 'demo')
  })
})
