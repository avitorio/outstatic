import { OstSSP } from '.'
import { mockRequests } from '../mocks/network'
import { createMockContext } from '../mocks/next/context'

describe(OstSSP, () => {
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

  it('should request collections', async () => {
    const context = await createMockContext(
      {
        method: 'GET',
        url: '/'
      },
      {}
    )

    const props = await OstSSP(context)
    expect(props).toMatchObject({
      props: {
        missingEnvVars: false,
        providerData: {
          repoOwner: process.env.OST_REPO_OWNER,
          repoSlug: process.env.OST_REPO_SLUG,
          repoBranch: 'main',
          contentPath: process.env.OST_CONTENT_PATH,
          monorepoPath: '',
          session: {
            user: {
              email: 'test@example.com'
            }
          },
          initialApolloState: {},
          collections: ['pages', 'posts', 'projects'], // <= collections show
          pages: ['settings', 'collections', 'pages', 'posts', 'projects'] // <= collections in page set
        }
      }
    })
  })

  it('returns no collections on a graphql error', async () => {
    const context = await createMockContext(
      {
        method: 'GET',
        url: '/'
      },
      {}
    )
    // set the repo owner, which alerts MSW we want a different behavior
    process.env.OST_REPO_OWNER = 'msw::collections::not-implemented'

    const spy = jest.spyOn(console, 'log')
    spy.mockImplementation(() => {})
    const props = await OstSSP(context)

    // verify console log of Apollo Error
    expect(spy).toBeCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: expect.stringMatching(/MSW - Not implemented/)
        })
      })
    )

    // TODO: in future, there should be an error instead of a console log event
    expect(props).toMatchObject({})

    spy.mockRestore()
  })
})
