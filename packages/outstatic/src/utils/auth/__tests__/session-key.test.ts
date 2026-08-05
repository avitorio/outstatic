import { webcrypto } from 'node:crypto'

const ENV_KEYS = [
  'OST_TOKEN_SECRET',
  'OST_GITHUB_SECRET',
  'OUTSTATIC_API_KEY'
] as const

const originalCrypto = Object.getOwnPropertyDescriptor(globalThis, 'crypto')
const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]])
)

async function loadSessionKey(): Promise<Uint8Array> {
  let getSessionKey: (() => Promise<Uint8Array>) | undefined

  await jest.isolateModulesAsync(async () => {
    ;({ getSessionKey } = await import('../session-key'))
  })

  return getSessionKey!()
}

function clearSessionEnv() {
  for (const key of ENV_KEYS) delete process.env[key]
}

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: webcrypto
  })
})

beforeEach(clearSessionEnv)

afterAll(() => {
  clearSessionEnv()
  for (const key of ENV_KEYS) {
    const value = originalEnv[key]
    if (value !== undefined) process.env[key] = value
  }

  if (originalCrypto) {
    Object.defineProperty(globalThis, 'crypto', originalCrypto)
  }
})

describe('getSessionKey', () => {
  it('uses OST_TOKEN_SECRET before other configured credentials', async () => {
    const tokenSecret = 'token-secret-that-is-at-least-32-bytes'
    process.env.OST_TOKEN_SECRET = tokenSecret
    process.env.OST_GITHUB_SECRET = 'github-secret'
    process.env.OUTSTATIC_API_KEY = 'api-key'
    const keyWithAllCredentials = await loadSessionKey()

    clearSessionEnv()
    process.env.OST_TOKEN_SECRET = tokenSecret
    const keyWithTokenSecretOnly = await loadSessionKey()

    expect(keyWithAllCredentials).toEqual(keyWithTokenSecretOnly)
  })

  it('uses OST_GITHUB_SECRET before OUTSTATIC_API_KEY', async () => {
    const githubSecret = 'github-secret'
    process.env.OST_GITHUB_SECRET = githubSecret
    process.env.OUTSTATIC_API_KEY = 'api-key'
    const keyWithBothCredentials = await loadSessionKey()

    clearSessionEnv()
    process.env.OST_GITHUB_SECRET = githubSecret
    const keyWithGithubSecretOnly = await loadSessionKey()

    expect(keyWithBothCredentials).toEqual(keyWithGithubSecretOnly)
  })

  it('derives the same key from the same material', async () => {
    process.env.OST_GITHUB_SECRET = 'stable-github-secret'
    const firstKey = await loadSessionKey()
    const secondKey = await loadSessionKey()

    expect(firstKey).toEqual(secondKey)
    expect(firstKey).toHaveLength(32)
  })

  it('derives different keys from different material', async () => {
    process.env.OST_GITHUB_SECRET = 'first-github-secret'
    const firstKey = await loadSessionKey()

    process.env.OST_GITHUB_SECRET = 'second-github-secret'
    const secondKey = await loadSessionKey()

    expect(firstKey).not.toEqual(secondKey)
  })

  it('rejects the deprecated public fallback', async () => {
    process.env.OST_TOKEN_SECRET = 'l1f3154n4dv3ntur3st4yS7r0n9s3cr3t'

    await expect(loadSessionKey()).rejects.toThrow('deprecated public fallback')
  })

  it('rejects a short OST_TOKEN_SECRET', async () => {
    process.env.OST_TOKEN_SECRET = 'too-short'

    await expect(loadSessionKey()).rejects.toThrow(
      'OST_TOKEN_SECRET must contain at least 32 bytes'
    )
  })

  it('throws when no session key material is configured', async () => {
    await expect(loadSessionKey()).rejects.toThrow(
      'Outstatic cannot derive a session key'
    )
  })
})
