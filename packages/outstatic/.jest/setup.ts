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
