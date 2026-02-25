import { graphql } from '../gql/gql'

export const GET_COLLECTIONS = graphql(`
  query Collections($owner: String!, $name: String!, $contentPath: String!) {
    repository(owner: $owner, name: $name) {
      id
      object(expression: $contentPath) {
        ... on Tree {
          entries {
            name
            type
          }
        }
      }
    }
  }
`)
