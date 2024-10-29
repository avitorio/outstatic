export function generateGetFileInformationQuery({
  paths,
  branch
}: {
  paths: string[]
  branch: string
}) {
  const queryParts = paths.map(
    (path, index) => `
    folder${index}: object(expression: "${branch}:${path}") {
      ... on Tree {
        commitUrl
        ...RecursiveTreeDetails
      }
    }`
  )

  return `
    query GetMultipleFileInformation(
      $owner: String!
      $name: String!
    ) {
      repository(owner: $owner, name: $name) {
        id
        ${queryParts.join('\n')}
      }
    }

    fragment TreeDetails on TreeEntry {
      path
      type
    }

    fragment BlobDetails on Blob {
      oid
      commitUrl
    }

    fragment RecursiveTreeDetails on Tree {
      entries {
        ...TreeDetails
        object {
          ... on Blob {
            ...BlobDetails
          }
        }
      }
    }
  `
}
