import { ORIGINAL_ENV } from '@/app/api/auth/test-helpers'

async function loadEnvVarsModule(
  overrides: Record<string, string | undefined>
) {
  jest.resetModules()
  process.env = {
    ...ORIGINAL_ENV,
    ...overrides
  }

  return import('../envVarsCheck')
}

describe('envVarsCheck', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('treats local GitHub credentials as configured auth', async () => {
    const envVarsModule = await loadEnvVarsModule({
      OST_GITHUB_ID: 'client-id',
      OST_GITHUB_SECRET: 'client-secret',
      OUTSTATIC_API_KEY: undefined
    })

    expect(envVarsModule.envVars.hasMissingEnvVars).toBe(false)
    expect(envVarsModule.envVars.envVars.required.OST_GITHUB_ID).toBe(true)
    expect(envVarsModule.envVars.envVars.required.OST_GITHUB_SECRET).toBe(true)
    expect(envVarsModule.envVars.envVars.required.OUTSTATIC_API_KEY).toBe(false)
  })

  it('treats pro API key as configured auth when local GitHub creds are missing', async () => {
    const envVarsModule = await loadEnvVarsModule({
      OST_GITHUB_ID: undefined,
      OST_GITHUB_SECRET: undefined,
      OUTSTATIC_API_KEY: 'pro-key'
    })

    expect(envVarsModule.envVars.hasMissingEnvVars).toBe(false)
    expect(envVarsModule.envVars.envVars.required.OST_GITHUB_ID).toBe(false)
    expect(envVarsModule.envVars.envVars.required.OST_GITHUB_SECRET).toBe(false)
    expect(envVarsModule.envVars.envVars.required.OUTSTATIC_API_KEY).toBe(true)
  })

  it('marks env as missing when neither auth mode is configured', async () => {
    const envVarsModule = await loadEnvVarsModule({
      OST_GITHUB_ID: undefined,
      OST_GITHUB_SECRET: undefined,
      OUTSTATIC_API_KEY: undefined
    })

    expect(envVarsModule.envVars.hasMissingEnvVars).toBe(true)
  })

  it('keeps optional variable detection unchanged', async () => {
    const envVarsModule = await loadEnvVarsModule({
      OST_GITHUB_ID: 'client-id',
      OST_GITHUB_SECRET: 'client-secret',
      OUTSTATIC_API_KEY: undefined,
      OST_CONTENT_PATH: 'content',
      OST_REPO_OWNER: 'owner'
    })

    expect(envVarsModule.envVars.envVars.optional.OST_CONTENT_PATH).toBe(true)
    expect(envVarsModule.envVars.envVars.optional.OST_REPO_OWNER).toBe(true)
  })
})
