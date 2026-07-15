export function generateGetFileInformationQuery({
  paths,
  singletonPaths = [],
  branch
}: {
  paths: string[]
  singletonPaths?: string[]
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
  const singletonVariableDefinitions = singletonPaths
    .map((_, index) => `$singleton${index}: String!`)
    .join('\n      ')
  const singletonQueryParts = singletonPaths.map(
    (_, index) => `
    singleton${index}: object(expression: $singleton${index}) {
      ... on Blob {
        ...BlobDetails
      }
    }`
  )

  return `
    query GetMultipleFileInformation(
      $owner: String!
      $name: String!
      ${singletonVariableDefinitions}
    ) {
      repository(owner: $owner, name: $name) {
        id
        ${queryParts.join('\n')}
        ${singletonQueryParts.join('\n')}
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
