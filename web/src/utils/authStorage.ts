/**
 * Token storage utilities for managing authentication tokens in localStorage
 */

const TOKEN_KEY = 'token'

/**
 * Save authentication token to localStorage
 */
export function saveToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch (error) {
    console.error('Failed to save token:', error)
  }
}

/**
 * Get authentication token from localStorage
 */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch (error) {
    console.error('Failed to get token:', error)
    return null
  }
}

/**
 * Remove authentication token from localStorage
 */
export function removeToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch (error) {
    console.error('Failed to remove token:', error)
  }
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
  const token = getToken()
  return !!token
}
