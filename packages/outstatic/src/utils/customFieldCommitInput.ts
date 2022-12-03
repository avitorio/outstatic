import { encode } from 'js-base64'

type customFieldCommitInputType = {
  owner: string
  fieldName: string
  customFieldsJSON: string
  oid: string
  repoSlug: string
  repoBranch: string
  contentPath: string
  monorepoPath: string
  collection: string
}

export const customFieldCommitInput = ({
  owner,
  fieldName,
  customFieldsJSON,
  oid,
  repoSlug,
  repoBranch,
  contentPath,
  monorepoPath,
  collection
}: customFieldCommitInputType) => {
  const additions = []

  additions.push({
    path: `${
      monorepoPath ? monorepoPath + '/' : ''
    }${contentPath}/${collection}/schema.json`,
    contents: encode(customFieldsJSON + '\n')
  })

  const headline = `feat(${collection}): add ${fieldName} field`

  return {
    input: {
      branch: {
        repositoryNameWithOwner: `${owner}/${repoSlug}`,
        branchName: repoBranch
      },
      message: {
        headline
      },
      fileChanges: { additions },
      expectedHeadOid: oid
    }
  }
}
