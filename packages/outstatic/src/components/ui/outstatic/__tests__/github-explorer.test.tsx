import { render } from '@testing-library/react'
import { Folder, FolderRoot } from 'lucide-react'

import GithubExplorer from '../github-explorer'
import { Tree } from '../file-tree'
import { useGetRepoFiles } from '@/utils/hooks/use-get-repo-files'

jest.mock('../file-tree', () => ({
  Tree: jest.fn(() => null)
}))

jest.mock('@/utils/hooks/use-get-repo-files', () => ({
  useGetRepoFiles: jest.fn()
}))

type MockTreeDataItem = {
  id: string
  name: string
  children?: MockTreeDataItem[]
}

type MockTreeProps = {
  data: MockTreeDataItem[]
  isPending: boolean
  className: string
  onSelectChange: (item: MockTreeDataItem | undefined) => void
  folderIcon: unknown
  itemIcon: unknown
}

const mockTree = jest.mocked(Tree)
const mockUseGetRepoFiles = jest.mocked(useGetRepoFiles)

const getLatestTreeProps = (): MockTreeProps => {
  const lastCall = mockTree.mock.calls[mockTree.mock.calls.length - 1]
  expect(lastCall).toBeDefined()
  return lastCall[0] as MockTreeProps
}

describe('<GithubExplorer />', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGetRepoFiles.mockReturnValue({
      data: [],
      isFetching: false
    } as unknown as ReturnType<typeof useGetRepoFiles>)
  })

  it('calls useGetRepoFiles with path and fileExtensions', () => {
    const setPath = jest.fn()

    render(
      <GithubExplorer
        path="content"
        setPath={setPath}
        fileExtensions={['.md', '.mdx']}
      />
    )

    expect(mockUseGetRepoFiles).toHaveBeenCalledWith({
      path: 'content',
      fileExtensions: ['.md', '.mdx']
    })
  })

  it('prepends root "." in folder mode', () => {
    mockUseGetRepoFiles.mockReturnValue({
      data: [{ id: 'docs', name: 'docs' }],
      isFetching: false
    } as unknown as ReturnType<typeof useGetRepoFiles>)

    render(<GithubExplorer path="" setPath={jest.fn()} />)

    const treeProps = getLatestTreeProps()
    expect(treeProps.data).toEqual([
      { id: '', name: '.', icon: FolderRoot },
      { id: 'docs', name: 'docs' }
    ])
    expect(treeProps.folderIcon).toBe(Folder)
    expect(treeProps.itemIcon).toBe(Folder)
  })

  it('does not prepend root when hideRoot is true', () => {
    mockUseGetRepoFiles.mockReturnValue({
      data: [{ id: 'docs', name: 'docs' }],
      isFetching: false
    } as unknown as ReturnType<typeof useGetRepoFiles>)

    render(<GithubExplorer path="" setPath={jest.fn()} hideRoot />)

    const treeProps = getLatestTreeProps()
    expect(treeProps.data).toEqual([{ id: 'docs', name: 'docs' }])
  })

  it('does not prepend root when fileExtensions is provided', () => {
    mockUseGetRepoFiles.mockReturnValue({
      data: [{ id: 'docs/post.mdx', name: 'post.mdx' }],
      isFetching: false
    } as unknown as ReturnType<typeof useGetRepoFiles>)

    render(
      <GithubExplorer path="" setPath={jest.fn()} fileExtensions={['.mdx']} />
    )

    const treeProps = getLatestTreeProps()
    expect(treeProps.data).toEqual([{ id: 'docs/post.mdx', name: 'post.mdx' }])
  })

  it('calls onFileSelect for matching file selection in file mode', () => {
    const setPath = jest.fn()
    const onFileSelect = jest.fn()

    render(
      <GithubExplorer
        path=""
        setPath={setPath}
        fileExtensions={['.md', '.mdx']}
        onFileSelect={onFileSelect}
      />
    )

    const treeProps = getLatestTreeProps()
    treeProps.onSelectChange({ id: 'docs/post.mdx', name: 'post.mdx' })

    expect(onFileSelect).toHaveBeenCalledWith('docs/post.mdx')
    expect(setPath).not.toHaveBeenCalled()
  })

  it('calls setPath for folder selection and ignores same-path selections', () => {
    const setPath = jest.fn()

    render(<GithubExplorer path="docs" setPath={setPath} />)

    const treeProps = getLatestTreeProps()

    treeProps.onSelectChange({ id: 'guides', name: 'guides', children: [] })
    expect(setPath).toHaveBeenCalledWith('guides')

    treeProps.onSelectChange({ id: 'docs', name: 'docs', children: [] })
    treeProps.onSelectChange(undefined)
    expect(setPath).toHaveBeenCalledTimes(1)
  })
})
