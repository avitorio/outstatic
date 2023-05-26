import { slugRegex } from './slugRegex'

describe('Regex Test', () => {
  it('should allow lowercase letters, numbers, and hyphens', () => {
    expect(slugRegex.test('abc123')).toBe(true)
    expect(slugRegex.test('abc-123')).toBe(true)
    expect(slugRegex.test('a1b2c3-d4')).toBe(true)
    expect(slugRegex.test('A1B2C3-d4')).toBe(false)
  })

  it('should not allow spaces or special characters', () => {
    expect(slugRegex.test('a bc123')).toBe(false)
    expect(slugRegex.test('a!b@c#1$2%3^')).toBe(false)
  })

  it('should start and end with a letter or number, not a hyphen', () => {
    expect(slugRegex.test('abc123')).toBe(true)
    expect(slugRegex.test('-abc123')).toBe(false)
    expect(slugRegex.test('abc123-')).toBe(false)
    expect(slugRegex.test('-abc123-')).toBe(false)
  })
})
