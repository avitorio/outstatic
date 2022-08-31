/* eslint-disable turbo/no-undeclared-env-vars */
export const envVars = [
  'OST_GITHUB_ID',
  'OST_GITHUB_SECRET',
  'OST_TOKEN_SECRET',
  'OST_REPO_SLUG',
  'OST_CONTENT_PATH'
]

export const hasMissingEnvVar =
  envVars.filter((variable) =>
    variable === 'OST_CONTENT_PATH' ? false : !process.env[variable]
  ).length > 0

export const missingEnvVars = envVars.map((variable) => !!process.env[variable])
