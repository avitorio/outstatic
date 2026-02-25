import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'
import {
  ContentLockProvider,
  useContentLock
} from '@/utils/hooks/use-content-lock'
import { NavigationGuardProvider, useNavigationGuard } from 'next-navigation-guard'

jest.mock('next-navigation-guard', () => ({
  useNavigationGuard: jest.fn(),
  NavigationGuardProvider: ({
    children
  }: {
    children: ReactNode
  }) => children
}))

const mockUseNavigationGuard = useNavigationGuard as jest.Mock

const wrapper = ({ children }: { children: ReactNode }) => (
  <NavigationGuardProvider>
    <ContentLockProvider>{children}</ContentLockProvider>
  </NavigationGuardProvider>
)

describe('useContentLock', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    jest.restoreAllMocks()
  })

  it('shares hasChanges across consumers through provider context', () => {
    const { result } = renderHook(
      () => {
        const first = useContentLock()
        const second = useContentLock()
        return { first, second }
      },
      { wrapper }
    )

    expect(result.current.first.hasChanges).toBe(false)
    expect(result.current.second.hasChanges).toBe(false)

    act(() => {
      result.current.first.setHasChanges(true)
    })

    expect(result.current.first.hasChanges).toBe(true)
    expect(result.current.second.hasChanges).toBe(true)
  })

  it('registers navigation guard with the shared hasChanges value', () => {
    const { result } = renderHook(() => useContentLock(), { wrapper })

    expect(mockUseNavigationGuard).toHaveBeenLastCalledWith(
      expect.objectContaining({
        enabled: false,
        confirm: expect.any(Function)
      })
    )

    act(() => {
      result.current.setHasChanges(true)
    })

    expect(mockUseNavigationGuard).toHaveBeenLastCalledWith(
      expect.objectContaining({
        enabled: true,
        confirm: expect.any(Function)
      })
    )
  })

  it('prompts on link clicks and blocks navigation when rejected', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)
    const { result } = renderHook(() => useContentLock(), { wrapper })

    act(() => {
      result.current.setHasChanges(true)
    })

    const link = document.createElement('a')
    link.href = '/outstatic/collections'
    document.body.appendChild(link)

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0
    })
    link.dispatchEvent(clickEvent)

    expect(confirmSpy).toHaveBeenCalledWith(
      'You have unsaved changes. Are you sure you want to leave?'
    )
    expect(clickEvent.defaultPrevented).toBe(true)
  })
})
