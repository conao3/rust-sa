import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'

declare global {
  // Injected by the Tauri shell so the bundled app can find the dynamic backend port.
  var __SA_API_ORIGIN__: string | undefined
}

export const API_ORIGIN: string =
  (typeof globalThis !== 'undefined' && globalThis.__SA_API_ORIGIN__) ||
  'https://sa-api.localhost'

export const apolloClient = new ApolloClient({
  link: new HttpLink({
    uri: `${API_ORIGIN}/api/graphql`,
  }),
  cache: new InMemoryCache(),
  devtools: {
    enabled: import.meta.env.DEV,
    name: 'rust-sa',
  },
})
