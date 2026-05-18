export function getServerOrigin(): string {
  if (typeof window === 'undefined') {
    return process.env.BACKEND_ORIGIN ?? 'https://sa-api.localhost'
  }
  return globalThis.__SA_API_ORIGIN__ ?? 'https://sa-api.localhost'
}
