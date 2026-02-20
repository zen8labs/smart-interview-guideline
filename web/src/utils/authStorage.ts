/**
 * Token storage utilities for managing authentication tokens in localStorage
 */

const TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refresh_token'

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
 * Save both access and refresh tokens (e.g. after login/register)
 */
export function saveTokens(accessToken: string, refreshToken: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  } catch (error) {
    console.error('Failed to save tokens:', error)
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
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch (error) {
    console.error('Failed to get refresh token:', error)
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
 * Remove both access and refresh tokens (logout or after failed refresh)
 */
export function removeTokens(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch (error) {
    console.error('Failed to remove tokens:', error)
  }
}

/**
 * Check if user is authenticated (has access or refresh token)
 */
export function isAuthenticated(): boolean {
  const token = getToken()
  const refresh = getRefreshToken()
  return !!token || !!refresh
}
