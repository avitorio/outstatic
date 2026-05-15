import { getUrlFromString, isValidUrl } from './urls'

describe('editor URL utilities', () => {
  it.each([
    ['https://example.com', true],
    ['http://example.com', true],
    ['mailto:hello@example.com', true],
    ['/docs/getting-started', true],
    ['javascript:alert(1)', false],
    ['data:text/html,<script>alert(1)</script>', false],
    ['example.com', false],
    ['hello world', false]
  ])('returns %s validity as %s', (url, expected) => {
    expect(isValidUrl(url)).toBe(expected)
  })

  it.each([
    ['https://example.com', 'https://example.com'],
    ['mailto:hello@example.com', 'mailto:hello@example.com'],
    ['/docs/getting-started', '/docs/getting-started'],
    ['example.com', 'https://example.com/'],
    ['hello world', null],
    ['localhost', null],
    ['javascript:alert(1)', null]
  ])('normalizes %s to %s', (value, expected) => {
    expect(getUrlFromString(value)).toBe(expected)
  })
})
