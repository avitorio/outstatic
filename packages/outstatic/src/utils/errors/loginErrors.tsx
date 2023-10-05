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
  )
}

export default loginErrors
