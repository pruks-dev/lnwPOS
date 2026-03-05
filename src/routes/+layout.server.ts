import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

const TOKEN_KEY = 'lnwpos_token'
const PUBLIC_ROUTES = ['/']
const PROTECTED_ROUTES = ['/dashboard', '/pos', '/products', '/settings', '/transactions']

function decodeToken(token: string): { username: string; expiration: number } | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const username = parts[0]
  const expiration = parseInt(parts[1], 10)
  if (isNaN(expiration)) return null
  return { username, expiration }
}

function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded) return true
  const currentTime = Math.floor(Date.now() / 1000)
  return currentTime >= decoded.expiration
}

export const load: LayoutServerLoad = async ({ url, cookies }) => {
  
  const token = cookies.get(TOKEN_KEY)
  const isAuthenticated = token && !isTokenExpired(token)
  
  if (url.pathname === '/') {
    if (isAuthenticated) {
      throw redirect(303, '/dashboard')
    }
    return {}
  }
  
  if (PROTECTED_ROUTES.includes(url.pathname)) {
    if (!isAuthenticated) {
      throw redirect(303, '/')
    }
  }

  return {}
}
