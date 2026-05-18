import { getApiOrigin } from '#/lib/apollo'

export function getServerOrigin(): string {
  if (typeof window === 'undefined') {
    return process.env.BACKEND_ORIGIN ?? 'https://sa-api.localhost'
  }
  return getApiOrigin()
}
