import { mockRequests } from '@/mocks/network'
import { Outstatic } from '.'

// mock getLoginSession return
jest.mock('@/utils/auth/auth', () => ({
  getLoginSession: jest.fn().mockReturnValue({
    user: {
      email: 'test@example.com'
    }
  })
}))

describe(Outstatic, () => {
  const ENV = process.env
  const [startMsw, stopMsw] = mockRequests({ type: 'server' })

  beforeAll(() => {
    startMsw()
  })

  afterAll(() => {
    stopMsw()
  })

  beforeEach(() => {
    // restore process.env before each test
    process.env = JSON.parse(JSON.stringify(ENV))
  })

  it('should return initial values', async () => {
    const props = await Outstatic()
    expect(props).toMatchObject({
      repoOwner: process.env.OST_REPO_OWNER,
      repoSlug: process.env.OST_REPO_SLUG,
      repoBranch: process.env.OST_REPO_BRANCH,
      contentPath: process.env.OST_CONTENT_PATH,
      monorepoPath: '',
      session: {
        user: {
          email: 'test@example.com'
        }
      },
      missingEnvVars: false,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      basePath: process.env.OST_BASE_PATH || '',
      ostDetach: process.env.OST_DETACH || false
    })
  })
})
