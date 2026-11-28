import { describe, expect, it } from 'vitest'
import { resolveApiOrigin } from './api-origin'

describe('resolveApiOrigin', () => {
  it('calls the portless backend from the vite dev server', () => {
    expect(resolveApiOrigin(true, { origin: 'https://sa.localhost' })).toBe(
      'https://sa-api.localhost',
    )
  })

  it('calls the origin that served the page in a production build', () => {
    expect(resolveApiOrigin(false, { origin: 'http://127.0.0.1:47811' })).toBe(
      'http://127.0.0.1:47811',
    )
    expect(resolveApiOrigin(false, { origin: 'https://sa.localhost' })).toBe('https://sa.localhost')
  })

  it('falls back to relative URLs without a location', () => {
    expect(resolveApiOrigin(false, undefined)).toBe('')
  })
})
