const DEV_API_ORIGIN = 'https://sa-api.localhost'

// Vite dev / portless calls the backend on sa-api.localhost; the SPA embedded
// in `sa` calls the origin that served it. Tauri requests go through IPC and
// ignore this.
export function resolveApiOrigin(dev: boolean, location: { origin: string } | undefined): string {
  if (dev) return DEV_API_ORIGIN
  return location?.origin ?? ''
}

export function getApiOrigin(): string {
  return resolveApiOrigin(
    import.meta.env.DEV,
    typeof window === 'undefined' ? undefined : window.location,
  )
}
