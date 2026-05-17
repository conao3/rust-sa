import { gql } from '@apollo/client'
import { useMutation, useQuery } from '@apollo/client/react'
import type { Theme } from '#/components/top-bar'

const PREFERENCES_QUERY = gql`
  query Preferences {
    preferences {
      theme
    }
  }
`

const SET_PREFERENCES_MUTATION = gql`
  mutation SetPreferences($theme: String) {
    setPreferences(theme: $theme) {
      theme
    }
  }
`

interface PreferencesData {
  preferences: { theme: string }
}

interface SetPreferencesData {
  setPreferences: { theme: string }
}

function asTheme(t: string | undefined): Theme {
  return t === 'dark' ? 'dark' : 'light'
}

export function useThemePreference(): [Theme, (next: Theme) => void] {
  const { data } = useQuery<PreferencesData>(PREFERENCES_QUERY, { fetchPolicy: 'cache-first' })
  const [mutate] = useMutation<SetPreferencesData>(SET_PREFERENCES_MUTATION, {
    refetchQueries: [{ query: PREFERENCES_QUERY }],
    awaitRefetchQueries: true,
  })
  const theme = asTheme(data?.preferences.theme)
  const setTheme = (next: Theme) => {
    mutate({ variables: { theme: next } })
  }
  return [theme, setTheme]
}
