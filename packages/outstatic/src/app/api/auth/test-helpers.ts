import type { NextRequest } from 'next/server'

export const ORIGINAL_ENV = { ...process.env }

type ResponseJsonInit = Omit<ResponseInit, 'headers'> & {
  headers?: HeadersInit
}

class MockResponse {
  status: number
  ok: boolean
  headers: Headers
  private readonly bodyValue: unknown

  constructor(bodyValue: unknown, init?: ResponseJsonInit) {
    this.status = init?.status ?? 200
    this.ok = this.status >= 200 && this.status < 300
    this.headers = new Headers(init?.headers ?? {})
    this.bodyValue = bodyValue
  }

  async json() {
    if (typeof this.bodyValue === 'string') {
      try {
        return JSON.parse(this.bodyValue)
      } catch {
        return this.bodyValue
      }
    }

    return this.bodyValue
  }

  async text() {
    if (typeof this.bodyValue === 'string') {
      return this.bodyValue
    }

    return JSON.stringify(this.bodyValue)
  }

  static json(body: unknown, init?: ResponseJsonInit) {
    return new MockResponse(body, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {})
      }
    })
  }
}

class MockRequest {
  url: string
  method: string
  headers: Headers

  constructor(input: string | URL, init?: RequestInit) {
    this.url = String(input)
    this.method = init?.method ?? 'GET'
    this.headers = new Headers(init?.headers ?? {})
  }
}

export function ensureWebApiGlobals() {
  if (typeof globalThis.Request === 'undefined') {
    ;(globalThis as any).Request = MockRequest
  }

  if (typeof globalThis.Response === 'undefined') {
    ;(globalThis as any).Response = MockResponse
  }
}

export function createNextRequest(
  url: string,
  init?: RequestInit
): NextRequest {
  ensureWebApiGlobals()

  return {
    url,
    method: init?.method ?? 'GET',
    headers: new Headers(init?.headers ?? {})
  } as unknown as NextRequest
}

export function jsonResponse(
  body: unknown,
  init?: Omit<ResponseInit, 'headers'> & { headers?: HeadersInit }
): Response {
  ensureWebApiGlobals()
  const status = init?.status ?? 200

  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }),
    json: async () => body,
    text: async () => JSON.stringify(body)
  } as unknown as Response
}

export function getLocationHeader(response: Response): string {
  return response.headers.get('location') ?? ''
}

export function resetEnv(overrides: Record<string, string | undefined>) {
  process.env = {
    ...ORIGINAL_ENV,
    ...overrides
  }
}
