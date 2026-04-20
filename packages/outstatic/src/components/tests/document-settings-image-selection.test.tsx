import { DocumentSettingsImageSelection } from '@/components/document-settings-image-selection'
import { TestProviders } from '@/utils/tests/test-wrapper'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormProvider, useForm, useWatch } from 'react-hook-form'

jest.mock('@/utils/hooks/use-outstatic', () => ({
  useOutstatic: jest.fn()
}))

jest.mock('@/components/ui/outstatic/media-library-modal', () => ({
  __esModule: true,
  default: () => null
}))

const mockUseOutstatic = jest.mocked(
  require('@/utils/hooks/use-outstatic').useOutstatic
)

type FormValues = {
  author?: {
    picture?: string
  }
}

const FormHarness = ({
  defaultValues,
  pickerDefaultValue
}: {
  defaultValues?: FormValues
  pickerDefaultValue?: string
}) => {
  const methods = useForm<FormValues>({ defaultValues })
  const picture = useWatch({
    control: methods.control,
    name: 'author.picture'
  })

  return (
    <TestProviders.DocumentContext>
      <FormProvider {...methods}>
        <DocumentSettingsImageSelection
          id="author.picture"
          defaultValue={pickerDefaultValue}
        />
        <div data-testid="current-picture">
          {picture === ''
            ? '__EMPTY__'
            : picture === undefined
              ? '__UNSET__'
              : picture}
        </div>
      </FormProvider>
    </TestProviders.DocumentContext>
  )
}

describe('<DocumentSettingsImageSelection />', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockUseOutstatic.mockReturnValue({
      basePath: '',
      publicMediaPath: 'media',
      repoOwner: 'outstatic',
      repoSlug: 'outstatic',
      repoBranch: 'canary',
      repoMediaPath: 'public/media'
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should keep the author picture empty after removing a seeded default avatar', async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime
    })

    render(<FormHarness pickerDefaultValue="https://example.com/avatar.jpg" />)

    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(screen.getByTestId('current-picture')).toHaveTextContent(
      'https://example.com/avatar.jpg'
    )
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove' }))

    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(screen.getByTestId('current-picture')).toHaveTextContent('__EMPTY__')
    expect(
      screen.queryByRole('button', { name: 'Remove' })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'From library' })
    ).toBeInTheDocument()
  })
})
