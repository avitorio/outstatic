import { deepCloneTree } from '../useGetRepoFiles'
import { TreeDataItem } from '@/components/ui/outstatic/file-tree'

describe('deepCloneTree', () => {
  it('should return an empty array when given an empty array', () => {
    const result = deepCloneTree([])
    expect(result).toEqual([])
  })

  it('should clone a flat array of items without children', () => {
    const items: TreeDataItem[] = [
      { id: '1', name: 'file1' },
      { id: '2', name: 'file2' }
    ]

    const result = deepCloneTree(items)

    expect(result).toEqual(items)
    expect(result).not.toBe(items)
    expect(result[0]).not.toBe(items[0])
    expect(result[1]).not.toBe(items[1])
  })

  it('should deep clone nested tree structures', () => {
    const items: TreeDataItem[] = [
      {
        id: 'folder1',
        name: 'Folder 1',
        children: [
          { id: 'file1', name: 'File 1' },
          {
            id: 'subfolder1',
            name: 'Subfolder 1',
            children: [{ id: 'file2', name: 'File 2' }]
          }
        ]
      }
    ]

    const result = deepCloneTree(items)

    expect(result).toEqual(items)
    expect(result).not.toBe(items)
    expect(result[0]).not.toBe(items[0])
    expect(result[0].children).not.toBe(items[0].children)
    expect(result[0].children![0]).not.toBe(items[0].children![0])
    expect(result[0].children![1].children).not.toBe(
      items[0].children![1].children
    )
  })

  it('should set children to undefined when original has no children', () => {
    const items: TreeDataItem[] = [{ id: '1', name: 'file1' }]

    const result = deepCloneTree(items)

    expect(result[0].children).toBeUndefined()
  })

  it('should not affect original when modifying clone', () => {
    const original: TreeDataItem[] = [
      {
        id: 'folder1',
        name: 'Folder 1',
        children: [{ id: 'file1', name: 'File 1' }]
      }
    ]

    const clone = deepCloneTree(original)
    clone[0].name = 'Modified Folder'
    clone[0].children![0].name = 'Modified File'

    expect(original[0].name).toBe('Folder 1')
    expect(original[0].children![0].name).toBe('File 1')
  })

  it('should preserve icon property reference', () => {
    const mockIcon = () => null
    const items: TreeDataItem[] = [
      { id: '1', name: 'file1', icon: mockIcon as any }
    ]

    const result = deepCloneTree(items)

    expect(result[0].icon).toBe(mockIcon)
  })

  it('should handle empty children arrays', () => {
    const items: TreeDataItem[] = [{ id: '1', name: 'folder', children: [] }]

    const result = deepCloneTree(items)

    expect(result[0].children).toEqual([])
    expect(result[0].children).not.toBe(items[0].children)
  })

  it('should handle deeply nested structures', () => {
    const items: TreeDataItem[] = [
      {
        id: 'level1',
        name: 'Level 1',
        children: [
          {
            id: 'level2',
            name: 'Level 2',
            children: [
              {
                id: 'level3',
                name: 'Level 3',
                children: [{ id: 'level4', name: 'Level 4' }]
              }
            ]
          }
        ]
      }
    ]

    const result = deepCloneTree(items)

    expect(result).toEqual(items)
    const deepChild = result[0].children![0].children![0].children![0]
    const originalDeepChild =
      items[0].children![0].children![0].children![0]
    expect(deepChild).not.toBe(originalDeepChild)
    expect(deepChild.id).toBe('level4')
  })
})
