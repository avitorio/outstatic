import { encode } from 'js-base64'

type collectionCommitInputType = {
  owner: string
  oid: string
  remove?: boolean
  repoSlug: string
  contentPath: string
  monorepoPath: string
  collection: string
}

export const collectionCommitInput = ({
  owner,
  oid,
  remove = false,
  repoSlug,
  contentPath,
  monorepoPath,
  collection
}: collectionCommitInputType) => {
  let fileChanges = {}
  const additions = []
  const deletions = []

  if (remove) {
    deletions.push({
      path: `${
        monorepoPath ? monorepoPath + '/' : ''
      }${contentPath}/${collection}`
    })
    fileChanges = { ...fileChanges, deletions }
  } else {
    additions.push({
      path: `${
        monorepoPath ? monorepoPath + '/' : ''
      }${contentPath}/${collection}/.gitkeep`,
      contents: encode('')
    })
    fileChanges = { additions }
  }

  const headline = !remove
    ? `feat(content): create ${collection}`
    : `feat(content): remove ${collection}`

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
