import { encode } from 'js-base64'
import { FileType } from '../types'

type createCommitInputType = {
  owner: string
  slug?: string
  oldSlug?: string
  content?: string
  oid: string
  files?: FileType[]
  repoSlug: string
  contentPath: string
  monorepoPath: string
}

export const createCommitInput = ({
  owner,
  slug,
  oldSlug,
  content,
  oid,
  files = [],
  repoSlug,
  contentPath,
  monorepoPath
}: createCommitInputType) => {
  let fileChanges = {}
  const additions = []
  const deletions = []

  if (slug && content) {
    let newContent = content

    if (files.length > 0) {
      files.forEach(({ filename, blob, type, content: fileContents }) => {
        const randString = window
          .btoa(Math.random().toString())
          .substring(10, 6)
        const newFilename = filename.replace(/(\.[^\.]*)?$/, `-${randString}$1`)

        additions.push({
          path: `${
            monorepoPath ? monorepoPath + '/' : ''
          }public/${type}/${newFilename}`,
          contents: fileContents
        })

        if (blob) {
          newContent = content.replace(blob, `/${type}/${newFilename}`)
        }
      })
    }

    newContent = newContent?.replace(
      'src="/api/outstatic/images/',
      `src="/images/`
    )

    additions.push({
      path: `${
        monorepoPath ? monorepoPath + '/' : ''
      }${contentPath}/${slug}.md`,
      contents: encode(newContent)
    })

    fileChanges = { additions }
  }

  // Remove old file if slug has changed
  if (oldSlug) {
    deletions.push({
      path: `${
        monorepoPath ? monorepoPath + '/' : ''
      }${contentPath}/${oldSlug}.md`
    })
    fileChanges = { ...fileChanges, deletions }
  }

  const headline = slug
    ? `feat(blog): ${slug}`
    : `feat(blog): remove ${oldSlug}`

  return {
    input: {
      branch: {
        repositoryNameWithOwner: `${owner}/${repoSlug}`,
        branchName: 'main'
      },
      message: {
        headline
      },
      fileChanges,
      expectedHeadOid: oid
    }
  }
}
