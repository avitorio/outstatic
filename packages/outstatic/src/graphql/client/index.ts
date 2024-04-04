import { GraphQLClient } from 'graphql-request'

async function getSession(basePath = '') {
  const response = await fetch(basePath + '/api/outstatic/user')
  return response.json()
}

const endpoint = 'https://api.github.com/graphql'

const gqlClient = new GraphQLClient(endpoint, {
  headers: {
    authorization: 'Bearer YOUR_AUTH_TOKEN'
    // Add other headers here as needed
  }
})

export default gqlClient
