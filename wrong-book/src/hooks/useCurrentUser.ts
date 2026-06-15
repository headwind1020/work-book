'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser, getUserProfile } from '@/lib/database'
import type { User } from '@/lib/supabase'

interface UseCurrentUserState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useCurrentUser(): UseCurrentUserState {
  const [state, setState] = useState<UseCurrentUserState>({
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const authUser = await getCurrentUser()
        if (!authUser) {
          if (mounted) setState({ user: null, loading: false, error: null })
          return
        }
        const profile = await getUserProfile()
        if (mounted) setState({ user: profile, loading: false, error: null })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (mounted) setState({ user: null, loading: false, error: message })
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  return state
}
