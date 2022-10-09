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
    OST_TOKEN_SECRET: false
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

  // OST_REPO_SLUG takes precendece over VERCEL_GIT_REPO_SLUG,
  // if both are empty, then we default to asking for OST_REPO_SLUG
  if (process.env.OST_REPO_SLUG) {
    initialEnvVars.required.OST_REPO_SLUG = true
  } else if (process.env.VERCEL_GIT_REPO_SLUG) {
    initialEnvVars.required.VERCEL_GIT_REPO_SLUG = true
  } else {
    initialEnvVars.required.OST_REPO_SLUG = false
  }

  Object.entries(initialEnvVars.required).forEach(([key]) => {
    envVarsObj.envVars.required[key] = !!process.env[key]

    if (!process.env[key]) {
      envVarsObj.hasMissingEnvVars = true
    }
  })

  Object.entries(initialEnvVars.optional).forEach(([key]) => {
    envVarsObj.envVars.optional[key] = !!process.env[key]
  })

  return envVarsObj
})()
