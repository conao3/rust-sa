import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  Observable,
  type FetchResult,
} from '@apollo/client'
import { print } from 'graphql'

declare global {
  // Set by Tauri when the document runs inside its webview.
  var __TAURI_INTERNALS__: unknown
}

export function isTauri(): boolean {
  return typeof globalThis !== 'undefined' && Boolean(globalThis.__TAURI_INTERNALS__)
}

export function getApiOrigin(): string {
  // Browser / portless dev. Tauri requests go through IPC and ignore this.
  return 'https://sa-api.localhost'
}

const tauriLink = new ApolloLink(
  (operation) =>
    new Observable<FetchResult>((observer) => {
      let cancelled = false
      ;(async () => {
        try {
          const { invoke } = await import('@tauri-apps/api/core')
          const result = await invoke<FetchResult>('graphql', {
            query: print(operation.query),
            variables: operation.variables ?? {},
            operationName: operation.operationName ?? null,
          })
          if (cancelled) return
          observer.next(result)
          observer.complete()
        } catch (err) {
          if (cancelled) return
          observer.error(err)
        }
      })()
      return () => {
        cancelled = true
      }
    }),
)

const httpLink = new HttpLink({
  uri: () => `${getApiOrigin()}/api/graphql`,
})

export const apolloClient = new ApolloClient({
  link: ApolloLink.split(isTauri, tauriLink, httpLink),
  cache: new InMemoryCache(),
  devtools: {
    enabled: import.meta.env.DEV,
    name: 'rust-sa',
  },
})
