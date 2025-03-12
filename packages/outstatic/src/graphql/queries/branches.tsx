import { graphql } from '../gql/gql'

export const GET_BRANCHES = graphql(`
  query GetBranches(
    $owner: String!
    $name: String!
    $first: Int!
    $query: String
  ) {
    repository(owner: $owner, name: $name) {
      refs(first: $first, refPrefix: "refs/heads/", query: $query) {
        nodes {
          name
        }
      }
    }
  }
`)
