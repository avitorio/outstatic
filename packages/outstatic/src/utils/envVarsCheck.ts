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
    OST_GITHUB_SECRET: false
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

    if (!process.env[key]) {
      envVarsObj.hasMissingEnvVars = true
    }
  })

  Object.entries(initialEnvVars.optional).forEach(([key]) => {
    envVarsObj.envVars.optional[key] = !!process.env[key]
  })

  return envVarsObj
})()
