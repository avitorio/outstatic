import '@testing-library/jest-dom'

/* env vars required by outstatic */
process.env.OST_GITHUB_ID = 'TEST_OST_GITHUB_ID'
process.env.OST_GITHUB_SECRET = 'TEST_OST_GITHUB_SECRET'
process.env.OST_TOKEN_SECRET = 'TEST_OST_TOKEN_SECRET'
process.env.OST_CONTENT_PATH = 'TEST_OST_CONTENT_PATH'
process.env.OST_REPO_OWNER = 'TEST_OST_REPO_OWNER'
process.env.OST_REPO_SLUG = 'TEST_OST_REPO_SLUG'
process.env.OST_REPO_BRANCH = 'TEST_OST_REPO_BRANCH'

// required by Iron
process.env.OST_TOKEN_SECRET = '32characterstringtestrequirement'

// Polyfill TextEncoder and TextDecoder for jose library
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// Polyfill crypto.randomUUID for tests
if (typeof crypto === 'undefined') {
  // @ts-ignore
  global.crypto = {}
}
if (!crypto.randomUUID) {
  crypto.randomUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }
}

// Mock next/cache to avoid Next.js internal dependencies in test environment
jest.mock('next/cache', () => ({
  unstable_cache: (fn: Function) => fn,
  revalidateTag: jest.fn()
}))

// Mock auth-provider to avoid AuthProvider dependency issues in tests
jest.mock('@/utils/auth/auth-provider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    session: {
      user: {
        name: 'Test User',
        login: 'testuser',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg'
      },
      access_token: 'mock-access-token',
      expires: new Date(Date.now() + 3600000)
    },
    updateSession: jest.fn(),
    signOut: jest.fn(),
    basePath: '',
    status: 'authenticated' as const
  })
}))

// Mock matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
})

// beforeEach(() => {
//   jest.spyOn(console, 'error')
//   // @ts-ignore jest.spyOn adds this functionallity
//   console.error.mockImplementation(() => null)
// })

// afterEach(() => {
//   // @ts-ignore jest.spyOn adds this functionallity
//   console.error.mockRestore()
// })

class MockPointerEvent extends Event {
  button: number
  ctrlKey: boolean
  pointerType: string

  constructor(type: string, props: PointerEventInit) {
    super(type, props)
    this.button = props.button || 0
    this.ctrlKey = props.ctrlKey || false
    this.pointerType = props.pointerType || 'mouse'
  }
}

window.PointerEvent = MockPointerEvent as any
window.HTMLElement.prototype.scrollIntoView = jest.fn()
window.HTMLElement.prototype.releasePointerCapture = jest.fn()
window.HTMLElement.prototype.hasPointerCapture = jest.fn()
