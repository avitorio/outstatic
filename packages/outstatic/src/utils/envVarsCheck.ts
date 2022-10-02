/* eslint-disable turbo/no-undeclared-env-vars */
export const envVars = [
  'OST_GITHUB_ID',
  'OST_GITHUB_SECRET',
  'OST_TOKEN_SECRET',
  'OST_REPO_SLUG',
  'OST_CONTENT_PATH',
  'OST_REPO_OWNER'
]

export const hasMissingEnvVar = (function () {
  let filteredEnvVars = envVars
  if (!process.env.OST_REPO_SLUG && process.env.VERCEL_GIT_REPO_SLUG) {
    filteredEnvVars = envVars.filter((envVar) => envVar !== 'OST_REPO_SLUG')
  }
  return (
    filteredEnvVars.filter((variable) =>
      variable === 'OST_CONTENT_PATH' || variable === 'OST_REPO_OWNER'
        ? false
        : !process.env[variable]
    ).length > 0
  )
})()

export const missingEnvVars = envVars.map((variable) => !!process.env[variable])
