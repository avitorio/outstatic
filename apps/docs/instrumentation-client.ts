import posthog, { type CaptureResult, type Properties } from 'posthog-js'

const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

if (apiKey) {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.posthog.com'
  const ingestionUrl = process.env.NEXT_PUBLIC_POSTHOG_INGESTION_URL

  posthog.init(apiKey, {
    api_host: ingestionUrl || resolvePostHogApiHost(host),
    ui_host: host,
    defaults: '2026-06-25',
    external_scripts_inject_target: 'head',
    autocapture: false,
    disable_session_recording: true,
    persistence: 'memory',
    person_profiles: 'identified_only',
    capture_pageleave: false,
    capture_pageview: 'history_change',
    before_send: sanitizeCaptureResult
  })
}

function resolvePostHogApiHost(host: string) {
  return host
    .replace('https://eu.posthog.com', 'https://eu.i.posthog.com')
    .replace('https://us.posthog.com', 'https://us.i.posthog.com')
}

function sanitizeCaptureResult(capture: CaptureResult | null) {
  if (!capture) {
    return null
  }

  return {
    ...capture,
    properties: sanitizeUrlProperties(capture.properties),
    ...(capture.$set ? { $set: sanitizeUrlProperties(capture.$set) } : {}),
    ...(capture.$set_once
      ? { $set_once: sanitizeUrlProperties(capture.$set_once) }
      : {})
  }
}

function sanitizeUrlProperties(properties: Properties) {
  const sanitized = { ...properties }

  for (const key of [
    '$current_url',
    '$referrer',
    '$initial_current_url',
    '$initial_referrer'
  ]) {
    const value = sanitized[key]

    if (typeof value === 'string') {
      sanitized[key] = stripQueryAndHash(value)
    }
  }

  return sanitized
}

function stripQueryAndHash(value: string) {
  if (!value.startsWith('/') && !/^https?:\/\//.test(value)) {
    return value
  }

  try {
    const url = new URL(value, window.location.origin)
    const isRelative = value.startsWith('/')

    url.search = ''
    url.hash = ''

    return isRelative ? url.pathname : url.href
  } catch {
    return value.split(/[?#]/, 1)[0] ?? value
  }
}
