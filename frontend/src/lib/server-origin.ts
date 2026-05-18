export const SERVER_ORIGIN =
  typeof window === 'undefined'
    ? (process.env.BACKEND_ORIGIN ?? 'https://sa-api.localhost')
    : (globalThis.__SA_API_ORIGIN__ ?? 'https://sa-api.localhost')
