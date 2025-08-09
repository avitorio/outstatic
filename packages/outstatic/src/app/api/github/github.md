# GitHub API Endpoint

This endpoint provides a secure way to make GitHub API requests with automatic token validation and refresh functionality. It supports both REST API and GraphQL requests.

## Endpoint

`POST /api/outstatic/github`

## Authentication

This endpoint requires authentication. It will automatically:

1. Check if the user has a valid session
2. Validate the access token
3. Refresh the token if it's expired (if a refresh token is available)

## Request Body

The request body must be a JSON object that matches either the REST API schema or the GraphQL schema.

### REST API Request Schema

```typescript
{
  endpoint: string,           // Required: GitHub API endpoint (e.g., "/user", "/repos")
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",  // Optional: HTTP method (defaults to "GET")
  body?: any,                // Optional: Request body for POST/PUT/PATCH requests
  headers?: Record<string, string>  // Optional: Additional headers to include
}
```

### GraphQL Request Schema

```typescript
{
  operationName?: string,     // Optional: GraphQL operation name
  query: string,             // Required: GraphQL query string
  variables?: Record<string, any>  // Optional: GraphQL variables
}
```

## Example Requests

### REST API Examples

#### Get user information

```json
{
  "endpoint": "/user",
  "method": "GET"
}
```

#### Get user repositories

```json
{
  "endpoint": "/user/repos",
  "method": "GET"
}
```

#### Create a repository

```json
{
  "endpoint": "/user/repos",
  "method": "POST",
  "body": {
    "name": "my-new-repo",
    "description": "A new repository",
    "private": false
  }
}
```

#### Get repository contents

```json
{
  "endpoint": "/repos/owner/repo/contents/path/to/file",
  "method": "GET"
}
```

### GraphQL Examples

#### Get repository file content

```json
{
  "operationName": "File",
  "query": "query File($owner: String!, $name: String!, $filePath: String!) { repository(owner: $owner, name: $name) { id object(expression: $filePath) { ... on Blob { text commitUrl } } } }",
  "variables": {
    "owner": "avitorio",
    "name": "basic-blog-2",
    "filePath": "main:outstatic/config.json"
  }
}
```

#### Get user information via GraphQL

```json
{
  "query": "query { viewer { login name email avatarUrl } }"
}
```

#### Get repository with GraphQL

```json
{
  "query": "query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) { name description url } }",
  "variables": {
    "owner": "avitorio",
    "name": "outstatic"
  }
}
```

## Response

The endpoint returns the exact GitHub API response without any additional wrapping.

### Success Response Examples

#### REST API Response

```json
{
  "id": 123,
  "login": "testuser",
  "name": "Test User",
  "email": "test@example.com",
  "avatar_url": "https://github.com/images/error/octocat_happy.gif"
}
```

#### GraphQL Response

```json
{
  "data": {
    "repository": {
      "id": "MDEwOlJlcG9zaXRvcnkxMjM0NTY3ODk=",
      "object": {
        "text": "{\"key\": \"value\"}",
        "commitUrl": "https://github.com/owner/repo/commit/abc123"
      }
    }
  }
}
```

### Error Responses

#### Validation Error (400)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["endpoint"],
      "message": "GitHub endpoint is required"
    }
  ]
}
```

#### Authentication Required (401)

```json
{
  "error": "Authentication required"
}
```

#### Token Expired (401)

```json
{
  "error": "Token expired and no refresh token available"
}
```

#### Token Refresh Failed (401)

```json
{
  "error": "Token refresh failed"
}
```

#### GitHub API Error (404)

```json
{
  "message": "Not Found",
  "documentation_url": "https://docs.github.com/rest"
}
```

#### GitHub GraphQL Error (200)

```json
{
  "errors": [
    {
      "message": "GraphQL error occurred",
      "locations": [
        {
          "line": 1,
          "column": 1
        }
      ]
    }
  ]
}
```

## Features

- **Automatic Token Refresh**: If the access token is expired and a refresh token is available, it will automatically refresh the token before making the GitHub API request.
- **Input Validation**: Uses Zod to validate all request inputs for both REST and GraphQL requests.
- **Dual API Support**: Supports both GitHub REST API v3 and GraphQL API v4.
- **Error Handling**: Comprehensive error handling for various scenarios.
- **Secure**: Only works with authenticated users and validates tokens.
- **Flexible**: Supports all GitHub API endpoints and HTTP methods.

## Usage Examples

### JavaScript/TypeScript

#### REST API Request

```typescript
// Get user information
const response = await fetch('/api/outstatic/github', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    endpoint: '/user',
    method: 'GET'
  })
})

const data = await response.json()
console.log(data) // Direct GitHub user information
```

#### GraphQL Request

```typescript
// Get repository file content
const response = await fetch('/api/outstatic/github', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    operationName: 'File',
    query:
      'query File($owner: String!, $name: String!, $filePath: String!) { repository(owner: $owner, name: $name) { id object(expression: $filePath) { ... on Blob { text commitUrl } } } }',
    variables: {
      owner: 'avitorio',
      name: 'basic-blog-2',
      filePath: 'main:outstatic/config.json'
    }
  })
})

const data = await response.json()
console.log(data) // Direct GitHub GraphQL response
```

### cURL

#### REST API Request

```bash
curl -X POST http://localhost:3000/api/outstatic/github \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "/user",
    "method": "GET"
  }'
```

#### GraphQL Request

```bash
curl -X POST http://localhost:3000/api/outstatic/github \
  -H "Content-Type: application/json" \
  -d '{
    "operationName": "File",
    "query": "query File($owner: String!, $name: String!, $filePath: String!) { repository(owner: $owner, name: $name) { id object(expression: $filePath) { ... on Blob { text commitUrl } } } }",
    "variables": {
      "owner": "avitorio",
      "name": "basic-blog-2",
      "filePath": "main:outstatic/config.json"
    }
  }'
```

## Notes

- **REST API**: The endpoint automatically adds the necessary GitHub API headers including `Authorization`, `Accept: application/vnd.github.v3+json`, and `User-Agent`.
- **GraphQL API**: The endpoint automatically adds the necessary GitHub API headers including `Authorization`, `Content-Type: application/json`, `Accept: application/vnd.github.v4+json`, and `User-Agent`.
- **REST API**: All requests are made to `https://api.github.com` with the specified endpoint.
- **GraphQL API**: All requests are made to `https://api.github.com/graphql`.
- The endpoint supports all GitHub API v3 endpoints and GraphQL v4 queries.
- Token refresh is handled automatically and transparently for both API types.
- The endpoint automatically detects whether the request is REST or GraphQL based on the presence of a `query` field.
