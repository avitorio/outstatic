import { graphql } from '../gql/gql'

export const CREATE_COMMIT = graphql(`
  mutation createCommit($input: CreateCommitOnBranchInput!) {
    createCommitOnBranch(input: $input) {
      commit {
        oid
      }
    }
  }
`)
