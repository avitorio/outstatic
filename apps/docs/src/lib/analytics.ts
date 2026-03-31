const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
const UMAMI_SCRIPT_SRC = 'https://cloud.umami.is/script.js'

type UmamiScriptConfig = {
  src: string
  websiteId: string
}

export function getUmamiScriptConfig(
  props: {
    websiteId?: string
  } = {}
): UmamiScriptConfig | null {
  const websiteId = props.websiteId ?? UMAMI_WEBSITE_ID

  if (!websiteId) {
    return null
  }

  return {
    src: UMAMI_SCRIPT_SRC,
    websiteId
  }
}
