import { fireEvent, render, screen } from '@testing-library/react'
import { MediaSettings } from './media-settings'
import { useGetConfig } from '@/utils/hooks/use-get-config'
import { useUpdateConfig } from '@/utils/hooks/use-update-config'
import { useOutstatic } from '@/utils/hooks/use-outstatic'

jest.mock('@/utils/hooks/use-get-config')
jest.mock('@/utils/hooks/use-update-config')
jest.mock('@/utils/hooks/use-outstatic')

const mockUseGetConfig = useGetConfig as jest.Mock
const mockUseUpdateConfig = useUpdateConfig as jest.Mock
const mockUseOutstatic = useOutstatic as jest.Mock

describe('MediaSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGetConfig.mockReturnValue({
      data: {},
      isPending: false
    })
    mockUseUpdateConfig.mockReturnValue(jest.fn())
    mockUseOutstatic.mockReturnValue({
      media: [
        {
          name: 'images',
          label: 'Images',
          input: 'media/images',
          output: '/media/images',
          extensions: ['png']
        }
      ],
      repoOwner: 'andre',
      repoSlug: 'outstatic',
      repoBranch: 'canary'
    })
  })

  it('blocks duplicate media source labels before advancing setup', () => {
    render(<MediaSettings />)

    fireEvent.click(screen.getByRole('button', { name: 'Add source' }))
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Images' }
    })

    expect(
      screen.getByText('A media source with this label already exists.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Documents' }
    })

    expect(
      screen.queryByText('A media source with this label already exists.')
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
  })
})
