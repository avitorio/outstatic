import { graphql } from '../gql/gql'

export const CREATE_BRANCH = graphql(`
  mutation CreateBranch(
    $repositoryId: ID!
    $name: String!
    $oid: GitObjectID!
  ) {
    createRef(input: { repositoryId: $repositoryId, name: $name, oid: $oid }) {
      ref {
        name
      }
    }
  }
`)
