import { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'https://docs.github.com/public/fpt/schema.docs.graphql',
  documents: ['src/**/*.{ts,tsx}', '!src/graphql/gql/**/*'],
  ignoreNoDocuments: true, // for better experience with the watcher
  generates: {
    './src/graphql/gql/': {
      preset: 'client',
      plugins: []
    }
  },
  config: {
    skipTypename: true
  },
  watch: true
}

export default config
