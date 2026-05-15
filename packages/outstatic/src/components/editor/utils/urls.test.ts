import { getUrlFromString, isValidUrl } from './urls'

describe('editor URL utilities', () => {
  it.each([
    ['https://example.com', true],
    ['http://example.com', true],
    ['mailto:hello@example.com', true],
    ['/docs/getting-started', true],
    ['/foo%20bar', true],
    ['/foo bar', false],
    ['/foo\tbar', false],
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
    ['/foo bar', null],
    ['example.com', 'https://example.com/'],
    ['hello world', null],
    ['localhost', 'http://localhost/'],
    ['LOCALHOST:3000', 'http://localhost:3000/'],
    ['javascript:alert(1)', null]
  ])('normalizes %s to %s', (value, expected) => {
    expect(getUrlFromString(value)).toBe(expected)
  })
})
