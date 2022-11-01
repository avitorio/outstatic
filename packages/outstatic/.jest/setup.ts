import '@testing-library/jest-dom'

/* env vars required by outstatic */
process.env.OST_GITHUB_ID = 'TEST_OST_GITHUB_ID'
process.env.OST_GITHUB_SECRET = 'TEST_OST_GITHUB_SECRET'
process.env.OST_TOKEN_SECRET = 'TEST_OST_TOKEN_SECRET'
process.env.OST_CONTENT_PATH = 'TEST_OST_CONTENT_PATH'
process.env.OST_REPO_OWNER = 'TEST_OST_REPO_OWNER'
process.env.OST_REPO_SLUG = 'TEST_OST_REPO_SLUG'

// required by Iron
process.env.OST_TOKEN_SECRET = '32characterstringtestrequirement'
