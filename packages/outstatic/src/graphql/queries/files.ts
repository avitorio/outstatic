import { graphql } from '../gql/gql'

export const GET_FILES = graphql(`
  query Files($owner: String!, $name: String!, $contentPath: String!) {
    repository(owner: $owner, name: $name) {
      id
      object(expression: $contentPath) {
        ... on Tree {
          entries {
            path
            name
            type
            object {
              ... on Tree {
                entries {
                  path
                  name
                  type
                }
              }
            }
          }
        }
      }
    }
  }
`)
