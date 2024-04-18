import { graphql } from '../gql/gql'

export const GET_DOCUMENT = graphql(`
  query Document(
    $owner: String!
    $name: String!
    $mdPath: String!
    $mdxPath: String!
  ) {
    repository(owner: $owner, name: $name) {
      fileMD: object(expression: $mdPath) {
        ... on Blob {
          text
        }
      }
      fileMDX: object(expression: $mdxPath) {
        ... on Blob {
          text
        }
      }
    }
  }
`)
