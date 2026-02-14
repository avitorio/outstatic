export type EnvVarsType = {
  required: {
    [key: string]: boolean
  }
  optional: {
    [key: string]: boolean
  }
}

type EnvVarsObjType = {
  hasMissingEnvVars: boolean
  envVars: EnvVarsType
}

const initialEnvVars: EnvVarsType = {
  required: {
    OST_GITHUB_ID: false,
    OST_GITHUB_SECRET: false,
    OUTSTATIC_API_KEY: false
  },
  optional: {
    OST_CONTENT_PATH: false,
    OST_REPO_OWNER: false
  }
}

export const envVars = (function () {
  const envVarsObj: EnvVarsObjType = {
    hasMissingEnvVars: false,
    envVars: {
      required: {},
      optional: {}
    }
  }

  Object.entries(initialEnvVars.required).forEach(([key]) => {
    envVarsObj.envVars.required[key] = !!process.env[key]
  })

  const hasGithubOAuthCredentials =
    !!process.env.OST_GITHUB_ID && !!process.env.OST_GITHUB_SECRET
  const hasProRelayCredentials = !!process.env.OUTSTATIC_API_KEY

  envVarsObj.hasMissingEnvVars =
    !hasGithubOAuthCredentials && !hasProRelayCredentials

  Object.entries(initialEnvVars.optional).forEach(([key]) => {
    envVarsObj.envVars.optional[key] = !!process.env[key]
  })

  return envVarsObj
})()
