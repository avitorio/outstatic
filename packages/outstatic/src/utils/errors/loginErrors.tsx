const loginErrors = {
  something: 'Something went wrong. Please try again.',
  'repository-not-found': (
    <>
      We couldn&apos;t access your repository. <br />
      Please, check out our{' '}
      <a
        className="underline"
        target="_blank"
        href="https://outstatic.com/docs/faqs#troubleshooting-login-and-repository-access-issues"
      >
        troubleshooting guide
      </a>
      .
    </>
  ),
  'not-collaborator': (
    <>
      You&apos;re not a collaborator of this repository. <br />
      Please, check out our{' '}
      <a
        className="underline"
        target="_blank"
        href="https://outstatic.com/docs/faqs#troubleshooting-login-and-repository-access-issues"
      >
        troubleshooting guide
      </a>
      .
    </>
  ),
  redirect_uri_mismatch: (
    <>
      The redirect_uri MUST match the registered callback URL for this
      application. <br />
      <br />
      For more information:{' '}
      <a
        className="underline"
        target="_blank"
        href="https://docs.github.com/apps/managing-oauth-apps/troubleshooting-authorization-request-errors/#redirect-uri-mismatch"
      >
        GitHub Apps troubleshooting
      </a>
      .
    </>
  ),
  'invalid-api-key': (
    <>
      The Outstatic PRO API key is invalid or has been revoked. <br />
      Please check your project settings and ensure you&apos;re using a valid
      API key.
    </>
  ),
  'auth-not-configured': (
    <>
      Login is not configured. <br />
      Add <code>OST_GITHUB_ID</code> and <code>OST_GITHUB_SECRET</code>, or set{' '}
      <code>OUTSTATIC_API_KEY</code> to use GitHub relay login.
    </>
  ),
  'project-url-not-configured': (
    <>
      Callback origins are not configured for this project. <br />
      Add callback base URLs in outstatic.com and ensure each one ends with{' '}
      <code>/outstatic</code>.
    </>
  ),
  'invalid-callback-domain': (
    <>
      The login callback URL does not match your configured callback origins.{' '}
      <br />
      Ensure this deployment URL is added in outstatic.com and ends with{' '}
      <code>/outstatic</code>.
    </>
  ),
  'invalid-callback-target': (
    <>
      Invalid callback target. <br />
      GitHub relay requires a callback route ending in{' '}
      <code>/api/outstatic/callback</code>.
    </>
  ),
  'github-relay-failed': (
    <>
      GitHub relay login failed. <br />
      Please try again. If the problem persists, check your callback origins and
      API key configuration.
    </>
  )
}

export default loginErrors
