<script lang="ts" context="module">
// LnwPoS - Auth Store (LocalStorage + Svelte 5)

import { browser } from '$app/environment'
import { setUser, removeUser, getUser, DEFAULT_USER_EMAIL, simpleHash, generateToken, setToken, removeToken, getToken, isTokenExpired } from '$lib/storage.js'
import type { User } from '$lib/types.js'
import { writable, derived } from 'svelte/store'

type AuthStoreType = User | null

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthStoreType>(null)

  function loadUser() {
    if (!browser) return
    try {
      const user = getUser()
      const token = getToken()
      
      if (user && token && !isTokenExpired(token)) {
        set(user)
      } else if (user && token && isTokenExpired(token)) {
        removeToken()
        removeUser()
        set(null)
      } else {
        set(user)
      }
    } catch (error) {
      console.error('Failed to load user:', error)
      set(null)
    }
  }

  // Initial load
  loadUser()

  return {
    subscribe,
    load: loadUser,
    login: (email: string, password: string): { success: boolean; error?: string } => {
      if (!browser) return { success: false }
      
      const inputPasswordHash = simpleHash(password)
      let existingUser = getUser()
      
      if (!existingUser) {
        const defaultUser: User = {
          id: 'user_default',
          email: DEFAULT_USER_EMAIL,
          passwordHash: simpleHash('password'),
          createdAt: new Date().toISOString(),
        }
        setUser(defaultUser)
        existingUser = defaultUser
        
        if (email === DEFAULT_USER_EMAIL && password === 'password') {
          const token = generateToken(email)
          setToken(token)
          set(existingUser)
          return { success: true }
        }
      }
      
      if (existingUser && existingUser.email === email) {
        if (existingUser.passwordHash === inputPasswordHash) {
          const token = generateToken(email)
          setToken(token)
          setUser(existingUser)
          set(existingUser)
          return { success: true }
        } else {
          return { success: false, error: 'Invalid password' }
        }
      }
      
      return { success: false, error: 'User not found' }
    },
    logout: () => {
      if (!browser) return
      removeToken()
      removeUser()
      set(null)
      fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
      window.location.href = '/'
    },
    getCurrentUser: () => getUser(),
    isAuthenticated: (sub: (value: boolean) => void) => sub(true),
  }
}

export const auth = createAuthStore()

// ========== Derived Stores ==========

// User email
export const userEmail = derived(auth, $user => $user?.email || '')

// Is authenticated
export const isAuthenticated = derived(auth, $user => $user !== null)
</script>
