import { graphql } from '../gql/gql'

export const GET_FILE = graphql(`
  query File($owner: String!, $name: String!, $filePath: String!) {
    repository(owner: $owner, name: $name) {
      id
      object(expression: $filePath) {
        ... on Blob {
          text
          commitUrl
        }
      }
    }
  }
`)
