import {
  type CreateCommitOnBranchInput,
  type FileChanges
} from '@/graphql/generated'
import { encode as toBase64 } from 'js-base64'

export interface CommitAPI {
  createInput: () => CreateCommitOnBranchInput
  setMessage: (title: string, body?: string) => void
  replaceFile: (file: string, contents: string, encode?: boolean) => void
  removeFile: (file: string) => void
}

interface CreateCommitOptions {
  message: string
  oid: string
  owner: string
  name: string
  branch: string
}

export const createCommitApi = ({
  message,
  owner,
  oid,
  name,
  branch
}: CreateCommitOptions): CommitAPI => {
  const additions: FileChanges['additions'] = []
  const deletions: FileChanges['deletions'] = []
  let commitMessage = message ?? 'chore: Outstatic commit'
  let commitBody = 'Automatically created by Outstatic'

  const setMessage = (title: string, body?: string) => {
    commitMessage = title ?? commitMessage
    commitBody = body ?? commitBody
  }

  const replaceFile = (file: string, contents: string, encode = true) => {
    const encoded = encode === true ? toBase64(contents) : contents
    additions.push({ path: file, contents: encoded })
  }

  const removeFile = (file: string) => {
    deletions.push({ path: file })
  }

  const createInput = () => ({
    branch: {
      repositoryNameWithOwner: `${owner}/${name}`,
      branchName: branch
    },
    message: {
      headline: commitMessage
    },
    fileChanges: {
      additions,
      deletions
    },
    expectedHeadOid: oid
  })

  // return the API
  return { setMessage, createInput, replaceFile, removeFile }
}
