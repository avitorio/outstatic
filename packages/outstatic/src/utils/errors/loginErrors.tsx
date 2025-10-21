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
      Please check your project settings and ensure you&apos;re using a valid API key.
    </>
  )
}

export default loginErrors
