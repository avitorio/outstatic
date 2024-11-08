import { graphql } from '../gql/gql'

export const GET_REPOSITORY = graphql(`
  query GetRepoInfo($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      id
      defaultBranchRef {
        name
        target {
          oid
        }
      }
    }
  }
`)
