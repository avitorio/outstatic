import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ContentScanResult } from '@/types/content-scan'
import { useImportContent } from '@/utils/hooks/use-import-content'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { toast } from 'sonner'
import { ContentScanReview } from '../content-scan-review'

jest.mock('@/utils/hooks/use-import-content', () => ({
  useImportContent: jest.fn()
}))
jest.mock('@/utils/hooks/use-demo-write-guard', () => ({
  useDemoWriteGuard: () => () => false
}))
jest.mock('@/utils/hooks/use-outstatic', () => ({ useOutstatic: jest.fn() }))
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() }))
}))
jest.mock('@/components/ui/outstatic/upgrade-dialog', () => ({
  UpgradeDialog: ({ open }: { open: boolean }) =>
    open ? <div>Upgrade dialog</div> : null
}))
jest.mock('sonner', () => ({
  toast: { error: jest.fn(), info: jest.fn(), success: jest.fn() }
}))

const mockUseImportContent = useImportContent as jest.Mock
const mockUseOutstatic = useOutstatic as jest.Mock
const mockToastInfo = toast.info as jest.Mock
const mockToastSuccess = toast.success as jest.Mock

const scan: ContentScanResult = {
  branch: 'main',
  headSha: 'abc',
  existingOutstatic: null,
  singletons: [],
  suggestions: [
    {
      id: 'posts',
      title: 'Posts',
      slug: 'posts',
      path: 'content/posts',
      docCount: 1,
      extensions: ['md'],
      sampleFiles: ['content/posts/first.md'],
      fields: [],
      tier: 2,
      confidence: 1,
      warnings: [],
      preselected: true
    }
  ],
  warnings: [],
  truncated: false,
  stats: { markdownFiles: 1, scannedFiles: 1 }
}

describe('ContentScanReview', () => {
  const importContent = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseImportContent.mockReturnValue(importContent)
    mockUseOutstatic.mockReturnValue({
      canSaveContent: true,
      isHosted: true,
      isPro: true,
      projectInfo: { accountSlug: 'acme' },
      dashboardRoute: '/outstatic'
    })
  })

  it('opens the upgrade dialog instead of importing when content setup is unavailable', () => {
    mockUseOutstatic.mockReturnValue({
      canSaveContent: false,
      isHosted: true,
      isPro: false,
      projectInfo: { accountSlug: 'acme' },
      dashboardRoute: '/outstatic'
    })

    render(<ContentScanReview scan={scan} onManual={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /set up dashboard/i }))

    expect(screen.getByText('Upgrade dialog')).toBeInTheDocument()
    expect(importContent).not.toHaveBeenCalled()
  })

  it('shows a success toast after a committed import', async () => {
    importContent.mockResolvedValue({ committed: true, skipped: [] })
    render(<ContentScanReview scan={scan} onManual={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /set up dashboard/i }))

    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Dashboard content imported.'
      )
    )
    expect(mockToastInfo).not.toHaveBeenCalled()
  })
})
