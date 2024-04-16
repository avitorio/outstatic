/* eslint-disable */
import * as types from './graphql'
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core'

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
  '\n  mutation createCommit($input: CreateCommitOnBranchInput!) {\n    createCommitOnBranch(input: $input) {\n      commit {\n        oid\n      }\n    }\n  }\n':
    types.CreateCommitDocument,
  '\n  query Collections($owner: String!, $name: String!, $contentPath: String!) {\n    repository(owner: $owner, name: $name) {\n      id\n      object(expression: $contentPath) {\n        ... on Tree {\n          entries {\n            name\n            type\n          }\n        }\n      }\n    }\n  }\n':
    types.CollectionsDocument,
  '\n  query Document($owner: String!, $name: String!, $filePath: String!) {\n    repository(owner: $owner, name: $name) {\n      id\n      object(expression: $filePath) {\n        ... on Blob {\n          text\n          commitUrl\n        }\n      }\n    }\n  }\n':
    types.DocumentDocument,
  '\n  query Documents($owner: String!, $name: String!, $contentPath: String!) {\n    repository(owner: $owner, name: $name) {\n      id\n      object(expression: $contentPath) {\n        ... on Tree {\n          entries {\n            name\n            object {\n              ... on Blob {\n                text\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n':
    types.DocumentsDocument,
  '\n  query Files($owner: String!, $name: String!, $contentPath: String!) {\n    repository(owner: $owner, name: $name) {\n      id\n      object(expression: $contentPath) {\n        ... on Tree {\n          entries {\n            path\n            name\n            type\n            object {\n              ... on Tree {\n                entries {\n                  path\n                  name\n                  type\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n':
    types.FilesDocument
}

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation createCommit($input: CreateCommitOnBranchInput!) {\n    createCommitOnBranch(input: $input) {\n      commit {\n        oid\n      }\n    }\n  }\n'
): (typeof documents)['\n  mutation createCommit($input: CreateCommitOnBranchInput!) {\n    createCommitOnBranch(input: $input) {\n      commit {\n        oid\n      }\n    }\n  }\n']
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query Collections($owner: String!, $name: String!, $contentPath: String!) {\n    repository(owner: $owner, name: $name) {\n      id\n      object(expression: $contentPath) {\n        ... on Tree {\n          entries {\n            name\n            type\n          }\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query Collections($owner: String!, $name: String!, $contentPath: String!) {\n    repository(owner: $owner, name: $name) {\n      id\n      object(expression: $contentPath) {\n        ... on Tree {\n          entries {\n            name\n            type\n          }\n        }\n      }\n    }\n  }\n']
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query Document($owner: String!, $name: String!, $filePath: String!) {\n    repository(owner: $owner, name: $name) {\n      id\n      object(expression: $filePath) {\n        ... on Blob {\n          text\n          commitUrl\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query Document($owner: String!, $name: String!, $filePath: String!) {\n    repository(owner: $owner, name: $name) {\n      id\n      object(expression: $filePath) {\n        ... on Blob {\n          text\n          commitUrl\n        }\n      }\n    }\n  }\n']
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query Documents($owner: String!, $name: String!, $contentPath: String!) {\n    repository(owner: $owner, name: $name) {\n      id\n      object(expression: $contentPath) {\n        ... on Tree {\n          entries {\n            name\n            object {\n              ... on Blob {\n                text\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query Documents($owner: String!, $name: String!, $contentPath: String!) {\n    repository(owner: $owner, name: $name) {\n      id\n      object(expression: $contentPath) {\n        ... on Tree {\n          entries {\n            name\n            object {\n              ... on Blob {\n                text\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n']
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query Files($owner: String!, $name: String!, $contentPath: String!) {\n    repository(owner: $owner, name: $name) {\n      id\n      object(expression: $contentPath) {\n        ... on Tree {\n          entries {\n            path\n            name\n            type\n            object {\n              ... on Tree {\n                entries {\n                  path\n                  name\n                  type\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query Files($owner: String!, $name: String!, $contentPath: String!) {\n    repository(owner: $owner, name: $name) {\n      id\n      object(expression: $contentPath) {\n        ... on Tree {\n          entries {\n            path\n            name\n            type\n            object {\n              ... on Tree {\n                entries {\n                  path\n                  name\n                  type\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n']

export function graphql(source: string) {
  return (documents as any)[source] ?? {}
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never
