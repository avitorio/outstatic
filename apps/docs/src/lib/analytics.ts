declare global {
  interface Window {
    umami: {
      track: (
        event: string | Record<string, string>,
        properties?: Record<string, string>
      ) => void
    }
  }
}

const UMAMI_HOST = process.env.NEXT_PUBLIC_UMAMI_HOST
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
const UMAMI_DISABLE_LOCALHOST_TRACKING =
  process.env.NEXT_PUBLIC_UMAMI_DISABLE_LOCALHOST_TRACKING

/**
 * Create a Umami analytics service.
 */
export function createUmamiAnalyticsService(
  props: {
    host: string
    websiteId: string
    disableLocalhostTracking?: boolean
  } = {
    host: UMAMI_HOST!,
    websiteId: UMAMI_WEBSITE_ID!,
    disableLocalhostTracking: UMAMI_DISABLE_LOCALHOST_TRACKING
      ? UMAMI_DISABLE_LOCALHOST_TRACKING === 'true'
      : false
  }
) {
  const host = props.host || UMAMI_HOST
  const websiteId = props.websiteId || UMAMI_WEBSITE_ID

  if (!host) {
    throw new Error(
      'UMAMI_HOST is not set. Please set the environment variable NEXT_PUBLIC_UMAMI_HOST.'
    )
  }

  if (!websiteId) {
    throw new Error(
      'UMAMI_WEBSITE_ID is not set. Please set the environment variable NEXT_PUBLIC_UMAMI_WEBSITE_ID.'
    )
  }

  return new UmamiAnalyticsService(
    host,
    websiteId,
    props.disableLocalhostTracking
  )
}

/**
 * Umami analytics service that sends events to Umami.
 */
class UmamiAnalyticsService {
  private userId: string | undefined
  private initialized = false

  constructor(
    private readonly host: string,
    private readonly websiteId: string,
    disableLocalhostTracking = false
  ) {
    if (disableLocalhostTracking) {
      this.disableLocalhostTracking()
    }
  }

  private get umami() {
    return typeof window === 'undefined' || !window.umami
      ? {
          track: () => {
            // Do nothing
          }
        }
      : window.umami
  }

  private createUmamiScript() {
    if (typeof document === 'undefined') {
      return Promise.resolve()
    }

    const script = document.createElement('script')
    script.src = this.host
    script.async = true
    script.defer = true

    script.setAttribute('data-website-id', this.websiteId)

    document.head.appendChild(script)

    return new Promise<void>((resolve) => {
      script.onload = () => {
        resolve()
      }
    })
  }

  async initialize() {
    if (this.initialized) {
      return Promise.resolve()
    }

    return this.createUmamiScript().then(() => {
      this.initialized = true
    })
  }

  async trackPageView() {
    // Umami does this automatically
  }

  async trackEvent(
    eventName: string,
    eventProperties: Record<string, string> = {}
  ) {
    await this.initialize()

    if (this.userId) {
      eventProperties.user_id = this.userId
    }

    return this.umami.track(eventName, eventProperties)
  }

  async identify(userId: string) {
    await this.initialize()

    this.userId = userId
  }

  private disableLocalhostTracking() {
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost') {
        localStorage.setItem('umami.disabled', '1')
      }
    }
  }
}
