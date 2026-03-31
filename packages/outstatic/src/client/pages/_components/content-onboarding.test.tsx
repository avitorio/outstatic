import { render, screen, fireEvent } from '@testing-library/react'
import ContentOnboarding from './content-onboarding'
import { useLocalData, useOutstatic } from '@/utils/hooks/use-outstatic'
import { useInitialData } from '@/utils/hooks/use-initial-data'
import { TestWrapper } from '@/utils/tests/test-wrapper'

// Mock the hooks
jest.mock('@/utils/hooks/use-outstatic')
jest.mock('@/utils/hooks/use-initial-data')
jest.mock('@/utils/auth/hooks', () => ({
  useOstSession: () => ({ status: 'authenticated' })
}))

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({}))
}))

// Mock change-case
jest.mock('change-case', () => ({
  split: (str: string) => str,
  kebabCase: (str: string) => str.toLowerCase().replace(/\s+/g, '-')
}))

describe('ContentOnboarding', () => {
  beforeEach(() => {
    ;(useLocalData as jest.Mock).mockReturnValue({
      setData: jest.fn()
    })
    ;(useOutstatic as jest.Mock).mockReturnValue({
      repoOwner: 'test-owner',
      repoSlug: 'test-repo',
      repoBranch: 'main',
      dashboardRoute: '/outstatic',
      basePath: '',
      gqlClient: {}
    })
  })

  describe('when branch is not confirmed', () => {
    beforeEach(() => {
      ;(useInitialData as jest.Mock).mockReturnValue({
        repoBranch: null
      })
    })

    it('shows branch confirmation UI', () => {
      render(
        <TestWrapper>
          <ContentOnboarding />
        </TestWrapper>
      )

      expect(screen.getByText('Confirm your Branch')).toBeInTheDocument()
      expect(
        screen.getByText(/Outstatic saves everything to GitHub/i)
      ).toBeInTheDocument()
    })

    it('shows Select and Create Branch buttons', () => {
      render(
        <TestWrapper>
          <ContentOnboarding />
        </TestWrapper>
      )

      expect(screen.getByRole('button', { name: 'Select' })).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Create Branch' })
      ).toBeInTheDocument()
    })

    it('confirms branch when Select button is clicked', () => {
      render(
        <TestWrapper>
          <ContentOnboarding />
        </TestWrapper>
      )

      const selectButton = screen.getByRole('button', { name: 'Select' })
      fireEvent.click(selectButton)

      // After clicking Select, should show the content creation UI
      expect(screen.getByText('Start your site')).toBeInTheDocument()
    })

    it('opens create branch dialog when Create Branch button is clicked', () => {
      render(
        <TestWrapper>
          <ContentOnboarding />
        </TestWrapper>
      )

      const createBranchButton = screen.getByRole('button', {
        name: 'Create Branch'
      })
      fireEvent.click(createBranchButton)

      // Dialog should open
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('when branch is confirmed via env var', () => {
    beforeEach(() => {
      ;(useInitialData as jest.Mock).mockReturnValue({
        repoBranch: 'main'
      })
    })

    it('shows content creation UI directly', () => {
      render(
        <TestWrapper>
          <ContentOnboarding />
        </TestWrapper>
      )

      expect(screen.getByText('Start your site')).toBeInTheDocument()
      expect(
        screen.getByText(/Most sites start with a Collection/i)
      ).toBeInTheDocument()
    })

    it('shows CollectionOnboarding card', () => {
      render(
        <TestWrapper>
          <ContentOnboarding />
        </TestWrapper>
      )

      expect(screen.getByText('Create a Collection')).toBeInTheDocument()
      expect(screen.getByText('Recommended')).toBeInTheDocument()
    })

    it('shows SingletonOnboarding card', () => {
      render(
        <TestWrapper>
          <ContentOnboarding />
        </TestWrapper>
      )

      expect(screen.getByText('Create a Singleton')).toBeInTheDocument()
    })

    it('shows divider between collection and singleton options', () => {
      render(
        <TestWrapper>
          <ContentOnboarding />
        </TestWrapper>
      )

      expect(
        screen.getByText('or start with a standalone page')
      ).toBeInTheDocument()
    })
  })

  describe('when branch is confirmed via URL param', () => {
    beforeEach(() => {
      ;(useInitialData as jest.Mock).mockReturnValue({
        repoBranch: null
      })

      // Mock URL params with confirmed=true
      const { useSearchParams } = require('next/navigation')
      useSearchParams.mockReturnValue(new URLSearchParams('confirmed=true'))
    })

    it('shows content creation UI directly', () => {
      render(
        <TestWrapper>
          <ContentOnboarding />
        </TestWrapper>
      )

      expect(screen.getByText('Start your site')).toBeInTheDocument()
    })
  })
})
